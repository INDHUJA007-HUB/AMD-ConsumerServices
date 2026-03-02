import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CityPlan } from '@/types/cityPlan';
import {
    X, Send, Bot, User, Sparkles, Loader2, Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
    id: string;
    type: 'user' | 'system';
    text: string;
    isUpdatingPlan?: boolean;
}

interface AIPlanModifierProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlan: CityPlan;
    onUpdatePlan: (newPlan: CityPlan) => void;
}

const AIPlanModifier: React.FC<AIPlanModifierProps> = ({
    isOpen,
    onClose,
    currentPlan,
    onUpdatePlan
}) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            type: 'system',
            text: `Hi! I can help you modify your ${currentPlan.days}-day plan for ${currentPlan.city}. What should we change?`
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const suggestions = [
        "Add a luxury dinner on Day 1",
        "Make the whole trip budget-friendly",
        "Switch travel to Private Cab",
        "Add more outdoor activities",
        "Increase stay comfort level"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = (textOverride?: string) => {
        const textToSend = textOverride || inputValue;
        if (!textToSend.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            type: 'user',
            text: textToSend.trim(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        const groqKey = import.meta.env.VITE_GROQ_API_KEY;

        if (!groqKey) {
            // Fallback to mock logic if no API key
            setTimeout(() => {
                const lowerInput = textToSend.toLowerCase();
                let newPlan = JSON.parse(JSON.stringify(currentPlan)) as CityPlan;
                let aiResponse = "I've updated your plan based on your request!";

                // Process modifications
                if (lowerInput.includes('cab') || lowerInput.includes('taxi')) {
                    newPlan.travel.mode = 'Private Cab';
                    newPlan.travel.suggestion = 'Switched to private cab for better comfort and time efficiency.';
                    aiResponse = "Switched your travel mode to Private Cab. I've updated the costs accordingly.";
                } else if (lowerInput.includes('dinner') || lowerInput.includes('meal')) {
                    if (newPlan.dailyPlans[0]) {
                        newPlan.dailyPlans[0].activities.push({
                            time: '8:30 PM',
                            activity: 'Luxury Dining Experience',
                            location: 'Premium Restaurant, ' + currentPlan.city,
                            cost: 2000,
                            emoji: '🍽️'
                        });
                        newPlan.dailyPlans[0].totalCost += 2000;
                        aiResponse = "Added a luxury dining experience to your first day!";
                    }
                } else if (lowerInput.includes('cheap') || lowerInput.includes('budget')) {
                    newPlan.budget.food = Math.floor(newPlan.budget.food * 0.6);
                    newPlan.dailyPlans.forEach(day => {
                        day.activities.forEach(act => act.cost = Math.floor(act.cost * 0.6));
                        day.totalCost = day.activities.reduce((sum, act) => sum + act.cost, 0);
                    });
                    aiResponse = "Recalibrated your plan for a tighter budget. Switched to affordable alternatives.";
                } else if (lowerInput.includes('add') || lowerInput.includes('visit')) {
                    // Try to extract location name
                    const match = lowerInput.match(/(?:add|visit) (.*?)(?: on day (\d+))?$/);
                    const locationName = match?.[1] || "New Location";
                    const dayNum = match?.[2] ? parseInt(match[2]) : 1;

                    const dayToUpdate = newPlan.dailyPlans.find(d => d.day === dayNum);
                    if (dayToUpdate) {
                        dayToUpdate.activities.push({
                            time: '4:00 PM',
                            activity: `Visit ${locationName}`,
                            location: `${locationName}, ${currentPlan.city}`,
                            cost: 200,
                            emoji: '📍'
                        });
                        dayToUpdate.totalCost += 200;
                        aiResponse = `I've added a visit to ${locationName} on Day ${dayNum}.`;
                    }
                } else {
                    // Default fallback modification
                    newPlan.budget.total += 500;
                    aiResponse = "I've made those adjustments to your itinerary and updated the budget breakdown.";
                }

                const sysMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    type: 'system',
                    text: aiResponse,
                    isUpdatingPlan: true
                };

                setMessages(prev => [...prev, sysMsg]);

                setTimeout(() => {
                    // Ensure costs are recalculated correctly after any modification
                    newPlan.dailyPlans.forEach((day, index) => {
                        day.totalCost = day.activities.reduce((sum, act) => sum + act.cost, 0);
                        const prevCumulative = index > 0 ? newPlan.dailyPlans[index - 1].cumulativeCost : 0;
                        day.cumulativeCost = prevCumulative + day.totalCost;
                    });

                    newPlan.budget.activities = newPlan.dailyPlans.reduce((sum, d) => sum + d.totalCost, 0);
                    newPlan.budget.total = newPlan.budget.stay + newPlan.budget.food + newPlan.budget.travel + newPlan.budget.activities;
                    newPlan.totalCost = newPlan.budget.total;

                    onUpdatePlan(newPlan);
                    setIsTyping(false);
                    setMessages(prev => [
                        ...prev.map(m => m.id === sysMsg.id ? { ...m, isUpdatingPlan: false } : m)
                    ]);
                }, 600);
            }, 800);
            return;
        }

        // Use real Groq API to parse modifications
        (async () => {
            try {
                // Remove some excessively nested details if context is too large, but CityPlan is usually small
                const planString = JSON.stringify(currentPlan);

                const prompt = `You are an AI travel itinerary modifier. 
The user wants to modify their current travel plan based on this request: "${textToSend}"

Here is their current plan in JSON format:
${planString}

Modify the JSON directly to reflect their exact personalized request. Ensure all budgets, activity lists, and totals accurately reflect the change.
CRITICAL INSTRUCTION: You MUST preserve ALL days in the \`dailyPlans\` array. If the user asks to change day 5, you MUST STILL INCLUDE days 1, 2, 3, and 4 exactly as they were. DO NOT truncate, delete, or omit ANY days unless the user explicitly asks to shorten the trip. 
You MUST respond ONLY with the newly updated plan in valid JSON format, without any surrounding markdown formatting like \`\`\`json. Only output the raw JSON object. Never include explanations. Ensure the schema perfectly matches the input JSON.`;

                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${groqKey}`,
                    },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.1,
                        max_tokens: 8000,
                        response_format: { type: "json_object" }
                    }),
                });

                if (!response.ok) {
                    const errBody = await response.text();
                    throw new Error(`API Error: ${response.status} - ${errBody}`);
                }

                const data = await response.json();
                let updatedPlanText = data.choices[0]?.message?.content || "";

                // Safety cleanup: occasionally LLMs still output markdown blocks even with json_object
                updatedPlanText = updatedPlanText.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '');

                let newPlan: CityPlan;
                try {
                    newPlan = JSON.parse(updatedPlanText);
                } catch (err: any) {
                    console.error("Failed to parse AI response as JSON:", err, updatedPlanText);
                    throw new Error(`Invalid format returned by AI. Please try again. Raw output: ${updatedPlanText.substring(0, 50)}...`);
                }

                const aiResponse = `I've personalized your plan based on your request: "${textToSend}"`;

                const sysMsg: Message = {
                    id: Date.now().toString(),
                    type: 'system',
                    text: aiResponse,
                    isUpdatingPlan: true
                };

                setMessages(prev => [...prev, sysMsg]);

                setTimeout(() => {
                    // Recalculate costs to ensure consistency
                    newPlan.dailyPlans.forEach((day, index) => {
                        day.totalCost = day.activities.reduce((sum, act) => sum + act.cost, 0);
                        const prevCumulative = index > 0 ? newPlan.dailyPlans[index - 1].cumulativeCost : 0;
                        day.cumulativeCost = prevCumulative + day.totalCost;
                    });
                    newPlan.budget.activities = newPlan.dailyPlans.reduce((sum, d) => sum + d.totalCost, 0);
                    newPlan.budget.total = newPlan.budget.stay + newPlan.budget.food + newPlan.budget.travel + newPlan.budget.activities;
                    newPlan.totalCost = newPlan.budget.total;

                    onUpdatePlan(newPlan);
                    setIsTyping(false);
                    setMessages(prev => [
                        ...prev.map(m => m.id === sysMsg.id ? { ...m, isUpdatingPlan: false } : m)
                    ]);
                }, 600);
            } catch (error: any) {
                console.error("Error updating plan with AI:", error);
                const errorMsg: Message = {
                    id: Date.now().toString(),
                    type: 'system',
                    text: `Sorry, I had trouble processing your request. Error: ${error.message || 'Unknown error'}`,
                };
                setMessages(prev => [...prev, errorMsg]);
                setIsTyping(false);
            }
        })();


    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -20, transformOrigin: 'top right' }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="w-[320px] sm:w-[380px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-blue-100 ring-1 ring-black/5"
                    >
                        {/* Triangle Arrow */}
                        <div className="absolute -top-2 right-6 w-4 h-4 bg-blue-600 rotate-45" />

                        <div className="relative flex flex-col h-[500px] bg-white rounded-2xl overflow-hidden">
                            {/* Compact Header */}
                            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold">AI Plan Modifier</h2>
                                        <p className="text-[10px] text-white/70">Online and ready to help</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Chat View */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm ${msg.type === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                            }`}>
                                            {msg.text}
                                            {msg.isUpdatingPlan && (
                                                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    Updating Plan...
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-gray-100 p-3 rounded-2xl shadow-sm flex items-center gap-1">
                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Suggestions Section */}
                            <div className="px-4 py-3 bg-white border-t border-gray-100 overflow-x-auto whitespace-nowrap no-scrollbar">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Recommendations</p>
                                <div className="flex gap-2 pb-1">
                                    {suggestions.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => handleSendMessage(s)}
                                            className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-full border border-blue-100 hover:bg-blue-100 transition-colors shrink-0"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Input Footer */}
                            <div className="p-4 bg-white border-t border-gray-100">
                                <div className="relative flex items-center">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Ask to change anything..."
                                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all shadow-inner"
                                        disabled={isTyping}
                                    />
                                    <button
                                        onClick={() => handleSendMessage()}
                                        disabled={!inputValue.trim() || isTyping}
                                        className="absolute right-2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all shadow-md active:scale-95"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AIPlanModifier;
