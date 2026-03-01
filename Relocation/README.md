# NammaWay AI: ConsumerExperience 🚀

### *AMD Slingshot Hackathon 2025*

**Essence**: Personalized, delightful interactions in retail, media, travel, and campus services.

---

## 🌟 Overview
**NammaWay AI** is a hyper-personalized ecosystem designed to bridge the gap between people and the services they use daily—whether it's finding the perfect place to stay, exploring a new city, or planning campus life. In a world of overwhelming options, NammaWay AI respects your budget, explains its choices, and prioritizes your unique lifestyle.

### Why It Matters
When systems explain *why* they recommend something and respect user-defined constraints (like budget and time), trust increases. NammaWay AI focuses on transparency and delightful discovery to prevent "filter bubbles" and foster genuine engagement.

---

## 🛠️ Current Implemented Features

### 1. 🌈 Photo Vibe Matcher
- **Technology**: Hugging Face's **CLIP (Contrastive Language-Image Pre-training)**.
- **Functionality**: Upload a photo that represents your "vibe" (a quiet park, a bustling cafe, a vibrant workspace). The AI classifies the image and matches it with the social gravity of neighborhoods in Coimbatore.
- **Transparency**: Explains matches with high-level classifications and compatibility scores.

### 2. 🏠 Smart Stay Finder (with Feature Engineering)
- **Problem**: Finding a home is more than just rent. It’s about proximity to what matters.
- **Implementation**:
    - **Proximity Logic**: Calculates distance to bus stops, workplaces (e.g., TIDEL Park), and amenities using the Haversine formula.
    - **Data Fusion**: Merges SETC bus stop data, OpenStreetMap amenity data, and internal housing datasets.
    - **UI**: Visual badges for navigation ease, workplace proximity, and local "mess" (e.g., student food) availability.

### 3. 👥 AI-Powered Collaborative Filtering
- **Functionality**: Peer-based recommendations for stays based on user profession and budget.
- **AI Layers**:
    - Uses an **SVD-inspired algorithm** for neighbor discovery.
    - Integrates with **Groq API** to generate personalized AI reviews and insights for recommended places.
    - Provides profession-based statistics to help users see where their peers are staying.

### 4. 📈 AI Predictive Engine (Expense & Vibe)
- **Predictive Analytics**: Automates context derivation from selected stays.
- **Explainability**: Implements **SHAP (SHapley Additive exPlanations)** values to visualize why a cost or vibe prediction was made.
- **Optimization**: Features "The Budget Saver" mode for student-centric financial planning.

---

## 🔬 Future AI Works
As part of our roadmap for the AI hackathon, we are planning the following enhancements:

- **Siamese Networks for Deep Lifestyle Matching**: Transitioning from CLIP-based classification to a dedicated Triplet Loss model that learns deeper lifestyle embeddings.
- **Real-time Edge AI**: Deploying lightweight models on the edge to provide instant, offline travel and safety recommendations.
- **Conversational Booking Assistants**: A budget-aware LLM agent that negotiates stays and plans itineraries based on time, cost, accessibility, and interests.
- **Anti-Filter Bubble Loop**: A "Discovery Mode" that intelligently pushes users out of their comfort zones by suggesting "vibe-contrary" but highly-rated experiences to promote local discovery.
- **On-Brand Media Generation**: AI tools for local clubs/teams to produce consistent, high-quality promotional content automatically.

---

## 💻 Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui.
- **Backend/API**: Python (FastAPI), Node.js.
- **AI/ML**: Hugging Face (CLIP), Groq API, SHAP, Custom SVD Logic.
- **Data**: PostGIS, GeoJSON, OpenStreetMap.

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Install dependencies
npm install

# Set up environment variables (.env)
VITE_GROQ_API_KEY=your_key
VITE_HUGGING_FACE_TOKEN=your_token

# Run development server
npm run dev
```

---

*Built with ❤️ for Coimbatore & the AMD Slingshot Hackathon.*
