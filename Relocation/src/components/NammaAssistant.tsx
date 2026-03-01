import { useState, useEffect } from 'react';
import { Bot, X, ChevronUp, ChevronDown, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { loadPGData } from '@/utils/pgDataLoader';
import { loadHouseRentData } from '@/utils/houseRentDataLoader';
import './NammaAssistant.css';

const NammaAssistant = () => {
    const location = useLocation();

    // Hide assistant completely on the amenities page
    if (location.pathname === '/amenities') {
        return null;
    }

    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [followUp, setFollowUp] = useState('');
    const [answer, setAnswer] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    // Load all datasets
    const { data: pgData = [] } = useQuery({
        queryKey: ['pgData'],
        queryFn: loadPGData,
        staleTime: 1000 * 60 * 60,
    });

    const { data: houseData = [] } = useQuery({
        queryKey: ['houseData'],
        queryFn: loadHouseRentData,
        staleTime: 1000 * 60 * 60,
    });

    // Sync with localStorage to get context if available
    useEffect(() => {
        const checkUserData = () => {
            const workplace = localStorage.getItem("workplace");
            const userName = localStorage.getItem("userName");
            const selectedStay = localStorage.getItem("selectedStayContext");
            setUserData({
                workplace,
                userName,
                selectedStay: selectedStay ? JSON.parse(selectedStay) : null
            });
        };

        checkUserData();
        window.addEventListener('storage', checkUserData);
        window.addEventListener('storage_update', checkUserData);
        return () => {
            window.removeEventListener('storage', checkUserData);
            window.removeEventListener('storage_update', checkUserData);
        };
    }, []);

    const groqKey = import.meta.env.VITE_GROQ_API_KEY;

    const handleSubmit = async () => {
        if (!followUp.trim()) return;
        if (!groqKey) {
            setAnswer('Groq API key is not configured.');
            return;
        }

        setIsLoading(true);
        try {
            // Build comprehensive context
            let context = `You are Namma Assistant for Coimbatore city. `;

            if (userData?.userName) {
                context += `User name: ${userData.userName}. `;
            }
            if (userData?.workplace) {
                context += `User workplace: ${userData.workplace}. `;
            }
            if (userData?.selectedStay) {
                context += `User selected stay: ${userData.selectedStay.name} in ${userData.selectedStay.area}, Price: ${userData.selectedStay.price}. `;
            }

            // Add dataset summaries
            context += `\n\nAvailable Data:\n`;
            context += `- ${pgData.length} PG accommodations in Coimbatore with details like price, area, amenities (WiFi, AC, food).\n`;
            context += `- ${houseData.length} houses for rent in Coimbatore with pricing and location info.\n`;

            // Sample data for context
            if (pgData.length > 0) {
                const samplePG = pgData.slice(0, 3).map(pg =>
                    `${pg.pg_name} in ${pg.area} - ${pg.price_per_month}, Rating: ${pg.rating}`
                ).join('; ');
                context += `Sample PGs: ${samplePG}.\n`;
            }
            if (houseData.length > 0) {
                const sampleHouse = houseData.slice(0, 3).map(h =>
                    `${h.pg_name} in ${h.area} - ${h.price_per_month}`
                ).join('; ');
                context += `Sample Houses: ${sampleHouse}.\n`;
            }

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${groqKey}`,
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    temperature: 0.7,
                    messages: [
                        {
                            role: 'system',
                            content: `You are Namma Assistant, a friendly Coimbatore local guide with a South Indian Tamil accent in your English responses. 

PERSONALITY & ACCENT:
- Use casual South Indian English expressions like "da", "machaan", "aiyo", "super", "semma", "vera level"
- Mix Tamil-English naturally: "romba nice", "nalla place", "full busy"
- Be warm, helpful, and use local references
- Speak like a friendly Coimbatore auto driver or tea shop owner would

RULES:
1. Keep answers SHORT (2-3 sentences max)
2. NO bold symbols ** anywhere
3. Use Coimbatore local knowledge
4. Recommend based on actual data provided
5. Always mention prices in rupees (₹)
6. Use local area names naturally

EXAMPLE STYLE:
"Aiyo, for that budget da, Saravanampatti side romba nalla PGs irukku machaan! Near IT park, full facilities with WiFi and food - around ₹8000-10000. Super convenient for office goers!"`
                        },
                        { role: 'user', content: context },
                        { role: 'user', content: followUp },
                    ],
                }),
            });

            if (!response.ok) {
                setAnswer('Aiyo, network issue da! Try again after some time.');
            } else {
                const payload = await response.json();
                let text = payload?.choices?.[0]?.message?.content;
                if (typeof text === 'string') {
                    text = text.replace(/\*\*/g, '').trim();
                    setAnswer(text);
                } else {
                    setAnswer('Sorry machaan, no response came.');
                }
            }
        } catch (error) {
            setAnswer('Aiyo, some problem da! Check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {!isOpen && (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 assistant-button"
                    title="Namma Assistant"
                >
                    <div className="loader">
                        <span className="bar"></span>
                        <span className="bar"></span>
                        <span className="bar"></span>
                    </div>
                </button>
            )}

            {isOpen && (
                <div className={`rounded-2xl border border-blue-200 bg-white shadow-xl transition-all duration-300 ${isExpanded ? 'w-96 md:w-[430px]' : 'w-80'}`}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-blue-100 bg-blue-50 rounded-t-2xl">
                        <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                            <div className="loader !h-4">
                                <span className="bar !h-2 !bg-blue-600"></span>
                                <span className="bar !h-3 !bg-blue-600 mx-1"></span>
                                <span className="bar !h-2 !bg-blue-600"></span>
                            </div>
                            Namma Assistant
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setIsExpanded((prev) => !prev)}
                                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-blue-100"
                            >
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-blue-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 space-y-3 text-sm text-gray-700">
                        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-xs italic">
                            Vanakkam! How can I help you find the perfect stay in Coimbatore da?
                        </div>

                        {answer && (
                            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-blue-800 animate-in fade-in slide-in-from-bottom-2">
                                {answer}
                            </div>
                        )}

                        <div className="space-y-2 pt-2">
                            <div className="flex gap-2">
                                <Input
                                    value={followUp}
                                    onChange={(e) => setFollowUp(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                    placeholder="Ask me anything..."
                                    className="h-10 text-sm border-blue-200 focus:border-blue-400"
                                />
                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    size="icon"
                                    className="h-10 w-10 bg-blue-600 hover:bg-blue-700 shrink-0"
                                    disabled={isLoading || !followUp.trim()}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                            {isLoading && (
                                <p className="text-[10px] text-blue-500 text-center animate-pulse">Yosikuren da, wait pannu...</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NammaAssistant;
