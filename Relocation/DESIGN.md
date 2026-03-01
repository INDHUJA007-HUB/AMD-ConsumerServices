# NammaWay AI: Technical Design Document 🏗️

This document details the architectural decisions, AI/ML pipelines, and data flow of the NammaWay AI platform, designed for the AMD Slingshot Hackathon.

---

## 🏛️ 1. High-Level System Architecture

NammaWay AI uses a modular architecture with a React-based frontend and a multi-service backend that integrates various AI models for personalized discovery.

```mermaid
graph TD
    A[User UI/UX] --> B[API Gateway / Router]
    B --> C[Lifestyle Matching Service]
    B --> D[Smart Stay Finder]
    B --> E[Predictive Expense Engine]
    
    subgraph "AI Models Layer"
        C1[Hugging Face CLIP]
        C2[Siamese Network Embedding - Future]
        D1[SVD Collaborative Filter]
        D2[Groq LLM Insights]
        E1[SHAP Explainability]
    end
    
    C --> C1
    C --> C2
    D --> D1
    D --> D2
    E --> E1
    
    subgraph "Data Layer"
        F[(PostGIS / GeoJSON)]
        G[(Resident Footprint DB)]
    end
    
    D --> F
    C --> G
```

---

## 🧠 2. AI/ML Component Detail

### A. Vibe Matcher Pipeline (Photo-to-Lifestyle)
The vibe matcher uses zero-shot classification to map visual "vibes" to neighborhood social signatures.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant CLIP_Model as HF CLIP Model
    participant DB as Neighborhood Signatures

    User->>Frontend: Uploads "Vibe" Image
    Frontend->>Backend: POST /vibe-match (Image)
    Backend->>CLIP_Model: Project Image to Latent Space
    CLIP_Model-->>Backend: Embedding / Classification
    Backend->>DB: Query Nearest Neighbors (Cosine Similarity)
    DB-->>Backend: Top Match Neighborhoods
    Backend->>Backend: Generate "Why" Explanations
    Backend-->>Frontend: Ranked List + Rationales
    Frontend-->>User: Visual Map + Recommendations
```

### B. Smart Stay Collaborative Filtering
This peer-based recommendation system combines matrix factorization concepts with LLM-powered content generation.

```mermaid
graph LR
    U[User Profile] --> CF[Collaborative Filter Logic]
    D[Stay Dataset] --> CF
    CF --> P[Identify Peer Group Stays]
    P --> G[Groq AI Review Generator]
    G --> R[Personalized Recommendations]
    
    style G fill:#f9f,stroke:#333,stroke-width:2px
```

---

## 🛠️ 3. Data Engineering & Feature Fusion

The Smart Stay Finder relies on a "Feature Fusion" layer that merges static housing data with dynamic urban infrastructure data.

```mermaid
graph TD
    subgraph "Ingestion Sources"
        S1[Housing Data CSV/JSON]
        S2[SETC Bus Stop API]
        S3[OpenStreetMap GeoJSON]
    end
    
    subgraph "Feature Engineering Layer"
        F1[Haversine Distance Processor]
        F2[Amenity Density Aggregator]
        F3[Workplace Proximity Resolver]
    end
    
    S1 --> F1
    S1 --> F2
    S2 --> F1
    S3 --> F2
    
    subgraph "Output Model"
        OM[Enhanced Accommodation Object]
    end
    
    F1 --> OM
    F2 --> OM
    F3 --> OM
```

---

## 🎨 4. Design Philosophy: Transparent Recommenders

- **"Why this match"**: Every recommendation includes a rationale (e.g., "92% Match: Near your workspace + High coffee shop density").
- **Budget Respect**: Models are constrained by user-defined budget sliders before any personal ranking is applied.
- **Explainability (SHAP)**: Cost predictions are accompanied by SHAP visualizations to show which factors (AC, Square Footage, Proximity) impacted the final estimate most.

---

## 🚀 5. Scalability & Roadmap

### Scalability
- **pgvector Integration**: Moving from in-memory cosine similarity to database-level vector search for sub-millisecond similarity queries across thousands of areas.
- **Edge Computing**: Using ONNX or TensorFlow.js to move inference tasks (like classification) to the client-side.

### Future Roadmap
1. **Deeper Embeddings**: Moving from heuristic triplets to a Triplet Loss trained Siamese Network for the Vibe Matcher.
2. **Context-Aware LLM Agents**: Integrating RAG (Retrieval-Augmented Generation) so the booking assistant can "read" latest local events/news and factor them into travel planning.
3. **Accessibility Integration**: Explicitly modeling mobility constraints in the feature engineering layer for more inclusive urban discovery.
