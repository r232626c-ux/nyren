const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AssessmentAttempt = sequelize.define('AssessmentAttempt', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  moduleId: { type: DataTypes.UUID, allowNull: false },
  contentId: { type: DataTypes.UUID, allowNull: false },
  attemptNumber: { type: DataTypes.INTEGER, allowNull: false },
  answers: { type: DataTypes.JSON, allowNull: false },
  score: { type: DataTypes.INTEGER, allowNull: false },
  correctAnswers: { type: DataTypes.INTEGER, allowNull: false },
  totalQuestions: { type: DataTypes.INTEGER, allowNull: false },
  passed: { type: DataTypes.BOOLEAN, allowNull: false },
  feedback: { type: DataTypes.JSON, allowNull: false },
  timeSpentSeconds: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'learning_assessment_attempts',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'contentId', 'createdAt'] },
  ],
});

module.exports = AssessmentAttempt;