import { defineModel } from '../db/odm.js';

// Card numbers, CVVs and expiry dates are never stored.
export default defineModel('Payment', {
  schema: {
    receiptNumber: { type: 'string', required: true },
    registration: { type: 'id', required: true },
    player: { type: 'id', required: true },
    tournament: { type: 'id', required: true },
    amount: { type: 'number', required: true, min: 0 },
    currency: { type: 'string', default: 'INR' },
    method: {
      type: 'string',
      enum: ['bank_transfer', 'upi_qr', 'cash_desk', 'invoice', 'online_gateway_ref'],
      default: 'bank_transfer',
    },
    referenceCode: { type: 'string', default: '', trim: true },
    status: { type: 'string', enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paidAt: { type: 'date', default: null },
    recordedBy: { type: 'id', default: null },
    notes: { type: 'string', default: '' },
  },
  unique: ['receiptNumber'],
  refs: { registration: 'Registration', player: 'Player', tournament: 'Tournament', recordedBy: 'User' },
});
