// Notification Service for IGCFMS
// Handles admin notifications and email alerts

import axios from 'axios';

class NotificationService {
  constructor() {
    this.API_BASE = 'http://localhost:8000/api';
    this.notifications = [];
    this.listeners = [];
  }

  // Get auth headers
  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Add listener for real-time notifications
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Remove listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.notifications));
  }

  // Create notification
  async createNotification(data) {
    try {
      const notification = {
        id: Date.now(),
        title: data.title,
        message: data.message,
        type: data.type || 'info', // info, success, warning, error
        user_id: data.user_id || null, // null for admin notifications
        transaction_id: data.transaction_id || null,
        fund_account_id: data.fund_account_id || null,
        amount: data.amount || null,
        created_at: new Date().toISOString(),
        read: false,
        ...data
      };

      // Store locally
      this.notifications.unshift(notification);
      
      // Notify listeners
      this.notifyListeners();

      // Send email if specified
      if (data.sendEmail) {
        await this.sendEmailNotification(notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  // Send email notification
  async sendEmailNotification(notification) {
    try {
      const emailData = {
        to: notification.email || 'admin@igcfms.gov.ph',
        subject: `IGCFMS Alert: ${notification.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
              <h1>🏛️ IGCFMS Notification</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <h2 style="color: #333;">${notification.title}</h2>
              <p style="color: #666; line-height: 1.6;">${notification.message}</p>
              
              ${notification.amount ? `<p><strong>Amount:</strong> ₱${parseFloat(notification.amount).toLocaleString()}</p>` : ''}
              ${notification.fund_account ? `<p><strong>Fund Account:</strong> ${notification.fund_account}</p>` : ''}
              ${notification.transaction_id ? `<p><strong>Transaction ID:</strong> #${notification.transaction_id}</p>` : ''}
              
              <div style="margin-top: 20px; padding: 15px; background: white; border-left: 4px solid #667eea;">
                <p style="margin: 0; color: #666;">
                  <strong>Time:</strong> ${new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
              <p>This is an automated notification from the Integrated Government Cash Flow Management System</p>
            </div>
          </div>
        `,
        type: notification.type
      };

      console.log('Email notification would be sent:', emailData);
      // Note: Actual email sending would require backend email service
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  // Transaction-specific notifications
  async notifyTransaction(type, data) {
    switch (type) {
      case 'MONEY_RECEIVED':
        return await this.createNotification({
          title: '💰 Money Received',
          message: `₱${parseFloat(data.amount).toLocaleString()} received from ${data.payer} into ${data.fund_account}`,
          type: 'success',
          transaction_id: data.transaction_id,
          fund_account_id: data.fund_account_id,
          amount: data.amount,
          sendEmail: true
        });

      case 'MONEY_ISSUED':
        return await this.createNotification({
          title: '💸 Money Issued',
          message: `₱${parseFloat(data.amount).toLocaleString()} disbursed to ${data.recipient} from ${data.fund_account}`,
          type: 'warning',
          transaction_id: data.transaction_id,
          fund_account_id: data.fund_account_id,
          amount: data.amount,
          sendEmail: true
        });

      case 'CHEQUE_ISSUED':
        return await this.createNotification({
          title: '📝 Cheque Issued',
          message: `Cheque #${data.cheque_number} for ₱${parseFloat(data.amount).toLocaleString()} issued to ${data.recipient}`,
          type: 'info',
          transaction_id: data.transaction_id,
          fund_account_id: data.fund_account_id,
          amount: data.amount,
          cheque_number: data.cheque_number,
          sendEmail: true
        });

      case 'FUND_ACCOUNT_CREATED':
        return await this.createNotification({
          title: '🏦 Fund Account Created',
          message: `New fund account "${data.name}" created with initial balance ₱${parseFloat(data.balance).toLocaleString()}`,
          type: 'info',
          fund_account_id: data.fund_account_id,
          amount: data.balance,
          sendEmail: true
        });

      case 'RECIPIENT_ACCOUNT_CREATED':
        return await this.createNotification({
          title: '👤 Recipient Account Created',
          message: `New recipient account "${data.name}" created and linked to ${data.fund_account}`,
          type: 'info',
          fund_account_id: data.fund_account_id,
          sendEmail: true
        });

      case 'LOW_BALANCE_WARNING':
        return await this.createNotification({
          title: '⚠️ Low Balance Warning',
          message: `Fund account "${data.fund_account}" balance is low: ₱${parseFloat(data.balance).toLocaleString()}`,
          type: 'warning',
          fund_account_id: data.fund_account_id,
          amount: data.balance,
          sendEmail: true
        });

      case 'TRANSACTION_OVERRIDE':
        return await this.createNotification({
          title: '🔄 Transaction Override',
          message: `Transaction #${data.transaction_id} was overridden by admin. Reason: ${data.reason}`,
          type: 'error',
          transaction_id: data.transaction_id,
          sendEmail: true
        });

      default:
        return await this.createNotification({
          title: data.title || 'System Notification',
          message: data.message || 'A system event occurred',
          type: data.type || 'info',
          sendEmail: data.sendEmail || false
        });
    }
  }

  // Get all notifications
  getNotifications() {
    return this.notifications;
  }

  // Mark notification as read
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
