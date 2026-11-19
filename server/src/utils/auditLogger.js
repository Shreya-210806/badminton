import AuditLog from '../models/AuditLog.js';

export async function recordAudit({
  req,
  action,
  entityType,
  entityId = '',
  summary,
  metadata = {},
}) {
  try {
    await AuditLog.create({
      actor: req?.user?._id || null,
      actorName: req?.user?.name || 'System',
      actorRole: req?.user?.role || 'system',
      action,
      entityType,
      entityId: String(entityId || ''),
      summary,
      metadata,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1',
    });
  } catch (err) {
    console.error('[AuditLog] Failed to write audit entry:', err.message);
  }
}
