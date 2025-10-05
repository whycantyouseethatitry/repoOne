const nock = require('nock');
const { generateQuiz, validateQuiz } = require('../services/aiService');

// Helper valid payload
function validQuiz(topic = 'Algebra', difficulty = 'easy') {
  return {
    topic,
    questions: [0, 1, 2, 3, 4].map((i) => ({
      id: `q${i + 1}`,
      question: `Q${i + 1}?`,
      options: ['A', 'B', 'C', 'D'],
      correct_index: 0,
      explanation: 'Because.'
    })),
    meta: { difficulty, source_hint: 'n/a' }
  };
}

// Build a Gemini-like response wrapper
function geminiWrapper(text) {
  return {
    candidates: [
      {
        content: { parts: [{ text }] }
      }
    ]
  };
}

describe('aiService', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.GEMINI_API_URL = 'https://gemini.test/v1';
    process.env.GEMINI_API_KEY = 'key';
  });

  afterEach(() => {
    delete process.env.GEMINI_API_URL;
    delete process.env.GEMINI_API_KEY;
  });

  test('repairs markdown-wrapped JSON and validates', async () => {
    const payload = validQuiz();
    const text = '```json\n' + JSON.stringify(payload) + '\n```';

    nock('https://gemini.test').post('/v1').reply(200, geminiWrapper(text));

    const out = await generateQuiz({ topic: 'Algebra', difficulty: 'easy' });
    expect(validateQuiz(out)).toBe(true);
    expect(out.questions).toHaveLength(5);
  });

  test('retries on invalid JSON then succeeds', async () => {
    const bad = 'not-json';
    const good = validQuiz('Biology');

    const scope = nock('https://gemini.test')
      .post('/v1')
      .reply(200, geminiWrapper(bad))
      .post('/v1')
      .reply(200, geminiWrapper(JSON.stringify(good)));

    const out = await generateQuiz({ topic: 'Biology', difficulty: 'easy' });
    expect(validateQuiz(out)).toBe(true);
    expect(out.topic).toBe('Biology');
    expect(scope.isDone()).toBe(true);
  });

  test('fails after retries with structured error', async () => {
    nock('https://gemini.test')
      .post('/v1')
      .times(3)
      .reply(200, geminiWrapper('invalid'));

    await expect(
      generateQuiz({ topic: 'Chemistry', difficulty: 'hard' })
    ).rejects.toThrow('AI failed to generate questions. Try again.');
  });
});
