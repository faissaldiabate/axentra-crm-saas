import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { notificationsDB } from "./db";
import { secret } from "encore.dev/config";
import nodemailer from "nodemailer";

const smtpHost = secret("SMTPHost");
const smtpPort = secret("SMTPPort");
const smtpUser = secret("SMTPUser");
const smtpPassword = secret("SMTPPassword");

export type NotificationChannel = "email" | "whatsapp" | "sms";

export interface SendNotificationRequest {
  userId: number;
  message: string;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
}

export interface SendNotificationResponse {
  id: number;
  status: string;
}

// Sends a notification via the specified channel.
export const sendNotification = api<SendNotificationRequest, SendNotificationResponse>(
  { auth: true, expose: true, method: "POST", path: "/notifications/send" },
  async (req) => {
    const auth = getAuthData()!;

    // Log the notification attempt
    const log = await notificationsDB.queryRow<{ id: number }>`
      INSERT INTO notification_logs (user_id, message, channel, recipient, status)
      VALUES (${req.userId}, ${req.message}, ${req.channel}, ${req.recipient}, 'pending')
      RETURNING id
    `;

    if (!log) {
      throw new Error("Failed to create notification log");
    }

    try {
      let success = false;
      let errorMessage = "";

      switch (req.channel) {
        case "email":
          success = await sendEmail(req.recipient, req.subject || "Notification", req.message);
          break;
        case "whatsapp":
          // Placeholder for WhatsApp integration (Twilio API)
          success = await sendWhatsApp(req.recipient, req.message);
          break;
        case "sms":
          // Placeholder for SMS integration
          success = await sendSMS(req.recipient, req.message);
          break;
        default:
          errorMessage = "Unsupported notification channel";
      }

      // Update the log with the result
      await notificationsDB.exec`
        UPDATE notification_logs 
        SET status = ${success ? 'sent' : 'failed'}, 
            error_message = ${errorMessage || null},
            sent_at = ${success ? new Date() : null}
        WHERE id = ${log.id}
      `;

      return {
        id: log.id,
        status: success ? 'sent' : 'failed',
      };
    } catch (error) {
      await notificationsDB.exec`
        UPDATE notification_logs 
        SET status = 'failed', error_message = ${error instanceof Error ? error.message : 'Unknown error'}
        WHERE id = ${log.id}
      `;

      throw error;
    }
  }
);

async function sendEmail(to: string, subject: string, message: string): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransporter({
      host: smtpHost(),
      port: parseInt(smtpPort()),
      secure: parseInt(smtpPort()) === 465,
      auth: {
        user: smtpUser(),
        pass: smtpPassword(),
      },
    });

    await transporter.sendMail({
      from: smtpUser(),
      to,
      subject,
      text: message,
      html: message.replace(/\n/g, '<br>'),
    });

    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
}

async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  // Placeholder for Twilio WhatsApp API integration
  console.log(`WhatsApp message to ${to}: ${message}`);
  // TODO: Implement Twilio WhatsApp API
  return true;
}

async function sendSMS(to: string, message: string): Promise<boolean> {
  // Placeholder for SMS integration
  console.log(`SMS to ${to}: ${message}`);
  // TODO: Implement SMS API (Twilio, etc.)
  return true;
}
