import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import toast from 'react-hot-toast';
import { quizAtom, topicAtom } from '../state/atoms';
import { generateQuiz } from '../api/client';

export default function QuizLoader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useRecoilState(quizAtom);
  const [topic] = useRecoilState(topicAtom);

  useEffect(() => {
    const state = location.state || {};
    const t = state.topic || topic;
    const difficulty = state.difficulty || 'easy';

    if (!t) {
      navigate('/topic');
      return;
    }

    let cancelled = false;
    async function run() {
      setQuiz((q) => ({ ...q, status: 'loading', error: null }));
      try {
        const data = await generateQuiz(t, difficulty);
        if (cancelled) return;
        // Persist quiz in localStorage for resume
        localStorage.setItem('quiz-data', JSON.stringify(data));
        setQuiz({ ...data, status: 'ready', error: null });
        navigate('/quiz');
      } catch (err) {
        if (cancelled) return;
        setQuiz((q) => ({ ...q, status: 'error', error: err.message }));
        toast.error(err.message || 'Failed to generate quiz');
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [location.state, navigate, setQuiz, topic]);

  return (
    <div className="container">
      <div className="loader" aria-busy="true" aria-live="polite">
        Generating your quiz... Please wait.
      </div>
      {quiz.status === 'error' && (
        <div className="card error">
          <p>{quiz.error}</p>
          <div>
            <button onClick={() => navigate('/loading', { state: location.state })}>Retry</button>
            <button onClick={() => navigate('/topic')}>Change Topic</button>
          </div>
        </div>
      )}
    </div>
  );
}
