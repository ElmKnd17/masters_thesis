const {
  MasterProfile,
  Schedule,
  Service,
  User,
} = require('../models/models');

const masterInclude = [
  {
    model: User,
    as: 'user',
    attributes: ['id', 'name', 'email', 'phone', 'photo_url'],
  },
  {
    model: Service,
    as: 'services',
    through: { attributes: [] },
  },
  {
    model: Schedule,
    as: 'schedule',
  },
];

class MasterController {
  async create(req, res) {
    try {
      const {
        userId,
        experience,
        specialization,
        photo_url,
        serviceIds = [],
      } = req.body;

      if (!userId || !specialization) {
        return res.status(400).json({ message: 'userId and specialization are required' });
      }

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await user.update({ role: 'MASTER' });

      const master = await MasterProfile.create({
        userId,
        experience: Number(experience) || 0,
        specialization,
        photo_url: photo_url || null,
      });

      if (Array.isArray(serviceIds) && serviceIds.length > 0) {
        await master.setServices(serviceIds);
      }

      const createdMaster = await MasterProfile.findByPk(master.id, {
        include: masterInclude,
      });

      return res.status(201).json(createdMaster);
    } catch (error) {
      return res.status(500).json({
        message: 'Master creation failed',
        error: error.message,
      });
    }
  }

  async getAll(req, res) {
    try {
      const masters = await MasterProfile.findAll({
        include: masterInclude,
        order: [['id', 'ASC']],
      });

      return res.status(200).json(masters);
    } catch (error) {
      return res.status(500).json({
        message: 'Masters loading failed',
        error: error.message,
      });
    }
  }

  async getOne(req, res) {
    try {
      const master = await MasterProfile.findByPk(req.params.id, {
        include: masterInclude,
      });

      if (!master) {
        return res.status(404).json({ message: 'Master not found' });
      }

      return res.status(200).json(master);
    } catch (error) {
      return res.status(500).json({
        message: 'Master loading failed',
        error: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      const {
        experience,
        specialization,
        photo_url,
        serviceIds,
      } = req.body;
      const master = await MasterProfile.findByPk(req.params.id);

      if (!master) {
        return res.status(404).json({ message: 'Master not found' });
      }

      const payload = {};
      if (experience !== undefined) payload.experience = Number(experience) || 0;
      if (specialization !== undefined) payload.specialization = specialization;
      if (photo_url !== undefined) payload.photo_url = photo_url;

      await master.update(payload);

      if (Array.isArray(serviceIds)) {
        await master.setServices(serviceIds);
      }

      const updatedMaster = await MasterProfile.findByPk(master.id, {
        include: masterInclude,
      });

      return res.status(200).json(updatedMaster);
    } catch (error) {
      return res.status(500).json({
        message: 'Master update failed',
        error: error.message,
      });
    }
  }

  async delete(req, res) {
    try {
      const master = await MasterProfile.findByPk(req.params.id);

      if (!master) {
        return res.status(404).json({ message: 'Master not found' });
      }

      const user = await User.findByPk(master.userId);

      await master.destroy();

      if (user) {
        await user.update({ role: 'CLIENT' });
      }

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({
        message: 'Master deletion failed',
        error: error.message,
      });
    }
  }

  async createSchedule(req, res) {
    try {
      const { date, start_time, end_time } = req.body;
      const master = await MasterProfile.findByPk(req.params.id);

      if (!master) {
        return res.status(404).json({ message: 'Master not found' });
      }

      if (!date || !start_time || !end_time) {
        return res.status(400).json({ message: 'date, start_time and end_time are required' });
      }

      const schedule = await Schedule.create({
        masterProfileId: master.id,
        date,
        start_time,
        end_time,
      });

      return res.status(201).json(schedule);
    } catch (error) {
      return res.status(500).json({
        message: 'Schedule creation failed',
        error: error.message,
      });
    }
  }

  async updateSchedule(req, res) {
    try {
      const { date, start_time, end_time } = req.body;
      const schedule = await Schedule.findByPk(req.params.id);

      if (!schedule) {
        return res.status(404).json({ message: 'Schedule slot not found' });
      }

      const payload = {};
      if (date !== undefined) payload.date = date;
      if (start_time !== undefined) payload.start_time = start_time;
      if (end_time !== undefined) payload.end_time = end_time;

      if (Object.keys(payload).length === 0) {
        return res.status(400).json({
          message: 'date, start_time or end_time is required',
        });
      }

      await schedule.update(payload);

      return res.status(200).json(schedule);
    } catch (error) {
      return res.status(500).json({
        message: 'Schedule update failed',
        error: error.message,
      });
    }
  }

  async deleteSchedule(req, res) {
    try {
      const schedule = await Schedule.findByPk(req.params.id);

      if (!schedule) {
        return res.status(404).json({ message: 'Schedule slot not found' });
      }

      await schedule.destroy();
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({
        message: 'Schedule deletion failed',
        error: error.message,
      });
    }
  }
}

module.exports = new MasterController();
