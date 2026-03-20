const AuthService = require('../services/AuthService');
const UserService = require('../services/UserService');
const User = require('../models/User');
const ActivityLogService = require('../services/ActivityLogService');
const { ValidationError } = require('../utils/validate');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (error) {
    const status = error instanceof ValidationError ? 400 : 401;
    res.status(status).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await AuthService.getMe(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await AuthService.updateProfile(req.user._id, req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Validation failed.' });
  }
};

exports.register = async (req, res) => {
  try {
    const user = await UserService.create(req.body, req.user);
    ActivityLogService.log({ userId: req.user._id, userName: req.user.name, action: 'create', entity: 'user', entityId: user._id, entityLabel: user.name });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
