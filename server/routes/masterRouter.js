const Router = require('express');
const MasterController = require('../controllers/masterController');
const CheckRoleMiddleware = require('../middleware/CheckRoleMiddleware');

const router = new Router();

router.post('/', CheckRoleMiddleware('ADMIN'), MasterController.create);
router.get('/', MasterController.getAll);
router.put('/schedule/:id', CheckRoleMiddleware('ADMIN'), MasterController.updateSchedule);
router.delete('/schedule/:id', CheckRoleMiddleware('ADMIN'), MasterController.deleteSchedule);
router.get('/:id', MasterController.getOne);
router.put('/:id', CheckRoleMiddleware('ADMIN'), MasterController.update);
router.delete('/:id', CheckRoleMiddleware('ADMIN'), MasterController.delete);
router.post('/:id/schedule', CheckRoleMiddleware('ADMIN'), MasterController.createSchedule);

module.exports = router;
