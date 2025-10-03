// auth.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('./User');

// --- Check environment variables ---
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('EMAIL_USER or EMAIL_PASS not set in .env. Emails will fail until configured.');
}

// --- Nodemailer transporter ---
const transporter = nodemailer.createTransport({
  service: 'gmail', // Change if using another SMTP provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify transporter at startup
transporter.verify((err, success) => {
  if (err) console.error('Email transporter verification failed:', err.message || err);
  else console.log('✅ Email transporter ready');
});

// --- Helper: generate 6-digit verification code ---
function genCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// === Register route ===
router.post('/register', [
  body('college').notEmpty(),
  body('committee').notEmpty(),
  body('email').isEmail(),
  body('contact').isLength({ min: 7 }),
  body('password').isLength({ min: 6 }),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error("Passwords do not match");
    return true;
  })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { college, committee, email, contact, password } = req.body;

  try {
    let user = await User.findOne({ email });

    const hashed = await bcrypt.hash(password, 10);
    const verificationCode = genCode();
    const verificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    if (user) {
      // User exists and verified
      if (user.isVerified) {
        return res.status(400).json({ errors: [{ msg: 'User already exists and is verified' }] });
      }
      // User exists but not verified → update info & new code
      user.college = college;
      user.committee = committee;
      user.contact = contact;
      user.password = hashed;
      user.verificationCode = verificationCode;
      user.verificationExpires = verificationExpires;
      user.isVerified = false;
      await user.save();
    } else {
      // New user
      user = new User({
        college, committee, email, contact,
        password: hashed,
        verificationCode,
        verificationExpires,
        isVerified: false
      });
      await user.save();
    }

    // Send verification email
    const mailOptions = {
      from: `"POP N' PLAN" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'POP N\' PLAN — Your verification code',
      text: `Your POP N' PLAN verification code is ${verificationCode}. It expires in 10 minutes.`,
      html: `<p>Your POP N' PLAN verification code is <b>${verificationCode}</b>.</p><p>This code will expire in 10 minutes.</p>`
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Verification email sent:', info?.messageId || info);
    } catch (mailErr) {
      console.error('Error sending verification email:', mailErr);
      return res.status(500).json({ errors: [{ msg: 'Failed to send verification email. Check server logs and SMTP credentials.' }] });
    }

    // Send email back to frontend so user doesn’t need to type it again
    return res.json({ msg: 'Verification code sent', email: user.email });

  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).send('Server error');
  }
});

// === Verify code ===
router.post('/verify', async (req, res) => {
  const { email, code } = req.body;

  if (!code) return res.status(400).json({ errors: [{ msg: 'Missing verification code' }] });
  if (!email) return res.status(400).json({ errors: [{ msg: 'Missing email (frontend must send stored email from /register)' }] });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ errors: [{ msg: 'User not found. Please register again.' }] });

    if (user.isVerified) return res.status(400).json({ errors: [{ msg: 'User already verified' }] });

    if (!user.verificationCode || Date.now() > user.verificationExpires) {
      return res.status(400).json({ errors: [{ msg: 'Code expired. Please request a new code.' }] });
    }

    if (user.verificationCode === code) {
      user.isVerified = true;
      user.verificationCode = undefined;
      user.verificationExpires = undefined;
      await user.save();

      return res.json({ msg: 'Registration successful' });
    } else {
      return res.status(400).json({ errors: [{ msg: 'Invalid verification code' }] });
    }
  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).send('Server error');
  }
});

// === Resend code ===
router.post('/resend-code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ errors: [{ msg: 'Missing email' }] });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ errors: [{ msg: 'User not found' }] });
    if (user.isVerified) return res.status(400).json({ errors: [{ msg: 'User already verified' }] });

    const verificationCode = genCode();
    const verificationExpires = Date.now() + 10 * 60 * 1000;
    user.verificationCode = verificationCode;
    user.verificationExpires = verificationExpires;
    await user.save();

    const mailOptions = {
      from: `"POP N' PLAN" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'POP N\' PLAN — Your new verification code',
      text: `Your new verification code is ${verificationCode}. It expires in 10 minutes.`,
      html: `<p>Your new verification code is <b>${verificationCode}</b>.</p><p>This code will expire in 10 minutes.</p>`
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Resent verification email:', info?.messageId || info);
    } catch (mailErr) {
      console.error('Error sending resend email:', mailErr);
      return res.status(500).json({ errors: [{ msg: 'Failed to send verification email. Check server logs and SMTP credentials.' }] });
    }

    return res.json({ msg: 'Verification code resent' });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).send('Server error');
  }
});

// === Login route ===
router.post('/login', [
  body('email').isEmail(),
  body('password').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });

    if (!user.isVerified) return res.status(400).json({ errors: [{ msg: 'Please verify your email before login' }] });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });

    const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return res.json({ msg: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).send('Server error');
  }
});

module.exports = router;
