# NammaWay AI — Vibe‑Match Neighbor Engine: Implementation Plan

## Purpose
- Build a Deep Metric Learning system that matches a user’s lifestyle (“Digital Footprint”) to the social gravity of neighborhoods (“Vibe Signatures”) using Siamese Networks with Triplet Loss.
- Deliver ranked neighborhoods with human‑readable “why this match” rationales and privacy by design.

## Feature Set
- Core
  - Collect user Digital Footprint (social pace, career stage, industry, hobbies, weekend routine, commute preference, short text summary).
  - Represent each neighborhood as a Vibe Signature embedding (centroid of resident embeddings).
  - Compute compatibility score with Siamese embeddings and Triplet Loss–trained projection.
  - Return top matches with rationale and map overlays.
- Extended
  - Blend with MCDA (Budget/Commute/Safety) and Travel Optimizer for unified ranking.
  - Feedback loop (thumbs up/down) to improve triplet mining.
  - Preference persistence tied to user account.
. The Onboarding: "Capturing the Vibe"Instead of asking for "Budget" first, start with the Lifestyle Profile.Quick-start buttons like:"I'm a Tidel Park Techie.""I'm a PSG Student.""I'm a Night Owl/Socialite."Visual Board: Show 4-5 photos of different street styles (one with cafes, one with trees, one with heavy traffic/shops) and ask: "Which of these feels like home?"🗺️ 2. The Interactive Vibe MapOnce the user inputs their data, the app displays a Heatmap of Coimbatore.The "Match %": Every area (Peelamedu, RS Puram, etc.) gets a compatibility score (e.g., "94% Match").The Time-Travel Slider: A feature that lets the user see how the vibe changes.Morning view: Shows joggers and breakfast spots.Evening view: Shows street food hubs and traffic "hot zones."POI Layer Toggles: Users can toggle icons for "Gyms," "Temples," "Coworking Spaces," or "Parks" to see why an area got its score.📊 3. The Neighborhood "Deep Dive" CardWhen a user clicks on an area (like Saibaba Colony), a detailed card pops up with:The Vibe Verdict: A 2-line AI-generated summary: "A classic residential hub with elite vibes and great filter coffee. Perfect if you value quiet evenings but want high-end shopping within 1km.""Real Talk" Snippets: The top 3 most common sentiments found by your Reddit/99acres Scraper (e.g., "Safe at night," "Bad water supply in summers").The "Vibe Radar" (Spider Chart): A visual graph showing scores for:SafetySocial LifeCommute EaseGreeneryAffordability💬 4. Features for Maximum SatisfactionTo make the project "complete," add these interactive features:FeatureWhat it doesWhy it satisfies the user"Vibe Matcher" ChatbotAI assistant that answers: "Where can I get good parotta after 11 PM here?"Provides instant local intelligence.Budget-Vibe BalancerA "What-If" tool: "If I increase my budget by ₹2000, which better vibe can I get?"Helps in financial decision-making.Safety Route OverlayHighlights the safest walking paths at night based on streetlights and activity.Gives peace of mind to newcomers/women.Social CompatibilityShows if the area has people from your industry or college.Reduces the "lonely in a new city" feeling.
  

## Data & Assets
- GeoJSON Neighborhoods (folder: `datasets/`)
  - Files (minimum for MVP):
    - `datasets/RS puram.geojson`
    - `datasets/Gandhipuram.geojson`
    - `datasets/Ganapathy.geojson`
    - `datasets/Race Course.geojson`
    - `datasets/Saravanampatti.geojson`
    - `datasets/coimbatore_vibes.json`
    - `datasets/coimbatore_vibes.report`
    - `datasets/numbeo_labels.txt`
  - Schema (per Feature):
    - `properties.name: string`
    - `properties.vibe_signature: number[]` (MVP: 3–16 dims; target: 128)
    - `properties.summary: string` (optional)
    - `geometry: Point` (centroid) or `Polygon` (preferred when available)
- User Digital Footprint (frontend → backend)
  - social_pace: 0.0–1.0
  - career_stage: enum [student, early, mid, senior]
  - industry: enum [tech, finance, manufacturing, healthcare, edu, other]
  - hobbies: array of tags [cycling, running, coffee, nightlife, hiking, yoga, gaming, music, art]
  - weekend_focus: enum [outdoors, cafes, nightlife, family]
  - commute_mode: enum [bus, bike, car, walk]
  - summary: optional short text (1–2 sentences)
- Resident Embeddings (privacy‑safe)
  - Store only embeddings (no PII) used to compute neighborhood centroids.
  - Publish/update centroids when k‑anonymity ≥ threshold (e.g., k≥50).

## Model (Deep Metric Learning)
- Architecture
  - Siamese twin branches with shared weights.
  - Encoders:
    - Text summary: lightweight sentence encoder (e.g., Distil‑style) → vector.
    - Categorical: learnable embeddings; numeric: standardized scalars.
    - Fuse (concat) → MLP projection → 128‑d unit‑norm embedding.
- Loss & Similarity
  - Triplet Loss: `L = max(d(a,p) − d(a,n) + α, 0)`, margin α≈0.2.
  - Distance d: cosine distance on L2‑normalized embeddings.
- Training
  - Triplet mining: online semi‑hard within batch; label smoothing for robustness.
  - Optimizer: AdamW; weight decay 1e‑4; dropout 0.2–0.4.
  - Early MVP can start with heuristic triplets; integrate real feedback as labels accumulate.
- Outputs
  - fu(user), fv(neighborhood); Compatibility = `100 × σ(β × (1 − cosine_distance))`, tune β on validation.

## Neighborhood Vibe Signature
- Resident Profile → Embedding (same schema as user).
- Aggregate by neighborhood:
  - Centroid = mean (or geometric median) of resident embeddings.
  - Store as `properties.vibe_signature` in GeoJSON and in DB.
- Recompute cadence: nightly/weekly; publish only if k‑anonymity threshold met.

## Backend (FastAPI)
- Endpoints
  - POST `/vibe-match`
    - Request
      ```json
      {
        "social_pace": 0.7,
        "career_stage": "early",
        "industry": "tech",
        "hobbies": ["cycling","coffee"],
        "weekend_focus": "outdoors",
        "commute_mode": "bus",
        "summary": "Weekend cycling, weekday coffee & coworking."
      }
      ```
    - Response
      ```json
      {
        "results": [
          {
            "neighborhood": "Peelamedu",
            "score": 92.3,
            "why": ["strong cycling culture","early-career tech density","vibrant cafés"],
            "coordinates": [77.0206, 11.0252]
          },
          { "neighborhood": "Gandhipuram", "score": 88.1, "why": ["cowork hubs","transit access"], "coordinates": [76.9714,11.0168] }
        ],
        "explanations_version": "v1"
      }
      ```
  - GET `/vibe-neighborhoods`
    - Returns names, geometry (bbox/centroid), and signature version/hash.
  - POST `/vibe-feedback`
    - Body: `{ "neighborhood":"Peelamedu", "liked": true }` for online improvement.
- Implementation Notes
  - Preprocessing identical to training (same tokenization/embeddings).
  - Load neighborhood centroids from DB; compute cosine distances; rank descending.
  - “Why” explanations via:
    - Top aligned dimensions from projection head.
    - Nearest tag centroids (e.g., cycling, coffee, nightlife).

## Storage
- PostGIS (core)
  - `neighborhoods(id, name, geography, signature_dim, signature_vector JSONB or pgvector)`
  - `vibe_centroids(version, neighborhood_id, vector, k_anonymity, created_at)`
- Optional `pgvector`
  - Indexed similarity search for scalability as neighborhood set grows.

## Centroid Pipeline
- Inputs: resident embeddings (de‑identified), neighborhood membership.
- Process:
  - Filter neighborhoods with resident_count ≥ k.
  - Compute centroid vector; compute quality metrics (variance, k).
  - Persist to DB and export GeoJSON (for map overlays and offline use).
- Schedule: cron/worker job (nightly); version outputs for rollback.

## Frontend (Vibe‑Match UI)
- Questionnaire
  - Sliders/toggles for social pace, weekend focus; selects for career stage, industry; multi‑select hobbies; optional text.
  - Save preset to user preferences on submit.
- Results
  - Ranked list with scores, chips for “why”, and “Compare Top 3”.
  - Map layer highlighting recommended neighborhoods with score badges.
  - Action: “See stays here” → deep‑link Smart Stay Finder scoped to area.
- Blending (optional)
  - Sliders to weight Vibe vs MCDA vs Travel: `Final = 0.5*Vibe + 0.3*MCDA + 0.2*Travel`.

## Privacy & Compliance
- Consent for using de‑identified preferences to build neighborhood signatures.
- K‑anonymity threshold before publishing centroids.
- Right to deletion: remove resident embedding and recalc on next batch.
- No raw PII stored in modeling tables; embeddings only.

## Evaluation
- Offline: Recall@K, NDCG@K, pairwise AUC on compatible vs incompatible pairs.
- Online: engagement (save/compare), downstream actions (open map, contact), explicit feedback.
- Calibration: tune β and margin α to maximize satisfaction without over‑personalization.

## Deployment
- Env Vars
  - `DATABASE_URL`, `MODEL_PATH`, `EMBEDDING_VERSION`, `JWT_SECRET` (if auth enabled)
- Local (Docker)
  - `docker-compose up --build` (PostGIS + FastAPI)
  - Ingest: load GeoJSON → DB neighborhood table (and/or serve from static datasets)
- Caching
  - Cache neighborhood signatures in memory with version key.

## Timeline (MVP — 4 Weeks)
- Week 1: Data & Schemas
  - Finalize user feature schema and 5 GeoJSON vibe signatures (MVP dims 8–16).
  - Implement preprocessing parity (train/infer).
- Week 2: Model & Centroids
  - Siamese model with heuristic triplets; export projection head.
  - Centroid computation pipeline; store in DB; export updated GeoJSONs.
- Week 3: APIs & UI
  - `/vibe-match`, `/vibe-neighborhoods`, `/vibe-feedback` endpoints with explanations.
  - Build questionnaire and results + map overlay; deep‑link to stays.
- Week 4: Evaluation & Privacy
  - Offline metrics; seed online feedback; finalize consent and k‑anonymity.
  - Polish copy for “why this match”; performance tuning (≤200ms p95 for 5–20 areas).

## Acceptance Criteria
- Upload 5 GeoJSONs with valid schema and non‑trivial vibe_signature vectors.
- `/vibe-match` returns ranked neighborhoods with scores and at least three rationale tags.
- UI allows completing footprint, shows ranked results, and links to stays within areas.
- Privacy safeguards documented; centroid pipeline enforces k‑anonymity gate.

## Appendices

### A. Sample GeoJSON Feature (MVP, Point)
```json
{
  "type": "Feature",
  "properties": {
    "name": "R.S. Puram",
    "vibe_signature": [0.8, 0.3, 0.5],
    "summary": "Established, café culture, parks; families and professionals."
  },
  "geometry": { "type": "Point", "coordinates": [76.9558, 11.0068] }
}
```

### B. Sample Triplet Construction (Heuristic Bootstrapping)
- Anchor (user): early‑career tech, cycling, cafés → embedding `fu`
- Positive (neighborhood): high cycling & tech café density → embedding `fp`
- Negative (neighborhood): low cycling, car‑dependent, quiet nights → embedding `fn`
- Loss: `max(cos(fu, fn) − cos(fu, fp) + α, 0)` with α=0.2

### C. API Error Cases
- 400 invalid schema; 422 unknown hobby tags; 503 model not loaded.
- Fallback: if text encoder unavailable, run structured‑only path.

### D. Integration Points
- Smart Stay Finder: filter cards by top 1–2 vibe areas.
- Predictive Expense: prefill city/area; attach Vibe Score for blended ranking.
- Travel Optimizer: show commute summary for top vibe areas.

---
Owner: AI Platform • Version: v1 • Scope: Vibe‑Match Neighbor Engine MVP
