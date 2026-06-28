module.exports = (sequelize, DataTypes) => {
  const PhoneScreening = sequelize.define("phone_screenings", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    candidatePhone: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('initiated', 'in_progress', 'completed', 'failed', 'cancelled'),
      defaultValue: 'initiated'
    },
    extractedData: {
      type: DataTypes.JSON,
      allowNull: true
    },
    bolnaExecutionId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['companyId']
      },
      {
        fields: ['candidateId']
      },
      {
        fields: ['candidatePhone']
      }
    ]
  });

  return PhoneScreening;
};