const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ShonaLesson = sequelize.define('ShonaLesson', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      index: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    level: {
      type: DataTypes.ENUM('beginner', 'elementary', 'intermediate', 'advanced'),
      allowNull: false,
      defaultValue: 'beginner',
      index: true,
    },
    orderIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Display order in curriculum',
    },
    grammarFocus: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Grammar concepts covered in this lesson',
    },
    vocabularyIds: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of ShonaVocabulary IDs covered',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Main lesson content/explanation',
    },
    exampleDialogue: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Conversational examples with translations',
    },
    quizQuestions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Quiz questions at end of lesson',
    },
    estimatedDurationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 15,
    },
    keyTakeaways: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of key learning points',
    },
    culturalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Cultural context and notes',
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
    tableName: 'shona_lessons',
    timestamps: true,
  });

module.exports = ShonaLesson;
