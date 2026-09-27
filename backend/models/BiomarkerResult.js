const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BiomarkerResult = sequelize.define('BiomarkerResult', {
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
  gene: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  logFoldChange: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  pValue: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  consistency: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  tableName: 'biomarker_results',
  timestamps: true,
  indexes: [
    {
      fields: ['jobId'],
    },
    {
      fields: ['gene'],
    },
  ],
});

module.exports = BiomarkerResult;
