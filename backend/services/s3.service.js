const AWS = require('aws-sdk');
const path = require('path');

// Load environment variables if not already loaded
if (!process.env.AWS_ACCESS_KEY_ID) {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1'
});

const s3 = new AWS.S3();

// Get bucket name dynamically to ensure env vars are loaded
const getBucketName = () => process.env.S3_BUCKET_NAME;

const s3Service = {
  // Upload file to S3
  uploadFile: async (fileBuffer, fileName, contentType = 'application/pdf', fileType = 'resume') => {
    const BUCKET_NAME = getBucketName();
    if (!BUCKET_NAME) {
      throw new Error('S3_BUCKET_NAME not configured');
    }

    // Determine folder based on file type
    let folderPath;
    switch (fileType) {
      case 'offer-letter':
        folderPath = 'offer-letters';
        break;
      case 'resume':
      default:
        folderPath = 'resumes';
        break;
    }

    const params = {
      Bucket: BUCKET_NAME,
      Key: `${folderPath}/${fileName}`,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'private'
    };

    try {
      const result = await s3.upload(params).promise();
      return {
        success: true,
        key: result.Key,
        location: result.Location,
        bucket: result.Bucket
      };
    } catch (error) {
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  },

  // Generate signed URL for file access
  getSignedUrl: (key, expiresIn = 3600) => {
    const BUCKET_NAME = getBucketName();
    if (!BUCKET_NAME) {
      throw new Error('S3_BUCKET_NAME not configured');
    }

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn
    };

    try {
      return s3.getSignedUrl('getObject', params);
    } catch (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  },

  // Delete file from S3
  deleteFile: async (key) => {
    const BUCKET_NAME = getBucketName();
    if (!BUCKET_NAME) {
      throw new Error('S3_BUCKET_NAME not configured');
    }

    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    try {
      await s3.deleteObject(params).promise();
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  },

  // Download file from S3 as buffer
  downloadFile: async (key) => {
    const BUCKET_NAME = getBucketName();
    if (!BUCKET_NAME) {
      throw new Error('S3_BUCKET_NAME not configured');
    }

    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    try {
      const result = await s3.getObject(params).promise();
      return result.Body;
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        throw new Error(`File not found in S3: ${key}`);
      }
      throw new Error(`Failed to download file from S3: ${error.message}`);
    }
  },

  // Check if file exists
  fileExists: async (key) => {
    const BUCKET_NAME = getBucketName();
    if (!BUCKET_NAME) {
      throw new Error('S3_BUCKET_NAME not configured');
    }

    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    try {
      await s3.headObject(params).promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw new Error(`Failed to check file existence: ${error.message}`);
    }
  }
};

// Test S3 connection on startup
s3Service.testConnection = async () => {
  try {
    const BUCKET_NAME = getBucketName();
    if (!BUCKET_NAME) {
      return false;
    }

    await s3.listObjectsV2({ Bucket: BUCKET_NAME, MaxKeys: 1 }).promise();
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = s3Service;