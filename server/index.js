require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { DataTypes } = require('sequelize');
const sequelize = require('./db');
const { Appointment } = require('./models/models');
const router = require('./routes');
const errorHandler = require('./middleware/ErrorHandlingMiddleware');
const { startCronJobs } = require('./cron');

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const app = express();

app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use('/api', router);
app.use(errorHandler);

const ensureAppointmentReminderColumn = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const tableName = Appointment.getTableName();
  const tableDescription = await queryInterface.describeTable(tableName);

  if (!tableDescription.reminder_sent) {
    await queryInterface.addColumn(tableName, 'reminder_sent', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    });
  }
};

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await ensureAppointmentReminderColumn();
    startCronJobs();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

start();
