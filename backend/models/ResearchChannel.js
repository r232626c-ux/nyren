const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ResearchChannel = sequelize.define('ResearchChannel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'URL/UI-safe identifier, e.g. "bioinformatics"',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Display name, e.g. "Bioinformatics"',
  },
  description: {
    type: DataTypes.STRING,
    comment: 'Short topic description shown under the channel name',
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: '💬',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'research_channels',
  timestamps: true,
});

module.exports = ResearchChannel;
