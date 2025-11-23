import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Volume2, Loader, MessageSquare, Radio } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const VoiceInput = () => {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [processing, setProcessing] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [interimTranscript, setInterimTranscript] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    
    // AI Response State
    const [aiResponse, setAiResponse] = useState('');
    const [gettingAiResponse, setGettingAiResponse] = useState(false);

    // Wake Word State
    const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
    const [wakeWordListening, setWakeWordListening] = useState(false);
    const [wakeWord, setWakeWord] = useState('hey electron');
    const [sensitivity, setSensitivity] = useState(0.85);

    const recognitionRef = useRef(null);
    const wakeWordRecognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);

    // Initialize Web Speech API for main voice input
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                let interim = '';
                let final = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        final += transcript + ' ';
                    } else {
                        interim += transcript;
                    }
                }

                if (final) {
                    setTranscript(prev => prev + final);
                }
                setInterimTranscript(interim);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error !== 'no-speech') {
                    toast.error('Speech recognition error: ' + event.error);
                }
                setListening(false);
            };

            recognitionRef.current.onend = () => {
                if (listening) {
                    recognitionRef.current.start();
                }
            };
        } else {
            toast.error('Speech recognition not supported in this browser');
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [listening]);

    // Initialize Wake Word Detection
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        wakeWordRecognitionRef.current = new SpeechRecognition();
        wakeWordRecognitionRef.current.continuous = true;
        wakeWordRecognitionRef.current.interimResults = false;
        wakeWordRecognitionRef.current.lang = 'en-US';

        wakeWordRecognitionRef.current.onresult = (event) => {
            const lastResult = event.results[event.results.length - 1];
            const spokenText = lastResult[0].transcript.toLowerCase().trim();
            const confidence = lastResult[0].confidence;

            console.log('Wake word detection:', spokenText, 'Confidence:', confidence);

            // Improved wake word matching
            const wakeWordLower = wakeWord.toLowerCase();
            
            // Check for exact match or close variations
            const exactMatch = spokenText === wakeWordLower;
            const containsMatch = spokenText.includes(wakeWordLower);
            
            // Also check word-by-word similarity
            const wakeWordParts = wakeWordLower.split(' ');
            const spokenParts = spokenText.split(' ');
            const wordMatch = wakeWordParts.every(word => 
                spokenParts.some(spoken => spoken.includes(word) || word.includes(spoken))
            );

            const isWakeWordDetected = exactMatch || (containsMatch && confidence >= sensitivity) || 
                                      (wordMatch && confidence >= sensitivity - 0.1);

            if (isWakeWordDetected) {
                console.log('✅ Wake word "' + wakeWord + '" detected!');
                toast.success(`🎤 Wake word "${wakeWord}" detected!`);
                startListening();
            }
        };

        wakeWordRecognitionRef.current.onerror = (event) => {
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                console.error('Wake word detection error:', event.error);
            }
        };

        wakeWordRecognitionRef.current.onend = () => {
            // Restart wake word listening if still enabled
            if (wakeWordEnabled && wakeWordListening) {
                try {
                    wakeWordRecognitionRef.current.start();
                } catch (e) {
                    console.log('Wake word restart delayed');
                    setTimeout(() => {
                        if (wakeWordEnabled && wakeWordListening) {
                            wakeWordRecognitionRef.current.start();
                        }
                    }, 100);
                }
            }
        };

        return () => {
            if (wakeWordRecognitionRef.current) {
                wakeWordRecognitionRef.current.stop();
            }
        };
    }, [wakeWord, sensitivity, wakeWordEnabled, wakeWordListening]);

    // Start/Stop Wake Word Listening
    const toggleWakeWord = () => {
        if (!wakeWordEnabled) {
            // Enable wake word
            setWakeWordEnabled(true);
            setWakeWordListening(true);
            try {
                wakeWordRecognitionRef.current.start();
                toast.success(`👂 Listening for "${wakeWord}"...`);
            } catch (error) {
                console.error('Failed to start wake word:', error);
                toast.error('Failed to start wake word detection');
                setWakeWordEnabled(false);
                setWakeWordListening(false);
            }
        } else {
            // Disable wake word
            setWakeWordEnabled(false);
            setWakeWordListening(false);
            if (wakeWordRecognitionRef.current) {
                wakeWordRecognitionRef.current.stop();
            }
            toast.success('Wake word detection stopped');
        }
    };

    // Get AI Response from Backend
    const getAiResponse = async (text) => {
        setGettingAiResponse(true);
        try {
            console.log('Sending to AI:', text);
            
            const response = await api.post('/voice/query', {
                text: text,
                useOnline: false
            });

            console.log('AI Response:', response.data);

            const aiReply = response.data.response;
            setAiResponse(aiReply);
            toast.success('🤖 AI responded!');
            
            // Auto-play AI response
            speakText(aiReply);
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            toast.error(error.response?.data?.error || 'Failed to get AI response');
        } finally {
            setGettingAiResponse(false);
        }
    };

    const startListening = async () => {
        try {
            // Stop wake word detection temporarily
            if (wakeWordEnabled && wakeWordRecognitionRef.current) {
                wakeWordRecognitionRef.current.stop();
                setWakeWordListening(false);
            }

            setListening(true);
            setTranscript('');
            setInterimTranscript('');
            setAiResponse('');

            // Start backend session
            const response = await api.post('/voice/start');
            setSessionId(response.data.sessionId);

            // Start browser speech recognition
            if (recognitionRef.current) {
                recognitionRef.current.start();
                toast.success('🎤 Listening... Speak now!');
            }
        } catch (error) {
            console.error('Error starting voice:', error);
            toast.error('Failed to start listening');
            setListening(false);
            
            // Resume wake word if it was enabled
            if (wakeWordEnabled) {
                setWakeWordListening(true);
                wakeWordRecognitionRef.current.start();
            }
        }
    };

    const stopListening = async () => {
        try {
            console.log('=== STOP LISTENING ===');
            console.log('Transcript:', transcript);
            console.log('Interim:', interimTranscript);
            
            const finalTranscript = (transcript + ' ' + interimTranscript).trim();
            console.log('Final:', finalTranscript);

            // Stop browser speech recognition
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }

            setListening(false);
            setInterimTranscript('');

            if (!finalTranscript) {
                toast.error('No speech detected. Try speaking longer.');
                
                // Resume wake word listening if enabled
                if (wakeWordEnabled) {
                    setWakeWordListening(true);
                    setTimeout(() => {
                        wakeWordRecognitionRef.current.start();
                    }, 500);
                }
                return;
            }

            setProcessing(true);

            // Send to backend
            await api.post('/voice/stop', {
                sessionId,
                text: finalTranscript
            });

            toast.success('✅ Speech processed!');
            setProcessing(false);
            setSessionId(null);

            // Get AI response
            await getAiResponse(finalTranscript);

            // Resume wake word listening after processing
            if (wakeWordEnabled) {
                setTimeout(() => {
                    setWakeWordListening(true);
                    wakeWordRecognitionRef.current.start();
                }, 1000);
            }

        } catch (error) {
            console.error('Error stopping voice:', error);
            toast.error('Failed to process speech');
            setProcessing(false);
            
            // Resume wake word on error
            if (wakeWordEnabled) {
                setWakeWordListening(true);
                setTimeout(() => {
                    wakeWordRecognitionRef.current.start();
                }, 500);
            }
        }
    };

    const speakText = (text) => {
        if (!text) {
            toast.error('No text to speak');
            return;
        }

        try {
            synthRef.current.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            const voices = synthRef.current.getVoices();
            const englishVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
            if (englishVoice) {
                utterance.voice = englishVoice;
            }

            utterance.onstart = () => {
                toast.success('🔊 Playing audio...');
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                toast.error('Failed to play audio');
            };

            synthRef.current.speak(utterance);
        } catch (error) {
            console.error('Speak error:', error);
            toast.error('Failed to play audio');
        }
    };

    const playAudio = () => {
        speakText(transcript);
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('audio/')) {
            toast.error('Please upload an audio file');
            return;
        }

        setUploading(true);
        
        try {
            const formData = new FormData();
            formData.append('audio', file);
            formData.append('useOffline', 'true');
            formData.append('language', 'en');

            const response = await api.post('/voice/transcribe', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const transcribedText = response.data.text;
            setTranscript(transcribedText);
            toast.success(`✅ Transcribed with ${response.data.service}`);
            
            await getAiResponse(transcribedText);
            
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to transcribe audio file');
        } finally {
            setUploading(false);
        }
    };

    const clearTranscript = () => {
        setTranscript('');
        setInterimTranscript('');
        setAiResponse('');
        toast.success('Transcript cleared');
    };

    const displayText = transcript + (interimTranscript ? ` ${interimTranscript}` : '');

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                    <Mic className="text-indigo-400" />
                    Voice AI Assistant
                </h1>

                {transcript && (
                    <button
                        onClick={clearTranscript}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Wake Word Settings */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Radio className="text-purple-400" />
                        Wake Word Detection
                    </h2>
                    <button
                        onClick={toggleWakeWord}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            wakeWordEnabled
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-slate-700 hover:bg-slate-600 text-white'
                        }`}
                    >
                        {wakeWordEnabled ? '✓ Enabled' : 'Enable Wake Word'}
                    </button>
                </div>

                {wakeWordListening && (
                    <div className="mb-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg">
                        <p className="text-green-400 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            Listening for wake word: "{wakeWord}"
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Wake Word
                        </label>
                        <input
                            type="text"
                            value={wakeWord}
                            onChange={(e) => setWakeWord(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                            placeholder="hey assistant"
                            disabled={wakeWordEnabled}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Sensitivity: {sensitivity.toFixed(2)}
                        </label>
                        <input
                            type="range"
                            min="0.5"
                            max="0.95"
                            step="0.05"
                            value={sensitivity}
                            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                            className="w-full"
                            disabled={wakeWordEnabled}
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            Higher = more accurate (0.85 recommended for "Hey Electron")
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
                {/* Microphone Controls */}
                <div className="flex items-center justify-center gap-6 mb-6">
                    {!listening && !processing ? (
                        <button
                            onClick={startListening}
                            className="p-8 bg-red-600 hover:bg-red-700 rounded-full shadow-lg transition-all hover:scale-105"
                            title="Start Recording"
                        >
                            <Mic size={40} />
                        </button>
                    ) : listening ? (
                        <button
                            onClick={stopListening}
                            className="p-8 bg-gray-700 hover:bg-gray-600 rounded-full shadow-lg transition-all animate-pulse"
                            title="Stop Recording"
                        >
                            <Square size={40} />
                        </button>
                    ) : (
                        <div className="p-8">
                            <Loader size={40} className="animate-spin text-indigo-400" />
                        </div>
                    )}

                    <button
                        onClick={playAudio}
                        disabled={!transcript || processing || listening}
                        className="p-6 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Play Your Speech"
                    >
                        <Volume2 size={32} />
                    </button>

                    <button
                        onClick={() => fileInputRef.current.click()}
                        disabled={uploading || listening}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
                    >
                        {uploading ? 'Uploading...' : 'Upload Audio'}
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </div>

                {/* Status */}
                <div className="text-center mb-4">
                    {listening && (
                        <p className="text-green-400 font-medium animate-pulse flex items-center justify-center gap-2">
                            <span className="w-3 h-3 bg-green-400 rounded-full animate-ping"></span>
                            Recording... Speak now
                        </p>
                    )}
                    {processing && (
                        <p className="text-yellow-400 font-medium">
                            Processing speech...
                        </p>
                    )}
                    {gettingAiResponse && (
                        <p className="text-purple-400 font-medium flex items-center justify-center gap-2">
                            <Loader className="w-4 h-4 animate-spin" />
                            AI is thinking...
                        </p>
                    )}
                    {!listening && !processing && !gettingAiResponse && transcript && (
                        <p className="text-indigo-400 font-medium">
                            ✅ {transcript.split(' ').length} words transcribed
                        </p>
                    )}
                </div>

                {/* Your Speech Transcript */}
                <div className="mb-4">
                    <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                        <Mic className="w-5 h-5" />
                        Your Speech:
                    </h3>
                    <div className="bg-slate-700 p-6 rounded-xl min-h-[150px] border border-slate-600">
                        {processing ? (
                            <p className="text-slate-400 italic">Processing speech…</p>
                        ) : displayText ? (
                            <p className="text-white text-lg leading-relaxed">
                                {transcript}
                                {interimTranscript && (
                                    <span className="text-slate-400 italic"> {interimTranscript}</span>
                                )}
                            </p>
                        ) : listening ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-slate-400 italic text-center">
                                    🎤 Listening…<br />
                                    <span className="text-sm">Start speaking</span>
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-slate-400 italic text-center">
                                    {wakeWordEnabled 
                                        ? `Say "${wakeWord}" or click the microphone`
                                        : 'Click the microphone button to start'
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Response Section */}
                {(aiResponse || gettingAiResponse) && (
                    <div className="mb-4">
                        <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-green-400" />
                            AI Response:
                        </h3>
                        <div className="bg-slate-900 p-6 rounded-xl min-h-[150px] border border-green-500/30">
                            {gettingAiResponse ? (
                                <div className="flex items-center gap-3 text-slate-400">
                                    <Loader className="w-5 h-5 animate-spin" />
                                    <p className="italic">AI is generating response...</p>
                                </div>
                            ) : (
                                <p className="text-green-300 text-lg leading-relaxed">
                                    {aiResponse}
                                </p>
                            )}
                        </div>
                        {aiResponse && (
                            <button
                                onClick={() => speakText(aiResponse)}
                                className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-2"
                            >
                                <Volume2 size={16} />
                                Replay AI Response
                            </button>
                        )}
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <h3 className="text-white font-medium mb-2">How to use:</h3>
                    <ul className="text-slate-400 text-sm space-y-1">
                        <li>✓ Enable wake word and say "{wakeWord}" anytime to activate</li>
                        <li>✓ Or click the <span className="text-red-400">red microphone</span> manually</li>
                        <li>✓ Speak your question clearly</li>
                        <li>✓ Click <span className="text-slate-300">square button</span> to stop or wait for auto-stop</li>
                        <li>✓ AI will automatically respond</li>
                        <li>✓ Wake word detection resumes after each interaction</li>
                    </ul>
                </div>

                {/* Browser Support Notice */}
                {!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && (
                    <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded-lg">
                        <p className="text-red-400 text-sm">
                            ⚠️ Speech recognition is not supported in this browser.
                            Please use Chrome, Edge, or Safari.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoiceInput;