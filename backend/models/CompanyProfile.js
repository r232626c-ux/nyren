const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CompanyProfile = sequelize.define('CompanyProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  domain: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  tagline: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  primaryColor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  logos: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  socials: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  industries: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  address: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  raw: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  tableName: 'company_profiles',
  timestamps: true,
});

module.exports = CompanyProfile;
