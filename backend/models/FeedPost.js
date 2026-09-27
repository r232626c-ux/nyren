const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FeedPost = sequelize.define('FeedPost', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
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
  postType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'post',
    comment: 'post | abstract | meme | image',
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
  tableName: 'feed_posts',
  timestamps: true,
  indexes: [
    { fields: ['createdAt'] },
    { fields: ['userId'] },
  ],
});

module.exports = FeedPost;
