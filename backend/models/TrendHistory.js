const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TrendHistory = sequelize.define('TrendHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  prediction: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  confidence_score: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  outcome: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'trend_histories',
  timestamps: true,
});

module.exports = TrendHistory;