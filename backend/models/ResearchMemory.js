const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ResearchMemory = sequelize.define('ResearchMemory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ideas: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  experiments: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: "",
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'research_memories',
  timestamps: true,
});

module.exports = ResearchMemory;