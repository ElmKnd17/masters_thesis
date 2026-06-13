const { Service } = require('../models/models');

const validateServicePayload = ({ name, price, duration }) => {
  if (!name || price === undefined || duration === undefined) {
    return 'Name, price and duration are required';
  }

  if (Number.isNaN(Number(price)) || Number(price) < 0) {
    return 'Price must be a positive number';
  }

  if (!Number.isInteger(Number(duration)) || Number(duration) <= 0) {
    return 'Duration must be a positive integer';
  }

  return null;
};

class ServiceController {
  async create(req, res) {
    try {
      const validationError = validateServicePayload(req.body);
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }

      const { name, price, duration } = req.body;
      const service = await Service.create({
        name,
        price,
        duration: Number(duration),
      });

      return res.status(201).json(service);
    } catch (error) {
      return res.status(500).json({
        message: 'Service creation failed',
        error: error.message,
      });
    }
  }

  async getAll(req, res) {
    try {
      const services = await Service.findAll({ order: [['id', 'ASC']] });
      return res.status(200).json(services);
    } catch (error) {
      return res.status(500).json({
        message: 'Services loading failed',
        error: error.message,
      });
    }
  }

  async getOne(req, res) {
    try {
      const service = await Service.findByPk(req.params.id);

      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }

      return res.status(200).json(service);
    } catch (error) {
      return res.status(500).json({
        message: 'Service loading failed',
        error: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      const service = await Service.findByPk(req.params.id);

      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }

      const payload = {};
      if (req.body.name !== undefined) payload.name = req.body.name;
      if (req.body.price !== undefined) {
        if (Number.isNaN(Number(req.body.price)) || Number(req.body.price) < 0) {
          return res.status(400).json({ message: 'Price must be a positive number' });
        }
        payload.price = req.body.price;
      }
      if (req.body.duration !== undefined) {
        if (!Number.isInteger(Number(req.body.duration)) || Number(req.body.duration) <= 0) {
          return res.status(400).json({ message: 'Duration must be a positive integer' });
        }
        payload.duration = Number(req.body.duration);
      }

      await service.update(payload);
      return res.status(200).json(service);
    } catch (error) {
      return res.status(500).json({
        message: 'Service update failed',
        error: error.message,
      });
    }
  }

  async delete(req, res) {
    try {
      const service = await Service.findByPk(req.params.id);

      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }

      await service.destroy();
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({
        message: 'Service deletion failed',
        error: error.message,
      });
    }
  }
}

module.exports = new ServiceController();
