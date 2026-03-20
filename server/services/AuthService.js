const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { getJwtSecret, JWT_EXPIRY } = require('../config/env');
const { required, isValidEmail, isValidPhone, minLength } = require('../utils/validate');

class AuthService {
  static async login(email, password) {
    required(email, 'Email');
    isValidEmail(email);
    required(password, 'Password');

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    const token = jwt.sign(
      { id: user._id },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRY }
    );

    const userObj = user.toObject();
    delete userObj.password;
    return { token, user: userObj };
  }

  static async getMe(userId) {
    const user = await User.findById(userId)
      .populate('assignedManager', 'name email')
      .populate('assignedAgents', 'name email');
    if (!user) throw new Error('User not found.');
    return user;
  }

  static async updateProfile(userId, data) {
    if (data.name !== undefined) required(data.name, 'Name');
    if (data.email !== undefined) {
      required(data.email, 'Email');
      isValidEmail(data.email);
    }
    if (data.phone) isValidPhone(data.phone);
    if (data.password) minLength(data.password, 6, 'Password');

    const user = await User.findById(userId).select('+password');
    if (!user) throw new Error('User not found.');
    const allowed = ['name', 'email', 'password', 'phone', 'address', 'designation'];
    Object.keys(data).forEach(key => {
      if (allowed.includes(key) && data[key] !== undefined) user[key] = data[key];
    });
    await user.save();
    return User.findById(userId).populate('assignedManager', 'name email').populate('assignedAgents', 'name email').select('-password');
  }
}

module.exports = AuthService;
