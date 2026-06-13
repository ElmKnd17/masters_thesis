const { Op } = require('sequelize');
const {
  Appointment,
  MasterProfile,
  Notification,
  Schedule,
  Service,
  User,
} = require('../models/models');

const DEFAULT_SLOT_STEP = 30;
const CANCELLED_STATUS = 'CANCELLED';
const statusLabels = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждена',
  CANCELLED: 'Отменена',
  COMPLETED: 'Завершена',
};

const parseTimeToMinutes = (time) => {
  if (!time || typeof time !== 'string') return null;

  const [hours, minutes] = time.split(':').map(Number);

  if (
    Number.isNaN(hours)
    || Number.isNaN(minutes)
    || hours < 0
    || hours > 23
    || minutes < 0
    || minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
};

const formatMinutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const rangesOverlap = (firstStart, firstEnd, secondStart, secondEnd) => (
  firstStart < secondEnd && firstEnd > secondStart
);

const getBusyRanges = (appointments) => appointments
  .map((appointment) => ({
    start: parseTimeToMinutes(appointment.start_time),
    end: parseTimeToMinutes(appointment.end_time),
  }))
  .filter((range) => range.start !== null && range.end !== null && range.end > range.start);

const buildAvailableSlots = ({ schedule, serviceDuration, appointments }) => {
  const scheduleStart = parseTimeToMinutes(schedule.start_time);
  const scheduleEnd = parseTimeToMinutes(schedule.end_time);
  const duration = Number(serviceDuration) || DEFAULT_SLOT_STEP;
  const step = duration || DEFAULT_SLOT_STEP;

  if (
    scheduleStart === null
    || scheduleEnd === null
    || scheduleEnd <= scheduleStart
    || duration <= 0
  ) {
    return [];
  }

  const busyRanges = getBusyRanges(appointments);
  const slots = [];

  for (
    let slotStart = scheduleStart;
    slotStart + duration <= scheduleEnd;
    slotStart += step
  ) {
    const slotEnd = slotStart + duration;
    const isBusy = busyRanges.some((range) => (
      rangesOverlap(slotStart, slotEnd, range.start, range.end)
    ));

    if (!isBusy) {
      slots.push({
        start_time: formatMinutesToTime(slotStart),
        end_time: formatMinutesToTime(slotEnd),
        label: `${formatMinutesToTime(slotStart)} - ${formatMinutesToTime(slotEnd)}`,
      });
    }
  }

  return slots;
};

const loadAvailabilityContext = async ({ masterId, date, serviceId }) => {
  const [master, service, schedule, appointments] = await Promise.all([
    MasterProfile.findByPk(masterId),
    Service.findByPk(serviceId),
    Schedule.findOne({
      where: {
        masterProfileId: masterId,
        date,
      },
    }),
    Appointment.findAll({
      where: {
        masterProfileId: masterId,
        date,
        status: { [Op.notIn]: ['CANCELLED', 'COMPLETED'] },
      },
      order: [['start_time', 'ASC']],
    }),
  ]);

  return {
    master,
    service,
    schedule,
    appointments,
  };
};

const getDateRange = (period = 'week') => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  if (period === 'today') {
    end.setDate(start.getDate());
  } else {
    end.setDate(start.getDate() + 6);
  }

  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
};

const appointmentInclude = [
  {
    model: User,
    as: 'client',
    attributes: ['id', 'name', 'email', 'phone', 'photo_url'],
  },
  {
    model: Service,
    as: 'service',
  },
  {
    model: MasterProfile,
    as: 'master',
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'phone', 'photo_url'],
      },
    ],
  },
];

const clientAppointmentInclude = [
  {
    model: Service,
    as: 'service',
  },
  {
    model: MasterProfile,
    as: 'master',
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'phone', 'photo_url'],
      },
    ],
  },
];

class AppointmentController {
  async getAvailableSlots(req, res) {
    try {
      const { masterId, date, serviceId } = req.query;

      if (!masterId || !date || !serviceId) {
        return res.status(400).json({
          message: 'masterId, date and serviceId are required',
        });
      }

      const {
        master,
        service,
        schedule,
        appointments,
      } = await loadAvailabilityContext({ masterId, date, serviceId });

      if (!master) {
        return res.status(404).json({ message: 'Master not found' });
      }

      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }

      if (!schedule) {
        return res.status(200).json({
          date,
          masterId: Number(masterId),
          serviceId: Number(serviceId),
          duration: service.duration,
          slots: [],
        });
      }

      const slots = buildAvailableSlots({
        schedule,
        serviceDuration: service.duration,
        appointments,
      });

      return res.status(200).json({
        date,
        masterId: Number(masterId),
        serviceId: Number(serviceId),
        duration: service.duration,
        schedule: {
          start_time: schedule.start_time,
          end_time: schedule.end_time,
        },
        slots,
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Available slots loading failed',
        error: error.message,
      });
    }
  }

  async create(req, res) {
    try {
      const { masterId, date, serviceId, start_time } = req.body;

      if (!masterId || !date || !serviceId || !start_time) {
        return res.status(400).json({
          message: 'masterId, date, serviceId and start_time are required',
        });
      }

      const {
        master,
        service,
        schedule,
        appointments,
      } = await loadAvailabilityContext({ masterId, date, serviceId });

      if (!master) {
        return res.status(404).json({ message: 'Master not found' });
      }

      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }

      if (!schedule) {
        return res.status(409).json({ message: 'Master has no schedule for this date' });
      }

      const slots = buildAvailableSlots({
        schedule,
        serviceDuration: service.duration,
        appointments,
      });
      const selectedSlot = slots.find((slot) => slot.start_time === start_time);

      if (!selectedSlot) {
        return res.status(409).json({ message: 'Selected time slot is not available' });
      }

      const appointment = await Appointment.create({
        clientId: req.user.id,
        masterProfileId: masterId,
        serviceId,
        date,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        status: 'PENDING',
      });
      await Notification.create({
        userId: master.userId,
        message: `У вас новая запись на ${date} в ${selectedSlot.start_time}`,
      });

      return res.status(201).json({ appointment });
    } catch (error) {
      return res.status(500).json({
        message: 'Appointment creation failed',
        error: error.message,
      });
    }
  }

  async getMyAppointments(req, res) {
    try {
      const { period = 'week' } = req.query;
      const { from, to } = getDateRange(period);
      const master = await MasterProfile.findOne({
        where: { userId: req.user.id },
      });

      if (!master) {
        return res.status(404).json({ message: 'Master profile not found' });
      }

      const appointments = await Appointment.findAll({
        where: {
          masterProfileId: master.id,
          date: { [Op.between]: [from, to] },
        },
        include: appointmentInclude,
        order: [['date', 'ASC'], ['start_time', 'ASC']],
      });

      return res.status(200).json({ appointments });
    } catch (error) {
      return res.status(500).json({
        message: 'Appointments loading failed',
        error: error.message,
      });
    }
  }

  async getClientAppointments(req, res) {
    try {
      const appointments = await Appointment.findAll({
        where: { clientId: req.user.id },
        include: clientAppointmentInclude,
        order: [['date', 'DESC'], ['start_time', 'ASC']],
      });

      return res.status(200).json({ appointments });
    } catch (error) {
      return res.status(500).json({
        message: 'Client appointments loading failed',
        error: error.message,
      });
    }
  }

  async getAll(req, res) {
    try {
      const appointments = await Appointment.findAll({
        include: appointmentInclude,
        order: [['date', 'DESC'], ['start_time', 'ASC']],
      });

      return res.status(200).json({ appointments });
    } catch (error) {
      return res.status(500).json({
        message: 'Appointments loading failed',
        error: error.message,
      });
    }
  }

  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const allowedStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid appointment status' });
      }

      const appointment = await Appointment.findByPk(req.params.id, {
        include: [{ model: MasterProfile, as: 'master' }],
      });

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      const isAdmin = req.user.role === 'ADMIN';
      const isOwnerMaster = appointment.master?.userId === req.user.id;
      const isOwnerClient = appointment.clientId === req.user.id;

      if (!isAdmin && !isOwnerMaster && !isOwnerClient) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      if (isOwnerClient && status !== CANCELLED_STATUS) {
        return res.status(403).json({ message: 'Clients can only cancel appointments' });
      }

      await appointment.update({ status });
      if (isOwnerClient && status === 'CANCELLED') {
        await Notification.create({
          userId: appointment.master.userId,
          message: `Клиент отменил запись на ${appointment.date} в ${appointment.start_time}`,
        });
      }
      await Notification.create({
        userId: appointment.clientId,
        message: `Статус вашей записи изменен на: ${statusLabels[status] || status}`,
      });

      return res.status(200).json({ appointment });
    } catch (error) {
      return res.status(500).json({
        message: 'Appointment status update failed',
        error: error.message,
      });
    }
  }

  async updateAppointment(req, res) {
    try {
      const { date, start_time, end_time } = req.body;
      const appointment = await Appointment.findByPk(req.params.id, {
        include: [{ model: MasterProfile, as: 'master' }],
      });

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      const isAdmin = req.user.role === 'ADMIN';
      const isOwnerMaster = appointment.master?.userId === req.user.id;

      if (!isAdmin && !isOwnerMaster) {
        return res.status(403).json({ message: 'Forbidden' });
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

      const nextStartTime = payload.start_time || appointment.start_time;
      const nextEndTime = payload.end_time || appointment.end_time;
      const nextStartMinutes = parseTimeToMinutes(nextStartTime);
      const nextEndMinutes = parseTimeToMinutes(nextEndTime);

      if (
        nextStartMinutes === null
        || nextEndMinutes === null
        || nextEndMinutes <= nextStartMinutes
      ) {
        return res.status(400).json({ message: 'Invalid appointment time range' });
      }

      await appointment.update(payload);

      const updatedAppointment = await Appointment.findByPk(appointment.id, {
        include: appointmentInclude,
      });

      return res.status(200).json({ appointment: updatedAppointment });
    } catch (error) {
      return res.status(500).json({
        message: 'Appointment update failed',
        error: error.message,
      });
    }
  }
}

module.exports = {
  appointmentController: new AppointmentController(),
  buildAvailableSlots,
  parseTimeToMinutes,
  formatMinutesToTime,
};
