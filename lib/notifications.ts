// Notification system utilities
// Handles creating notifications and extensible notification channels

import db from "./db"

export type NotificationType =
  | "request_accepted"
  | "helper_on_way"
  | "service_completed"
  | "request_cancelled"

export interface NotificationData {
  requestId?: number
  helperId?: number
  [key: string]: any
}

export interface NotificationChannel {
  send(userId: number, type: NotificationType, message: string, data?: NotificationData): Promise<void>
}

// In-app notification channel (stores in database)
export class InAppNotificationChannel implements NotificationChannel {
  async send(userId: number, type: NotificationType, message: string, data?: NotificationData): Promise<void> {
    db.prepare(`
      INSERT INTO notifications (user_id, type, message, data)
      VALUES (?, ?, ?, ?)
    `).run(userId, type, message, data ? JSON.stringify(data) : null)
  }
}

// Push notification channel (extensible - can be implemented with Firebase, etc.)
export class PushNotificationChannel implements NotificationChannel {
  async send(userId: number, type: NotificationType, message: string, data?: NotificationData): Promise<void> {
    // TODO: Implement push notification logic
    // For now, just log - can be extended to use FCM, APNs, etc.
    console.log(`Push notification to user ${userId}: ${message}`)
  }
}

// Notification service that manages multiple channels
export class NotificationService {
  private channels: NotificationChannel[] = []

  constructor() {
    // Always include in-app notifications
    this.channels.push(new InAppNotificationChannel())

    // Add push notifications if configured
    if (process.env.ENABLE_PUSH_NOTIFICATIONS === "true") {
      this.channels.push(new PushNotificationChannel())
    }
  }

  async sendNotification(userId: number, type: NotificationType, message: string, data?: NotificationData): Promise<void> {
    await Promise.all(
      this.channels.map(channel => channel.send(userId, type, message, data))
    )
  }

  // Helper methods for specific notification types
  async notifyRequestAccepted(userId: number, requestId: number, helperName: string): Promise<void> {
    const message = `Your service request has been accepted by ${helperName}.`
    await this.sendNotification(userId, "request_accepted", message, { requestId })
  }

  async notifyHelperOnWay(userId: number, requestId: number, helperName: string): Promise<void> {
    const message = `${helperName} is on the way to assist you.`
    await this.sendNotification(userId, "helper_on_way", message, { requestId })
  }

  async notifyServiceCompleted(userId: number, requestId: number, helperName: string): Promise<void> {
    const message = `Service completed by ${helperName}. Please rate the service.`
    await this.sendNotification(userId, "service_completed", message, { requestId })
  }

  async notifyRequestCancelled(userId: number, requestId: number, reason?: string): Promise<void> {
    const message = `Your service request has been cancelled.${reason ? ` Reason: ${reason}` : ""}`
    await this.sendNotification(userId, "request_cancelled", message, { requestId })
  }
}

// Singleton instance
export const notificationService = new NotificationService()