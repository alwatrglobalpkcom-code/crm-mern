const ActivityLog = require('../models/ActivityLog');

/**
 * Log user action. Fire-and-forget to avoid blocking requests.
 * @param {Object} params
 * @param {string} params.userId - Acting user ID
 * @param {string} params.userName - Acting user name
 * @param {'create'|'update'|'delete'} params.action
 * @param {'user'|'client'|'task'|'document'} params.entity
 * @param {string} [params.entityId]
 * @param {string} [params.entityLabel] - Human-readable label (e.g. "John Doe", "ABC Pty Ltd")
 */
function log({ userId, userName, action, entity, entityId, entityLabel }) {
  const doc = new ActivityLog({
    userId,
    userName: userName || 'Unknown',
    action,
    entity,
    entityId: entityId || null,
    entityLabel: entityLabel || null
  });
  doc.save().catch(err => console.error('[ActivityLog]', err.message));
}

module.exports = { log };
