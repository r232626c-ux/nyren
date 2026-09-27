const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Dataset = sequelize.define('Dataset', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'dataset',
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'gene_expression',
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
  },
  raw_payload: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
}, {
  tableName: 'datasets',
  timestamps: true,
  indexes: [
    {
      fields: ['userId'],
    },
    {
      fields: ['type'],
    },
  ],
});

module.exports = Dataset;
