module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("users", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false
    },
    userType: {
      type: DataTypes.ENUM('candidate', 'company', 'admin'),
      allowNull: false,
      defaultValue: 'company'
    },
    profile_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: [0, 50]
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
    googleId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    profilePicture: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    company: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    invitedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'invited_by_user_id',
      references: { model: 'users', key: 'id' }
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    avatarUrl: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordExpire: {
      type: DataTypes.DATE,
      allowNull: true
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

  // Generate 5-digit random ID before creating
  User.beforeCreate(async (user) => {
    if (!user.id) {
      let id;
      let exists = true;
      
      while (exists) {
        id = Math.floor(10000 + Math.random() * 90000);
        const existingUser = await User.findOne({ where: { id } });
        exists = !!existingUser;
      }
      
      user.id = id;
    }
  });

  return User;
};
