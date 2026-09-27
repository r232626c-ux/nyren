const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AnalysisJob = sequelize.define('AnalysisJob', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'uuid',
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  },
  datasetId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'datasets',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  taskType: {
    type: DataTypes.ENUM(
      'qc_pipeline',
      'differential_expression_pipeline',
      'biomarker_pipeline',
      'descriptive_stats_pipeline',
      'correlation_pipeline'
    ),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'running', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'pending',
  },
  attempt: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  retryCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  params: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  idempotencyKey: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'analysis_jobs',
  timestamps: true,
  indexes: [
    {
      fields: ['datasetId'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['userId'],
    },
    {
      fields: ['idempotencyKey'],
    },
  ],
});

module.exports = AnalysisJob;
