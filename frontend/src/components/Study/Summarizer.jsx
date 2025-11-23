// // Summarizer component

// // frontend/src/components/Study/Summarizer.jsx
// import React, { useState, useContext } from 'react';
// import { ThemeContext } from '../../contexts/ThemeContext';
// import api from '../../services/api';
// import toast from 'react-hot-toast';
// import { FileText, Sparkles } from 'lucide-react';

// const Summarizer = () => {
//   const [text, setText] = useState('');
//   const [title, setTitle] = useState('');
//   const [summary, setSummary] = useState('');
//   const [loading, setLoading] = useState(false);
//   const { useOnlineAI } = useContext(ThemeContext);

//   const handleSummarize = async () => {
//     if (!text.trim()) {
//       toast.error('Please enter text to summarize');
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await api.post('/study/summarize', {
//         text,
//         title,
//         useOnline: useOnlineAI
//       });
//       setSummary(response.data.summary);
//       toast.success('Summary generated!');
//     } catch (error) {
//       toast.error('Failed to generate summary');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-6xl mx-auto space-y-6">
//       <h1 className="text-3xl font-bold text-white flex items-center gap-2">
//         <FileText className="text-indigo-400" />
//         Text Summarizer
//       </h1>

//       <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
//         <input
//           type="text"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           placeholder="Title (optional)"
//           className="w-full mb-4 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
//         />

//         <textarea
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           placeholder="Paste your text here..."
//           rows={10}
//           className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
//         />

//         <button
//           onClick={handleSummarize}
//           disabled={loading}
//           className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
//         >
//           <Sparkles className="w-5 h-5" />
//           {loading ? 'Generating...' : 'Summarize'}
//         </button>
//       </div>

//       {summary && (
//         <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
//           <h2 className="text-xl font-bold text-white mb-4">Summary</h2>
//           <p className="text-slate-300 leading-relaxed">{summary}</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Summarizer;

// frontend/src/components/Study/Summarizer.jsx
import React, { useState, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FileText, Sparkles } from 'lucide-react';

const Summarizer = () => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const { useOnlineAI } = useContext(ThemeContext);

  const handleSummarize = async () => {
    if (!text.trim()) {
      toast.error('Please enter text to summarize');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/study/summarize', {
        text,
        title,
        useOnline: useOnlineAI
      });
      setSummary(response.data.summary);
      toast.success('Summary generated!');
    } catch (error) {
      toast.error('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white flex items-center gap-2">
        <FileText className="text-indigo-400" />
        Text Summarizer
      </h1>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full mb-4 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text here..."
          rows={10}
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          onClick={handleSummarize}
          disabled={loading}
          className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          <Sparkles className="w-5 h-5" />
          {loading ? 'Generating...' : 'Summarize'}
        </button>
      </div>

      {summary && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">Summary</h2>
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{summary}</p>
        </div>
      )}
    </div>
  );
};

export default Summarizer;