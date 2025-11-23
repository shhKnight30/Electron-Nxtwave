// Dashboard component

// frontend/src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  BookOpen, CreditCard, Trophy, Clock, 
  TrendingUp, Calendar, Brain, Target 
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    sessions: 0,
    flashcards: 0,
    pomodoroCompleted: 0,
    moodScore: 5
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [sessionsRes, flashcardsRes, pomodoroRes, mentalHealthRes] = await Promise.all([
        api.get('/study/sessions'),
        api.get('/study/flashcards'),
        api.get('/planner/pomodoro/stats'),
        api.get('/mental-health/latest')
      ]);

      setStats({
        sessions: sessionsRes.data.sessions.length,
        flashcards: flashcardsRes.data.flashcards.length,
        pomodoroCompleted: pomodoroRes.data.completed || 0,
        moodScore: mentalHealthRes.data.moodScore || 5
      });

      setRecentSessions(sessionsRes.data.sessions.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <TrendingUp className="w-5 h-5 text-green-400" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
      <p className="text-slate-400 text-sm">{label}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Your learning journey at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={BookOpen}
          label="Study Sessions"
          value={stats.sessions}
          color="bg-indigo-600"
        />
        <StatCard
          icon={CreditCard}
          label="Flashcards"
          value={stats.flashcards}
          color="bg-purple-600"
        />
        <StatCard
          icon={Clock}
          label="Pomodoros Completed"
          value={stats.pomodoroCompleted}
          color="bg-green-600"
        />
        <StatCard
          icon={Brain}
          label="Mental Health Score"
          value={`${stats.moodScore}/10`}
          color="bg-pink-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Recent Study Sessions
          </h2>
          
          {recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  <h3 className="text-white font-medium mb-1">
                    {session.title || 'Untitled Session'}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {new Date(session.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">
              No study sessions yet. Start summarizing content to see your sessions here!
            </p>
          )}
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            Today's Goals
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
              <span className="text-white">Complete 4 Pomodoro sessions</span>
              <span className="text-indigo-400 font-medium">
                {stats.pomodoroCompleted}/4
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
              <span className="text-white">Create 10 flashcards</span>
              <span className="text-indigo-400 font-medium">
                {Math.min(stats.flashcards, 10)}/10
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
              <span className="text-white">Review notes</span>
              <span className="text-yellow-400 font-medium">Pending</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Keep up the great work! 🎉
        </h2>
        <p className="text-indigo-100 mb-4">
          You're making excellent progress. Remember to take breaks and stay hydrated.
        </p>
        <button className="px-6 py-2 bg-white text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition-colors">
          View Mental Health Insights
        </button>
      </div>
    </div>
  );
};

export default Dashboard;