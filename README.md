# AI-Assisted Knowledge Quiz (MERN + Recoil + Gemini)

An AI-assisted quiz generator that creates 5-question MCQ quizzes for a selected topic and difficulty using Gemini. Built with Express/Node, React + Recoil, and MongoDB (via Mongoose).

## Quick start

### Prerequisites
- Node 18+
- npm
- MongoDB URI (Atlas or local)
- Gemini API key and endpoint (free tier)

### Environment

Create `.env` files from the examples:

- Server: `server/.env`
```
PORT=4000
MONGO_URI=<mongo-uri>
GEMINI_API_URL=<gemini-endpoint>
GEMINI_API_KEY=<gemini-key>
NODE_ENV=development
```

- Client: `client/.env`
```
VITE_API_BASE=http://localhost:4000
```

### Install & run (two terminals)

Terminal A:
```bash
cd server
npm install
npm run start:dev
```

Terminal B:
```bash
cd client
npm install
npm start
```

Open http://localhost:5173

## API

- POST `/api/ai/generate-quiz`
  - Body: `{ topic: string, difficulty: 'easy'|'medium'|'hard' }`
  - Returns strictly validated JSON of 5 questions
- GET `/api/health`
- POST `/api/feedback` (optional persistence)

## Backend notes

- `src/services/aiService.js`: calls Gemini with timeout (15s), validates JSON via AJV, auto-repair pass, retries with exponential backoff (1s, 2s), and returns structured error when all attempts fail.
- Request logging via `morgan` (API keys redacted), security middleware via `helmet`, rate limiting via `express-rate-limit`.
- Input sanitation: topic max 50 chars, allowed characters only.

### Tests

```bash
cd server
npm test
```
- Unit tests cover malformed AI responses and retry behavior.

## Frontend structure

- Recoil atoms: `topicAtom`, `quizAtom`, `currentQuestionIndexAtom`, `answersAtom`
- Routes/pages: `TopicSelect`, `QuizLoader`, `QuizPage`, `ResultPage`
- Components: `QuestionCard`, `ProgressBar`
- UX: loading state, error with retry, localStorage persistence, toasts, keyboard-friendly buttons

## Prompts

See `docs/prompts.md` for the prompt and refinements used.

## Known issues
- The result feedback is static; can be upgraded to AI-generated feedback.
- The Gemini response shape may differ per endpoint; adjust parsing in `aiService` accordingly.

## Next steps
- Add animated transitions between questions.
- Add dark mode toggle.
- Store past quizzes and analytics.
- Add simple server-side rate limiter per IP/topic.
