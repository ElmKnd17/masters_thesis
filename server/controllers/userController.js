const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models/models');

const getJwtSecret = () => process.env.SECRET_KEY || 'development_secret_key';

const getCookieOptions = () => ({
  maxAge: 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production',
});

const getClearCookieOptions = () => ({
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production',
});

const generateJwt = (user) => jwt.sign(
  {
    id: user.id,
    email: user.email,
    role: user.role,
  },
  getJwtSecret(),
  { expiresIn: '24h' },
);

const getPublicUser = (user) => {
  const publicUser = user.get({ plain: true });
  delete publicUser.password;
  return publicUser;
};

const setAuthCookie = (res, user) => {
  const token = generateJwt(user);
  res.cookie('token', token, getCookieOptions());
};

class UserController {
  async getAll(req, res) {
    try {
      const users = await User.findAll({
        attributes: ['id', 'name', 'email', 'phone', 'photo_url', 'role'],
        order: [['id', 'ASC']],
      });

      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({
        message: 'Users loading failed',
        error: error.message,
      });
    }
  }

  async registration(req, res) {
    try {
      const { name, email, password, phone, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required' });
      }

      const candidate = await User.findOne({ where: { email } });
      if (candidate) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }

      const hashPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        phone,
        role: role || 'CLIENT',
        password: hashPassword,
      });

      setAuthCookie(res, user);

      return res.status(201).json({
        user: getPublicUser(user),
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Registration failed',
        error: error.message,
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      setAuthCookie(res, user);

      return res.status(200).json({
        user: getPublicUser(user),
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Login failed',
        error: error.message,
      });
    }
  }

  async check(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      setAuthCookie(res, user);

      return res.status(200).json({ user: getPublicUser(user) });
    } catch (error) {
      return res.status(500).json({
        message: 'User check failed',
        error: error.message,
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const {
        name,
        email,
        phone,
        photo_url,
        password,
      } = req.body;
      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const payload = {};
      if (name !== undefined) payload.name = name;
      if (email !== undefined) payload.email = email;
      if (phone !== undefined) payload.phone = phone;
      if (photo_url !== undefined) payload.photo_url = photo_url;
      if (password) payload.password = await bcrypt.hash(password, 10);

      await user.update(payload);

      return res.status(200).json({
        user: getPublicUser(user),
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Profile update failed',
        error: error.message,
      });
    }
  }

  async logout(req, res) {
    res.clearCookie('token', getClearCookieOptions());
    return res.status(200).json({ message: 'Logged out' });
  }
}

module.exports = new UserController();
