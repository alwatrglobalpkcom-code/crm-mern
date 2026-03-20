const { getTransporter, isEmailConfigured } = require('../config/email');

class EmailService {
  static async sendReminder(toEmail, toName, taskType, clientName, dueDate) {
    if (!isEmailConfigured()) return false;

    const transporter = getTransporter();
    if (!transporter) return false;

    const subject = `Reminder: ${taskType} due ${dueDate}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <h2>Task Deadline Reminder</h2>
        <p>Hi ${toName},</p>
        <p>This is a reminder for your upcoming task:</p>
        <ul>
          <li><strong>Task:</strong> ${taskType}</li>
          <li><strong>Client:</strong> ${clientName}</li>
          <li><strong>Due Date:</strong> ${dueDate}</li>
        </ul>
        <p>Please complete the task before the deadline.</p>
        <p style="color: #64748b; font-size: 12px;">CRM System - Automated Reminder</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: toEmail,
        subject,
        html
      });
      return true;
    } catch (err) {
      console.error('Email send error:', err.message);
      return false;
    }
  }

  static async sendOverdueReminder(toEmail, toName, taskType, clientName, dueDate) {
    if (!isEmailConfigured()) return false;

    const transporter = getTransporter();
    if (!transporter) return false;

    const subject = `URGENT: ${taskType} - Due date passed (${dueDate})`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <h2 style="color: #dc2626;">Overdue Task - Action Required</h2>
        <p>Hi ${toName},</p>
        <p><strong>${dueDate} ho gayi hai - abhi tak kuch hua nahi.</strong></p>
        <p>This task is overdue and needs immediate attention:</p>
        <ul>
          <li><strong>Task:</strong> ${taskType}</li>
          <li><strong>Client:</strong> ${clientName}</li>
          <li><strong>Due Date:</strong> ${dueDate} (PASSED)</li>
        </ul>
        <p>Please complete this task as soon as possible.</p>
        <p style="color: #64748b; font-size: 12px;">CRM System - Overdue Reminder</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: toEmail,
        subject,
        html
      });
      return true;
    } catch (err) {
      console.error('Email send error:', err.message);
      return false;
    }
  }

  static async sendTaskApproval(toEmail, toName, taskType, clientName) {
    if (!isEmailConfigured()) return false;

    const transporter = getTransporter();
    if (!transporter) return false;

    const subject = `Task Approved: ${taskType} for ${clientName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <h2 style="color: #16a34a;">Task Approved</h2>
        <p>Hi ${toName},</p>
        <p>Your task has been approved by the manager:</p>
        <ul>
          <li><strong>Task:</strong> ${taskType}</li>
          <li><strong>Client:</strong> ${clientName}</li>
        </ul>
        <p>You can now proceed with this task.</p>
        <p style="color: #64748b; font-size: 12px;">CRM System - Task Approval Notification</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: toEmail,
        subject,
        html
      });
      return true;
    } catch (err) {
      console.error('Email send error:', err.message);
      return false;
    }
  }

  static async sendTaskNeedsApproval(toEmail, toName, taskType, clientName, agentName) {
    if (!isEmailConfigured()) return false;
    const transporter = getTransporter();
    if (!transporter) return false;
    const subject = `Task Needs Approval: ${taskType} for ${clientName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <h2 style="color: #b45309;">Task Pending Approval</h2>
        <p>Hi ${toName},</p>
        <p>Agent ${agentName} has created a task that needs your approval:</p>
        <ul>
          <li><strong>Task:</strong> ${taskType}</li>
          <li><strong>Client:</strong> ${clientName}</li>
        </ul>
        <p>Please review and approve in the CRM.</p>
        <p style="color: #64748b; font-size: 12px;">CRM System - Task Approval Request</p>
      </div>
    `;
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: toEmail,
        subject,
        html
      });
      return true;
    } catch (err) {
      console.error('Email send error:', err.message);
      return false;
    }
  }

  static async sendTaskAssigned(toEmail, toName, taskType, clientName) {
    if (!isEmailConfigured()) return false;
    const transporter = getTransporter();
    if (!transporter) return false;
    const subject = `New Task Assigned: ${taskType} for ${clientName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <h2 style="color: #2563eb;">New Task Assigned</h2>
        <p>Hi ${toName},</p>
        <p>You have been assigned a new task:</p>
        <ul>
          <li><strong>Task:</strong> ${taskType}</li>
          <li><strong>Client:</strong> ${clientName}</li>
        </ul>
        <p>Please check the CRM for details.</p>
        <p style="color: #64748b; font-size: 12px;">CRM System - Task Assignment</p>
      </div>
    `;
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: toEmail,
        subject,
        html
      });
      return true;
    } catch (err) {
      console.error('Email send error:', err.message);
      return false;
    }
  }

  static async sendClientNeedsApproval(toEmail, toName, clientName, agentName) {
    if (!isEmailConfigured()) return false;
    const transporter = getTransporter();
    if (!transporter) return false;
    const subject = `Client Needs Approval: ${clientName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <h2 style="color: #b45309;">Client Pending Approval</h2>
        <p>Hi ${toName},</p>
        <p>Agent ${agentName} has added a new client that needs your approval:</p>
        <ul>
          <li><strong>Client:</strong> ${clientName}</li>
        </ul>
        <p>Please review and approve in the CRM.</p>
        <p style="color: #64748b; font-size: 12px;">CRM System - Client Approval Request</p>
      </div>
    `;
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: toEmail,
        subject,
        html
      });
      return true;
    } catch (err) {
      console.error('Email send error:', err.message);
      return false;
    }
  }

  static async sendClientApproval(toEmail, toName, clientName) {
    if (!isEmailConfigured()) return false;

    const transporter = getTransporter();
    if (!transporter) return false;

    const subject = `Client Approved: ${clientName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <h2 style="color: #16a34a;">Client Approved</h2>
        <p>Hi ${toName},</p>
        <p>Your client has been approved by the manager:</p>
        <ul>
          <li><strong>Client:</strong> ${clientName}</li>
        </ul>
        <p>You can now add tasks for this client.</p>
        <p style="color: #64748b; font-size: 12px;">CRM System - Client Approval Notification</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: toEmail,
        subject,
        html
      });
      return true;
    } catch (err) {
      console.error('Email send error:', err.message);
      return false;
    }
  }
}

module.exports = EmailService;
