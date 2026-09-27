const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ScientificReference = sequelize.define('ScientificReference', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.TEXT, allowNull: false },
  authors: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  journal: { type: DataTypes.STRING },
  year: { type: DataTypes.INTEGER },
  pmid: { type: DataTypes.STRING, unique: true },
  doi: { type: DataTypes.STRING, unique: true },
  url: { type: DataTypes.TEXT, allowNull: false },
  source: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pubmed' },
  articleType: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  abstract: { type: DataTypes.TEXT },
  relevance: { type: DataTypes.TEXT },
  verifiedAt: { type: DataTypes.DATE, allowNull: false },
}, {
  tableName: 'scientific_references',
  timestamps: true,
});

module.exports = ScientificReference;