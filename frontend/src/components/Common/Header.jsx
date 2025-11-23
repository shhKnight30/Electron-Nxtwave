// Header component

// frontend/src/components/Common/Header.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { Wifi, WifiOff, User } from 'lucide-react';

const Header = () => {
  const { user } = useContext(AuthContext);
  const { useOnlineAI, toggleAIMode } = useContext(ThemeContext);

  return (
    <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Welcome back, {user?.username}!
          </h2>
          <p className="text-sm text-slate-400">Let's make today productive</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleAIMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              useOnlineAI
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 text-slate-300'
            }`}
            title={useOnlineAI ? 'Using Online AI' : 'Using Offline AI'}
          >
            {useOnlineAI ? (
              <>
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">Offline</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg">
            <User className="w-5 h-5 text-slate-300" />
            <span className="text-sm font-medium text-white">{user?.email}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;