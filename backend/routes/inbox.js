/**
 * Inbox routes — user-to-user direct messaging with a request/accept flow.
 * Sending a request just creates a 'pending' DirectConnection; only once the
 * recipient accepts can either side post messages in the thread.
 */

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticateToken } = require('../middleware/auth');
const { DirectConnection, DirectMessage, User } = require('../models');

async function loadParticipantConnection(connectionId, myUuid) {
  const connection = await DirectConnection.findByPk(connectionId);
  if (!connection) return { error: 404 };
  if (connection.requesterId !== myUuid && connection.recipientId !== myUuid) {
    return { error: 403 };
  }
  return { connection };
}

/**
 * POST /api/inbox/requests
 * Send (or re-use) a connection request to another user.
 */
router.post('/requests', authenticateToken, async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    const myUuid = req.user.uuid;

    if (!recipientId) {
      return res.status(400).json({ success: false, error: 'Missing recipientId' });
    }
    if (recipientId === myUuid) {
      return res.status(400).json({ success: false, error: "You can't message yourself" });
    }

    const recipient = await User.findOne({ where: { uuid: recipientId } });
    if (!recipient) {
      return res.status(404).json({ success: false, error: 'Recipient not found' });
    }

    let connection = await DirectConnection.findOne({
      where: {
        [Op.or]: [
          { requesterId: myUuid, recipientId },
          { requesterId: recipientId, recipientId: myUuid },
        ],
      },
    });

    if (connection && connection.status === 'declined') {
      // Allow re-requesting after a decline.
      connection.requesterId = myUuid;
      connection.recipientId = recipientId;
      connection.status = 'pending';
      connection.requestMessage = message || null;
      connection.respondedAt = null;
      await connection.save();
    } else if (!connection) {
      connection = await DirectConnection.create({
        requesterId: myUuid,
        recipientId,
        status: 'pending',
        requestMessage: message || null,
      });
    }
    // If a connection already exists as 'pending' or 'accepted', just return it (idempotent).

    res.status(201).json({ success: true, data: connection });
  } catch (error) {
    console.error('[Inbox] Request create error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/inbox/requests
 * Pending requests waiting on the current user to accept/decline.
 */
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const myUuid = req.user.uuid;

    const requests = await DirectConnection.findAll({
      where: { recipientId: myUuid, status: 'pending' },
      include: [{ model: User, as: 'Requester', attributes: ['uuid', 'name'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('[Inbox] Requests fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/inbox/sent
 * Requests the current user has sent, so they can see the status of their
 * own outreach (pending/accepted/declined) rather than it disappearing.
 */
router.get('/sent', authenticateToken, async (req, res) => {
  try {
    const myUuid = req.user.uuid;

    const sent = await DirectConnection.findAll({
      where: { requesterId: myUuid },
      include: [{ model: User, as: 'Recipient', attributes: ['uuid', 'name'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: sent });
  } catch (error) {
    console.error('[Inbox] Sent requests fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/inbox/requests/:id/accept
 */
router.post('/requests/:id/accept', authenticateToken, async (req, res) => {
  try {
    const myUuid = req.user.uuid;
    const connection = await DirectConnection.findByPk(req.params.id);

    if (!connection) return res.status(404).json({ success: false, error: 'Request not found' });
    if (connection.recipientId !== myUuid) {
      return res.status(403).json({ success: false, error: 'Only the recipient can accept this request' });
    }
    if (connection.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Request is already ${connection.status}` });
    }

    connection.status = 'accepted';
    connection.respondedAt = new Date();
    await connection.save();

    // Turn the original request note into the first thread message, if any.
    if (connection.requestMessage) {
      const requester = await User.findOne({ where: { uuid: connection.requesterId } });
      await DirectMessage.create({
        connectionId: connection.id,
        senderId: connection.requesterId,
        senderName: requester?.name || 'Researcher',
        content: connection.requestMessage,
      });
    }

    res.json({ success: true, data: connection });
  } catch (error) {
    console.error('[Inbox] Accept error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/inbox/requests/:id/decline
 */
router.post('/requests/:id/decline', authenticateToken, async (req, res) => {
  try {
    const myUuid = req.user.uuid;
    const connection = await DirectConnection.findByPk(req.params.id);

    if (!connection) return res.status(404).json({ success: false, error: 'Request not found' });
    if (connection.recipientId !== myUuid) {
      return res.status(403).json({ success: false, error: 'Only the recipient can decline this request' });
    }
    if (connection.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Request is already ${connection.status}` });
    }

    connection.status = 'declined';
    connection.respondedAt = new Date();
    await connection.save();

    res.json({ success: true, data: connection });
  } catch (error) {
    console.error('[Inbox] Decline error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/inbox/requests/:id
 * Either participant can remove a connection — the recipient declining a
 * request, the sender cancelling their own pending/declined request, or
 * either side deleting an accepted conversation (this also removes its
 * messages via the FK cascade).
 */
router.delete('/requests/:id', authenticateToken, async (req, res) => {
  try {
    const myUuid = req.user.uuid;
    const connection = await DirectConnection.findByPk(req.params.id);

    if (!connection) return res.status(404).json({ success: false, error: 'Request not found' });
    if (connection.requesterId !== myUuid && connection.recipientId !== myUuid) {
      return res.status(403).json({ success: false, error: 'Not a participant in this request' });
    }

    await connection.destroy();

    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    console.error('[Inbox] Delete error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/inbox/conversations
 * Accepted connections for the current user, with the other participant's
 * name and a preview of the latest message.
 */
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const myUuid = req.user.uuid;

    const connections = await DirectConnection.findAll({
      where: {
        status: 'accepted',
        [Op.or]: [{ requesterId: myUuid }, { recipientId: myUuid }],
      },
      include: [
        { model: User, as: 'Requester', attributes: ['uuid', 'name'] },
        { model: User, as: 'Recipient', attributes: ['uuid', 'name'] },
      ],
      order: [['updatedAt', 'DESC']],
    });

    const withPreview = await Promise.all(
      connections.map(async (c) => {
        const lastMessage = await DirectMessage.findOne({
          where: { connectionId: c.id },
          order: [['createdAt', 'DESC']],
        });
        const other = c.requesterId === myUuid ? c.Recipient : c.Requester;
        return {
          id: c.id,
          otherUser: { uuid: other?.uuid, name: other?.name || 'Researcher' },
          lastMessage: lastMessage
            ? { content: lastMessage.content, createdAt: lastMessage.createdAt, senderId: lastMessage.senderId }
            : null,
          updatedAt: c.updatedAt,
        };
      })
    );

    res.json({ success: true, data: withPreview });
  } catch (error) {
    console.error('[Inbox] Conversations fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/inbox/conversations/:connectionId/messages
 */
router.get('/conversations/:connectionId/messages', authenticateToken, async (req, res) => {
  try {
    const myUuid = req.user.uuid;
    const { after, limit = 100 } = req.query;

    const { connection, error } = await loadParticipantConnection(req.params.connectionId, myUuid);
    if (error === 404) return res.status(404).json({ success: false, error: 'Conversation not found' });
    if (error === 403) return res.status(403).json({ success: false, error: 'Not a participant in this conversation' });
    if (connection.status !== 'accepted') {
      return res.status(403).json({ success: false, error: 'Conversation is not active yet' });
    }

    const where = { connectionId: connection.id };
    if (after) where.createdAt = { [Op.gt]: new Date(after) };

    const messages = await DirectMessage.findAll({
      where,
      order: [['createdAt', 'ASC']],
      limit: Math.min(parseInt(limit, 10) || 100, 300),
    });

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('[Inbox] Messages fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/inbox/conversations/:connectionId/messages
 */
router.post('/conversations/:connectionId/messages', authenticateToken, async (req, res) => {
  try {
    const myUuid = req.user.uuid;
    const { content, attachmentUrl, attachmentName, attachmentType } = req.body;

    const { connection, error } = await loadParticipantConnection(req.params.connectionId, myUuid);
    if (error === 404) return res.status(404).json({ success: false, error: 'Conversation not found' });
    if (error === 403) return res.status(403).json({ success: false, error: 'Not a participant in this conversation' });
    if (connection.status !== 'accepted') {
      return res.status(403).json({ success: false, error: 'Conversation is not active yet' });
    }

    const trimmedContent = typeof content === 'string' ? content.trim() : '';
    if (!trimmedContent && !attachmentUrl) {
      return res.status(400).json({ success: false, error: 'Message content or attachment is required' });
    }
    if (trimmedContent.length > 2000) {
      return res.status(400).json({ success: false, error: 'Message is too long (max 2000 characters)' });
    }

    const sender = await User.findOne({ where: { uuid: myUuid } });

    const dm = await DirectMessage.create({
      connectionId: connection.id,
      senderId: myUuid,
      senderName: sender?.name || 'Researcher',
      content: trimmedContent || null,
      attachmentUrl: attachmentUrl || null,
      attachmentName: attachmentName || null,
      attachmentType: attachmentType || null,
    });

    connection.changed('updatedAt', true);
    await connection.update({ updatedAt: new Date() });

    res.status(201).json({ success: true, data: dm });
  } catch (error) {
    console.error('[Inbox] Message create error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
