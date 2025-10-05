import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import TopicSelect from './pages/TopicSelect'
import QuizLoader from './pages/QuizLoader'
import QuizPage from './pages/QuizPage'
import ResultPage from './pages/ResultPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/topic" replace />} />
      <Route path="/topic" element={<TopicSelect />} />
      <Route path="/loading" element={<QuizLoader />} />
      <Route path="/quiz" element={<QuizPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="*" element={<Navigate to="/topic" replace />} />
    </Routes>
  )
}

export default App
