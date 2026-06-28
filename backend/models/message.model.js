module.exports = (sequelize, Sequelize) => {
  const Message = sequelize.define('message', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    conversationId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'conversations', key: 'id' }
    },
    senderId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    messageType: {
      type: Sequelize.ENUM('text', 'file', 'system'),
      defaultValue: 'text'
    },
    fileUrl: {
      type: Sequelize.STRING(500),
      allowNull: true
    },
    fileName: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    readAt: {
      type: Sequelize.DATE,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'messages',
    indexes: [
      { fields: ['conversationId', 'createdAt'] },
      { fields: ['senderId'] },
      { fields: ['readAt'] }
    ]
  });

  return Message;
};
