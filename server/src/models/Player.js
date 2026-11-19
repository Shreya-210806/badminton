import { defineModel, sub } from '../db/odm.js';

export default defineModel('Player', {
  schema: {
    user: { type: 'id' },
    playerCode: { type: 'string', required: true },
    fullName: { type: 'string', required: true, trim: true },
    email: { type: 'string', required: true, lowercase: true, trim: true },
    phone: { type: 'string', default: '', trim: true },
    gender: { type: 'string', enum: ['Male', 'Female', 'Other'], default: '' },
    age: { type: 'number', min: 1, max: 120 },
    dateOfBirth: { type: 'date' },
    ageGroup: { type: 'string', enum: ['U15', 'U19', 'Open', '35+', '45+'], default: 'Open' },
    club: { type: 'string', default: 'Independent', trim: true },
    city: { type: 'string', default: '', trim: true },
    handedness: { type: 'string', enum: ['Right', 'Left'], default: 'Right' },
    skillLevel: { type: 'string', enum: ['Beginner', 'Intermediate', 'Advanced', 'Pro'], default: 'Intermediate' },
    bio: { type: 'string', default: '' },
    avatarUrl: { type: 'string', default: '' },
    rankingPoints: { type: 'number', default: 1000 },
    wins: { type: 'number', default: 0 },
    losses: { type: 'number', default: 0 },
    titles: { type: 'number', default: 0 },
    emergencyContact: {
      name: { type: 'string', default: '' },
      relation: { type: 'string', default: '' },
      phone: { type: 'string', default: '' },
    },
    publicProfile: {
      isListed: { type: 'boolean', default: true },
      showEmail: { type: 'boolean', default: false },
      showPhone: { type: 'boolean', default: false },
      showClub: { type: 'boolean', default: true },
      showStats: { type: 'boolean', default: true },
    },
    crm: {
      status: { type: 'string', enum: ['active', 'vip', 'inactive', 'flagged'], default: 'active' },
      tags: [{ type: 'string', trim: true }],
      notes: [
        sub(
          {
            text: { type: 'string', required: true, trim: true },
            authorName: { type: 'string', required: true },
            authorId: { type: 'id' },
          },
          { timestamps: true }
        ),
      ],
      contactPreferences: {
        emailUpdates: { type: 'boolean', default: true },
        smsUpdates: { type: 'boolean', default: false },
        marketing: { type: 'boolean', default: false },
      },
    },
  },
  unique: ['playerCode'],
  refs: { user: 'User' },
});
