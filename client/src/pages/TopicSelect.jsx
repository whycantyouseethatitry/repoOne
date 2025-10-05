import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import toast from 'react-hot-toast';
import { topicAtom, quizAtom } from '../state/atoms';

const sampleTopics = ['JavaScript Basics', 'React Hooks', 'Node.js', 'Algorithms', 'Databases'];

export default function TopicSelect() {
  const [topic, setTopic] = useRecoilState(topicAtom);
  const [, setQuiz] = useRecoilState(quizAtom);
  const [difficulty, setDifficulty] = useState('easy');
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    const t = topic.trim();
    if (!t) {
      toast.error('Please enter a topic');
      return;
    }
    setQuiz((q) => ({ ...q, status: 'loading', error: null }));
    navigate('/loading', { state: { topic: t, difficulty } });
  }

  return (
    <div className="container">
      <h1>AI-Assisted Quiz</h1>
      <form onSubmit={handleSubmit} className="card">
        <label>
          Topic
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. React Hooks" />
        </label>

        <label>
          Difficulty
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>

        <div className="samples">
          <span>Try:</span>
          {sampleTopics.map((s) => (
            <button type="button" key={s} onClick={() => setTopic(s)}>
              {s}
            </button>
          ))}
        </div>

        <button type="submit">Generate Quiz</button>
      </form>
    </div>
  );
}
