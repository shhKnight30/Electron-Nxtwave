// Flashcards component

// frontend/src/components/Study/Flashcards.jsx
import React, { useState, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CreditCard, RotateCw } from 'lucide-react';

const Flashcards = () => {
  const [text, setText] = useState('');
  const [count, setCount] = useState(5);
  const [flashcards, setFlashcards] = useState([]);
  const [flipped, setFlipped] = useState({});
  const [loading, setLoading] = useState(false);
  const { useOnlineAI } = useContext(ThemeContext);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('Please enter text');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/study/flashcards', {
        text,
        count,
        useOnline: useOnlineAI
      });
      setFlashcards(response.data.flashcards);
      setFlipped({});
      toast.success(`Generated ${response.data.count} flashcards!`);
    } catch (error) {
      toast.error('Failed to generate flashcards');
    } finally {
      setLoading(false);
    }
  };

  const toggleFlip = (index) => {
    setFlipped(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white flex items-center gap-2">
        <CreditCard className="text-indigo-400" />
        Flashcard Generator
      </h1>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your study content..."
          rows={8}
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
        />

        <div className="mt-4 flex items-center gap-4">
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            min="1"
            max="20"
            className="w-24 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Flashcards'}
          </button>
        </div>
      </div>

      {flashcards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flashcards.map((card, index) => (
            <div
              key={index}
              onClick={() => toggleFlip(index)}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700 cursor-pointer hover:border-indigo-500 transition-all min-h-[200px] flex items-center justify-center"
            >
              <div className="text-center">
                {!flipped[index] ? (
                  <>
                    <p className="text-sm text-slate-400 mb-2">Question</p>
                    <p className="text-white font-medium">{card.question}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-400 mb-2">Answer</p>
                    <p className="text-indigo-300">{card.answer}</p>
                  </>
                )}
                <RotateCw className="w-4 h-4 text-slate-500 mx-auto mt-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Flashcards;