module.exports = (sequelize, DataTypes) => {
  const PhoneScreeningDetails = sequelize.define("phone_screening_details", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    bolnaExecutionId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    duration: {
      type: DataTypes.INTEGER, // in seconds
      allowNull: true
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: true
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    candidateName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    technicalQualification: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    technicalQualificationRating: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    clarity: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    clarityRating: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    technicalUnderstanding: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    technicalUnderstandingRating: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    consistencyWithCv: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    consistencyWithCvRating: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    handlingEdgeCases: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    handlingEdgeCasesRating: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    overallScore: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: true
    },
    finalEvaluation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    transcript: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    recordingUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    callStatus: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    conversationDuration: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    totalCost: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    userNumber: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    agentNumber: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    bolnaApiResponse: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['bolnaExecutionId'],
        unique: true
      },
      {
        fields: ['companyId']
      }
    ]
  });

  return PhoneScreeningDetails;
};