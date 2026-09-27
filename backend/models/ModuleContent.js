const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ModuleContent = sequelize.define('ModuleContent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  moduleId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Parent module ID',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Topic title (e.g., "Backpropagation Algorithm")',
  },
  description: {
    type: DataTypes.TEXT,
    comment: 'Topic description and learning objectives',
  },
  weekNumber: { type: DataTypes.INTEGER },
  learningObjectives: { type: DataTypes.JSON },
  prerequisites: { type: DataTypes.JSON },
  workedExample: { type: DataTypes.JSON },
  biomedicalApplication: { type: DataTypes.TEXT },
  practicalActivity: { type: DataTypes.JSON },
  criticalThinkingQuestion: { type: DataTypes.TEXT },
  completionRequirements: { type: DataTypes.JSON },
  contentType: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true,
    comment: 'Content type: video, reading, exercise, lab, quiz, project',
  },
  content: {
    type: DataTypes.TEXT,
    comment: 'Main content (markdown supported)',
  },
  videoUrl: {
    type: DataTypes.STRING,
    comment: 'YouTube or external video URL',
  },
  estimatedDurationMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
  },
  difficulty: {
    type: DataTypes.STRING,
    defaultValue: 'beginner',
    comment: 'Difficulty level: beginner, intermediate, advanced',
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    comment: 'Order within module',
  },
  codeExamples: {
    type: DataTypes.JSON,
    comment: 'Array of code snippets with explanations',
  },
  exercises: {
    type: DataTypes.JSON,
    comment: 'Practical exercises and solutions',
  },
  resources: {
    type: DataTypes.JSON,
    comment: 'External resources: {papers, datasets, tools}',
  },
  quizQuestions: {
    type: DataTypes.JSON,
    comment: 'Quiz questions with multiple choice options',
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
  tableName: 'module_contents',
  timestamps: true,
  indexes: [
    { fields: ['moduleId'] },
    { fields: ['moduleId', 'orderIndex'] },
  ],
});

module.exports = ModuleContent;
