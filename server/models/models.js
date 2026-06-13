const sequelize = require('../db');
const { DataTypes } = require('sequelize');

const User = sequelize.define('user', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING },
  photo_url: { type: DataTypes.STRING, allowNull: true },
  role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'CLIENT' },
});

const Service = sequelize.define('service', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  duration: { type: DataTypes.INTEGER, allowNull: false },
});

const MasterProfile = sequelize.define('master_profile', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  experience: { type: DataTypes.INTEGER, defaultValue: 0 },
  specialization: { type: DataTypes.STRING, allowNull: false },
  photo_url: { type: DataTypes.STRING, allowNull: true },
});

const MasterService = sequelize.define('master_service', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
});

const Schedule = sequelize.define('schedule', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  start_time: { type: DataTypes.TIME, allowNull: false },
  end_time: { type: DataTypes.TIME, allowNull: false },
});

const Appointment = sequelize.define('appointment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  start_time: { type: DataTypes.TIME, allowNull: false },
  end_time: { type: DataTypes.TIME, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'PENDING' },
});

const Notification = sequelize.define('notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  message: { type: DataTypes.STRING, allowNull: false },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
});

User.hasOne(MasterProfile, {
  foreignKey: 'userId',
  as: 'masterProfile',
  onDelete: 'CASCADE',
});
MasterProfile.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

MasterProfile.belongsToMany(Service, {
  through: MasterService,
  foreignKey: 'masterProfileId',
  otherKey: 'serviceId',
  as: 'services',
});
Service.belongsToMany(MasterProfile, {
  through: MasterService,
  foreignKey: 'serviceId',
  otherKey: 'masterProfileId',
  as: 'masters',
});

MasterProfile.hasMany(Schedule, {
  foreignKey: 'masterProfileId',
  as: 'schedule',
  onDelete: 'CASCADE',
});
Schedule.belongsTo(MasterProfile, {
  foreignKey: 'masterProfileId',
  as: 'master',
});

User.hasMany(Appointment, {
  foreignKey: 'clientId',
  as: 'appointments',
});
Appointment.belongsTo(User, {
  foreignKey: 'clientId',
  as: 'client',
});

MasterProfile.hasMany(Appointment, {
  foreignKey: 'masterProfileId',
  as: 'appointments',
});
Appointment.belongsTo(MasterProfile, {
  foreignKey: 'masterProfileId',
  as: 'master',
});

Service.hasMany(Appointment, {
  foreignKey: 'serviceId',
  as: 'appointments',
});
Appointment.belongsTo(Service, {
  foreignKey: 'serviceId',
  as: 'service',
});

User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications',
});
Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

module.exports = {
  User,
  Service,
  MasterProfile,
  MasterService,
  Schedule,
  Appointment,
  Notification,
};
