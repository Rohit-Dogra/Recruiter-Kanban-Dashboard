module.exports = (sequelize, DataTypes) => {
  const UserTrial = sequelize.define("user_trials", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'userId',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    phoneScreeningsUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'phone_screenings_used'
    },
    technicalInterviewsUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'technical_interviews_used'
    },
    phoneScreeningsLimit: {
      type: DataTypes.INTEGER,
      defaultValue: 2,
      field: 'phone_screenings_limit'
    },
    technicalInterviewsLimit: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'technical_interviews_limit'
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'startedAt'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expiresAt'
    }
  }, {
    timestamps: true,
    underscored: false,
    tableName: 'user_trials'
  });

  return UserTrial;
};
