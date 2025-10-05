export default function ProgressBar({ current, total }) {
  const percent = Math.round(((current + 1) / total) * 100);
  return (
    <div className="progress" aria-label="quiz progress">
      <div className="progress-inner" style={{ width: `${percent}%` }} />
      <span className="progress-text">{current + 1} / {total}</span>
    </div>
  );
}
