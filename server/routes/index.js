const Router = require('express');
const userRouter = require('./userRouter');
const serviceRouter = require('./serviceRouter');
const masterRouter = require('./masterRouter');
const appointmentRouter = require('./appointmentRouter');
const notificationRouter = require('./notificationRouter');
const UserController = require('../controllers/userController');
const CheckRoleMiddleware = require('../middleware/CheckRoleMiddleware');

const router = new Router();

router.get('/ping', (req, res) => {
  res.status(200).json({ message: 'pong' });
});

router.get('/users', CheckRoleMiddleware('ADMIN'), UserController.getAll);
router.use('/user', userRouter);
router.use('/services', serviceRouter);
router.use('/masters', masterRouter);
router.use('/appointments', appointmentRouter);
router.use('/notifications', notificationRouter);

module.exports = router;
