const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// A DM "connection" between two users — doubles as a connection request
// (status starts 'pending') and, once accepted, the thread messages live under.
const DirectConnection = sequelize.define('DirectConnection', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  requesterId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  recipientId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
    comment: 'pending | accepted | declined',
  },
  requestMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Optional note sent along with the connection request',
  },
  respondedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'direct_connections',
  timestamps: true,
});

module.exports = DirectConnection;
