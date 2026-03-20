const Document = require('../models/Document');
const DocumentService = require('../services/DocumentService');
const ActivityLogService = require('../services/ActivityLogService');
const path = require('path');

exports.list = async (req, res) => {
  try {
    const { clientId, search, fileType } = req.query;
    const docs = await DocumentService.list(req.user, { clientId, search, fileType });
    res.json(Array.isArray(docs) ? docs : []);
  } catch (error) {
    const status = error.message === 'Access denied.' ? 403 : error.message === 'Client not found.' ? 404 : 500;
    res.status(status).json({ message: error.message || 'Failed to load documents.' });
  }
};

exports.upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    const clientId = req.body.clientId || req.query.clientId;
    if (!clientId) {
      return res.status(400).json({ message: 'Client ID is required.' });
    }
    const doc = await DocumentService.create(clientId, req.file, req.user);
    ActivityLogService.log({ userId: req.user._id, userName: req.user.name, action: 'create', entity: 'document', entityId: doc._id, entityLabel: doc.fileName });
    const populated = await Document.findById(doc._id).populate('client', 'clientName companyName').populate('uploadedBy', 'name email').lean();
    res.status(201).json(populated || doc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const target = await Document.findById(req.params.id).select('fileName').lean();
    await DocumentService.delete(req.params.id, req.user);
    ActivityLogService.log({ userId: req.user._id, userName: req.user.name, action: 'delete', entity: 'document', entityId: req.params.id, entityLabel: target?.fileName });
    res.json({ success: true });
  } catch (error) {
    const status = error.message === 'Access denied.' ? 403 : error.message === 'Document not found.' ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

exports.download = async (req, res) => {
  try {
    const doc = await DocumentService.canAccessDocument(req.params.id, req.user);
    const fs = require('fs');
    const filePath = doc.filePath;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found.' });
    }
    res.download(filePath, doc.fileName); // or encodeURIComponent for special chars in filename
  } catch (error) {
    const status = error.message === 'Access denied.' ? 403 : error.message === 'Document not found.' ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};
