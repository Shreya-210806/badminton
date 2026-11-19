import { defineModel } from '../db/odm.js';

export default defineModel('Team', {
  schema: {
    teamCode: { type: 'string', required: true },
    name: { type: 'string', required: true, trim: true },
    tournament: { type: 'id', required: true },
    categoryCode: { type: 'string', required: true, trim: true },
    categoryName: { type: 'string', default: '' },
    player1: { type: 'id', required: true },
    player2: { type: 'id', default: null },
    partnerDetails: {
      name: { type: 'string', default: '' },
      email: { type: 'string', lowercase: true, trim: true, default: '' },
      phone: { type: 'string', default: '' },
      club: { type: 'string', default: '' },
    },
    status: { type: 'string', enum: ['confirmed', 'pending_partner', 'disbanded'], default: 'confirmed' },
    seedNumber: { type: 'number', default: null },
  },
  unique: ['teamCode'],
  refs: { tournament: 'Tournament', player1: 'Player', player2: 'Player' },
});
