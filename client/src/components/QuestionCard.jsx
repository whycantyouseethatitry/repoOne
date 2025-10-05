import { useMemo } from 'react';

export default function QuestionCard({ question, selectedIndex, onSelect, disabled }) {
  const options = useMemo(() => question.options || [], [question]);

  return (
    <div className="card">
      <h2>{question.question}</h2>
      <div className="options" role="listbox" aria-label="answer options">
        {options.map((opt, idx) => {
          const isSelected = selectedIndex === idx;
          return (
            <button
              key={idx}
              role="option"
              aria-selected={isSelected}
              className={`option ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(idx)}
              disabled={disabled}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
