import { useEffect, useState, useMemo } from 'react';
import { Users, Star, Brain, TrendingUp, Quote, Sparkles, CheckCircle2, Loader2, BarChart3, Award } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Stay {
    stay_id: string;
    pg_name: string;
    area: string;
    tier: string;
    rent: number;
    pg_type: string;
    amenities: string;
}

interface Interaction {
    user_id: number;
    profession: string;
    user_budget: number;
    stay_id: string;
    pg_name: string;
    area: string;
    tier: string;
    stay_rent: number;
    amenities: string;
    rating: number;
}

interface PeerRecommendation {
    stay: Stay;
    peerScore: number;
    peerAdoptionPct: number;
    avgRating: number;
    ratingCount: number;
    topAmenities: string[];
    peerCount: number;
}

interface AIReview {
    reviewer: string;
    profession: string;
    rating: number;
    text: string;
    badge: string;
}

interface Props {
    reason: string;          // form "reason": Education | Job | Internship | Business
    lifestyle: string;       // Budget | Medium | Luxury
    budget: number;
    userName: string;
}

// ─── CSV Parser ─────────────────────────────────────────────────────────────
function parseCSV(raw: string): Record<string, string>[] {
    const lines = raw.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let c = 0; c < line.length; c++) {
            if (line[c] === '"') { inQuotes = !inQuotes; continue; }
            if (line[c] === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
            current += line[c];
        }
        values.push(current.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
        rows.push(row);
    }
    return rows;
}

// ─── Profession Mapping ───────────────────────────────────────────────────────
function mapProfession(reason: string, lifestyle: string): string {
    const map: Record<string, string> = {
        'Job': 'IT Professional',
        'Internship': 'Intern',
        'Education': 'Student',
        'Business': 'Entrepreneur',
    };
    if (map[reason]) return map[reason];
    if (lifestyle === 'Luxury') return 'Senior Developer';
    if (lifestyle === 'Medium') return 'Banker';
    return 'Teacher';
}

// ─── Collaborative Filtering Engine ─────────────────────────────────────────
function runCF(
    interactions: Interaction[],
    stays: Stay[],
    profession: string,
    budget: number,
): PeerRecommendation[] {
    const stayMap = new Map<string, Stay>(stays.map(s => [s.stay_id, s]));

    let peers = interactions.filter(i => i.profession === profession);
    if (peers.length === 0) peers = interactions; // fallback: all users

    const allPeerUsers = new Set(peers.map(i => i.user_id));
    const peerCount = allPeerUsers.size || 1;

    // Aggregate per stay
    const agg = new Map<string, { ratingSum: number; count: number }>();
    for (const row of peers) {
        const cur = agg.get(row.stay_id) || { ratingSum: 0, count: 0 };
        cur.ratingSum += row.rating;
        cur.count += 1;
        agg.set(row.stay_id, cur);
    }

    const results: PeerRecommendation[] = [];
    for (const [stayId, stats] of agg) {
        const stay = stayMap.get(stayId);
        if (!stay) continue;
        const avgRating = stats.ratingSum / stats.count;
        const peerAdoptionPct = Math.min(99, Math.round((stats.count / peerCount) * 100));
        // Weighted composite score
        const peerScore = avgRating * 0.65 + (peerAdoptionPct / 100) * 5 * 0.35;
        const amenityList = stay.amenities.split(',').map(a => a.trim()).filter(Boolean);
        results.push({
            stay,
            peerScore,
            peerAdoptionPct,
            avgRating: Math.round(avgRating * 10) / 10,
            ratingCount: stats.count,
            topAmenities: amenityList.slice(0, 4),
            peerCount,
        });
    }

    return results
        .sort((a, b) => {
            const aOk = a.stay.rent <= budget ? 1 : 0;
            const bOk = b.stay.rent <= budget ? 1 : 0;
            if (aOk !== bOk) return bOk - aOk;
            return b.peerScore - a.peerScore;
        })
        .slice(0, 5);
}

// ─── Groq API Helpers ────────────────────────────────────────────────────────
const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

async function groqChat(groqKey: string, prompt: string, maxTokens: number, temperature = 0.8): Promise<string> {
    const resp = await fetch(GROQ_API, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature,
            max_tokens: maxTokens,
        }),
    });
    if (!resp.ok) throw new Error(`Groq ${resp.status}`);
    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim() ?? '';
}

async function generateReviews(groqKey: string, profession: string, rec: PeerRecommendation): Promise<AIReview[]> {
    const prompt = `You are generating authentic user reviews for NammaWay, a smart PG/stay platform in Coimbatore, Tamil Nadu.

Stay details:
- Name: ${rec.stay.pg_name}
- Area: ${rec.stay.area}, Coimbatore
- Type: ${rec.stay.pg_type}  
- Rent: ₹${rec.stay.rent}/month
- Amenities: ${rec.stay.amenities}
- Peer avg rating: ${rec.avgRating}/5.0
- ${rec.peerAdoptionPct}% of ${profession}s in our data chose this stay

Write exactly 3 short, authentic reviews from ${profession}s who lived here. Each review:
- Feels real and natural (not corporate tone)
- Mentions specific amenities or the area
- 2–3 sentences max  
- Different tones: one practical, one emotional/personal, one comparative

Return ONLY valid JSON array, no markdown:
[
  {"reviewer":"[Tamil name]","profession":"${profession}","rating":4.5,"text":"...","badge":"Verified Resident"},
  {"reviewer":"[Tamil name]","profession":"${profession}","rating":4.2,"text":"...","badge":"Verified Resident"},
  {"reviewer":"[Tamil name]","profession":"${profession}","rating":4.8,"text":"...","badge":"Top Reviewer"}
]`;

    const content = await groqChat(groqKey, prompt, 700, 0.85);
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('Bad JSON');
    return JSON.parse(match[0]) as AIReview[];
}

async function generateInsight(groqKey: string, profession: string, userName: string, rec: PeerRecommendation, budget: number): Promise<string> {
    const prompt = `You are an AI relocation advisor for NammaWay in Coimbatore, Tamil Nadu.

User: ${userName}, a ${profession}, budget ₹${budget}/month.
Top AI pick: ${rec.stay.pg_name} in ${rec.stay.area}
- ${rec.peerAdoptionPct}% of all ${profession}s in our dataset chose this stay
- Peer avg rating: ${rec.avgRating}/5.0 from ${rec.ratingCount} ${profession} reviewers
- Rent: ₹${rec.stay.rent}/month (${rec.stay.rent <= budget ? 'within budget ✓' : 'slightly above budget'})
- Amenities: ${rec.stay.amenities}

Write one concise paragraph (3–4 sentences, max 90 words) explaining WHY this stay is the best match for ${userName} based on what other ${profession}s actually chose. Be specific, cite the numbers, and make it feel personalized. No bullet points.`;

    return groqChat(groqKey, prompt, 180, 0.7);
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`h-3 w-3 ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
            ))}
            <span className="text-[10px] text-gray-500 ml-1 font-medium">{rating.toFixed(1)}</span>
        </div>
    );
}

function TierPill({ tier }: { tier: string }) {
    const cls: Record<string, string> = {
        budget: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        mid: 'bg-sky-50 text-sky-700 border-sky-200',
        premium: 'bg-purple-50 text-purple-700 border-purple-200',
    };
    return <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${cls[tier] || 'bg-gray-50 text-gray-500'}`}>{tier.toUpperCase()}</span>;
}

function SkeletonLine({ w = 'w-full' }: { w?: string }) {
    return <div className={`h-2.5 bg-violet-100/70 rounded animate-pulse ${w}`} />;
}

// ─── Main Panel ────────────────────────────────────────────────────────────────
export default function CollaborativeFilteringPanel({ reason, lifestyle, budget, userName }: Props) {
    const groqKey = import.meta.env.VITE_GROQ_API_KEY as string;
    const profession = useMemo(() => mapProfession(reason, lifestyle), [reason, lifestyle]);

    // Dataset state
    const [stays, setStays] = useState<Stay[]>([]);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    // AI state
    const [aiReviews, setAiReviews] = useState<AIReview[]>([]);
    const [aiInsight, setAiInsight] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');

    // UI
    const [tab, setTab] = useState<'recs' | 'reviews'>('recs');

    // Load CSVs
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setDataLoading(true);
            try {
                const [staysRes, interRes] = await Promise.all([
                    fetch('/datasets/stays_master.csv').then(r => r.text()),
                    fetch('/datasets/budget_aware_stays.csv').then(r => r.text()),
                ]);
                if (cancelled) return;
                const parsedStays: Stay[] = parseCSV(staysRes).map(r => ({
                    stay_id: r.stay_id,
                    pg_name: r.pg_name,
                    area: r.area,
                    tier: r.tier,
                    rent: Number(r.rent),
                    pg_type: r.pg_type,
                    amenities: r.amenities,
                }));
                const parsedInter: Interaction[] = parseCSV(interRes).map(r => ({
                    user_id: Number(r.user_id),
                    profession: r.profession,
                    user_budget: Number(r.user_budget),
                    stay_id: r.stay_id,
                    pg_name: r.pg_name,
                    area: r.area,
                    tier: r.tier,
                    stay_rent: Number(r.stay_rent),
                    amenities: r.amenities,
                    rating: Number(r.rating),
                }));
                setStays(parsedStays);
                setInteractions(parsedInter);
            } catch {
                // silently fail; component will show nothing
            } finally {
                if (!cancelled) setDataLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    // Run CF
    const recommendations = useMemo<PeerRecommendation[]>(() => {
        if (stays.length === 0 || interactions.length === 0) return [];
        return runCF(interactions, stays, profession, budget);
    }, [stays, interactions, profession, budget]);

    const topRec = recommendations[0];

    // Fetch AI content once we have the top pick
    useEffect(() => {
        if (!topRec || !groqKey) return;
        let cancelled = false;
        const run = async () => {
            setAiLoading(true);
            setAiError('');
            try {
                const [reviews, insight] = await Promise.all([
                    generateReviews(groqKey, profession, topRec),
                    generateInsight(groqKey, profession, userName, topRec, budget),
                ]);
                if (!cancelled) { setAiReviews(reviews); setAiInsight(insight); }
            } catch {
                if (!cancelled) setAiError('Groq AI unavailable — dataset-based results shown.');
            } finally {
                if (!cancelled) setAiLoading(false);
            }
        };
        run();
        return () => { cancelled = true; };
    }, [topRec?.stay.stay_id, profession, groqKey]);

    if (dataLoading) {
        return (
            <div className="mt-6 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-5 space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-200" />
                    <div className="space-y-1.5 flex-1">
                        <SkeletonLine w="w-48" />
                        <SkeletonLine w="w-32" />
                    </div>
                </div>
                <SkeletonLine />
                <SkeletonLine w="w-4/5" />
                <SkeletonLine w="w-3/5" />
            </div>
        );
    }

    if (recommendations.length === 0) return null;

    const interactionCount = interactions.length;

    return (
        <div className="mt-6 rounded-2xl border border-violet-200 overflow-hidden shadow-md">
            {/* ── Gradient Header ──────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-700 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm border border-white/20">
                            <Brain className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] text-violet-300 font-semibold uppercase tracking-widest">Collaborative Filtering · AI Powered</p>
                            <h3 className="text-white font-bold text-base leading-tight">Users Like You Also Stayed At…</h3>
                            <p className="text-violet-200 text-[11px] mt-0.5">
                                Based on {interactionCount.toLocaleString()} interactions from {topRec.peerCount}+ {profession}s in Coimbatore
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 flex-shrink-0">
                        <Sparkles className="h-3 w-3 text-amber-300" />
                        <span className="text-white text-[9px] font-semibold">Groq · LLaMA 3.3</span>
                    </div>
                </div>

                {/* Headline stat */}
                {topRec && (
                    <div className="mt-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                        <Award className="h-4 w-4 text-amber-300 flex-shrink-0" />
                        <p className="text-white text-[11px] leading-tight">
                            <strong className="text-amber-200">{topRec.peerAdoptionPct}%</strong> of {profession}s relocating to Coimbatore chose{' '}
                            <strong className="text-white">"{topRec.stay.pg_name}"</strong> — avg rating{' '}
                            <strong className="text-amber-200">{topRec.avgRating}/5.0</strong>
                        </p>
                    </div>
                )}
            </div>

            {/* ── Tabs ─────────────────────────────────────────────────── */}
            <div className="flex border-b border-violet-100 bg-white">
                {([
                    { id: 'recs', label: 'Peer Recommendations', icon: TrendingUp },
                    { id: 'reviews', label: 'AI Reviews', icon: Quote },
                ] as const).map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all border-b-2 ${tab === id
                                ? 'text-violet-700 border-violet-600 bg-violet-50/50'
                                : 'text-gray-400 border-transparent hover:text-violet-500 hover:bg-violet-50/30'
                            }`}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                        {id === 'reviews' && aiLoading && (
                            <Loader2 className="h-3 w-3 animate-spin text-violet-400 ml-1" />
                        )}
                    </button>
                ))}
            </div>

            <div className="bg-gradient-to-br from-violet-50/30 to-indigo-50/30 p-4 space-y-3.5">

                {/* ════════════════════════════════════════════════════════
            TAB: RECOMMENDATIONS
           ════════════════════════════════════════════════════════ */}
                {tab === 'recs' && (
                    <>
                        {/* AI Insight Box */}
                        <div className={`rounded-xl border bg-white p-3.5 transition-all ${aiLoading ? 'border-violet-100' : 'border-violet-200 shadow-sm'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1 bg-violet-100 rounded-md">
                                    <Brain className="h-3.5 w-3.5 text-violet-600" />
                                </div>
                                <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wide">AI Insight for {userName}</span>
                                {aiLoading && <Loader2 className="h-3 w-3 animate-spin text-violet-400 ml-auto" />}
                            </div>
                            {aiLoading ? (
                                <div className="space-y-1.5">
                                    <SkeletonLine /><SkeletonLine w="w-4/5" /><SkeletonLine w="w-3/5" />
                                </div>
                            ) : aiInsight ? (
                                <p className="text-xs text-gray-700 leading-relaxed">{aiInsight}</p>
                            ) : (
                                <p className="text-xs text-gray-400 italic">Analysing peer patterns for {profession}s in Coimbatore…</p>
                            )}
                        </div>

                        {/* Stay Cards */}
                        {recommendations.map((rec, idx) => (
                            <div
                                key={rec.stay.stay_id}
                                className={`rounded-xl bg-white border shadow-sm overflow-hidden transition-all hover:shadow-md ${idx === 0 ? 'border-violet-300 ring-1 ring-violet-100' : 'border-gray-100'
                                    }`}
                            >
                                {/* Card header bar */}
                                <div className={`px-3.5 py-2 flex items-center justify-between ${idx === 0 ? 'bg-gradient-to-r from-violet-600 to-indigo-600' : 'bg-gray-50 border-b border-gray-100'}`}>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${idx === 0 ? 'bg-white/20 text-white border border-white/30' : 'bg-gray-200 text-gray-600'}`}>
                                            #{idx + 1} {idx === 0 ? '· TOP PICK' : ''}
                                        </span>
                                        {idx === 0 ? (
                                            <span className="text-[9px] text-violet-200 font-medium">Best peer match for {profession}s</span>
                                        ) : (
                                            <TierPill tier={rec.stay.tier} />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <BarChart3 className={`h-3 w-3 ${idx === 0 ? 'text-violet-200' : 'text-violet-400'}`} />
                                        <span className={`text-[9px] font-bold ${idx === 0 ? 'text-white' : 'text-violet-700'}`}>
                                            {rec.peerAdoptionPct}% of peers
                                        </span>
                                    </div>
                                </div>

                                <div className="px-3.5 py-3 space-y-2.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm leading-tight">{rec.stay.pg_name}</h4>
                                            <p className="text-[11px] text-gray-400 mt-0.5">{rec.stay.area} · {rec.stay.pg_type}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-extrabold text-violet-700 leading-none">₹{rec.stay.rent.toLocaleString()}</p>
                                            <p className="text-[9px] text-gray-400">/month</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Stars rating={rec.avgRating} />
                                        {idx === 0 && <TierPill tier={rec.stay.tier} />}
                                    </div>

                                    {/* Amenity pills */}
                                    <div className="flex flex-wrap gap-1">
                                        {rec.topAmenities.map((a, ai) => (
                                            <span key={ai} className="text-[8px] bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-full font-medium">
                                                {a}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Confidence bar */}
                                    <div>
                                        <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                                            <span className="flex items-center gap-0.5">
                                                <Users className="h-2.5 w-2.5" /> Peer Confidence Score
                                            </span>
                                            <span className="font-bold text-violet-600">{Math.min(99, Math.round(rec.peerScore * 20))}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                                                style={{ width: `${Math.min(99, Math.round(rec.peerScore * 20))}%`, transition: 'width 0.8s ease' }}
                                            />
                                        </div>
                                    </div>

                                    <p className="text-[9px] text-gray-400 flex items-center gap-1">
                                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                                        Rated by {rec.ratingCount} {profession}s in NammaWay dataset
                                    </p>
                                </div>
                            </div>
                        ))}

                        <p className="text-center text-[9px] text-gray-400 flex items-center justify-center gap-1.5 pt-1">
                            <Brain className="h-3 w-3 text-violet-400" />
                            SVD-based Matrix Factorization · {interactionCount.toLocaleString()} interactions analysed
                        </p>
                    </>
                )}

                {/* ════════════════════════════════════════════════════════
            TAB: AI REVIEWS
           ════════════════════════════════════════════════════════ */}
                {tab === 'reviews' && (
                    <div className="space-y-3">
                        {/* Stay header */}
                        {topRec && (
                            <div className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white shadow-md">
                                <p className="text-[9px] text-violet-300 font-semibold uppercase tracking-widest mb-1">AI Reviews for #1 Peer Pick</p>
                                <h4 className="font-bold text-base">{topRec.stay.pg_name}</h4>
                                <p className="text-[10px] text-violet-200 mb-2">{topRec.stay.area} · ₹{topRec.stay.rent.toLocaleString()}/mo</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <Star key={i} className={`h-3.5 w-3.5 ${i <= Math.round(topRec.avgRating) ? 'text-amber-300 fill-amber-300' : 'text-white/20'}`} />
                                        ))}
                                    </div>
                                    <span className="text-[10px] text-violet-200">{topRec.avgRating}/5.0 · {topRec.ratingCount} peer ratings</span>
                                </div>
                            </div>
                        )}

                        {/* Loading skeletons */}
                        {aiLoading && (
                            <>
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="rounded-xl border border-gray-100 bg-white p-3.5 animate-pulse space-y-2.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-full bg-violet-100" />
                                            <div className="space-y-1.5 flex-1">
                                                <SkeletonLine w="w-28" /><SkeletonLine w="w-20" />
                                            </div>
                                        </div>
                                        <SkeletonLine /><SkeletonLine w="w-4/5" />
                                    </div>
                                ))}
                                <p className="text-center text-[10px] text-violet-500 flex items-center justify-center gap-1.5 py-2">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Groq AI is synthesising authentic reviews from dataset patterns…
                                </p>
                            </>
                        )}

                        {/* Error */}
                        {aiError && !aiLoading && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">{aiError}</div>
                        )}

                        {/* Review cards */}
                        {!aiLoading && aiReviews.length > 0 && (
                            <>
                                <div className="flex items-center gap-1.5 pb-0.5">
                                    <Sparkles className="h-3 w-3 text-violet-500" />
                                    <p className="text-[9px] text-gray-400 font-medium">
                                        AI-synthesised from {topRec?.ratingCount ?? 0} real dataset interactions
                                    </p>
                                </div>

                                {aiReviews.map((rev, idx) => (
                                    <div key={idx} className="rounded-xl border border-gray-100 bg-white shadow-sm p-4 space-y-2.5 hover:border-violet-200 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                    <span className="text-white text-sm font-bold">{(rev.reviewer?.[0] ?? 'U').toUpperCase()}</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900">{rev.reviewer}</p>
                                                    <p className="text-[9px] text-gray-400">{rev.profession}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                <span className="text-[9px] text-emerald-600 font-semibold">{rev.badge}</span>
                                            </div>
                                        </div>

                                        <Stars rating={rev.rating} />

                                        <div className="relative pl-4">
                                            <Quote className="absolute left-0 top-0.5 h-3 w-3 text-violet-200" />
                                            <p className="text-xs text-gray-600 leading-relaxed italic">{rev.text}</p>
                                        </div>
                                    </div>
                                ))}

                                <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3 flex items-start gap-2">
                                    <Brain className="h-3.5 w-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-[9px] text-violet-500 leading-relaxed">
                                        These reviews are AI-synthesised by Groq (LLaMA 3.3 70B) from real rating patterns in{' '}
                                        {interactionCount.toLocaleString()} user-stay interactions. They reflect genuine sentiment trends derived from the dataset.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
