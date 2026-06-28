module.exports = (sequelize, DataTypes) => {
  const Job = sequelize.define("jobs", {
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

    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [3, 100]
      }
    },
    company: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('full-time', 'part-time', 'contract', 'internship', 'temporary'),
      allowNull: false
    },
    salary: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    experience: {
      type: DataTypes.ENUM('entry', 'mid', 'senior', 'lead', 'executive'),
      allowNull: true,
      defaultValue: 'entry'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    requirements: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    benefits: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    urgency: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium'
    },
    workType: {
      type: DataTypes.ENUM('remote', 'onsite', 'hybrid'),
      defaultValue: 'onsite'
    },
    expiresIn: {
      type: DataTypes.ENUM('10days', '15days', '20days', '30days'),
      defaultValue: '30days'
    },
    applyFormConfig: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        phoneRequired: false,
        coverLetterRequired: false,
        customQuestions: []
      }
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isRemote: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    skills: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'paused', 'closed'),
      allowNull: false,
      defaultValue: 'active'
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  // // Ensure userId is not included in queries
  // Job.removeAttribute('userId');
  
  return Job;
};
