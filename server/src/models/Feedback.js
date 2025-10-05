const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
    answers: { type: Object, default: {} },
    score: { type: Number, default: 0 },
    feedbackText: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);
