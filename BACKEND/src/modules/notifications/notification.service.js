class NotificationService {
  async createNotification({
    userId,
    title,
    message,
  }) {
    console.log(
      "Notification:",
      title
    );
  }
}

module.exports =
  new NotificationService();