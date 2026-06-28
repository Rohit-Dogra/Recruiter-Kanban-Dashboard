const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Configure AWS SES with separate credentials
AWS.config.update({
  region: process.env.SES_REGION || process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.SES_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.SES_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
});

const ses = new AWS.SES();
const logger = require('../utils/logger');

const emailService = {
  async sendEmail({ to, subject, content, candidateName, attachments = [] }) {
    logger.debug('Attempting to send email to:', to);
    
    if (!to || !subject || !content) {
      throw new Error('Missing required email parameters');
    }

    // Route to raw email path when attachments are present (Req 4.1)
    if (attachments && attachments.length > 0) {
      return this.sendEmailWithAttachment({ to, subject, content, candidateName, attachments });
    }

    // Use simple SES for emails without attachments (Req 4.2)
    const htmlContent = this.generateHtmlContent(content, false);

    try {
      const params = {
        Destination: {
          ToAddresses: [to]
        },
        Message: {
          Body: {
            Text: {
              Charset: 'UTF-8',
              Data: content
            },
            Html: {
              Charset: 'UTF-8',
              Data: htmlContent
            }
          },
          Subject: {
            Charset: 'UTF-8',
            Data: subject
          }
        },
        Source: process.env.FROM_EMAIL || 'info@expertisestation.com'
      };

      const result = await ses.sendEmail(params).promise();
      logger.info(`Email sent successfully to ${to}:`, result.MessageId);
      
      return {
        success: true,
        messageId: result.MessageId,
        attachmentCount: 0
      };
    } catch (error) {
      logger.error('Email sending error:', {
        to,
        subject,
        error: error.message,
        code: error.code,
        statusCode: error.statusCode
      });
      throw new Error(`Failed to send email: ${error.message}`);
    }
  },

  // Fallback method using direct SES (without attachments)
  async sendSimpleEmail({ to, subject, content, candidateName }) {
    const params = {
      Destination: {
        ToAddresses: [to]
      },
      Message: {
        Body: {
          Text: {
            Charset: 'UTF-8',
            Data: content
          },
          Html: {
            Charset: 'UTF-8',
            Data: `
              <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                      <h2 style="color: #2563eb; margin: 0;">HirerMind</h2>
                    </div>
                    <div style="white-space: pre-line; margin-bottom: 20px;">
                      ${content}
                    </div>
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 14px; color: #6b7280;">
                      <p>Best regards,<br>HirerMind Team</p>
                    </div>
                  </div>
                </body>
              </html>
            `
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject
        }
      },
      Source: process.env.FROM_EMAIL || 'info@expertisestation.com'
    };

    try {
      const result = await ses.sendEmail(params).promise();
      logger.info('Email sent successfully:', result.MessageId);
      return {
        success: true,
        messageId: result.MessageId
      };
    } catch (error) {
      logger.error('Email sending error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  },

  // Send email with attachment support using raw email via nodemailer + SES transport (Req 4.1)
  async sendEmailWithAttachment({ to, subject, content, candidateName, attachments = [] }) {
    if (!attachments || attachments.length === 0) {
      return this.sendEmail({ to, subject, content, candidateName });
    }

    // Validate and filter attachments (Req 4.3, 4.4)
    const validAttachments = [];
    for (const att of attachments) {
      try {
        const stat = await fs.stat(att.path);

        // Reject attachments over 10MB (Req 4.4)
        if (stat.size > MAX_ATTACHMENT_SIZE) {
          logger.error(`Attachment exceeds 10MB limit: ${att.filename} (${(stat.size / 1024 / 1024).toFixed(2)}MB)`);
          throw new Error(`Attachment ${att.filename} exceeds 10MB size limit`);
        }

        validAttachments.push(att);
      } catch (err) {
        if (err.code === 'ENOENT') {
          // File not found — send email without this attachment and log warning (Req 4.3)
          logger.warn(`Attachment file not found, sending email without it: ${att.path}`);
        } else {
          // Re-throw size limit errors and other unexpected errors
          throw err;
        }
      }
    }

    // If all attachments were filtered out, send without attachments
    if (validAttachments.length === 0) {
      logger.warn(`All attachments were invalid for email to ${to}, sending without attachments`);
      return this.sendEmail({ to, subject, content, candidateName });
    }

    // Create SES transporter for raw email with attachments
    const transporter = nodemailer.createTransport({
      SES: {
        ses: ses,
        aws: AWS
      }
    });

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'info@expertisestation.com',
      to: to,
      subject: subject,
      text: content,
      html: this.generateHtmlContent(content, true),
      attachments: validAttachments.map(att => ({
        filename: att.filename,
        path: att.path,
        contentType: att.contentType || 'application/pdf'
      }))
    };

    try {
      const result = await transporter.sendMail(mailOptions);
      logger.info(`Email with ${validAttachments.length} attachment(s) sent successfully to ${to}:`, result.messageId);
      
      // Return SES message ID on success (Req 4.5)
      return {
        success: true,
        messageId: result.messageId,
        attachmentCount: validAttachments.length
      };
    } catch (error) {
      logger.error('Email with attachments sending error:', {
        to,
        subject,
        attachmentCount: validAttachments.length,
        error: error.message
      });
      throw new Error(`Failed to send email with attachments: ${error.message}`);
    }
  },

  generateHtmlContent(content, hasAttachments) {
    return `
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .company-name { font-size: 24px; font-weight: bold; margin: 0; }
            .tagline { font-size: 14px; opacity: 0.9; margin-top: 5px; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .message { white-space: pre-line; margin-bottom: 30px; font-size: 16px; }
            .cta-section { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .cta-text { font-weight: bold; color: #667eea; margin-bottom: 10px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-radius: 0 0 8px 8px; }
            .attachment-notice { background: #e0f2fe; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #0288d1; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="company-name">HirerMind</div>
              <div class="tagline">Innovative Recruitment Solutions</div>
            </div>
            <div class="content">
              <div class="message">${content}</div>
              ${hasAttachments ? `
                <div class="attachment-notice">
                  <strong>📎 Attachment:</strong> Please find the detailed offer letter attached as a PDF document.
                </div>
              ` : ''}
              <div class="cta-section">
                <div class="cta-text">We look forward to your response!</div>
                <p style="margin: 0; font-size: 14px; color: #666;">Please review the attached documents and respond within the specified timeframe.</p>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0;"><strong>Best regards,</strong><br>HirerMind Team</p>
              <p style="margin: 10px 0 0 0; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  },

  async sendInviteEmail({ to, name, email, password, companyName, inviterName }) {
    const loginUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173/auth/login';
    const subject = `You've been invited to join ${companyName} on HirerMind`;
    const content = `Hello ${name},

${inviterName} has invited you to join ${companyName} on HirerMind - your AI-powered recruitment platform.

Your login credentials:
Email: ${email}
Password: ${password}

Login URL: ${loginUrl}

Use the company login page to sign in. You will have direct access to the dashboard - no signup required.

Best regards,
HirerMind Team`;
    return this.sendEmail({ to, subject, content, candidateName: name });
  }
};

module.exports = emailService;