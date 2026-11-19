import { defineModel } from '../db/odm.js';

export default defineModel('OrganizationSetting', {
  schema: {
    singletonKey: { type: 'string', default: 'default' },
    organizationName: { type: 'string', default: 'ShuttlePulse Badminton Federation' },
    shortName: { type: 'string', default: 'ShuttlePulse' },
    tagline: {
      type: 'string',
      default: 'Premier Competitive Badminton Circuit & Official Tournament Operations Hub',
    },
    supportEmail: { type: 'string', default: 'operations@shuttlepulse.org' },
    supportPhone: { type: 'string', default: '+1 (555) 234-8890' },
    headquarters: { type: 'string', default: '420 Olympic Arena Blvd, Seattle, WA 98109' },
    website: { type: 'string', default: 'https://shuttlepulse.org' },
    accentColor: { type: 'string', default: '#10b981' },
    primaryColor: { type: 'string', default: '#0b132b' },
    currency: { type: 'string', default: 'INR' },
    defaultCourtsCount: { type: 'number', default: 8 },
    paymentInstructions: {
      type: 'string',
      default:
        'Transfer entry fee via Bank Transfer (Acct: 8801-4492-19, Routing: 021000021) or Arena Desk QR and enter your reference code.',
    },
    updatedBy: { type: 'id', default: null },
  },
  unique: ['singletonKey'],
  refs: { updatedBy: 'User' },
});
