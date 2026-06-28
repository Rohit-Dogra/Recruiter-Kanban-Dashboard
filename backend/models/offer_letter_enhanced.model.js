const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OfferLetterEnhanced = sequelize.define('OfferLetterEnhanced', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // Application and candidate details
    applicationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'applications',
        key: 'id'
      }
    },
    candidateId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'jobs',
        key: 'id'
      }
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    // Candidate information (stored for reference)
    candidateName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    candidateEmail: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    candidatePhone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    // Job information (stored for reference)
    jobTitle: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    
    // Offer details
    template: {
      type: DataTypes.STRING(50),
      defaultValue: 'modern',
      allowNull: false
    },
    salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    joiningDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    workLocation: {
      type: DataTypes.STRING(100),
      defaultValue: 'Remote'
    },
    benefits: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Content and customization
    offerContent: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    customizations: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON object containing template customizations like colors, fonts, logos'
    },
    
    // File storage - S3 integration
    s3BucketName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    s3Key: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'S3 object key for the offer letter PDF'
    },
    s3Url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      comment: 'S3 URL for accessing the offer letter PDF'
    },
    s3Uploaded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the PDF was successfully uploaded to S3'
    },
    
    // Legacy support
    pdfUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Legacy local file path or URL'
    },
    
    // Status and tracking
    status: {
      type: DataTypes.ENUM('draft', 'generated', 'sent', 'viewed', 'accepted', 'rejected', 'expired'),
      defaultValue: 'draft'
    },
    trackingToken: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: true
    },
    
    // Timestamps for workflow
    generatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    viewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Email tracking
    emailMessageId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    emailSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Metadata
    expiresIn: {
      type: DataTypes.INTEGER,
      defaultValue: 7,
      comment: 'Number of days until offer expires'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // User tracking
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'offer_letters_enhanced',
    timestamps: true,
    indexes: [
      { fields: ['applicationId'] },
      { fields: ['candidateId'] },
      { fields: ['jobId'] },
      { fields: ['companyId', 'createdAt'] },
      { fields: ['status'] },
      { fields: ['expiresAt'] },
      { fields: ['trackingToken'] },
      { fields: ['s3Key'] },
      { fields: ['candidateEmail'] }
    ]
  });

  OfferLetterEnhanced.associate = (models) => {
    OfferLetterEnhanced.belongsTo(models.Application, {
      foreignKey: 'applicationId',
      as: 'application'
    });
    OfferLetterEnhanced.belongsTo(models.user, {
      foreignKey: 'companyId',
      as: 'company'
    });
    OfferLetterEnhanced.belongsTo(models.user, {
      foreignKey: 'candidateId',
      as: 'candidate'
    });
    OfferLetterEnhanced.belongsTo(models.job, {
      foreignKey: 'jobId',
      as: 'job'
    });
    OfferLetterEnhanced.belongsTo(models.user, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    OfferLetterEnhanced.belongsTo(models.user, {
      foreignKey: 'updatedBy',
      as: 'updater'
    });
  };

  return OfferLetterEnhanced;
};