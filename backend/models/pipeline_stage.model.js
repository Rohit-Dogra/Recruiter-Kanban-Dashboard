module.exports = (sequelize, DataTypes) => {
  const PipelineStage = sequelize.define('PipelineStage', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    systemStatus: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    stage_order: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    color: {
      type: DataTypes.STRING(20),
      defaultValue: 'bg-blue-500'
    },
    icon: {
      type: DataTypes.STRING(50),
      defaultValue: 'FileText'
    },
    actionType: {
      type: DataTypes.STRING(50),
      defaultValue: 'email'
    }
  }, {
    tableName: 'pipeline_stages',
    indexes: [{ unique: true, fields: ['companyId', 'systemStatus'] }]
  });
  return PipelineStage;
};