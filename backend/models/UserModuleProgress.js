const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const UserModuleProgress = sequelize.define('UserModuleProgress', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Reference to user',
  },
  moduleId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Reference to learning module',
  },
  contentId: {
    type: DataTypes.UUID,
    comment: 'Reference to specific content within module',
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'not_started',
    index: true,
    comment: 'Status: not_started, in_progress, completed, mastered, paused',
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Score 0-100',
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Number of attempts at module/quiz',
  },
  correctAnswers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalQuestions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  timeSpentSeconds: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total time spent on this module',
  },
  lastAccessedAt: {
    type: DataTypes.DATE,
  },
  completedAt: {
    type: DataTypes.DATE,
  },
  masteredAt: {
    type: DataTypes.DATE,
    comment: 'When user achieved mastery (80%+ score)',
  },
  reviewDueAt: {
    type: DataTypes.DATE,
    comment: 'For spaced repetition algorithm',
  },
  repetitionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of times reviewed for spaced repetition',
  },
  difficulties: {
    type: DataTypes.JSON,
    comment: 'Array of difficult topics within this module',
  },
  xpEarned: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Experience points earned',
  },
  streakCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Consecutive days learning',
  },
  certificateEarned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether user earned completion certificate',
  },
  notes: {
    type: DataTypes.TEXT,
    comment: 'User notes and reflections',
  },
  metadata: {
    type: DataTypes.JSON,
    comment: 'Additional data: {deviceType, learningStyle, speed}',
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
  tableName: 'user_module_progress',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['userId', 'moduleId'] },
    { fields: ['userId', 'status'] },
    { fields: ['userId', 'category'] },
  ],
});

module.exports = UserModuleProgress;
