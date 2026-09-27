const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DirectMessage = sequelize.define('DirectMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  connectionId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  senderName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Denormalized display name at time of sending',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  attachmentUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  attachmentName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  attachmentType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'direct_messages',
  timestamps: true,
  indexes: [
    { fields: ['connectionId', 'createdAt'] },
  ],
});

module.exports = DirectMessage;
