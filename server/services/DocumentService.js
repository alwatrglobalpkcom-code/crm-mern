const Document = require('../models/Document');
const Client = require('../models/Client');
const fs = require('fs');
const path = require('path');

const toId = (v) => (v?._id ?? v)?.toString?.() || '';

class DocumentService {
  static async getAccessibleClientIds(user) {
    let query = {};
    if (user.role === 'admin') {
      query = {};
    } else if (user.role === 'manager') {
      query.$or = [{ assignedManager: user._id }, { createdBy: user._id }];
    } else {
      query.$or = [{ assignedAgent: user._id }, { createdBy: user._id }];
    }
    const clients = await Client.find(query).select('_id').lean();
    return clients.map(c => c._id);
  }

  static async list(user, { clientId, search, fileType } = {}) {
    const clientIds = await this.getAccessibleClientIds(user);
    const clientFilter = clientId
      ? (clientIds.some(cid => cid.toString() === clientId.toString()) ? clientId : null)
      : (clientIds.length > 0 ? { $in: clientIds } : { $in: [] });
    if (clientId && clientFilter === null) throw new Error('Access denied.');

    const andConditions = [{ client: clientFilter }];

    if (search && search.trim()) {
      const term = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(term, 'i');
      const nameMatchClients = clientIds.length > 0
        ? await Client.find({ _id: { $in: clientIds }, $or: [{ clientName: regex }, { companyName: regex }] }).select('_id').lean()
        : [];
      const nameMatchIds = nameMatchClients.map(c => c._id);
      andConditions.push({
        $or: [
          { fileName: regex },
          ...(nameMatchIds.length > 0 ? [{ client: { $in: nameMatchIds } }] : [])
        ]
      });
    }

    if (fileType && fileType.trim()) {
      const ext = fileType.trim().replace(/^\./, '');
      andConditions.push({ fileName: { $regex: `\\.${ext}$`, $options: 'i' } });
    }

    const query = andConditions.length > 1 ? { $and: andConditions } : andConditions[0];

    return Document.find(query)
      .populate('client', 'clientName companyName')
      .populate('uploadedBy', 'name email')
      .sort({ uploadedAt: -1 })
      .limit(200)
      .lean();
  }

  static async getByClient(clientId, user) {
    if (!clientId) return [];
    const client = await Client.findById(clientId);
    if (!client) throw new Error('Client not found.');

    const canAccess = user.role === 'admin' ||
      toId(client.assignedManager) === toId(user._id) ||
      toId(client.assignedAgent) === toId(user._id) ||
      toId(client.createdBy) === toId(user._id);

    if (!canAccess) throw new Error('Access denied.');

    return Document.find({ client: clientId })
      .populate('uploadedBy', 'name email')
      .sort({ uploadedAt: -1 });
  }

  static async create(clientId, file, user) {
    const client = await Client.findById(clientId);
    if (!client) throw new Error('Client not found.');

    const canUpload = user.role === 'admin' ||
      toId(client.assignedManager) === toId(user._id) ||
      toId(client.assignedAgent) === toId(user._id) ||
      toId(client.createdBy) === toId(user._id);

    if (!canUpload) throw new Error('Access denied.');

    const doc = await Document.create({
      client: clientId,
      fileName: file.originalname,
      filePath: file.path,
      uploadedBy: user._id
    });

    return Document.findById(doc._id).populate('uploadedBy', 'name email');
  }

  static async delete(id, user) {
    const doc = await Document.findById(id).populate('client');
    if (!doc) throw new Error('Document not found.');

    const client = doc.client;
    if (!client) throw new Error('Document not found.');

    const canDelete = user.role === 'admin' ||
      toId(client.assignedManager) === toId(user._id) ||
      toId(client.assignedAgent) === toId(user._id) ||
      toId(client.createdBy) === toId(user._id);

    if (!canDelete) throw new Error('Access denied.');

    if (doc.filePath && fs.existsSync(doc.filePath)) {
      try {
        fs.unlinkSync(doc.filePath);
      } catch (e) {
        // continue - DB record should still be removed
      }
    }
    await doc.deleteOne();
    return { success: true };
  }

  static async canAccessDocument(docId, user) {
    const doc = await Document.findById(docId).populate('client');
    if (!doc || !doc.client) throw new Error('Document not found.');

    const client = doc.client;
    const canAccess = user.role === 'admin' ||
      toId(client.assignedManager) === toId(user._id) ||
      toId(client.assignedAgent) === toId(user._id) ||
      toId(client.createdBy) === toId(user._id);

    if (!canAccess) throw new Error('Access denied.');

    const absPath = path.isAbsolute(doc.filePath) ? doc.filePath : path.resolve(path.join(__dirname, '..'), doc.filePath);
    const finalPath = fs.existsSync(doc.filePath) ? doc.filePath : absPath;
    return { ...doc.toObject(), filePath: finalPath };
  }
}

module.exports = DocumentService;
