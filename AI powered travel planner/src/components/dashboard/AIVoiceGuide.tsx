import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Navigation, Info, Utensils, Star, Clock, MapPin, IndianRupee } from 'lucide-react';

const SmartVoiceGuide = () => {
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'result'>('idle');
    const [transcript, setTranscript] = useState("");
    const [history, setHistory] = useState<{ role: string, content: string }[]>([]);
    const [showResult, setShowResult] = useState(false);
    const [resultType, setResultType] = useState<'food' | 'bus' | 'place' | 'plan'>('food');
    // Using default/fallback values since GlobalContext is missing
    const remainingBudget = 500;
    const currentTime = "12:00";
    const currentLocation = "Gandhipuram";
    const [resultData, setResultData] = useState<any>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [recognition, setRecognition] = useState<any>(null);
    const recognitionRef = React.useRef<any>(null); // always points to live instance
    const isListeningRef = React.useRef(false); // tracks if recognition is actively running
    const transcriptRef = React.useRef(transcript);
    const historyRef = React.useRef(history);
    const statusRef = React.useRef(status);

    useEffect(() => {
        transcriptRef.current = transcript;
    }, [transcript]);

    useEffect(() => {
        historyRef.current = history;
    }, [history]);

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        const synth = window.speechSynthesis;
        const loadVoices = () => {
            const availableVoices = synth.getVoices();
            setVoices(availableVoices);
        };
        loadVoices();
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = loadVoices;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = true;
            recognitionInstance.lang = 'en-IN';

            recognitionInstance.onresult = (event: any) => {
                const current = event.resultIndex;
                const resultTranscript = event.results[current][0].transcript;
                setTranscript(resultTranscript);
            };

            recognitionInstance.onstart = () => {
                isListeningRef.current = true;
                setStatus('listening');
            };

            recognitionInstance.onend = () => {
                isListeningRef.current = false;
                // Only process if we have a transcript
                if (transcriptRef.current) {
                    setStatus('processing');
                    handleVoiceCommand(transcriptRef.current);
                } else {
                    setStatus('idle');
                }
            };

            recognitionInstance.onerror = (event: any) => {
                // Gracefully handle errors without crashing
                if (event.error !== 'no-speech') {
                    console.warn('SpeechRecognition error:', event.error);
                }
                isListeningRef.current = false;
                setStatus('idle');
            };

            setRecognition(recognitionInstance);
            recognitionRef.current = recognitionInstance;
        }
    }, []);

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const speakText = (text: string, onEnd?: () => void) => {
        const synth = window.speechSynthesis;
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance; // Keep a reference to prevent GC

        // Prioritize premium female Indian voice (Heera/Siri/Samantha/Google Female)
        const femaleIndianVoice = voices.find(v =>
            (v.name.includes("Heera") || v.name.includes("Neerja") ||
                v.name.includes("Swara") || v.name.includes("Samantha") ||
                v.name.includes("Siri") || v.name.includes("Google Female")) &&
            (v.lang.includes("en-IN") || v.lang.includes("en-US"))
        ) || voices.find(v => v.lang === 'en-IN') || voices.find(v => v.name.includes("Female")) || voices[0];

        if (femaleIndianVoice) {
            utterance.voice = femaleIndianVoice;
            console.log("Using Female Voice:", femaleIndianVoice.name);
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.3; // Higher pitch for a distinct female persona

        utterance.onend = () => {
            utteranceRef.current = null;
            if (onEnd) onEnd();
        };

        synth.speak(utterance);
    };

    const handleVoiceCommand = async (textToProcess?: string) => {
        const currentTranscript = textToProcess || transcriptRef.current;
        if (!currentTranscript) {
            setStatus('idle');
            return;
        }

        const userMsg = { role: "user", content: currentTranscript };
        const updatedHistory = [...historyRef.current, userMsg];
        setHistory(updatedHistory);
        setTranscript(""); // Clear user transcript for display

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";
            const response = await fetch(`${backendUrl}/api/voice-query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: currentTranscript,
                    history: updatedHistory,
                    budget: remainingBudget,
                    time: currentTime,
                    location: currentLocation
                })
            });
            const data = await response.json();
            const aiResponse = data.response;
            const card = data.card;

            setHistory(prev => [...prev, { role: "assistant", content: aiResponse }]);
            setTranscript(aiResponse); // Show AI response

            if (card) {
                setResultType(card.type || 'place');
                setResultData(card);
                setShowResult(true);
            }

            setStatus('result');
            speakText(aiResponse, () => {
                // Auto-listen for follow-up immediately after speaking
                setTimeout(() => {
                    if (statusRef.current === 'result' && !isListeningRef.current) {
                        setTranscript(""); // clear AI text, show listening state
                        try {
                            recognitionRef.current?.start(); // use ref, never stale
                        } catch (e) {
                            console.warn("Auto-listen restart failed:", e);
                            reset(); // auto-close if voice mic restart fails
                        }
                    }
                }, 600);
            });

        } catch (error) {
            console.error(error);
            setTranscript("Machan, server issue-nu nenaiken. Try again later.");
            setStatus('result');
            speakText("Machan, server issue-nu nenaiken. Try again later.", () => {
                setTimeout(() => reset(), 1500);
            });
        }
    };

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (status === 'idle' || status === 'result') {
            if (isListeningRef.current) return; // already running, don't double-start
            try {
                window.speechSynthesis.cancel();
                recognitionRef.current.start();
            } catch (e) {
                console.error(e);
                isListeningRef.current = false;
            }
        } else {
            reset();
        }
    };

    const reset = () => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { }
        }
        isListeningRef.current = false;
        window.speechSynthesis.cancel();
        setStatus('idle');
        setTranscript("");
        setHistory([]);
        setShowResult(false);
        setResultData(null);
    };


    const getResultContent = () => {
        if (resultData) return {
            ...resultData,
            title: resultData.title || "Recommendation",
            desc: resultData.desc || "",
            image: resultData.image || (resultType === 'place'
                ? "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80&w=800"
                : "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800"),
            icon: resultType === 'place' ? <MapPin className="w-4 h-4 text-yellow-500" /> : <Navigation className="w-4 h-4" />,
            badge: resultType === 'food' ? "Food Match" : "Tourist Spot"
        };

        switch (resultType) {
            case 'bus':
                return {
                    title: "Route 12C - To Gandhipuram",
                    desc: "Next bus in 4 mins. Frequency: every 15 mins.",
                    price: "₹15",
                    oldPrice: "₹20",
                    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800",
                    badge: "Regular",
                    icon: <Navigation className="w-4 h-4" />,
                    statLabel: "ETA",
                    statValue: "4 mins"
                };
            case 'place':
                return {
                    title: "Marudhamalai Temple",
                    desc: "Hilltop temple with breathtaking city views.",
                    price: "Free",
                    oldPrice: "Entry",
                    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80&w=800",
                    badge: "Highly Rated",
                    icon: <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />,
                    statLabel: "Crowd",
                    statValue: "Medium"
                };
            case 'plan':
                return {
                    title: "Your Daily Itinerary",
                    desc: "3 more stops remaining today. You are 12% under budget.",
                    price: "₹850",
                    oldPrice: "Budgeted",
                    image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=800",
                    badge: "Optimized",
                    icon: <Clock className="w-4 h-4" />,
                    statLabel: "Next Stop",
                    statValue: "1 PM Lunch"
                };
            default:
                return {
                    title: "Annapoorna Local Mess",
                    desc: "Authentic South Indian Meals. Famous for limited thali.",
                    price: "₹55",
                    oldPrice: "₹80",
                    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=800",
                    badge: "Bestseller",
                    icon: <Utensils className="w-4 h-4" />,
                    statLabel: "Distance",
                    statValue: "8 mins walk"
                };
        }
    };

    const content = getResultContent();

    return (
        <div className="fixed bottom-8 left-8 z-[9999] flex flex-col items-start gap-4 pointer-events-none w-auto max-w-[calc(100vw-4rem)] h-auto overflow-visible">

            {/* Rich Result Card */}
            <AnimatePresence>
                {showResult && (
                    <motion.div
                        initial={{ opacity: 0, x: -50, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                        className="w-full max-w-[320px] md:max-w-[380px] bg-white rounded-[2rem] border border-blue-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden pointer-events-auto"
                    >
                        <div className="relative h-40 overflow-hidden bg-slate-100">
                            <img
                                src={content.image}
                                alt={content.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 right-4 bg-white px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border border-blue-50">
                                <span className="text-[10px] font-bold text-gray-800 tracking-wide uppercase">{content.badge}</span>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6">
                                <div>
                                    <h3 className="text-xl font-bold text-white leading-tight">{content.title}</h3>
                                    <p className="text-white/90 text-xs flex items-center gap-1.5 mt-1">
                                        {content.icon}
                                        {content.desc.length > 40 ? content.desc.substring(0, 40) + "..." : content.desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-white overflow-y-auto max-h-[50vh]">
                            <div className="space-y-4 mb-4">
                                {content.Location && content.Location !== "NA" && (
                                    <div className="flex items-start gap-3 text-sm text-gray-700">
                                        <MapPin className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                                        <span><strong className="text-gray-900 block text-[10px] uppercase font-bold tracking-wider">Location</strong>{content.Location}</span>
                                    </div>
                                )}
                                {content.Timings && content.Timings !== "NA" && (
                                    <div className="flex items-start gap-3 text-sm text-gray-700">
                                        <Clock className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                                        <span><strong className="text-gray-900 block text-[10px] uppercase font-bold tracking-wider">Timings</strong>{content.Timings}</span>
                                    </div>
                                )}
                                {content.Cost && content.Cost !== "NA" && (
                                    <div className="flex items-start gap-3 text-sm text-gray-700">
                                        <IndianRupee className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                                        <span><strong className="text-gray-900 block text-[10px] uppercase font-bold tracking-wider">Cost / Budget</strong>{content.Cost}</span>
                                    </div>
                                )}
                                {content.Bus_Route && content.Bus_Route !== "NA" && (
                                    <div className="flex items-start gap-3 text-sm text-gray-700">
                                        <Navigation className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                                        <span><strong className="text-gray-900 block text-[10px] uppercase font-bold tracking-wider">Bus Route</strong>{content.Bus_Route}</span>
                                    </div>
                                )}
                                {content.Rating_Cuisine && content.Rating_Cuisine !== "NA" && (
                                    <div className="flex items-start gap-3 text-sm text-gray-700">
                                        <Star className="w-4 h-4 mt-0.5 text-blue-500 shrink-0 select-none" />
                                        <span><strong className="text-gray-900 block text-[10px] uppercase font-bold tracking-wider">Rating & Cuisine</strong>{content.Rating_Cuisine}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                                <button
                                    onClick={reset}
                                    className="p-3 rounded-2xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <button className="flex-1 bg-blue-600 text-white rounded-2xl py-3 font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-[0.98]">
                                    <Navigation className="w-5 h-5" />
                                    Show Details
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Smart Waveform UI */}
            <div className="relative flex flex-col items-start gap-3">
                <AnimatePresence>
                    {(status === 'listening' || status === 'processing' || status === 'result') && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, x: -10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, x: -10 }}
                            className="bg-slate-900 px-6 py-3 rounded-2xl shadow-2xl flex flex-col items-start gap-2 border border-slate-700 max-w-[320px] pointer-events-auto"
                        >
                            <div className="flex items-center gap-1.5 h-6">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            height: status === 'listening' ? [8, 20, 8] : (status === 'processing' ? [12, 14, 12] : [8, 8, 8])
                                        }}
                                        transition={{
                                            repeat: status === 'result' ? 0 : Infinity,
                                            duration: 0.6,
                                            delay: i * 0.1,
                                            ease: "easeInOut"
                                        }}
                                        className={`w-1 rounded-full ${status === 'result' ? 'bg-green-400' : 'bg-blue-500'}`}
                                    />
                                ))}
                            </div>
                            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1 w-full">
                                {history.map((msg, i) => (
                                    <div key={i} className={`text-[10px] leading-relaxed ${msg.role === 'user' ? 'text-blue-300' : 'text-white/90'}`}>
                                        <span className="font-bold">{msg.role === 'user' ? 'You: ' : 'Buddy: '}</span>
                                        {msg.content}
                                    </div>
                                ))}
                                {status === 'processing' && (
                                    <div className="loader-container scale-50 -my-4 !w-auto">
                                        <div className="advanced-loader !text-white [--text-color:white] [--shadow-color:#ffffff40]">
                                            <div className="text"><span>Loading</span></div>
                                            <div className="text"><span>Loading</span></div>
                                            <div className="text"><span>Loading</span></div>
                                            <div className="text"><span>Loading</span></div>
                                            <div className="text"><span>Loading</span></div>
                                            <div className="text"><span>Loading</span></div>
                                            <div className="text"><span>Loading</span></div>
                                            <div className="text"><span>Loading</span></div>
                                            <div className="text"><span>Loading</span></div>
                                            <div className="line"></div>
                                        </div>
                                    </div>
                                )}
                                {status === 'listening' && history.length > 0 && (
                                    <p className="text-[10px] text-green-400 animate-pulse">🎙️ Listening for you, Nanba...</p>
                                )}
                                {status === 'listening' && history.length === 0 && (
                                    <p className="text-[10px] text-blue-400 animate-pulse">🎙️ Ready to help, Sir!</p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Mic Button */}
                <button
                    onClick={toggleListening}
                    className={`group relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.2)] pointer-events-auto border-2 ${status === 'idle'
                        ? 'bg-white border-blue-50 text-blue-600 hover:shadow-blue-200 hover:scale-105'
                        : status === 'listening'
                            ? 'bg-green-500 border-green-400 text-white shadow-green-200'
                            : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                >
                    {status === 'listening' && (
                        <>
                            <motion.div
                                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 bg-green-400 rounded-full"
                            />
                            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                        </>
                    )}

                    <div className="relative z-10 transition-all duration-300 group-active:scale-95 group-hover:rotate-12">
                        {status === 'idle' ? <Mic className="w-6 h-6 md:w-8 md:h-8" /> : (status === 'processing' ? <Clock className="w-6 h-6 animate-spin" /> : <X className="w-6 h-6 md:w-8 md:h-8" />)}
                    </div>

                    {status === 'idle' && (
                        <span className="absolute left-full ml-4 bg-slate-900 text-white text-[11px] font-bold px-4 py-2 rounded-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0 -translate-x-2 pointer-events-none shadow-2xl border border-slate-700">
                            Ask me anything about Kovai!
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SmartVoiceGuide;
