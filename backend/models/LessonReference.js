const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LessonReference = sequelize.define('LessonReference', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  lessonId: { type: DataTypes.UUID, allowNull: false },
  referenceId: { type: DataTypes.UUID, allowNull: false },
  relevance: { type: DataTypes.TEXT },
}, {
  tableName: 'lesson_references',
  timestamps: true,
  indexes: [{ unique: true, fields: ['lessonId', 'referenceId'] }],
});

module.exports = LessonReference;