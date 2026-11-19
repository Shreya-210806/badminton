import { defineModel } from '../db/odm.js';

export default defineModel('Notification', {
  schema: {
    title: { type: 'string', required: true, trim: true },
    message: { type: 'string', required: true },
    type: {
      type: 'string',
      enum: ['announcement', 'schedule', 'result', 'payment', 'registration', 'inquiry'],
      default: 'announcement',
    },
    audience: { type: 'string', enum: ['all', 'players', 'tournament', 'individual', 'admins'], default: 'all' },
    tournament: { type: 'id', default: null },
    recipientUsers: [{ type: 'id' }],
    readBy: [{ type: 'id' }],
    recipientCount: { type: 'number', default: 0 },
    channel: { type: 'string', enum: ['in_app', 'in_app_and_email'], default: 'in_app_and_email' },
    sentBy: { type: 'id', default: null },
    senderName: { type: 'string', default: 'Tournament Desk' },
  },
  refs: { tournament: 'Tournament', sentBy: 'User' },
});
