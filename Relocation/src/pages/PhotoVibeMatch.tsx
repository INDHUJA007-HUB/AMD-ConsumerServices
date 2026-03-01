import { useState, useCallback } from 'react';
import { Upload, Camera, MapPin, Sparkles, TrendingUp, Image as ImageIcon, X, Star, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Dock from '@/components/Dock';
import CoimbatoreSmartMap from '@/components/CoimbatoreSmartMap';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PlaceTypeResult {
  key: string;
  label: string;
  emoji: string;
  confidence: number;
  all_scores: Array<{ key: string; emoji: string; score: number }>;
}

interface MatchedPlace {
  name: string;
  area: string;
  description: string;
  coordinates: [number, number];
  mapillary_image: string | null;
  match_pct: number;
  why_match: string;
}

interface VibeResult {
  detected_type: PlaceTypeResult;
  matched_places: MatchedPlace[];
}

// ── Scanning steps ─────────────────────────────────────────────────────────────
const SCAN_STEPS = [
  '📸 Reading visual patterns...',
  '🧠 Running CLIP classification...',
  '🌆 Matching Coimbatore vibes...',
  '📍 Finding similar spots...',
  '✨ Generating explanations...',
];

const PhotoVibeMatch = () => {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [matching, setMatching] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [result, setResult] = useState<VibeResult | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<MatchedPlace | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // ── Upload handlers ─────────────────────────────────────────────────────────
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const fileArr = Array.from(files);
    if (uploadedImages.length + fileArr.length > 3) {
      alert('Maximum 3 photos allowed');
      return;
    }
    fileArr.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => setUploadedImages(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }, [uploadedImages]);

  // ── Analyse ─────────────────────────────────────────────────────────────────
  const findMatches = async () => {
    if (uploadedImages.length === 0) { alert('Please upload at least 1 photo'); return; }
    setMatching(true);
    setResult(null);
    setSelectedPlace(null);

    for (let i = 0; i < SCAN_STEPS.length; i++) {
      setScanStep(SCAN_STEPS[i]);
      await new Promise(r => setTimeout(r, 900));
    }

    try {
      const resp = await fetch('http://localhost:5000/api/place-classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: uploadedImages })
      });
      if (!resp.ok) throw new Error(`API error ${resp.status}`);
      const data: VibeResult = await resp.json();
      setResult(data);
      if (data.matched_places?.length > 0) setSelectedPlace(data.matched_places[0]);
    } catch (err) {
      console.error(err);
      alert('Could not connect to the AI server. Make sure vibe_match_api.py is running on port 5000.');
    } finally {
      setMatching(false);
      setScanStep('');
    }
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const MatchBar = ({ pct }: { pct: number }) => (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );

  const PlaceCard = ({ place, active }: { place: MatchedPlace; active: boolean }) => (
    <div
      onClick={() => setSelectedPlace(place)}
      className={`cursor-pointer rounded-2xl border-2 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${active ? 'border-violet-500 ring-2 ring-violet-200' : 'border-gray-100 hover:border-violet-200'
        }`}
    >
      {/* place image */}
      <div className="relative h-40 bg-gradient-to-br from-slate-700 to-slate-900 overflow-hidden">
        {place.mapillary_image ? (
          <img
            src={place.mapillary_image}
            alt={place.name}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white/40 gap-2">
            <ImageIcon className="h-10 w-10" />
            <span className="text-xs">Street view unavailable</span>
          </div>
        )}
        {/* Match badge */}
        <div className="absolute top-2 right-2 bg-violet-600 text-white text-sm font-bold px-2.5 py-1 rounded-full shadow-lg">
          {place.match_pct}% match
        </div>
      </div>

      {/* details */}
      <div className="p-4 bg-white">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-bold text-gray-900 leading-tight">{place.name}</h4>
          <ChevronRight className={`h-4 w-4 shrink-0 mt-0.5 transition-colors ${active ? 'text-violet-500' : 'text-gray-300'}`} />
        </div>
        <p className="text-xs text-violet-600 font-medium mb-2 flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {place.area}
        </p>
        <MatchBar pct={place.match_pct} />
        <p className="text-xs text-gray-600 mt-3 line-clamp-2">{place.description}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur border border-violet-200 rounded-full px-4 py-1.5 text-sm text-violet-700 font-medium mb-4 shadow-sm">
            <Sparkles className="h-4 w-4" />
            Powered by Hugging Face CLIP + Groq AI
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2 leading-tight">
            📸 Photo-to-Vibe Matching
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Upload a photo of any place — park, café, mall, temple, waterfall — and we'll find the most similar spots in Coimbatore.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ─── Left: Upload + Detected type ────────────────────────────── */}
          <div className="space-y-5">
            {/* Upload card */}
            <Card className="p-6 bg-white/80 backdrop-blur border-0 shadow-lg rounded-3xl">
              <h2 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-violet-500" />
                Upload Your Place Photos
              </h2>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors mb-4 cursor-pointer ${dragOver ? 'border-violet-500 bg-violet-50' : 'border-violet-200 hover:border-violet-400 hover:bg-violet-50/50'
                  }`}
              >
                <input
                  type="file" accept="image/*" multiple id="img-upload"
                  onChange={e => addFiles(e.target.files)}
                  className="hidden" disabled={uploadedImages.length >= 3}
                />
                <label htmlFor="img-upload" className="cursor-pointer block">
                  <div className="bg-violet-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-violet-500" />
                  </div>
                  <p className="font-semibold text-gray-700">Drop photos here or click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">{uploadedImages.length}/3 photos • Parks, cafés, malls, waterfalls, temples…</p>
                </label>
              </div>

              {/* Thumbnails */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden border-2 border-violet-100">
                      <img src={img} alt="" className={`w-full h-28 object-cover ${matching ? 'opacity-40' : ''}`} />
                      {matching && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-400/40 to-transparent animate-[shimmer_1.5s_infinite]" />
                      )}
                      {!matching && (
                        <button
                          onClick={() => setUploadedImages(p => p.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={findMatches}
                disabled={uploadedImages.length === 0 || matching}
                className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white rounded-xl text-base py-5 shadow-md font-semibold"
              >
                {matching ? (
                  <><Sparkles className="h-5 w-5 mr-2 animate-spin" />{scanStep}</>
                ) : (
                  <><Sparkles className="h-5 w-5 mr-2" />Find My Coimbatore Match</>
                )}
              </Button>
            </Card>

            {/* Detected Place Type card */}
            {result?.detected_type && (
              <Card className="p-5 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-3xl shadow-xl border-0">
                <p className="text-sm font-medium text-violet-200 mb-1 uppercase tracking-wide">Detected Place Type</p>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-5xl">{result.detected_type.emoji}</span>
                  <div>
                    <h3 className="text-2xl font-extrabold capitalize leading-tight">
                      {result.detected_type.label.split(' ').slice(0, 3).join(' ')}
                    </h3>
                    <p className="text-violet-200 text-sm font-semibold">
                      {result.detected_type.confidence.toFixed(1)}% confidence
                    </p>
                  </div>
                </div>
                {/* Confidence bar */}
                <div className="w-full bg-white/20 rounded-full h-2 mb-4">
                  <div
                    className="h-2 rounded-full bg-white transition-all duration-700"
                    style={{ width: `${result.detected_type.confidence}%` }}
                  />
                </div>
                {/* Other type thumbnails */}
                <div className="flex gap-2 flex-wrap">
                  {result.detected_type.all_scores.slice(1, 5).map(s => (
                    <div key={s.key} className="flex items-center gap-1 bg-white/15 rounded-full px-3 py-1 text-xs font-medium">
                      <span>{s.emoji}</span>
                      <span>{s.key}</span>
                      <span className="text-violet-300">{s.score.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* How it works */}
            {!result && !matching && (
              <Card className="p-5 bg-white/70 backdrop-blur rounded-3xl border-0 shadow-sm">
                <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">How It Works</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: '📸', title: 'Upload Photo', desc: 'Any place you love' },
                    { icon: '🤗', title: 'Hugging Face CLIP', desc: 'Zero-shot AI classification' },
                    { icon: '🌆', title: 'Coimbatore Match', desc: 'Finds similar local spots' },
                    { icon: '✨', title: 'Groq Explains', desc: "Why it's a perfect match" },
                  ].map(s => (
                    <div key={s.title} className="flex gap-2 items-start p-3 bg-violet-50 rounded-xl">
                      <span className="text-2xl">{s.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-800 text-xs">{s.title}</p>
                        <p className="text-gray-500 text-xs">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* ─── Right: Results ───────────────────────────────────────────── */}
          <div className="space-y-5">
            {result?.matched_places && result.matched_places.length > 0 ? (
              <>
                <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-violet-500" />
                  Similar Places in Coimbatore
                </h2>
                {/* Place cards */}
                <div className="space-y-3">
                  {result.matched_places.map((p, i) => (
                    <PlaceCard key={i} place={p} active={selectedPlace?.name === p.name} />
                  ))}
                </div>

                {/* Selected place expanded panel */}
                {selectedPlace && (
                  <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl shadow-md">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
                      <h3 className="font-bold text-gray-900">Why This Matches Your Photo</h3>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-4">{selectedPlace.why_match}</p>

                    {/* Mini Map */}
                    <div className="rounded-xl overflow-hidden border border-amber-200">
                      <CoimbatoreSmartMap
                        center={selectedPlace.coordinates}
                        zoom={15}
                        markers={[{
                          coordinates: selectedPlace.coordinates,
                          title: selectedPlace.name,
                          description: `${selectedPlace.match_pct}% match • ${selectedPlace.area}`
                        }]}
                        height="200px"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedPlace.name} — {selectedPlace.area}
                    </p>
                  </Card>
                )}
              </>
            ) : result && !matching ? (
              <Card className="p-10 flex flex-col items-center justify-center text-center bg-white/80 rounded-3xl border-0 shadow">
                <span className="text-5xl mb-3">🤔</span>
                <h3 className="font-bold text-gray-800 mb-2">No Strong Matches Found</h3>
                <p className="text-gray-500 text-sm">Try uploading a clearer photo of a specific type of place.</p>
              </Card>
            ) : !matching ? (
              <Card className="p-10 flex flex-col items-center justify-center text-center bg-white/80 rounded-3xl border-0 shadow h-80">
                <div className="bg-violet-100 rounded-full p-5 mb-4">
                  <Camera className="h-12 w-12 text-violet-400" />
                </div>
                <h3 className="font-bold text-gray-700 mb-1">Upload a photo to get started</h3>
                <p className="text-gray-400 text-sm max-w-xs">
                  We'll detect what type of place it is and find the most similar spots in Coimbatore.
                </p>
              </Card>
            ) : (
              <Card className="p-10 flex flex-col items-center justify-center text-center bg-white/80 rounded-3xl border-0 shadow h-80">
                <Sparkles className="h-12 w-12 text-violet-400 animate-pulse mb-3" />
                <h3 className="font-bold text-gray-700 mb-1">Analyzing your photo…</h3>
                <p className="text-gray-400 text-sm">{scanStep}</p>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Dock />
    </div>
  );
};

export default PhotoVibeMatch;
