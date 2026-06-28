module.exports = (sequelize, Sequelize) => {
  const Notification = sequelize.define('notification', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    type: {
      type: Sequelize.ENUM('job', 'candidate', 'interview', 'offer', 'system', 'alert'),
      allowNull: false
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    tag: {
      type: Sequelize.STRING,
      allowNull: true
    },
    read: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    jobId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'jobs',
        key: 'id'
      }
    },
    candidateId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'candidates',
        key: 'id'
      }
    },
    applicationId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'applications',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    tableName: 'notifications'
  });

  return Notification;
};
