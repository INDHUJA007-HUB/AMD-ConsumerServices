import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Sparkles, Server, Map, Shield, DollarSign, Utensils } from "lucide-react";

interface AILoadingScreenProps {
    onComplete: () => void;
}

const steps = [
    { id: "init", title: "Initializing smart constraints...", icon: <Server className="h-4 w-4" />, duration: 1500 },
    { id: "location", title: "Analyzing location & workplace data...", icon: <Map className="h-4 w-4" />, duration: 2000 },
    { id: "food", title: "Checking real-time Zomato & local food scenes...", icon: <Utensils className="h-4 w-4" />, duration: 2500 },
    { id: "safety", title: "Verifying safety and transit schedules...", icon: <Shield className="h-4 w-4" />, duration: 2200 },
    { id: "budget", title: "Optimizing budget and accommodations...", icon: <DollarSign className="h-4 w-4" />, duration: 2000 },
    { id: "finalize", title: "Finalizing personalized itinerary...", icon: <Sparkles className="h-4 w-4" />, duration: 1500 },
    { id: "finalize", title: "Finalizing personalized itinerary...", icon: <Sparkles className="h-5 w-5" />, duration: 1500 },
];

const AILoadingScreen = ({ onComplete }: AILoadingScreenProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [logs, setLogs] = useState<{ id: string; text: string; status: 'pending' | 'active' | 'done' }[]>([]);
    const [progress, setProgress] = useState(0);
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize logs
        setLogs(steps.map((step, index) => ({
            id: step.id,
            text: step.title,
            status: index === 0 ? 'active' : 'pending'
        })));
    }, []);

    useEffect(() => {
        if (currentStep >= steps.length) {
            setTimeout(() => onComplete(), 800);
            return;
        }

        const step = steps[currentStep];

        // Update progress
        const targetProgress = Math.round(((currentStep + 1) / steps.length) * 100);

        const progressInterval = setInterval(() => {
            setProgress(p => {
                if (p >= targetProgress) {
                    clearInterval(progressInterval);
                    return targetProgress;
                }
                return p + 1;
            });
        }, step.duration / (targetProgress - progress || 1));

        const timeout = setTimeout(() => {
            setLogs(prev => prev.map((l, i) => {
                if (i === currentStep) return { ...l, status: 'done' };
                if (i === currentStep + 1) return { ...l, status: 'active' };
                return l;
            }));
            setCurrentStep(prev => prev + 1);
        }, step.duration);

        return () => {
            clearTimeout(timeout);
            clearInterval(progressInterval);
        };
    }, [currentStep, onComplete, progress]);

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center space-y-8">

                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-2">
                        <Sparkles className="w-8 h-8 animate-pulse" />
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
                        Crafting Your Plan
                    </h2>
                    <p className="text-muted-foreground">Our engine is crunching the numbers and finding local gems...</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-md space-y-2">
                    <div className="flex justify-between text-sm font-medium text-muted-foreground">
                        <span>Overall Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: `${progress}%` }}
                            transition={{ ease: "easeOut", duration: 0.5 }}
                        />
                    </div>
                </div>

                {/* Logs Container (Dark Console Style) */}
                <div
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden font-mono text-sm"
                >
                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">system_log_v2.0</span>
                    </div>

                    <div
                        ref={logContainerRef}
                        className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent flex flex-col"
                    >
                        <AnimatePresence initial={false}>
                            {logs.map((log, index) => {
                                if (log.status === 'pending' && index > currentStep + 1) return null;

                                return (
                                    <motion.div
                                        key={`${log.id}-${index}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`flex items-start gap-4 p-3 rounded-xl transition-colors ${log.status === 'active' ? 'bg-slate-900 border border-slate-800' : 'border border-transparent'}`}
                                    >
                                        <div className="mt-0.5 shrink-0">
                                            {log.status === 'done' ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                            ) : log.status === 'active' ? (
                                                <div className="flex items-center justify-center w-5 h-5">
                                                    <span className="relative flex h-2.5 w-2.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-700" />
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className={`${log.status === 'active' ? 'text-blue-400' : log.status === 'done' ? 'text-slate-500' : 'text-slate-700'}`}>
                                                    {steps[index].icon}
                                                </span>
                                                <p className={`font-medium tracking-tight ${log.status === 'active' ? 'text-slate-200' :
                                                    log.status === 'done' ? 'text-slate-500' : 'text-slate-700'
                                                    }`}>
                                                    {log.text}
                                                </p>
                                            </div>

                                            {log.status === 'active' && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex items-center gap-2 text-emerald-400/80 text-xs ml-[28px]"
                                                >
                                                    <span className="animate-pulse">&gt;</span>
                                                    <span className="typing-effect">Fetching live parameters...</span>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AILoadingScreen;
