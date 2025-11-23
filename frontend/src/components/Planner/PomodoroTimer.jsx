// Pomodoro timer component

// frontend/src/components/Planner/PomodoroTimer.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Clock, Play, Pause, RotateCcw } from 'lucide-react';

const PomodoroTimer = () => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [stats, setStats] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    let interval = null;
    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            handleComplete();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/planner/pomodoro/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const handleStart = async () => {
    if (!sessionId) {
      try {
        const response = await api.post('/planner/pomodoro/start', {
          duration: 25
        });
        setSessionId(response.data.sessionId);
      } catch (error) {
        toast.error('Failed to start session');
        return;
      }
    }
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setMinutes(25);
    setSeconds(0);
    setIsActive(false);
    setSessionId(null);
  };

  const handleComplete = async () => {
    setIsActive(false);
    if (sessionId) {
      try {
        await api.put(`/planner/pomodoro/${sessionId}/complete`);
        toast.success('Pomodoro completed! 🎉');
        fetchStats();
      } catch (error) {
        console.error('Failed to complete session');
      }
    }
    handleReset();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white flex items-center gap-2">
        <Clock className="text-indigo-400" />
        Pomodoro Timer
      </h1>

      <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
        <div className="text-8xl font-bold text-white mb-8">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>

        <div className="flex justify-center gap-4">
          {!isActive ? (
            <button
              onClick={handleStart}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="px-8 py-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center gap-2"
            >
              <Pause className="w-5 h-5" />
              Pause
            </button>
          )}
          <button
            onClick={handleReset}
            className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Today's Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-700 rounded-lg">
            <p className="text-2xl font-bold text-white">{stats.completed}</p>
            <p className="text-slate-400">Completed</p>
          </div>
          <div className="p-4 bg-slate-700 rounded-lg">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-slate-400">Total Sessions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;