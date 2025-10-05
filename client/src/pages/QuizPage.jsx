import { useEffect, useMemo, useState } from 'react';
import { useRecoilState } from 'recoil';
import { useNavigate } from 'react-router-dom';
import { quizAtom, currentQuestionIndexAtom, answersAtom } from '../state/atoms';
import QuestionCard from '../components/QuestionCard';
import ProgressBar from '../components/ProgressBar';

export default function QuizPage() {
  const [quiz] = useRecoilState(quizAtom);
  const [currentIndex, setCurrentIndex] = useRecoilState(currentQuestionIndexAtom);
  const [answers, setAnswers] = useRecoilState(answersAtom);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  const total = quiz?.questions?.length || 0;
  const question = useMemo(() => quiz?.questions?.[currentIndex] || null, [quiz, currentIndex]);

  if (!total) {
    navigate('/topic');
    return null;
  }

  // Restore persisted answers
  useEffect(() => {
    const saved = localStorage.getItem('answers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers((a) => Object.keys(a).length ? a : parsed);
      } catch {}
    }
  }, [setAnswers]);

  function handleSelect(idx) {
    setAnswers((a) => {
      const next = { ...a, [question.id]: idx };
      localStorage.setItem('answers', JSON.stringify(next));
      return next;
    });
  }

  function prev() {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }

  async function next() {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
      return;
    }
    // finish
    setProcessing(true);
    // compute score locally
    const correct = quiz.questions.reduce((acc, q) => {
      const selected = answers[q.id];
      return acc + (selected === q.correct_index ? 1 : 0);
    }, 0);
    const score = Math.round((correct / total) * 100);
    // put score in history state
    navigate('/result', { state: { score } });
  }

  const selectedIndex = answers[question.id];

  return (
    <div className="container">
      <ProgressBar current={currentIndex} total={total} />
      <QuestionCard
        question={question}
        selectedIndex={selectedIndex}
        onSelect={handleSelect}
        disabled={processing}
      />
      <div className="row">
        <button onClick={prev} disabled={currentIndex === 0 || processing}>
          Prev
        </button>
        <button onClick={next} disabled={processing}>
          {currentIndex === total - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}
