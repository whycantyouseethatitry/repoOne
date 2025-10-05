import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { quizAtom, answersAtom, topicAtom, currentQuestionIndexAtom } from '../state/atoms';
import { generateAiFeedback } from '../api/client';

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useRecoilState(quizAtom);
  const [answers, setAnswers] = useRecoilState(answersAtom);
  const [, setTopic] = useRecoilState(topicAtom);
  const [, setIndex] = useRecoilState(currentQuestionIndexAtom);

  const score = location.state?.score ?? 0;
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setLoading(true);
        const out = await generateAiFeedback({ topic: quiz.topic, score, total: quiz.questions.length || 5 });
        if (cancelled) return;
        setFeedback(out.feedback || '');
      } catch (_) {
        if (!cancelled) setFeedback('Great job! Review explanations for any missed questions to improve.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (quiz.topic) run();
    return () => { cancelled = true; };
  }, [quiz.topic, score, quiz.questions.length]);

  function resetAll() {
    setQuiz({ topic: '', questions: [], meta: { difficulty: 'easy' }, status: 'idle', error: null });
    setAnswers({});
    localStorage.removeItem('answers');
    localStorage.removeItem('quiz-data');
    setTopic('');
    setIndex(0);
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Your score: {score}</h2>
        <p>
          <strong>Feedback:</strong>{' '}
          {loading ? 'Generating personalized feedback...' : feedback}
        </p>
        <div className="row">
          <button onClick={() => navigate('/quiz')}>Review</button>
          <button onClick={() => { resetAll(); navigate('/topic'); }}>New Topic</button>
        </div>
      </div>
    </div>
  );
}
