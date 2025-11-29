import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TodosPage } from './pages/TodosPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Routes>
          <Route path="/" element={<Navigate to="/todos" replace />} />
          <Route path="/todos" element={<TodosPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
