const axios = require('axios');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const quizSchema = {
  type: 'object',
  required: ['topic', 'questions', 'meta'],
  additionalProperties: false,
  properties: {
    topic: { type: 'string' },
    questions: {
      type: 'array',
      minItems: 5,
      maxItems: 5,
      items: {
        type: 'object',
        required: ['id', 'question', 'options', 'correct_index'],
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          question: { type: 'string' },
          options: {
            type: 'array',
            minItems: 4,
            maxItems: 4,
            items: { type: 'string' },
          },
          correct_index: { type: 'integer', minimum: 0, maximum: 3 },
          explanation: { type: 'string' },
        },
      },
    },
    meta: {
      type: 'object',
      required: ['difficulty'],
      additionalProperties: false,
      properties: {
        difficulty: { enum: ['easy', 'medium', 'hard'] },
        source_hint: { type: 'string' },
      },
    },
  },
};

const validateQuiz = ajv.compile(quizSchema);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildPrompt(topic, difficulty) {
  return (
    'You are an expert quiz generator. Produce **exact JSON only** matching the schema below. ' +
    `Topic: "${topic}". Difficulty: "${difficulty}". ` +
    'Create exactly 5 multiple-choice questions. Each question must have exactly 4 options. ' +
    'Mark the correct option with "correct_index" (0-based). Do NOT include any commentary, markdown, or extra fields outside the schema. ' +
    'Keep questions concise (<=2 sentences). Provide short explanation for each answer (1-2 sentences). Output must be valid JSON.\n\n' +
    'Schema:\n' +
    '{\n' +
    '  "topic":"string",\n' +
    '  "questions":[\n' +
    '    {\n' +
    '      "id":"q1",\n' +
    '      "question":"string",\n' +
    '      "options":["a","b","c","d"],\n' +
    '      "correct_index":0,\n' +
    '      "explanation":"string"\n' +
    '    }\n' +
    '  ],\n' +
    '  "meta":{"difficulty":"easy|medium|hard","source_hint":"string"}\n' +
    '}'
  );
}

function buildFeedbackPrompt({ topic, score, total }) {
  return (
    'You are a supportive tutor. Provide concise feedback for a quiz attempt. ' +
    `Topic: "${topic}". Score: ${score}/${total}. ` +
    'In 2-4 sentences: encourage the learner, highlight strengths, and suggest 1-2 concrete next steps. Plain text only.'
  );
}

function attemptRepair(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  // Strip markdown code fences and common wrappers
  let text = rawText.trim();
  text = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();

  // Try to find first { ... } JSON block
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  try {
    const obj = JSON.parse(text);
    return obj;
  } catch (_) {
    return null;
  }
}

async function callGemini({ topic, difficulty, timeoutMs, customPrompt }) {
  const url = process.env.GEMINI_API_URL;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!url || !apiKey) {
    const err = new Error('Gemini configuration missing');
    err.status = 500;
    throw err;
  }

  const prompt = customPrompt || buildPrompt(topic, difficulty);

  // Example request shape; adjust to your Gemini endpoint
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  const response = await axios.post(
    url,
    {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: { temperature: 0.4 },
    },
    { timeout: timeoutMs }
  );

  // Try multiple common response shapes
  const data = response.data;
  let text = '';
  if (typeof data === 'string') {
    text = data;
  } else if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    text = data.candidates[0].content.parts[0].text;
  } else if (data?.output_text) {
    text = data.output_text;
  } else if (data?.text) {
    text = data.text;
  } else {
    text = JSON.stringify(data);
  }
  return text;
}

async function generateQuiz({ topic, difficulty }) {
  const timeoutMs = 15000;
  const maxRetries = 2;

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    try {
      const text = await callGemini({ topic, difficulty, timeoutMs });

      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch (_) {
        parsed = attemptRepair(text);
      }

      if (!parsed) {
        throw new Error('Empty or non-JSON response from AI');
      }

      if (validateQuiz(parsed)) {
        return parsed;
      }

      // Try a single repair pass from already-parsed object
      const repaired = attemptRepair(JSON.stringify(parsed));
      if (repaired && validateQuiz(repaired)) {
        return repaired;
      }

      const err = new Error('AI response failed schema validation');
      err.details = validateQuiz.errors;
      throw err;
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) break;
      const backoff = Math.pow(2, attempt) * 1000; // 0->1s, 1->2s
      await sleep(backoff);
      attempt += 1;
    }
  }

  const finalError = new Error('AI failed to generate questions. Try again.');
  finalError.status = 502;
  finalError.cause = lastError;
  throw finalError;
}

async function generateFeedback({ topic, score, total }) {
  const timeoutMs = 10000;
  const maxRetries = 2;

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    try {
      const prompt = buildFeedbackPrompt({ topic, score, total });
      const text = await callGemini({ topic, difficulty: 'easy', timeoutMs, customPrompt: prompt });
      // Clean up any code fences if present
      let out = text?.trim() || '';
      out = out.replace(/^```(?:[a-z]+)?/i, '').replace(/```$/i, '').trim();
      if (!out) throw new Error('Empty feedback');
      return { feedback: out };
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) break;
      const backoff = Math.pow(2, attempt) * 1000;
      await sleep(backoff);
      attempt += 1;
    }
  }

  const finalError = new Error('Failed to generate feedback');
  finalError.status = 502;
  finalError.cause = lastError;
  throw finalError;
}

module.exports = {
  generateQuiz,
  validateQuiz,
  buildFeedbackPrompt,
  generateFeedback,
};
