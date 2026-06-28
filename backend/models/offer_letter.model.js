const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OfferLetter = sequelize.define('OfferLetter', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    applicationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'applications',
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
    template: {
      type: DataTypes.STRING(50),
      defaultValue: 'modern'
    },
    offerContent: {
      type: DataTypes.TEXT('long'),
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
      type: DataTypes.STRING(50)
    },
    benefits: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'),
      defaultValue: 'draft'
    },
    sentAt: {
      type: DataTypes.DATE
    },
    viewedAt: {
      type: DataTypes.DATE
    },
    expiresAt: {
      type: DataTypes.DATE
    },
    acceptedAt: {
      type: DataTypes.DATE
    },
    rejectedAt: {
      type: DataTypes.DATE
    },
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
      references: {
        model: 'users',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.TEXT
    },
    pdfUrl: {
      type: DataTypes.STRING(255)
    },
    s3Key: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'S3 object key for the offer letter PDF'
    },
    s3Uploaded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the PDF was successfully uploaded to S3'
    },
    trackingToken: {
      type: DataTypes.STRING(255),
      unique: true
    },
    expiresIn: {
      type: DataTypes.INTEGER,
      defaultValue: 7
    }
  }, {
    tableName: 'offer_letters',
    timestamps: true,
    indexes: [
      { fields: ['applicationId'] },
      { fields: ['companyId', 'createdAt'] },
      { fields: ['status'] },
      { fields: ['expiresAt'] }
    ]
  });

  OfferLetter.associate = (models) => {
    OfferLetter.belongsTo(models.Application, {
      foreignKey: 'applicationId',
      as: 'application'
    });
    OfferLetter.belongsTo(models.User, {
      foreignKey: 'companyId',
      as: 'company'
    });
    OfferLetter.belongsTo(models.User, {
      foreignKey: 'candidateId',
      as: 'candidate'
    });
    OfferLetter.belongsTo(models.Job, {
      foreignKey: 'jobId',
      as: 'job'
    });
    OfferLetter.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };

  return OfferLetter;
};