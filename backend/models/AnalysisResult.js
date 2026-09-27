const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AnalysisResult = sequelize.define('AnalysisResult', {
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
  summary: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  metrics: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  tableName: 'analysis_results',
  timestamps: true,
  indexes: [
    {
      fields: ['jobId'],
    },
  ],
});

module.exports = AnalysisResult;
