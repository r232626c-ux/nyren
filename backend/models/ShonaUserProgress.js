const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ShonaUserProgress = sequelize.define('ShonaUserProgress', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      index: true,
      comment: 'References users.uuid',
    },
    lessonId: {
      type: DataTypes.UUID,
      allowNull: false,
      index: true,
      comment: 'References shona_lessons.id',
    },
    vocabularyId: {
      type: DataTypes.UUID,
      allowNull: true,
      index: true,
      comment: 'References shona_vocabulary.id (for word-level progress)',
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'mastered'),
      defaultValue: 'not_started',
      index: true,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Quiz/assessment score (0-100)',
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of attempts at this lesson',
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
      comment: 'Time spent on this lesson in seconds',
    },
    lastAccessedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    masteredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When learner achieved mastery (80%+ score)',
    },
    reviewDueAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Spaced repetition: next review date',
    },
    repetitionCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of times reviewed for spaced repetition',
    },
    difficulties: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON array of specific areas causing difficulty',
    },
    xpEarned: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'XP points earned from this lesson',
    },
    streakCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Current learning streak',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional metadata like device, session duration',
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
    tableName: 'shona_user_progress',
    timestamps: true,
    indexes: [
      { fields: ['userId', 'lessonId'] },
      { fields: ['userId', 'status'] },
    ],
  });

module.exports = ShonaUserProgress;
