module.exports = (sequelize, DataTypes) => {
  const SubscriptionPlan = sequelize.define("subscription_plans", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    phoneScreeningsLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'phone_screenings_limit'
    },
    technicalInterviewsLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'technical_interviews_limit'
    },
     membersLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'members_limit'
    },
    priceMonthly: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'price_monthly'
    },
    priceYearly: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'price_yearly'
    },
    features: {
      type: DataTypes.JSON,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sort_order'
    }
  }, {
    timestamps: true,
    underscored: false,
    tableName: 'subscription_plans'
  });

  return SubscriptionPlan;
};   
