const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const EmotionalMemory = sequelize.define('EmotionalMemory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  mood: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  trigger: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  response: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'uuid',
    },
  },
}, {
  tableName: 'emotional_memories',
  timestamps: true,
});

module.exports = EmotionalMemory;