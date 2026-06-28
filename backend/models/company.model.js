module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define('Company', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: false
    },
    size: {
      type: DataTypes.STRING,
      allowNull: false
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    founded: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mission: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    values: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    culture: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    logo: {
      type: DataTypes.BLOB('long'),
      allowNull: true
    }
  }, {
    tableName: 'companies',
    timestamps: true
  });

  return Company;
};
