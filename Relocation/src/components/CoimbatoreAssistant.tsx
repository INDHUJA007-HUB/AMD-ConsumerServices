import { useState } from 'react';
import { X, Send } from 'lucide-react';

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

// Detect if the query is about finding a place on the map
const isMapSearchQuery = (q: string): boolean => {
  const keywords = [
    'find', 'show', 'where', 'near', 'closest', 'best', 'recommend',
    'coworking', 'restaurant', 'hospital', 'school', 'fuel', 'park', 'temple',
    'cafe', 'shop', 'mall', 'bakery', 'pharmacy', 'clinic', 'parking',
    'walking', 'spots', 'places', 'location'
  ];
  const lower = q.toLowerCase();
  return keywords.some(k => lower.includes(k));
};

interface CoimbatoreAssistantProps {
  onSearch?: (query: string) => Promise<string | null>;
}

const CoimbatoreAssistant = ({ onSearch }: CoimbatoreAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([
    { text: "Hello! I'm your Coimbatore Assistant 🌟 Ask me anything — food spots, coworking spaces, hospitals, or just chat about Coimbatore! I'll also highlight results on the map.", isUser: false }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const callGroq = async (userMsg: string): Promise<string> => {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          temperature: 0.7,
          messages: [
            {
              role: 'system',
              content: `You are the Coimbatore Assistant — a warm, helpful local guide for Coimbatore city, Tamil Nadu. You know about local areas like RS Puram, Ganapathy, Saravanampatti, Gandhipuram, and Race Course, as well as local culture, food, transport and lifestyle. Keep responses SHORT (2-4 sentences), be warm and conversational, use local knowledge. NO markdown formatting like ** in responses.`
            },
            { role: 'user', content: userMsg }
          ],
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data?.choices?.[0]?.message?.content?.replace(/\*\*/g, '').trim() || "Let me help you explore Coimbatore!";
    } catch {
      return 'Sorry, I had a brief hiccup! Try again or use the map filters directly.';
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const query = input;
    setMessages(prev => [...prev, { text: query, isUser: true }]);
    setInput('');
    setIsTyping(true);

    let response: string | null = null;

    // Route map-specific queries to onSearch callback
    if (onSearch && isMapSearchQuery(query)) {
      try {
        response = await onSearch(query);
      } catch (err) {
        console.error('Assistant search error:', err);
      }
    }

    // Fall back to Groq for general conversation or if onSearch returned nothing
    if (!response) {
      response = await callGroq(query);
    }

    setMessages(prev => [...prev, { text: response as string, isUser: false }]);
    setIsTyping(false);
  };

  const generateResponse = (query: string) => {
    const q = query.toLowerCase();
    if (q.includes('restaurant') || q.includes('food') || q.includes('eat')) {
      return "I can help you find restaurants! Try filtering by 'Food & Drinks' category or tell me what cuisine you're looking for.";
    }
    if (q.includes('hospital') || q.includes('clinic') || q.includes('health')) {
      return "Looking for healthcare facilities? Use the 'Healthcare' filter to see hospitals and clinics in your selected area.";
    }
    if (q.includes('school') || q.includes('college') || q.includes('education')) {
      return "Check out educational institutions using the 'Education' category filter!";
    }
    if (q.includes('shop') || q.includes('mall') || q.includes('market')) {
      return "For shopping options, select the 'Shopping' category to see malls, markets, and stores nearby.";
    }
    if (q.includes('fuel') || q.includes('petrol') || q.includes('gas')) {
      return "Need fuel? Filter by 'Fuel Stations' to find the nearest petrol pumps.";
    }
    if (q.includes('temple') || q.includes('church') || q.includes('mosque') || q.includes('worship')) {
      return "Looking for places of worship? Use the 'Worship' category to find temples, churches, and mosques.";
    }
    return "I can help you explore amenities in Coimbatore! Select a location from the dropdown and use category filters to find what you need.";
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-50"
        >
          <div className="wrapper-icon">
            <div className="circle-icon"></div>
            <div className="circle-icon"></div>
            <div className="circle-icon"></div>
            <div className="shadow-icon"></div>
            <div className="shadow-icon"></div>
            <div className="shadow-icon"></div>
          </div>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 animate-slide-up">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="wrapper-header">
                <div className="circle-header"></div>
                <div className="circle-header"></div>
                <div className="circle-header"></div>
                <div className="shadow-header"></div>
                <div className="shadow-header"></div>
                <div className="shadow-header"></div>
              </div>
              <div>
                <h3 className="font-bold">Coimbatore Assistant</h3>
                <p className="text-xs opacity-90">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-full transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${msg.isUser
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 shadow-md rounded-bl-none'
                    }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-md">
                  <div className="wrapper-typing">
                    <div className="circle-typing"></div>
                    <div className="circle-typing"></div>
                    <div className="circle-typing"></div>
                    <div className="shadow-typing"></div>
                    <div className="shadow-typing"></div>
                    <div className="shadow-typing"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about amenities..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={handleSend}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2 rounded-full hover:scale-110 transition-all duration-300 disabled:opacity-50"
                disabled={!input.trim()}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .wrapper-icon {
          width: 40px;
          height: 40px;
          position: relative;
          z-index: 1;
        }

        .circle-icon {
          width: 12px;
          height: 12px;
          position: absolute;
          border-radius: 50%;
          background-color: white;
          left: 15%;
          transform-origin: 50%;
          animation: circle7124 0.5s alternate infinite ease;
        }

        @keyframes circle7124 {
          0% {
            top: 40px;
            height: 3px;
            border-radius: 50px 50px 25px 25px;
            transform: scaleX(1);
          }
          40% {
            height: 12px;
            border-radius: 50%;
            transform: scaleX(0);
          }
          100% {
            top: 0%;
          }
        }

        .circle-icon:nth-child(2) {
          left: 45%;
          animation-delay: 0.2s;
        }

        .circle-icon:nth-child(3) {
          left: auto;
          right: 15%;
          animation-delay: 0.3s;
        }

        .shadow-icon {
          width: 12px;
          height: 3px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.3);
          position: absolute;
          top: 42px;
          transform-origin: 50%;
          z-index: -1;
          left: 15%;
          filter: blur(1px);
          animation: shadow046 0.5s alternate infinite ease;
        }

        @keyframes shadow046 {
          0% {
            transform: scaleX(1.5);
          }
          40% {
            transform: scaleX(1);
            opacity: 0.7;
          }
          100% {
            transform: scaleX(0.2);
            opacity: 0.4;
          }
        }

        .shadow-icon:nth-child(4) {
          left: 45%;
          animation-delay: 0.2s;
        }

        .shadow-icon:nth-child(5) {
          left: auto;
          right: 15%;
          animation-delay: 0.3s;
        }

        .wrapper-header {
          width: 40px;
          height: 30px;
          position: relative;
          z-index: 1;
        }

        .circle-header {
          width: 10px;
          height: 10px;
          position: absolute;
          border-radius: 50%;
          background-color: white;
          left: 15%;
          transform-origin: 50%;
          animation: circle7124-header 0.5s alternate infinite ease;
        }

        @keyframes circle7124-header {
          0% {
            top: 30px;
            height: 2px;
            border-radius: 50px 50px 25px 25px;
            transform: scaleX(1);
          }
          40% {
            height: 10px;
            border-radius: 50%;
            transform: scaleX(0);
          }
          100% {
            top: 0%;
          }
        }

        .circle-header:nth-child(2) {
          left: 45%;
          animation-delay: 0.2s;
        }

        .circle-header:nth-child(3) {
          left: auto;
          right: 15%;
          animation-delay: 0.3s;
        }

        .shadow-header {
          width: 10px;
          height: 2px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.3);
          position: absolute;
          top: 31px;
          transform-origin: 50%;
          z-index: -1;
          left: 15%;
          filter: blur(1px);
          animation: shadow046-header 0.5s alternate infinite ease;
        }

        @keyframes shadow046-header {
          0% {
            transform: scaleX(1.5);
          }
          40% {
            transform: scaleX(1);
            opacity: 0.7;
          }
          100% {
            transform: scaleX(0.2);
            opacity: 0.4;
          }
        }

        .shadow-header:nth-child(4) {
          left: 45%;
          animation-delay: 0.2s;
        }

        .shadow-header:nth-child(5) {
          left: auto;
          right: 15%;
          animation-delay: 0.3s;
        }

        .wrapper-typing {
          width: 60px;
          height: 30px;
          position: relative;
          z-index: 1;
        }

        .circle-typing {
          width: 10px;
          height: 10px;
          position: absolute;
          border-radius: 50%;
          background-color: #3b82f6;
          left: 15%;
          transform-origin: 50%;
          animation: circle7124-typing 0.5s alternate infinite ease;
        }

        @keyframes circle7124-typing {
          0% {
            top: 30px;
            height: 2px;
            border-radius: 50px 50px 25px 25px;
            transform: scaleX(1);
          }
          40% {
            height: 10px;
            border-radius: 50%;
            transform: scaleX(0);
          }
          100% {
            top: 0%;
          }
        }

        .circle-typing:nth-child(2) {
          left: 45%;
          animation-delay: 0.2s;
        }

        .circle-typing:nth-child(3) {
          left: auto;
          right: 15%;
          animation-delay: 0.3s;
        }

        .shadow-typing {
          width: 10px;
          height: 2px;
          border-radius: 50%;
          background-color: rgba(0, 0, 0, 0.3);
          position: absolute;
          top: 31px;
          transform-origin: 50%;
          z-index: -1;
          left: 15%;
          filter: blur(1px);
          animation: shadow046-typing 0.5s alternate infinite ease;
        }

        @keyframes shadow046-typing {
          0% {
            transform: scaleX(1.5);
          }
          40% {
            transform: scaleX(1);
            opacity: 0.7;
          }
          100% {
            transform: scaleX(0.2);
            opacity: 0.4;
          }
        }

        .shadow-typing:nth-child(4) {
          left: 45%;
          animation-delay: 0.2s;
        }

        .shadow-typing:nth-child(5) {
          left: auto;
          right: 15%;
          animation-delay: 0.3s;
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default CoimbatoreAssistant;
