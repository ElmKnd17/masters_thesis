require('dotenv').config();

const bcrypt = require('bcrypt');
const sequelize = require('./db');
const {
  User,
  Service,
  MasterProfile,
  Schedule,
} = require('./models/models');

const PASSWORD = '123456';
const SALT_ROUNDS = 10;

const toDateOnly = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const createUser = async ({ name, email, phone, role, passwordHash }) => User.create({
  name,
  email,
  phone,
  role,
  password: passwordHash,
});

const createSchedulesForNextDays = async (masters, daysCount = 3) => {
  const schedules = [];

  for (const master of masters) {
    for (let dayOffset = 0; dayOffset < daysCount; dayOffset += 1) {
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);

      schedules.push({
        masterProfileId: master.id,
        date: toDateOnly(date),
        start_time: '10:00',
        end_time: '18:00',
      });
    }
  }

  return Schedule.bulkCreate(schedules);
};

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

    const admin = await createUser({
      name: 'Администратор',
      email: 'admin@salon.local',
      phone: '+7 900 000 00 01',
      role: 'ADMIN',
      passwordHash,
    });

    const firstMasterUser = await createUser({
      name: 'Екатерина Вестникова',
      email: 'master1@salon.local',
      phone: '+7 900 000 00 02',
      role: 'MASTER',
      passwordHash,
    });

    const secondMasterUser = await createUser({
      name: 'Ольга Дмитриева',
      email: 'master2@salon.local',
      phone: '+7 900 000 00 03',
      role: 'MASTER',
      passwordHash,
    });

    const firstMasterProfile = await MasterProfile.create({
      userId: firstMasterUser.id,
      experience: 8,
      specialization: 'Стрижки и уходы для волос',
    });

    const secondMasterProfile = await MasterProfile.create({
      userId: secondMasterUser.id,
      experience: 10,
      specialization: 'Окрашивание и маникюр',
    });

    const haircut = await Service.create({
      name: 'Стрижка',
      price: 1500,
      duration: 60,
    });

    const coloring = await Service.create({
      name: 'Окрашивание',
      price: 3500,
      duration: 120,
    });

    const manicure = await Service.create({
      name: 'Маникюр',
      price: 1800,
      duration: 90,
    });

    await firstMasterProfile.setServices([haircut, coloring]);
    await secondMasterProfile.setServices([coloring, manicure]);

    await createSchedulesForNextDays([firstMasterProfile, secondMasterProfile], 3);

    console.log('Seed completed successfully');
    console.log('Created users:');
    console.log(`Admin: ${admin.email} / ${PASSWORD}`);
    console.log(`${firstMasterUser.name}: ${firstMasterUser.email} / ${PASSWORD}`);
    console.log(`${secondMasterUser.name}: ${secondMasterUser.email} / ${PASSWORD}`);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

seed();
