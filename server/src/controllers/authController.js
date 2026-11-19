import crypto from 'crypto';
import { sendEmail } from '../utils/mailer.js';
import { User, Player, Notification } from '../models/index.js';
import { signToken } from '../middleware/auth.js';
import { ageGroupForAge } from '../utils/playerEligibility.js';

const generatePlayerCode = () =>
  `PL-${Math.floor(100000 + Math.random() * 900000)}`;

export const signup = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone = '',
      gender,
      age,
      club = 'Independent',
      city = '',
      handedness = 'Right',
      skillLevel = 'Intermediate',
    } = req.body;

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please sign in instead.',
      });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'player',
      lastLoginAt: new Date(),
    });

    // Link existing CRM player profile by email if organizer created one earlier, otherwise create new
    let player = await Player.findOne({ email: normalizedEmail });
    if (player) {
      player.user = user._id;
      player.fullName = name.trim();
      player.phone = phone.trim();
      player.gender = gender;
      player.age = Number(age);
      player.ageGroup = ageGroupForAge(player.age);
      player.club = club;
      player.city = city || player.city;
      player.handedness = handedness;
      player.skillLevel = skillLevel;
      await player.save();
    } else {
      player = await Player.create({
        user: user._id,
        playerCode: generatePlayerCode(),
        fullName: name.trim(),
        email: normalizedEmail,
        phone,
        gender,
        age: Number(age),
        ageGroup: ageGroupForAge(age),
        club,
        city,
        handedness,
        skillLevel,
      });
    }

    await Notification.create({
      title: 'Welcome to ShuttlePulse!',
      message:
        'Your player profile is active. Browse upcoming tournaments, configure privacy controls, and register for singles or doubles events.',
      type: 'registration',
      audience: 'individual',
      recipientUsers: [user._id],
      recipientCount: 1,
    });

    const token = signToken(user);
    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        staffTitle: user.staffTitle,
      },
      player,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'This account is suspended. Please contact the tournament desk.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const player = await Player.findOne({ user: user._id });
    const token = signToken(user);

    res.json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        staffTitle: user.staffTitle,
      },
      player,
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+resetToken +resetTokenExpires');

    if (!user) {
      // Avoid enumerating emails, return standard message
      return res.json({
        success: true,
        message:
          'If an account exists for that email, a 6-character reset token has been generated.',
      });
    }

    const rawToken = crypto.randomBytes(3).toString('hex').toUpperCase();
    user.resetToken = rawToken;
    user.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    const emailed = await sendEmail({
      to: user.email,
      subject: 'Your ShuttlePulse password reset code',
      text: `Your password reset code is ${rawToken}. It is valid for 30 minutes. If you did not request this, you can ignore this email.`,
    });

    res.json({
      success: true,
      message: emailed
        ? 'A password reset code has been emailed to you (valid for 30 minutes).'
        : 'Password reset code generated (valid for 30 minutes). Email delivery is not configured, so use the demo code shown.',
      // Returned in development/demo mode so password reset can be completed end-to-end without external SMTP
      demoResetCode: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, resetCode, newPassword } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select(
      '+resetToken +resetTokenExpires +passwordHash'
    );

    if (
      !user ||
      !user.resetToken ||
      user.resetToken !== String(resetCode).trim().toUpperCase() ||
      !user.resetTokenExpires ||
      user.resetTokenExpires < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code.',
      });
    }

    user.passwordHash = await User.hashPassword(newPassword);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully. You may now sign in.',
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const player = await Player.findOne({ user: req.user._id });
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        staffTitle: req.user.staffTitle,
      },
      player,
    });
  } catch (err) {
    next(err);
  }
};
