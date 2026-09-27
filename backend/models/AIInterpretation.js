const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AIInterpretation = sequelize.define('AIInterpretation', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'analysis_jobs',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'openai',
  },
  interpretation: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  raw_response: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  confidence: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
}, {
  tableName: 'ai_interpretations',
  timestamps: true,
  indexes: [
    {
      fields: ['jobId'],
    },
  ],
});

module.exports = AIInterpretation;
