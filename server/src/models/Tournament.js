import { defineModel, sub } from '../db/odm.js';

export default defineModel('Tournament', {
  schema: {
    name: { type: 'string', required: true, trim: true },
    slug: { type: 'string', required: true, lowercase: true, trim: true },
    subtitle: { type: 'string', default: '' },
    bannerImage: { type: 'string', default: '' },
    venue: { type: 'string', required: true, trim: true },
    address: { type: 'string', default: '' },
    city: { type: 'string', required: true, trim: true },
    startDate: { type: 'date', required: true },
    endDate: { type: 'date', required: true },
    registrationDeadline: { type: 'date', required: true },
    status: { type: 'string', enum: ['draft', 'published', 'ongoing', 'completed', 'archived'], default: 'published' },
    registrationStatus: { type: 'string', enum: ['open', 'closing_soon', 'waitlist_only', 'closed'], default: 'open' },
    description: { type: 'string', required: true },
    rules: [{ type: 'string' }],
    shuttleType: { type: 'string', default: 'BWF Approved Feather Grade 1' },
    courtsCount: { type: 'number', default: 6, min: 1 },
    prizePool: { type: 'number', default: 5000, min: 0 },
    featured: { type: 'boolean', default: false },
    categories: [
      sub(
        {
          code: { type: 'string', required: true, trim: true },
          name: { type: 'string', required: true, trim: true },
          format: { type: 'string', enum: ['singles', 'doubles'], required: true },
          gender: { type: 'string', enum: ['Male', 'Female', 'Mixed', 'Any'], default: 'Any' },
          ageGroup: { type: 'string', enum: ['U15', 'U19', 'Open', '35+', '45+'], default: 'Open' },
          fee: { type: 'number', required: true, min: 0, default: 25 },
          maxEntries: { type: 'number', required: true, min: 2, default: 16 },
          prizeWinner: { type: 'number', default: 500 },
        },
        { id: false }
      ),
    ],
    sponsors: [
      sub(
        {
          name: { type: 'string', required: true },
          tier: { type: 'string', enum: ['Title', 'Gold', 'Official', 'Partner'], default: 'Official' },
          website: { type: 'string', default: '' },
        },
        { id: false }
      ),
    ],
    organizerContact: {
      name: { type: 'string', default: 'Tournament Desk' },
      email: { type: 'string', default: 'desk@shuttlepulse.org' },
      phone: { type: 'string', default: '+1 (555) 234-8890' },
    },
    createdBy: { type: 'id' },
  },
  unique: ['slug'],
  refs: { createdBy: 'User' },
});
