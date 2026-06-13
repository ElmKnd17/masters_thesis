const Router = require('express');
const AuthMiddleware = require('../middleware/AuthMiddleware');
const CheckRoleMiddleware = require('../middleware/CheckRoleMiddleware');
const { appointmentController } = require('../controllers/appointmentController');

const router = new Router();

router.get('/available-slots', appointmentController.getAvailableSlots);
router.get('/client/me', AuthMiddleware, appointmentController.getClientAppointments);
router.get('/me', CheckRoleMiddleware('MASTER'), appointmentController.getMyAppointments);
router.get('/', CheckRoleMiddleware('ADMIN'), appointmentController.getAll);
router.post('/', AuthMiddleware, appointmentController.create);
router.put(
  '/:id',
  CheckRoleMiddleware(['MASTER', 'ADMIN']),
  appointmentController.updateAppointment,
);
router.patch(
  '/:id/status',
  AuthMiddleware,
  appointmentController.updateStatus,
);

module.exports = router;
