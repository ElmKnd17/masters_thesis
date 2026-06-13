const Router = require('express');
const ServiceController = require('../controllers/serviceController');
const CheckRoleMiddleware = require('../middleware/CheckRoleMiddleware');

const router = new Router();

router.post('/', CheckRoleMiddleware('ADMIN'), ServiceController.create);
router.get('/', ServiceController.getAll);
router.get('/:id', ServiceController.getOne);
router.put('/:id', CheckRoleMiddleware('ADMIN'), ServiceController.update);
router.delete('/:id', CheckRoleMiddleware('ADMIN'), ServiceController.delete);

module.exports = router;
