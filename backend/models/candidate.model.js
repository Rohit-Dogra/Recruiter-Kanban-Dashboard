module.exports = (sequelize, DataTypes) => {
  const Candidate = sequelize.define("candidates", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    candidate_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [2, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    currentTitle: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    currentCompany: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    experience: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    education: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    skills: {
      type: DataTypes.JSON,
      allowNull: true
    },
    resumeUrl: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
        atsScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'ATS Score from 0-100'
    },
    skillsMatchPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Skills match percentage'
    },
    profileUrl: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    avatarUrl: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    source: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  }, {
    timestamps: true
  });

  return Candidate;
};
