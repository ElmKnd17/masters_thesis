const Router = require('express');
const NotificationController = require('../controllers/notificationController');
const AuthMiddleware = require('../middleware/AuthMiddleware');

const router = new Router();

router.get('/', AuthMiddleware, NotificationController.getAll);
router.patch('/:id/read', AuthMiddleware, NotificationController.markAsRead);

module.exports = router;
