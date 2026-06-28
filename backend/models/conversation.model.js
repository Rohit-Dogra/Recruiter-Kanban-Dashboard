module.exports = (sequelize, Sequelize) => {
  const Conversation = sequelize.define('conversation', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    companyUserId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    candidateUserId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    jobId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'jobs', key: 'id' }
    },
    lastMessageAt: {
      type: Sequelize.DATE,
      allowNull: true
    },
    companyUnread: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    candidateUnread: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    }
  }, {
    timestamps: true,
    tableName: 'conversations',
    indexes: [
      {
        unique: true,
        fields: ['companyUserId', 'candidateUserId', 'jobId'],
        name: 'unique_company_candidate_job'
      },
      { fields: ['companyUserId'] },
      { fields: ['candidateUserId'] },
      { fields: ['lastMessageAt'] }
    ]
  });

  return Conversation;
};
