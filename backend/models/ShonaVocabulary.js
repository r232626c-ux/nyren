const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ShonaVocabulary = sequelize.define('ShonaVocabulary', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    english: {
      type: DataTypes.STRING,
      allowNull: false,
      index: true,
    },
    shona: {
      type: DataTypes.STRING,
      allowNull: false,
      index: true,
    },
    pronunciation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneticBreakdown: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Phonetic breakdown of Shona word',
    },
    audioUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL to pronunciation audio',
    },
    category: {
      type: DataTypes.ENUM('greetings', 'food', 'animals', 'family', 'body', 'numbers', 'verbs', 'adjectives', 'objects', 'places', 'time', 'emotions'),
      allowNull: false,
      index: true,
    },
    difficulty: {
      type: DataTypes.ENUM('beginner', 'elementary', 'intermediate', 'advanced'),
      allowNull: false,
      defaultValue: 'beginner',
      index: true,
    },
    nounClass: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Bantu noun class (1-15)',
    },
    exampleSentence: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Example sentence in Shona',
    },
    exampleTranslation: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'English translation of example',
    },
    mnemonicTip: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Memory aid for learning',
    },
    relatedWords: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of related word IDs',
    },
    grammarNotes: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Grammar rules and patterns',
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
    tableName: 'shona_vocabulary',
    timestamps: true,
  });

module.exports = ShonaVocabulary;
