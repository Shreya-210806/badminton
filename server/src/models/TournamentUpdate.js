import { defineModel } from '../db/odm.js';

export default defineModel('TournamentUpdate', {
  schema: {
    tournament: { type: 'id', required: true },
    title: { type: 'string', required: true, trim: true },
    content: { type: 'string', required: true },
    type: {
      type: 'string',
      enum: [
        'announcement',
        'event',
        'match_timing',
        'schedule_change',
        'fixture',
        'result',
        'venue',
        'instruction',
      ],
      default: 'announcement',
    },
    isPinned: { type: 'boolean', default: false },
    postedBy: { type: 'id' },
    authorName: { type: 'string', default: 'Tournament Committee' },
  },
  refs: { tournament: 'Tournament', postedBy: 'User' },
});
