import { defineModel } from '../db/odm.js';

export default defineModel('AuditLog', {
  schema: {
    actor: { type: 'id', default: null },
    actorName: { type: 'string', required: true },
    actorRole: { type: 'string', required: true },
    action: { type: 'string', required: true },
    entityType: {
      type: 'string',
      enum: [
        'Tournament',
        'TournamentUpdate',
        'Player',
        'Registration',
        'Team',
        'Match',
        'Payment',
        'Notification',
        'Settings',
        'User',
      ],
      required: true,
    },
    entityId: { type: 'string', default: '' },
    summary: { type: 'string', required: true },
    metadata: { type: 'mixed', default: () => ({}) },
    ipAddress: { type: 'string', default: '' },
  },
  refs: { actor: 'User' },
});
