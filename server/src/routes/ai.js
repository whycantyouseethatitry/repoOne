const express = require('express');
const router = express.Router();
const { generateQuiz, generateFeedback } = require('../services/aiService');

function sanitizeTopic(raw) {
  if (typeof raw !== 'string') return '';
  let topic = raw.trim();
  // Limit length and strip disallowed characters
  topic = topic.slice(0, 50);
  topic = topic.replace(/[^a-zA-Z0-9 \-_,.!?#()+/]/g, '');
  return topic;
}

const allowedDifficulties = new Set(['easy', 'medium', 'hard']);

router.post('/generate-quiz', async (req, res, next) => {
  try {
    const { topic: rawTopic, difficulty: rawDifficulty } = req.body || {};
    const topic = sanitizeTopic(rawTopic);
    const difficulty = allowedDifficulties.has(rawDifficulty)
      ? rawDifficulty
      : 'easy';

    if (!topic) {
      return res.status(400).json({ error: 'Invalid or empty topic' });
    }

    const result = await generateQuiz({ topic, difficulty });
    res.json(result);
  } catch (err) {
    // Provide a friendly error to UI
    err.status = err.status || 502;
    err.expose = true;
    err.message = 'AI failed to generate questions. Try again.';
    next(err);
  }
});

router.post('/feedback', async (req, res, next) => {
  try {
    const { topic: rawTopic, score, total } = req.body || {};
    const topic = sanitizeTopic(rawTopic);
    const numScore = Number(score);
    const numTotal = Number(total) || 5;
    if (!topic || Number.isNaN(numScore) || Number.isNaN(numTotal)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    const out = await generateFeedback({ topic, score: numScore, total: numTotal });
    res.json(out);
  } catch (err) {
    err.status = err.status || 502;
    err.expose = true;
    err.message = 'Failed to generate feedback';
    next(err);
  }
});

module.exports = router;
