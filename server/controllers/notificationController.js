const { Notification } = require('../models/models');

class NotificationController {
  async getAll(req, res) {
    try {
      const notifications = await Notification.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']],
      });

      return res.status(200).json(notifications);
    } catch (error) {
      return res.status(500).json({
        message: 'Notifications loading failed',
        error: error.message,
      });
    }
  }

  async markAsRead(req, res) {
    try {
      const notification = await Notification.findOne({
        where: {
          id: req.params.id,
          userId: req.user.id,
        },
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      await notification.update({ isRead: true });

      return res.status(200).json(notification);
    } catch (error) {
      return res.status(500).json({
        message: 'Notification update failed',
        error: error.message,
      });
    }
  }
}

module.exports = new NotificationController();
