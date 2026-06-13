const Router = require('express');
const UserController = require('../controllers/userController');
const AuthMiddleware = require('../middleware/AuthMiddleware');

const router = new Router();

router.post('/registration', UserController.registration);
router.post('/login', UserController.login);
router.post('/logout', UserController.logout);
router.get('/auth', AuthMiddleware, UserController.check);
router.put('/profile', AuthMiddleware, UserController.updateProfile);

module.exports = router;
