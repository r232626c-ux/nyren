const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FeedLike = sequelize.define('FeedLike', {
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
}, {
  tableName: 'feed_likes',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['postId', 'userId'] },
  ],
});

module.exports = FeedLike;
