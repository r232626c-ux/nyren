const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FeedComment = sequelize.define('FeedComment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  postId: {
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
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'feed_comments',
  timestamps: true,
  indexes: [
    { fields: ['postId', 'createdAt'] },
  ],
});

module.exports = FeedComment;
