import { defineModel } from '../db/odm.js';

export default defineModel('Registration', {
  schema: {
    registrationNumber: { type: 'string', required: true },
    tournament: { type: 'id', required: true },
    categoryCode: { type: 'string', required: true, trim: true },
    categoryName: { type: 'string', required: true },
    format: { type: 'string', enum: ['singles', 'doubles'], required: true },
    player: { type: 'id', required: true },
    user: { type: 'id' },
    partner: { type: 'id', default: null },
    partnerDetails: {
      name: { type: 'string', default: '' },
      email: { type: 'string', lowercase: true, trim: true, default: '' },
      phone: { type: 'string', default: '' },
      club: { type: 'string', default: '' },
      gender: { type: 'string', default: '' },
    },
    team: { type: 'id', default: null },
    emergencyContact: {
      name: { type: 'string', default: '' },
      relation: { type: 'string', default: 'Family' },
      phone: { type: 'string', default: '' },
    },
    status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'waitlisted', 'cancelled'], default: 'pending' },
    paymentStatus: { type: 'string', enum: ['unpaid', 'pending', 'paid', 'refunded'], default: 'unpaid' },
    feeAmount: { type: 'number', required: true, min: 0 },
    seedNumber: { type: 'number', default: null },
    shirtSize: { type: 'string', enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], default: 'M' },
    notes: { type: 'string', default: '' },
  },
  unique: ['registrationNumber'],
  refs: { tournament: 'Tournament', player: 'Player', user: 'User', partner: 'Player', team: 'Team' },
});
