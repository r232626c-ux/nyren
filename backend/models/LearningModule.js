const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LearningModule = sequelize.define('LearningModule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Module title (e.g., "Neural Networks", "Gene Expression")',
  },
  description: {
    type: DataTypes.TEXT,
    comment: 'Detailed description of what students will learn',
  },
  subtitle: { type: DataTypes.STRING },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true,
    comment: 'Category: CORE_AI, APPLIED_AI, AI_ENGINEERING, BIOLOGY, CHEMISTRY, PHYSICS_MATHS, CORE_BIOINFORMATICS, ADVANCED_BIOINFORMATICS',
  },
  subcategory: {
    type: DataTypes.STRING,
    comment: 'e.g., "Machine Learning", "Healthcare AI", "MLOps"',
  },
  difficulty: {
    type: DataTypes.STRING,
    defaultValue: 'beginner',
    index: true,
    comment: 'Difficulty level: beginner, intermediate, advanced, expert',
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    comment: 'Order within category for curriculum progression',
  },
  content: {
    type: DataTypes.JSON,
    comment: 'Module content: {sections, keyTopics, learningObjectives}',
  },
  learningObjectives: { type: DataTypes.JSON },
  skills: { type: DataTypes.JSON },
  masteryRequirements: { type: DataTypes.JSON },
  finalProject: { type: DataTypes.JSON },
  status: { type: DataTypes.STRING, defaultValue: 'published' },
  version: { type: DataTypes.STRING, defaultValue: '1.0' },
  publishedAt: { type: DataTypes.DATE },
  prerequisites: {
    type: DataTypes.JSON,
    comment: 'Array of prerequisite module IDs',
  },
  estimatedDurationMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 60,
  },
  resources: {
    type: DataTypes.JSON,
    comment: 'External resources: {papers, videos, tools, datasets}',
  },
  practiceProblems: {
    type: DataTypes.JSON,
    comment: 'Array of practice problems with solutions',
  },
  caseStudies: {
    type: DataTypes.JSON,
    comment: 'Real-world case studies and applications',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    index: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'learning_modules',
  timestamps: true,
});

module.exports = LearningModule;
