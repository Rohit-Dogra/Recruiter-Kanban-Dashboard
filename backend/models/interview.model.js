module.exports = (sequelize, DataTypes) => {
  const Interview = sequelize.define("interviews", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    applicationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'applications',
        key: 'id'
      }
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER,
      defaultValue: 60 // in minutes
    },
    type: {
      type: DataTypes.ENUM('video', 'in-person'),
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    meetingUrl: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    mapLink: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    interviewerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'completed', 'cancelled', 'no-show'),
      defaultValue: 'scheduled'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['scheduledDate']
      }
    ]
  });

  return Interview;
};
