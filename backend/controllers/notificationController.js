const Notification = require('../models/Notification');

// Get user notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id
    })
    .populate('sender', 'name email image')
    .sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipient: req.user._id
      },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};