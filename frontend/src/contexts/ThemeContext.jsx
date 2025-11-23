// Theme context

// frontend/src/contexts/ThemeContext.jsx
import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [useOnlineAI, setUseOnlineAI] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedAIPref = localStorage.getItem('useOnlineAI') === 'true';
    setTheme(savedTheme);
    setUseOnlineAI(savedAIPref);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleAIMode = () => {
    const newMode = !useOnlineAI;
    setUseOnlineAI(newMode);
    localStorage.setItem('useOnlineAI', newMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, useOnlineAI, toggleAIMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
