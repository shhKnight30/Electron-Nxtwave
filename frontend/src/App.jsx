import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import Summarizer from './components/Study/Summarizer';
import Flashcards from './components/Study/Flashcards';
import QuizGenerator from './components/Study/QuizGenerator';
import NoteTaker from './components/Study/NoteTaker';
import StudyPlanner from './components/Planner/StudyPlanner';
import PomodoroTimer from './components/Planner/PomodoroTimer';
import MentalHealthDashboard from './components/MentalHealth/MentalHealthDashboard';
import Settings from './components/Settings/Settings';
import VoiceInput from './components/Voice/VoiceInput';
import VoiceSettings from './components/Voice/VoiceSettings';
import Layout from './components/Layout';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="app">
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#1e293b',
                  color: '#f1f5f9',
                  border: '1px solid #334155'
                }
              }}
            />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="summarize" element={<Summarizer />} />
                <Route path="flashcards" element={<Flashcards />} />
                <Route path="quiz" element={<QuizGenerator />} />
                <Route path="notes" element={<NoteTaker />} />
                <Route path="planner" element={<StudyPlanner />} />
                <Route path="pomodoro" element={<PomodoroTimer />} />
                <Route path="mental-health" element={<MentalHealthDashboard />} />
                <Route path="voice" element={<VoiceInput />} />
                <Route path="voice-settings" element={<VoiceSettings />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;