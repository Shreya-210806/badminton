import { defineModel, sub } from '../db/odm.js';

const side = () =>
  sub(
    {
      player: { type: 'id', default: null },
      team: { type: 'id', default: null },
      label: { type: 'string', required: true, default: 'TBD' },
      club: { type: 'string', default: '' },
      seed: { type: 'number', default: null },
    },
    { id: false }
  );

export default defineModel('Match', {
  schema: {
    matchCode: { type: 'string', required: true },
    tournament: { type: 'id', required: true },
    categoryCode: { type: 'string', required: true },
    categoryName: { type: 'string', required: true },
    format: { type: 'string', enum: ['singles', 'doubles'], default: 'singles' },
    round: {
      type: 'string',
      enum: ['Round of 64', 'Round of 32', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Final', 'Group Stage'],
      default: 'Quarterfinal',
    },
    roundOrder: { type: 'number', default: 1 },
    matchNumber: { type: 'number', default: 1 },
    nextMatchCode: { type: 'string', default: null },
    nextMatchSlot: { type: 'string', enum: ['A', 'B'], default: null },
    court: { type: 'string', default: 'Court 1' },
    scheduledAt: { type: 'date', required: true },
    status: { type: 'string', enum: ['scheduled', 'live', 'completed', 'walkover', 'postponed'], default: 'scheduled' },
    sideA: side(),
    sideB: side(),
    scores: [
      sub(
        {
          gameNumber: { type: 'number', required: true, min: 1, max: 3 },
          scoreA: { type: 'number', required: true, min: 0, max: 30 },
          scoreB: { type: 'number', required: true, min: 0, max: 30 },
        },
        { id: false }
      ),
    ],
    servingSide: { type: 'string', enum: ['A', 'B'], default: 'A' },
    winnerSide: { type: 'string', enum: ['A', 'B'], default: null },
    assignedReferee: { type: 'id', default: null },
    published: { type: 'boolean', default: true },
    durationMinutes: { type: 'number', default: 0 },
    completedAt: { type: 'date', default: null },
    notes: { type: 'string', default: '' },
  },
  unique: ['matchCode'],
  refs: { tournament: 'Tournament', assignedReferee: 'User' },
});
