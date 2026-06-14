const cron = require('node-cron');
const moment = require('moment-timezone');
const {
  Appointment,
  MasterProfile,
  Notification,
} = require('./models/models');

const APP_TIMEZONE = 'Etc/GMT-4';
const PENDING_STATUS = 'PENDING';
const CONFIRMED_STATUS = 'CONFIRMED';
const CANCELLED_STATUS = 'CANCELLED';
const COMPLETED_STATUS = 'COMPLETED';
const REMINDER_WINDOW_MINUTES = 120;

const normalizeDate = (date) => {
  if (typeof date === 'string') return date.slice(0, 10);
  return moment(date).format('YYYY-MM-DD');
};

const normalizeTime = (time) => {
  if (!time || typeof time !== 'string') return '00:00:00';

  const [hours = '00', minutes = '00', seconds = '00'] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
};

const getDateTimeInAppTimezone = (date, time) => (
  moment.tz(
    `${normalizeDate(date)} ${normalizeTime(time)}`,
    'YYYY-MM-DD HH:mm:ss',
    APP_TIMEZONE,
  )
);

const getAppointmentDateTime = (appointment, timeField) => (
  getDateTimeInAppTimezone(appointment.date, appointment[timeField])
);

const cancelExpiredPendingAppointments = async (now) => {
  const appointments = await Appointment.findAll({
    where: { status: PENDING_STATUS },
  });

  const expiredAppointments = appointments.filter((appointment) => (
    getAppointmentDateTime(appointment, 'start_time').isSameOrBefore(now)
  ));

  await Promise.all(expiredAppointments.map(async (appointment) => {
    await appointment.update({ status: CANCELLED_STATUS });
    await Notification.create({
      userId: appointment.clientId,
      message: `Ваша запись на ${appointment.date} в ${appointment.start_time} автоматически отменена, так как она не была подтверждена`,
    });
  }));
};

const completeFinishedAppointments = async (now) => {
  const appointments = await Appointment.findAll({
    where: { status: CONFIRMED_STATUS },
  });

  const finishedAppointments = appointments.filter((appointment) => (
    getAppointmentDateTime(appointment, 'end_time').isSameOrBefore(now)
  ));

  await Promise.all(finishedAppointments.map((appointment) => (
    appointment.update({ status: COMPLETED_STATUS })
  )));
};

const sendUpcomingAppointmentReminders = async (now) => {
  const appointments = await Appointment.findAll({
    where: {
      status: CONFIRMED_STATUS,
      reminder_sent: false,
    },
    include: [
      {
        model: MasterProfile,
        as: 'master',
        attributes: ['id', 'userId'],
      },
    ],
  });

  const upcomingAppointments = appointments.filter((appointment) => {
    const startsAt = getAppointmentDateTime(appointment, 'start_time');
    const minutesUntilStart = startsAt.diff(now, 'minutes', true);

    return minutesUntilStart > 0 && minutesUntilStart <= REMINDER_WINDOW_MINUTES;
  });

  await Promise.all(upcomingAppointments.map(async (appointment) => {
    const notifications = [
      {
        userId: appointment.clientId,
        message: 'Напоминание: у вас запланирована запись через 2 часа',
      },
    ];

    if (appointment.master?.userId) {
      notifications.push({
        userId: appointment.master.userId,
        message: 'Напоминание: у вас запланирована запись через 2 часа',
      });
    }

    await Notification.bulkCreate(notifications);
    await appointment.update({ reminder_sent: true });
  }));
};

const runAppointmentJobs = async () => {
  const now = moment().tz(APP_TIMEZONE);

  await cancelExpiredPendingAppointments(now);
  await completeFinishedAppointments(now);
  await sendUpcomingAppointmentReminders(now);
};

const startCronJobs = () => {
  cron.schedule('* * * * *', async () => {
    try {
      await runAppointmentJobs();
    } catch (error) {
      console.error('Appointment cron job failed:', error);
    }
  }, {
    timezone: APP_TIMEZONE,
  });
};

module.exports = {
  startCronJobs,
  runAppointmentJobs,
};
