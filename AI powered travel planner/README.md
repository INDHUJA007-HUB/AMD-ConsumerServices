# NammaWay - AI-Powered Travel & Relocation Assistant

NammaWay is an intelligent, highly personalized travel and relocation dashboard designed to simplify planning for users visiting or moving to a new city (currently focused on Coimbatore). It generates end-to-end, multi-day itineraries, manages granular budget breakdowns, provides dynamic route mapping, and crucially features a **real-time AI Plan Modifier** that allows users to seamlessly customize their trip via natural language chat.

## 🚀 Key Features

### 1. Smart Itinerary Generator
At the core of the platform is an intelligent generation engine. Users input their basic constraints—such city destination, total days, overall budget, trip style (budget, medium, luxury), and food preferences (veg/non-veg). The system then automatically constructs a detailed, day-by-day timeline that fills in appropriate lodging, transportation, breakfast, lunch, dinner, and activities without the user needing to manually research every spot.

### 2. Interactive AI Plan Modifier
Instead of just static text, NammaWay features a slide-out AI conversational widget directly tied to the itinerary data. If a user doesn't like a specific generation (e.g., "Change my Day 2 lunch to a local mess" or "Make the whole trip 20% cheaper"), they can type this naturally into the chat. The AI intercepts the request, rewrites the underlying plan structure using Groq LLM API, and the entire dashboard—including timelines and budgets—updates instantly without refreshing the page.

### 3. Real-Time Dynamic Budget Tracking
The platform provides a granular, visual budget breakdown component. As the itinerary is generated or modified, the dashboard calculates a cumulative cost analysis split into four categories: Stay, Food, Travel, and Activities. 
If a user's plan exceeds their stated budget, the system displays a visual warning and proactively suggests "Savings Options"—such as switching from a hotel to a hostel, or swapping a paid attraction for a free park—with exact estimated savings attached.

### 4. Visual Master Itinerary Timeline
The trip is displayed not as a simple list, but as a rich, scrollable daily timeline. Each activity card includes:
*   Precise timestamps (e.g., "10:30 AM").
*   Estimated costs per activity.
*   Visual emojis and status indicators (e.g., "Open", "Crowded", "Tickets Available").
*   Safety scores for the specific location.
*   Running cumulative costs so users know exactly how much they will have spent by any given hour of their trip.

### 5. Mapbox Route Visualization
NammaWay integrates geospatial tracking to visualize the trip. When a user clicks on a specific day in their itinerary, the platform renders an interactive map displaying the exact geographic route they will take between their hotel, dining spots, and attractions, helping them understand the real-world logistics and travel distances of their planned day.

### 6. Namma Assistant (Universal Helper)
Separate from the itinerary modifier, the platform includes a floating, universally accessible "Namma Assistant" chatbot. This assistant is context-aware of the user's current city or workplace selection and acts as a local guide. Users can ask it general questions like "What is the best way to commute from X to Y?" or "Is XYZ safe at night?" and receive practical, locally-tailored advice instantly.

### 7. Dynamic Disruption Simulators
To prove the robustness of the platform, it includes real-world event simulators (like a "Simulate Delay" button). Clicking this injects a realistic disruption into the plan (such as a 30-minute traffic delay or a sudden rainstorm), pushing the timestamps of subsequent daily activities backward and demonstrating how the itinerary can fluidly adapt to unexpected travel changes.

### 8. AI Voice Guide (Gemini Powered)
The platform features a hands-free, hyper-local AI Voice Tour Guide. Users can simply tap a microphone button and ask questions about landmarks, local history, or current operations (e.g. "Is Marudhamalai open right now?"). The system leverages the **Gemini 1.0 Pro** API combined with local dataset context to generate conversational, Tanglish audio and text responses, acting as a personal regional expert.

### 9. Visual Linguist (AR Lens)
Taking exploration a step further, the "Visual Linguist" allows users to snap or upload a photo of any landmark, sign, or street food item. The **Gemini Vision (2.5 Flash)** API instantly analyzes the image, identifies the object/location, and translates or explains its cultural significance in real-time, effectively serving as an augmented reality travel companion.

## 🛠️ Technologies Used
*   **Frontend Framework**: React.js (TypeScript) + Vite
*   **Styling**: Tailwind CSS, Framer Motion
*   **AI Integrations**: Google Gemini API (1.0 Pro & 2.5 Flash Vision), Groq Inference Engine (`llama-3.3-70b-versatile` and `llama-3.1-8b-instant`)
*   **Backend Framework**: FastAPI (Python)
*   **Maps & Routing**: Mapbox GL JS 
*   **Icons**: Lucide React
