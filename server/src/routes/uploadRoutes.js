import { protect } from '../middleware/auth.js';
import express from 'express';
import multer from 'multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import s3, { S3_BUCKET_NAME } from '../config/s3.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP and PDF files are allowed.'));
    }
  },
});

const allowedFolders = [
  'player-photos',
  'tournament-images',
  'team-logos',
  'certificates',
];

router.post('/', protect, upload.single('file'), async (req, res, next) => {

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a file.',
      });
    }

    const folder = req.body.folder;

    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid upload folder.',
      });
    }

    const extension = req.file.originalname
      .split('.')
      .pop()
      .toLowerCase();

    const key = `${folder}/${randomUUID()}.${extension}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully.',
      key,
      bucket: S3_BUCKET_NAME,
    });
  } catch (error) {
    next(error);
  }
});

export default router;