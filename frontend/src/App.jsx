// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Import components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import Summarizer from './components/Study/Summarizer';
import Flashcards from './components/Study/Flashcards';
import QuizGenerator from './components/Study/QuizGenerator';
import PomodoroTimer from './components/Planner/PomodoroTimer';
import VoiceInput from './components/Voice/VoiceInput';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #334155'
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff'
                }
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff'
                }
              }
            }}
          />
          
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="summarize" element={<Summarizer />} />
              <Route path="flashcards" element={<Flashcards />} />
              <Route path="quiz" element={<QuizGenerator />} />
              <Route path="pomodoro" element={<PomodoroTimer />} />
              <Route path="voice" element={<VoiceInput />} />
              {/* Add more routes as you create components */}
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;