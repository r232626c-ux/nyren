const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ResearchMessage = sequelize.define('ResearchMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  channelId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Denormalized display name at time of posting',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  attachmentUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Relative /uploads/community/... path to a shared file',
  },
  attachmentName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  attachmentType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'MIME type of the attachment, e.g. image/png',
  },
}, {
  tableName: 'research_messages',
  timestamps: true,
  indexes: [
    { fields: ['channelId', 'createdAt'] },
  ],
});

module.exports = ResearchMessage;
