const path = require('path');
const fs = require('fs').promises;

// Mock AWS SES
const mockSendEmail = jest.fn();
const mockSendRawEmail = jest.fn();
jest.mock('aws-sdk', () => {
  const SES = jest.fn(() => ({
    sendEmail: jest.fn(() => ({
      promise: mockSendEmail
    })),
    sendRawEmail: jest.fn(() => ({
      promise: mockSendRawEmail
    }))
  }));
  return {
    config: { update: jest.fn() },
    SES
  };
});

// Mock nodemailer
const mockSendMail = jest.fn();
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail
  }))
}));

// Mock fs.stat
jest.mock('fs', () => ({
  promises: {
    stat: jest.fn()
  }
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const logger = require('../../utils/logger');

describe('emailService', () => {
  let emailService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEmail.mockResolvedValue({ MessageId: 'ses-simple-msg-id-123' });
    mockSendMail.mockResolvedValue({ messageId: 'ses-raw-msg-id-456' });
    // Re-require to get fresh module with mocks
    delete require.cache[require.resolve('../emailService')];
    emailService = require('../emailService');
  });

  // Req 4.2: No attachments → simple SES
  describe('sendEmail without attachments', () => {
    test('uses simple SES sendEmail API when no attachments provided', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        content: 'Test content'
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('ses-simple-msg-id-123');
      expect(result.attachmentCount).toBe(0);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    test('uses simple SES when attachments array is empty', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        content: 'Content',
        attachments: []
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('ses-simple-msg-id-123');
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    test('throws on missing required parameters', async () => {
      await expect(emailService.sendEmail({ to: '', subject: 'S', content: 'C' }))
        .rejects.toThrow('Missing required email parameters');
    });
  });

  // Req 4.1: Attachments present → SES raw email via nodemailer
  describe('sendEmail with attachments', () => {
    test('routes to nodemailer SES transport when attachments present', async () => {
      fs.stat.mockResolvedValue({ size: 1024 }); // 1KB file

      const result = await emailService.sendEmail({
        to: 'candidate@example.com',
        subject: 'Offer Letter',
        content: 'Your offer letter is attached',
        attachments: [{ filename: 'offer.pdf', path: '/tmp/offer.pdf' }]
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('ses-raw-msg-id-456');
      expect(result.attachmentCount).toBe(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      // Simple SES should NOT have been called
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    test('includes all valid attachments as MIME parts', async () => {
      fs.stat.mockResolvedValue({ size: 5000 });

      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Multi-attach',
        content: 'Multiple files',
        attachments: [
          { filename: 'doc1.pdf', path: '/tmp/doc1.pdf' },
          { filename: 'doc2.pdf', path: '/tmp/doc2.pdf' }
        ]
      });

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.attachments).toHaveLength(2);
      expect(mailOptions.attachments[0].filename).toBe('doc1.pdf');
      expect(mailOptions.attachments[1].filename).toBe('doc2.pdf');
    });
  });

  // Req 4.3: File not found → send without attachment, log warning
  describe('attachment file not found handling', () => {
    test('sends email without attachment when file not found and logs warning', async () => {
      const enoentError = new Error('ENOENT');
      enoentError.code = 'ENOENT';
      fs.stat.mockRejectedValue(enoentError);

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Offer',
        content: 'Content',
        attachments: [{ filename: 'missing.pdf', path: '/tmp/missing.pdf' }]
      });

      // Falls back to simple SES since all attachments were filtered out
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('ses-simple-msg-id-123');
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Attachment file not found')
      );
    });

    test('sends with remaining valid attachments when some files missing', async () => {
      const enoentError = new Error('ENOENT');
      enoentError.code = 'ENOENT';

      // First call: file not found, second call: valid file
      fs.stat
        .mockRejectedValueOnce(enoentError)
        .mockResolvedValueOnce({ size: 1024 });

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Offer',
        content: 'Content',
        attachments: [
          { filename: 'missing.pdf', path: '/tmp/missing.pdf' },
          { filename: 'valid.pdf', path: '/tmp/valid.pdf' }
        ]
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('ses-raw-msg-id-456');
      expect(result.attachmentCount).toBe(1);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Attachment file not found')
      );
      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.attachments).toHaveLength(1);
      expect(mailOptions.attachments[0].filename).toBe('valid.pdf');
    });
  });

  // Req 4.4: Attachment over 10MB → reject with logged error
  describe('attachment size validation', () => {
    test('rejects attachment over 10MB and logs error', async () => {
      fs.stat.mockResolvedValue({ size: 11 * 1024 * 1024 }); // 11MB

      await expect(emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Large file',
        content: 'Content',
        attachments: [{ filename: 'huge.pdf', path: '/tmp/huge.pdf' }]
      })).rejects.toThrow('exceeds 10MB size limit');

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('exceeds 10MB limit')
      );
    });

    test('accepts attachment exactly at 10MB', async () => {
      fs.stat.mockResolvedValue({ size: 10 * 1024 * 1024 }); // exactly 10MB

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Boundary',
        content: 'Content',
        attachments: [{ filename: 'exact10mb.pdf', path: '/tmp/exact10mb.pdf' }]
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('ses-raw-msg-id-456');
    });
  });

  // Req 4.5: Return SES message ID on success
  describe('SES message ID return', () => {
    test('returns messageId from simple SES on no-attachment send', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Simple',
        content: 'No attachments'
      });

      expect(result.messageId).toBe('ses-simple-msg-id-123');
    });

    test('returns messageId from nodemailer/SES on attachment send', async () => {
      fs.stat.mockResolvedValue({ size: 1024 });

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'With attachment',
        content: 'Has PDF',
        attachments: [{ filename: 'offer.pdf', path: '/tmp/offer.pdf' }]
      });

      expect(result.messageId).toBe('ses-raw-msg-id-456');
    });
  });

  // sendEmailWithAttachment called directly with no attachments falls back
  describe('sendEmailWithAttachment edge cases', () => {
    test('falls back to sendEmail when called with empty attachments', async () => {
      const result = await emailService.sendEmailWithAttachment({
        to: 'test@example.com',
        subject: 'Fallback',
        content: 'No attachments here'
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('ses-simple-msg-id-123');
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });
});
