const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

router.post('/', async (req, res) => {
  try {
    // If Mongo is not connected, model operations will fail – handle gracefully
    if (!Feedback) {
      return res.status(503).json({ error: 'Persistence unavailable' });
    }

    const { topic, difficulty, answers, score, feedbackText } = req.body || {};

    const doc = await Feedback.create({
      topic: String(topic || ''),
      difficulty: String(difficulty || 'easy'),
      answers: answers || {},
      score: Number(score || 0),
      feedbackText: String(feedbackText || ''),
    });

    res.status(201).json({ id: doc._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to store feedback' });
  }
});

module.exports = router;
