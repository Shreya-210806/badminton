import { validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path || e.param,
      message: e.msg,
    }));
    return res.status(400).json({
      success: false,
      message: formatted[0]?.message || 'Validation failed.',
      errors: formatted,
    });
  }
  next();
};

export const rejectCardDetails = (req, res, next) => {
  const forbiddenKeys = ['cardNumber', 'card_number', 'cvv', 'cvc', 'expiry', 'cardExpiry', 'pan'];
  const bodyKeys = Object.keys(req.body || {});
  const found = bodyKeys.find((k) => forbiddenKeys.includes(k));
  if (found) {
    return res.status(400).json({
      success: false,
      message: 'Security policy: Card details are never accepted or stored. Submit only payment method and transaction reference.',
    });
  }
  // Also reject 15-16 digit raw card patterns inside referenceCode or notes
  const ref = String(req.body?.referenceCode || '').replace(/[\s-]/g, '');
  if (/^\d{15,19}$/.test(ref)) {
    return res.status(400).json({
      success: false,
      message: 'Reference code resembles a payment card number. Never enter card numbers; provide a receipt or transfer ID.',
    });
  }
  next();
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (err, _req, res, _next) => {
  console.error('[API Error]', err);
  if (err.name === 'ValidationError' && err.errors) {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages[0] || 'Invalid data provided.',
      errors: messages,
    });
  }
  if (err.name === 'DuplicateKeyError') {
    return res.status(409).json({
      success: false,
      message: `Duplicate value detected for ${err.field || 'record'}.`,
    });
  }
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
};
