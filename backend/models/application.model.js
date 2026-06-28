module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define("applications", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    candidateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
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
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'jobs',
        key: 'id'
      }
    },
    resumeUrl: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    coverLetter: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'new'
    },
    stage: {
      type: DataTypes.STRING(50),
      defaultValue: 'applied'
    },
    appliedDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    reviewedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    aiScore: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true
    },
    aiNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    resumeMatch: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    skillsMatch: {
      type: DataTypes.JSON,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    atsStatus: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      defaultValue: 'pending'
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['candidateId', 'jobId']
      }
    ]
  });

  return Application;
};
