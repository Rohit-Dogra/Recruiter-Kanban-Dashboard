module.exports = (sequelize, DataTypes) => {
  const ScreeningQuestion = sequelize.define('ScreeningQuestion', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'jobs', key: 'id' },
      onDelete: 'CASCADE'
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    questions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    }
  }, {
    tableName: 'screening_questions',
    indexes: [
      { unique: true, fields: ['jobId', 'companyId'] },
      { fields: ['companyId'] }
    ]
  });
  return ScreeningQuestion;
};
