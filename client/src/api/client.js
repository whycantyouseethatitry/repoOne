import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:4000',
  timeout: 15000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err?.response?.data?.error || err.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);

export async function generateQuiz(topic, difficulty = 'easy') {
  const { data } = await api.post('/api/ai/generate-quiz', { topic, difficulty });
  return data;
}

export async function postFeedback(payload) {
  const { data } = await api.post('/api/feedback', payload);
  return data;
}

export async function generateAiFeedback({ topic, score, total }) {
  const { data } = await api.post('/api/ai/feedback', { topic, score, total });
  return data;
}

export async function health() {
  const { data } = await api.get('/api/health');
  return data;
}
