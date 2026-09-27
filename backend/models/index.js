const User = require('./User');
const Conversation = require('./Conversation');
const EmotionalMemory = require('./EmotionalMemory');
const ResearchMemory = require('./ResearchMemory');
const TrendHistory = require('./TrendHistory');
const Task = require('./Task');
const Document = require('./Document');
const Dataset = require('./Dataset');
const AnalysisJob = require('./AnalysisJob');
const AnalysisResult = require('./AnalysisResult');
const BiomarkerResult = require('./BiomarkerResult');
const AIInterpretation = require('./AIInterpretation');
const { VectorMemory } = require('../services/vectorMemoryService');
const CompanyProfile = require('./CompanyProfile');
const Subscription = require('./Subscription');
const LearningModule = require('./LearningModule');
const ModuleContent = require('./ModuleContent');
const UserModuleProgress = require('./UserModuleProgress');
const AssessmentAttempt = require('./AssessmentAttempt');
const ScientificReference = require('./ScientificReference');
const LessonReference = require('./LessonReference');
const ResearchChannel = require('./ResearchChannel');
const ResearchMessage = require('./ResearchMessage');
const DirectConnection = require('./DirectConnection');
const DirectMessage = require('./DirectMessage');
const FeedPost = require('./FeedPost');
const FeedLike = require('./FeedLike');
const FeedComment = require('./FeedComment');

// Define associations
User.hasMany(Conversation, { foreignKey: 'userId', sourceKey: 'uuid' });
Conversation.belongsTo(User, { foreignKey: 'userId', targetKey: 'uuid' });

User.hasMany(EmotionalMemory, { foreignKey: 'userId', sourceKey: 'uuid' });
EmotionalMemory.belongsTo(User, { foreignKey: 'userId', targetKey: 'uuid' });

User.hasMany(ResearchMemory, { foreignKey: 'userId', sourceKey: 'uuid' });
ResearchMemory.belongsTo(User, { foreignKey: 'userId', targetKey: 'uuid' });

User.hasMany(Document, { foreignKey: 'userId', sourceKey: 'uuid' });
Document.belongsTo(User, { foreignKey: 'userId', targetKey: 'uuid' });

User.hasMany(VectorMemory, { foreignKey: 'userId', sourceKey: 'uuid' });
VectorMemory.belongsTo(User, { foreignKey: 'userId', targetKey: 'uuid' });

User.hasMany(AnalysisJob, { foreignKey: 'userId', sourceKey: 'uuid' });
AnalysisJob.belongsTo(User, { foreignKey: 'userId', targetKey: 'uuid' });

User.hasMany(Subscription, { foreignKey: 'userId', sourceKey: 'uuid' });
Subscription.belongsTo(User, { foreignKey: 'userId', targetKey: 'uuid' });

Dataset.hasMany(AnalysisJob, { foreignKey: 'datasetId' });
AnalysisJob.belongsTo(Dataset, { foreignKey: 'datasetId' });

AnalysisJob.hasOne(AnalysisResult, { foreignKey: 'jobId' });
AnalysisResult.belongsTo(AnalysisJob, { foreignKey: 'jobId' });

AnalysisJob.hasMany(BiomarkerResult, { foreignKey: 'jobId' });
BiomarkerResult.belongsTo(AnalysisJob, { foreignKey: 'jobId' });

AnalysisJob.hasOne(AIInterpretation, { foreignKey: 'jobId' });
AIInterpretation.belongsTo(AnalysisJob, { foreignKey: 'jobId' });

// ========== LEARNING MODULES ASSOCIATIONS ==========
User.hasMany(UserModuleProgress, { foreignKey: 'userId', sourceKey: 'uuid' });
UserModuleProgress.belongsTo(User, { foreignKey: 'userId', targetKey: 'uuid' });

LearningModule.hasMany(ModuleContent, { foreignKey: 'moduleId' });
ModuleContent.belongsTo(LearningModule, { foreignKey: 'moduleId' });

LearningModule.hasMany(UserModuleProgress, { foreignKey: 'moduleId' });
UserModuleProgress.belongsTo(LearningModule, { foreignKey: 'moduleId' });

ModuleContent.hasMany(UserModuleProgress, { foreignKey: 'contentId' });
UserModuleProgress.belongsTo(ModuleContent, { foreignKey: 'contentId' });

User.hasMany(AssessmentAttempt, { foreignKey: 'userId', sourceKey: 'uuid' });
AssessmentAttempt.belongsTo(User, { foreignKey: 'userId', targetKey: 'uuid' });
LearningModule.hasMany(AssessmentAttempt, { foreignKey: 'moduleId' });
AssessmentAttempt.belongsTo(LearningModule, { foreignKey: 'moduleId' });
ModuleContent.hasMany(AssessmentAttempt, { foreignKey: 'contentId' });
AssessmentAttempt.belongsTo(ModuleContent, { foreignKey: 'contentId' });

ModuleContent.hasMany(LessonReference, { foreignKey: 'lessonId', as: 'ReferenceLinks' });
LessonReference.belongsTo(ModuleContent, { foreignKey: 'lessonId', as: 'Lesson' });
ScientificReference.hasMany(LessonReference, { foreignKey: 'referenceId', as: 'LessonLinks' });
LessonReference.belongsTo(ScientificReference, { foreignKey: 'referenceId', as: 'Reference' });
ModuleContent.belongsToMany(ScientificReference, {
  through: LessonReference,
  foreignKey: 'lessonId',
  otherKey: 'referenceId',
  as: 'ScientificReferences',
});
ScientificReference.belongsToMany(ModuleContent, {
  through: LessonReference,
  foreignKey: 'referenceId',
  otherKey: 'lessonId',
  as: 'Lessons',
});

// ========== RESEARCH COMMUNITY ASSOCIATIONS ==========
ResearchChannel.hasMany(ResearchMessage, { foreignKey: 'channelId' });
ResearchMessage.belongsTo(ResearchChannel, { foreignKey: 'channelId' });

User.hasMany(ResearchMessage, { foreignKey: 'userId', sourceKey: 'uuid' });
ResearchMessage.belongsTo(User, { foreignKey: 'userId', targetKey: 'uuid' });

// ========== DIRECT MESSAGING ASSOCIATIONS ==========
DirectConnection.hasMany(DirectMessage, { foreignKey: 'connectionId' });
DirectMessage.belongsTo(DirectConnection, { foreignKey: 'connectionId' });

User.hasMany(DirectConnection, { foreignKey: 'requesterId', sourceKey: 'uuid', as: 'SentConnectionRequests' });
DirectConnection.belongsTo(User, { foreignKey: 'requesterId', targetKey: 'uuid', as: 'Requester' });

User.hasMany(DirectConnection, { foreignKey: 'recipientId', sourceKey: 'uuid', as: 'ReceivedConnectionRequests' });
DirectConnection.belongsTo(User, { foreignKey: 'recipientId', targetKey: 'uuid', as: 'Recipient' });

// ========== SCIENCE FEED ASSOCIATIONS ==========
FeedPost.hasMany(FeedLike, { foreignKey: 'postId' });
FeedLike.belongsTo(FeedPost, { foreignKey: 'postId' });

FeedPost.hasMany(FeedComment, { foreignKey: 'postId' });
FeedComment.belongsTo(FeedPost, { foreignKey: 'postId' });

module.exports = {
  User,
  Conversation,
  EmotionalMemory,
  ResearchMemory,
  TrendHistory,
  Task,
  Document,
  Dataset,
  AnalysisJob,
  AnalysisResult,
  BiomarkerResult,
  AIInterpretation,
  VectorMemory,
  CompanyProfile,
  Subscription,
  LearningModule,
  ModuleContent,
  UserModuleProgress,
  AssessmentAttempt,
  ScientificReference,
  LessonReference,
  ResearchChannel,
  ResearchMessage,
  DirectConnection,
  DirectMessage,
  FeedPost,
  FeedLike,
  FeedComment,
};