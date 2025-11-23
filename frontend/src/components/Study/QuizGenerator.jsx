// Quiz generator component

// frontend/src/components/Study/QuizGenerator.jsx
import React, { useState, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HelpCircle, CheckCircle, XCircle } from 'lucide-react';

const QuizGenerator = () => {
  const [text, setText] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const { useOnlineAI } = useContext(ThemeContext);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('Please enter text');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/study/quiz', {
        text,
        questionCount: 5,
        useOnline: useOnlineAI
      });
      setQuestions(response.data.questions);
      setAnswers({});
      setSubmitted(false);
      setScore(null);
      toast.success('Quiz generated!');
    } catch (error) {
      toast.error('Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, answer) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) correct++;
    });
    setScore((correct / questions.length) * 100);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white flex items-center gap-2">
        <HelpCircle className="text-indigo-400" />
        Quiz Generator
      </h1>

      {questions.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your study material..."
            rows={10}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Quiz'}
          </button>
        </div>
      ) : (
        <>
          {submitted && score !== null && (
            <div className={`rounded-xl p-6 ${score >= 70 ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'} border-2`}>
              <h2 className="text-2xl font-bold text-white mb-2">
                Score: {score.toFixed(0)}%
              </h2>
              <p className="text-slate-300">
                {score >= 70 ? 'Great job! 🎉' : 'Keep practicing! 💪'}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-medium text-white mb-4">
                  {qIndex + 1}. {q.question}
                </h3>
                <div className="space-y-2">
                  {['A', 'B', 'C', 'D'].map((letter, oIndex) => {
                    const isSelected = answers[qIndex] === letter;
                    const isCorrect = submitted && letter === q.correctAnswer;
                    const isWrong = submitted && isSelected && letter !== q.correctAnswer;

                    return (
                      <button
                        key={letter}
                        onClick={() => !submitted && handleAnswerSelect(qIndex, letter)}
                        disabled={submitted}
                        className={`w-full p-4 rounded-lg text-left transition-colors ${
                          isCorrect ? 'bg-green-600 text-white' :
                          isWrong ? 'bg-red-600 text-white' :
                          isSelected ? 'bg-indigo-600 text-white' :
                          'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{letter}) {q.options[oIndex]}</span>
                          {submitted && isCorrect && <CheckCircle className="w-5 h-5" />}
                          {submitted && isWrong && <XCircle className="w-5 h-5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {!submitted && (
            <button
              onClick={handleSubmit}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
            >
              Submit Quiz
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default QuizGenerator;