const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  coli_response: {
    type: DataTypes.TEXT,
    allowNull: true, // IMPORTANT FIX - allow null for pending responses
  },
  threadId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  isImportant: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'conversations',
  timestamps: true,
});

module.exports = Conversation;