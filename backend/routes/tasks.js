const express = require('express');
const router = express.Router();
const { addTask } = require('../queue/taskQueue');
const Task = require('../models/Task');

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const tasks = await Task.find({ userId }).sort({ scheduledAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, task, scheduledAt } = req.body;

    if (!userId || !task) {
      return res.status(400).json({ error: 'userId and task are required' });
    }

    const newTask = new Task({
      userId,
      task,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
    });

    await newTask.save();

    // Add to queue if scheduled
    if (scheduledAt) {
      const delay = new Date(scheduledAt).getTime() - Date.now();
      if (delay > 0) {
        await addTask('custom', { taskId: newTask._id, task }, delay);
      }
    }

    res.json(newTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, logs } = req.body;

    const update = { status };
    if (logs) {
      update.$push = { logs: { $each: logs } };
    }
    if (status === 'running') {
      update.executedAt = new Date();
    }

    const task = await Task.findByIdAndUpdate(id, update, { new: true });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/reminder', async (req, res) => {
  try {
    const { userId, message, delay } = req.body;

    await addTask('reminder', { userId, message }, delay || 0);
    res.json({ success: true });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;