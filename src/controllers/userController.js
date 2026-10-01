const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { registerValidation, loginValidation } = require('../middleware/validate');


const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS
  }
});

// 1. REGISTER
exports.register = async (req, res) => {
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const emailExists = await User.findOne({ email: req.body.email });
    if (emailExists) return res.status(400).json({ message: 'Email already exists.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Generate unique verification token expiring in 24 hours
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; 

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      verificationToken: verificationToken,
      verificationTokenExpires: tokenExpiry
    });

    await user.save();

    // Send verification email link
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    await transporter.sendMail({
      from: `"EventHorizon" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Verify Your EventHorizon Account',
      html: `<p>Welcome to EventHorizon! Click <a href="${verificationLink}">here</a> to verify your email address. This link expires in 24 hours.</p>`
    });

    res.status(201).json({ message: 'Registration successful! Please check your email to verify your account.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// 2. VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: 'Verification token is required.' });

  try {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.status(200).json({ message: 'Email verification successful! You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// 3. LOGIN
exports.login = async (req, res) => {
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password.' });

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid email or password.' });

    // RESTRICTION: Reject login if unverified
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email address before logging in.' });
    }

    const token = jwt.sign({ _id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
