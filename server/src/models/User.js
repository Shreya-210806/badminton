import bcrypt from 'bcryptjs';
import { defineModel } from '../db/odm.js';

const User = defineModel('User', {
  schema: {
    name: { type: 'string', required: true, trim: true },
    email: { type: 'string', required: true, lowercase: true, trim: true },
    passwordHash: { type: 'string', required: true },
    role: { type: 'string', enum: ['player', 'referee', 'organizer', 'admin'], default: 'player' },
    staffTitle: { type: 'string', default: '' },
    status: { type: 'string', enum: ['active', 'suspended'], default: 'active' },
    resetToken: { type: 'string' },
    resetTokenExpires: { type: 'date' },
    lastLoginAt: { type: 'date' },
  },
  unique: ['email'],
  hidden: ['passwordHash', 'resetToken', 'resetTokenExpires'],
});

User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

User.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

export default User;
