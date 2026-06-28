module.exports = (sequelize, DataTypes) => {
  const UserSubscription = sequelize.define("user_subscriptions", {
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
    planId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'planId',
      references: {
        model: 'subscription_plans',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'cancelled', 'expired', 'past_due'),
      defaultValue: 'active'
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
    currentPeriodStart: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'current_period_start'
    },
    currentPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'current_period_end'
    }

  }, {
    timestamps: true,
    underscored: false,
    tableName: 'user_subscriptions'
  });

  return UserSubscription;
};
