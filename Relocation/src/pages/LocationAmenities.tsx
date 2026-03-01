import { useMemo, useState, useEffect } from 'react';
import { MapPin, Search, Building2, ShoppingBag, Utensils, Hospital, School, Fuel, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import CoimbatoreAssistant from '@/components/CoimbatoreAssistant';
import CoimbatoreSmartMap from '@/components/CoimbatoreSmartMap';
import { SmartAmenityList } from '@/components/SmartAmenityCard';
import AnimatedList from '@/components/AnimatedList';
import { getTimeContext } from '@/utils/contextAwareFilter';
import { haversineDistance } from '@/services/featureEngineering';
import { loadEngagementReviews, type EngagementReview } from '@/services/datasetsApi';
import api from '@/services/apiClient';

const LOCATIONS = ['Saravanampatti', 'Gandhipuram', 'RS Puram', 'Race Course', 'Ganapathy'];
const GHOST_EXAMPLES = [
  'Try: Quiet cafes with WiFi near RS Puram',
  'Try: Veg meals under 200 in Gandhipuram',
  'Try: Somewhere peaceful for an evening walk near Race Course',
  'Try: Biryani places open now around Saravanampatti',
  'Try: Coworking spaces with parking in Ganapathy'
];

const getAmenityName = (properties: any) => {
  return properties.name || properties.amenity || properties.shop || properties.leisure || 'Unnamed Location';
};

const getAmenityIcon = (properties: any) => {
  if (properties.amenity === 'hospital' || properties.healthcare) return <Hospital className="h-4 w-4 text-red-500" />;
  if (properties.amenity === 'school' || properties.amenity === 'college') return <School className="h-4 w-4 text-blue-500" />;
  if (properties.amenity === 'restaurant' || properties.amenity === 'cafe') return <Utensils className="h-4 w-4 text-orange-500" />;
  if (properties.shop) return <ShoppingBag className="h-4 w-4 text-purple-500" />;
  if (properties.amenity === 'fuel') return <Fuel className="h-4 w-4 text-yellow-600" />;
  return <Building2 className="h-4 w-4 text-gray-500" />;
};

const getAmenityDescription = (properties: any) => {
  const parts = [];
  if (properties.amenity) parts.push(`${properties.amenity}`);
  if (properties.shop) parts.push(`Shop: ${properties.shop}`);
  if (properties.cuisine) parts.push(`Cuisine: ${properties.cuisine}`);
  if (properties['addr:street']) parts.push(properties['addr:street']);
  if (properties.phone) parts.push(`📞 ${properties.phone}`);
  return parts.join(' • ') || 'No additional details';
};

const getTimeBucket = (visitTime: string) => {
  const hour = parseInt(visitTime.split(':')[0]);
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

const LocationAmenities = () => {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [amenities, setAmenities] = useState<any[]>([]);
  const [originalAmenities, setOriginalAmenities] = useState<any[]>([]);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([76.9558, 11.0168]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAmenity, setSelectedAmenity] = useState<any>(null);
  const [mapillaryImages, setMapillaryImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [reviews, setReviews] = useState<EngagementReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewFilters, setReviewFilters] = useState({
    sentiment: 'all',
    amenity_type: 'all',
    min_rating: 0,
    time_bucket: 'all',
    lifestyle: 'all',
  });
  const [naturalQuery, setNaturalQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [naturalCriteria, setNaturalCriteria] = useState<any | null>(null);
  const [naturalResults, setNaturalResults] = useState<any[]>([]);
  const [ghostText, setGhostText] = useState<string>(GHOST_EXAMPLES[0]);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % GHOST_EXAMPLES.length;
      setGhostText(GHOST_EXAMPLES[i]);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const filterByNaturalCriteria = (base: any[], criteria: any | null) => {
    if (!criteria) return base;
    let results = base.slice();
    if (criteria.type) {
      const t = String(criteria.type).toLowerCase();
      results = results.filter(a => {
        const p = a.properties || {};
        return String(p.amenity || '').toLowerCase() === t || String(p.shop || '').toLowerCase() === t;
      });
    }
    if (criteria.location) {
      const loc = String(criteria.location).toLowerCase();
      results = results.filter(a => JSON.stringify(a.properties || {}).toLowerCase().includes(loc));
    }
    if (Array.isArray(criteria.amenities) && criteria.amenities.length > 0) {
      criteria.amenities.forEach((am: string) => {
        const k = String(am).toLowerCase();
        results = results.filter(a => JSON.stringify(a.properties || {}).toLowerCase().includes(k));
      });
    }
    if (criteria.vibe === 'quiet') {
      const quietTypes = new Set(['park', 'temple', 'library', 'place_of_worship']);
      results = results.filter(a => {
        const p = a.properties || {};
        return quietTypes.has(String(p.amenity || '').toLowerCase()) || String(p.leisure || '').toLowerCase() === 'park';
      });
    }
    return results.slice(0, Math.max(results.length, 0));
  };

  const handleAssistantSearch = async (query: string): Promise<string | null> => {
    if (!query.trim()) return null;
    setSearchLoading(true);
    setNaturalQuery(query);
    try {
      const response = await api.post('/amenity/natural-search', {
        query: query,
        amenities: amenities
      });
      if (response.data) {
        const crit = response.data.criteria || null;
        setNaturalCriteria(crit);
        const filteredLocal = filterByNaturalCriteria(originalAmenities.length ? originalAmenities : amenities, crit);
        const serverResults = Array.isArray(response.data.results) ? response.data.results : [];
        const topResults = serverResults.length ? serverResults : filteredLocal.slice(0, 5);
        setNaturalResults(topResults);
        setAmenities(filteredLocal);
        setSelectedCategory('all');
        const firstResult = topResults[0];
        // Guard: ensure firstResult and its geometry exist before accessing them
        if (firstResult && firstResult.geometry) {
          const geom = firstResult.geometry;
          const coords = geom.type === 'Point'
            ? geom.coordinates
            : (Array.isArray(geom.coordinates[0]) && Array.isArray(geom.coordinates[0][0])
              ? geom.coordinates[0][0]
              : geom.coordinates[0]);
          if (coords && coords.length >= 2) {
            setMapCenter([coords[0], coords[1]]);
            handleAmenityClick(firstResult);
          }
        }
        // Return the LLM why_message from the first result if available
        if (firstResult?.properties?.why_message) {
          return firstResult.properties.why_message;
        }
        if (topResults.length > 0) {
          const name = firstResult?.properties?.name || firstResult?.properties?.amenity || 'a relevant spot';
          return `I found ${topResults.length} match${topResults.length > 1 ? 'es' : ''} near you! The top result is ${name} — check the map for more details.`;
        }
        return `I searched for "${query}" but couldn't find exact matches nearby. Try selecting a location from the dropdown first, or try a different query!`;
      }
    } catch (error: any) {
      console.error('Natural search error:', error);
      // Don't show raw error to the user, return a helpful message instead
      return `Sorry, I had trouble processing that search. Please make sure you've selected a location from the dropdown first, then try again!`;
    } finally {
      setSearchLoading(false);
    }
    return null;
  };

  const categories = [
    { id: 'all', label: 'All', icon: <Building2 className="h-4 w-4" /> },
    { id: 'worship', label: 'Worship', icon: <Building2 className="h-4 w-4" /> },
    { id: 'food', label: 'Food & Drinks', icon: <Utensils className="h-4 w-4" /> },
    { id: 'fuel', label: 'Fuel Stations', icon: <Fuel className="h-4 w-4" /> },
    { id: 'health', label: 'Healthcare', icon: <Hospital className="h-4 w-4" /> },
    { id: 'education', label: 'Education', icon: <School className="h-4 w-4" /> },
    { id: 'shopping', label: 'Shopping', icon: <ShoppingBag className="h-4 w-4" /> },
  ];

  const categorizeAmenity = (properties: any) => {
    if (properties.amenity === 'place_of_worship' || properties.religion) return 'worship';
    if (properties.amenity === 'restaurant' || properties.amenity === 'cafe' || properties.amenity === 'fast_food' || properties.amenity === 'ice_cream' || properties.shop === 'bakery') return 'food';
    if (properties.amenity === 'fuel') return 'fuel';
    if (properties.amenity === 'hospital' || properties.amenity === 'clinic' || properties.amenity === 'pharmacy' || properties.healthcare) return 'health';
    if (properties.amenity === 'school' || properties.amenity === 'college') return 'education';
    if (properties.shop) return 'shopping';
    return 'other';
  };

  const filteredAmenities = selectedCategory === 'all'
    ? amenities
    : amenities.filter(a => categorizeAmenity(a.properties) === selectedCategory);

  const filteredMarkers = filteredAmenities.slice(0, 100).map((feature: any) => {
    const coords = feature.geometry.type === 'Point'
      ? feature.geometry.coordinates
      : feature.geometry.coordinates[0]?.[0] || [76.9558, 11.0168];

    return {
      coordinates: [coords[0], coords[1]] as [number, number],
      title: getAmenityName(feature.properties),
      description: feature.properties.amenity || feature.properties.shop || ''
    };
  });

  const categoryCounts = {
    all: amenities.length,
    worship: amenities.filter(a => categorizeAmenity(a.properties) === 'worship').length,
    food: amenities.filter(a => categorizeAmenity(a.properties) === 'food').length,
    fuel: amenities.filter(a => categorizeAmenity(a.properties) === 'fuel').length,
    health: amenities.filter(a => categorizeAmenity(a.properties) === 'health').length,
    education: amenities.filter(a => categorizeAmenity(a.properties) === 'education').length,
    shopping: amenities.filter(a => categorizeAmenity(a.properties) === 'shopping').length,
  };

  const handleLocationChange = async (location: string) => {
    setSelectedLocation(location);
    setSelectedCategory('all');
    setSelectedAmenity(null);
    setNaturalCriteria(null);
    setNaturalQuery('');
    try {
      const response = await fetch(`/datasets/${location}.geojson`);
      const data = await response.json();

      if (data?.features) {
        setOriginalAmenities(data.features);
        setAmenities(data.features);

        const markers = data.features.slice(0, 100).map((feature: any) => {
          const coords = feature.geometry.type === 'Point'
            ? feature.geometry.coordinates
            : feature.geometry.coordinates[0]?.[0] || [76.9558, 11.0168];

          return {
            coordinates: [coords[0], coords[1]] as [number, number],
            title: getAmenityName(feature.properties),
            description: feature.properties.amenity || feature.properties.shop || ''
          };
        });

        setMapMarkers(markers);
        if (markers.length > 0) {
          setMapCenter(markers[0].coordinates);
        }
      }
      // Load engagement reviews for sidebar
      setLoadingReviews(true);
      try {
        // Try API first
        let fetched = await loadEngagementReviews({ limit: 500 });

        // If API returns empty, load from CSV as fallback
        if (!fetched || fetched.length === 0) {
          const csvResponse = await fetch('/datasets/coimbatore_engagement_data.csv');
          const csvText = await csvResponse.text();
          const lines = csvText.split('\n').slice(1); // Skip header

          fetched = lines.filter(line => line.trim()).map(line => {
            const values = line.split(',');
            return {
              user_id: values[0],
              reviewer_name: values[1],
              age: Number(values[2]),
              lifestyle: values[3],
              location_id: values[4],
              location_name: values[5],
              area: values[6],
              amenity_type: values[7],
              visit_time: values[8],
              dwell_time_mins: Number(values[9]),
              rating: Number(values[10]),
              sentiment: values[11],
              review_text: values.slice(12).join(','),
              time_bucket: getTimeBucket(values[8])
            };
          });
        }

        setReviews(fetched);
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    } catch (error) {
      console.error('Error loading amenities:', error);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedAmenity(null);

    if (categoryId !== 'all') {
      const filtered = amenities.filter(a => categorizeAmenity(a.properties) === categoryId);
      if (filtered.length > 0) {
        const firstItem = filtered[0];
        const coords = firstItem.geometry.type === 'Point'
          ? firstItem.geometry.coordinates
          : firstItem.geometry.coordinates[0]?.[0];
        if (coords) {
          setMapCenter([coords[0], coords[1]]);
        }
      }
    }
  };

  const handleAmenityClick = async (amenity: any) => {
    setSelectedAmenity(amenity);
    const coords = amenity.geometry.type === 'Point'
      ? amenity.geometry.coordinates
      : amenity.geometry.coordinates[0]?.[0];
    if (coords) {
      setMapCenter([coords[0], coords[1]]);

      // Update markers to show only the selected amenity
      setMapMarkers([{
        coordinates: [coords[0], coords[1]] as [number, number],
        title: getAmenityName(amenity.properties),
        description: amenity.properties.amenity || amenity.properties.shop || ''
      }]);

      setLoadingImages(true);
      try {
        const response = await fetch(
          `https://graph.mapillary.com/images?access_token=MLY|26188936157384961|c640e27cc20168034f2ba6883c3683cc&fields=id,thumb_1024_url,thumb_256_url&bbox=${coords[0] - 0.001},${coords[1] - 0.001},${coords[0] + 0.001},${coords[1] + 0.001}&limit=5`
        );
        const data = await response.json();
        setMapillaryImages(data.data || []);
      } catch (error) {
        console.error('Error fetching Mapillary images:', error);
        setMapillaryImages([]);
      } finally {
        setLoadingImages(false);
      }
    }
  };

  const isWeekend = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 || d === 6;
  }, []);

  const timeContext = useMemo(() => getTimeContext(), []);

  const togglePreference = (pref: string) => {
    setPreferences(prev => prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]);
  };

  const categoryEmoji = (cat: string) => {
    if (cat === 'food') return '🍽️';
    if (cat === 'shopping') return '🛍️';
    if (cat === 'health') return '🏥';
    if (cat === 'education') return '🎓';
    if (cat === 'fuel') return '⛽';
    if (cat === 'worship') return '🛕';
    return '📍';
  };

  const contextIcon = (ctx: string) => {
    if (ctx === 'morning') return '☀️';
    if (ctx === 'afternoon') return '🌤️';
    if (ctx === 'evening') return '🌆';
    return '🌙';
  };

  const getBaseVibe = (cat: string, ctx: string) => {
    if (ctx === 'morning') {
      if (cat === 'food') return 0.7;
      if (cat === 'health') return 0.6;
      if (cat === 'education') return 0.6;
      return 0.4;
    }
    if (ctx === 'afternoon') {
      if (cat === 'food') return 0.8;
      if (cat === 'shopping') return 0.7;
      if (cat === 'worship') return 0.5;
      return 0.5;
    }
    if (ctx === 'evening') {
      if (cat === 'food') return 0.9;
      if (cat === 'shopping') return 0.8;
      return 0.5;
    }
    if (ctx === 'night') {
      if (cat === 'food') return 0.6;
      return 0.3;
    }
    return 0.5;
  };

  const enrichedAmenities = useMemo(() => {
    const centerLat = mapCenter[1];
    const centerLon = mapCenter[0];
    const favWeekend = new Set(['shopping', 'food', 'entertainment', 'park']);
    return amenities.map(a => {
      const cat = categorizeAmenity(a.properties);
      const coords = a.geometry.type === 'Point' ? a.geometry.coordinates : a.geometry.coordinates[0]?.[0] || [centerLon, centerLat];
      const distanceKm = haversineDistance(centerLat, centerLon, coords[1], coords[0]);
      const vibe = getBaseVibe(cat, timeContext);
      const prefBoost = preferences.includes(cat) ? 0.2 : 0;
      const weekendBoost = isWeekend && favWeekend.has(cat) ? 0.3 : 0;
      const distFactor = Math.max(0, 1 - Math.min(distanceKm, 5) / 5);
      const score = Math.min(1, vibe * 0.6 + distFactor * 0.3 + prefBoost + weekendBoost * 0.1);
      const matchPct = Math.round(score * 100);
      const why = [
        timeContext === 'evening' ? 'Evening vibe' : timeContext === 'morning' ? 'Morning-friendly' : timeContext === 'afternoon' ? 'Lunch-time spot' : 'Late-hour friendly',
        preferences.includes(cat) ? 'matches your preference' : 'popular nearby',
        distanceKm < 1 ? 'very close' : distanceKm < 3 ? 'nearby' : 'a short ride'
      ].join(' • ');
      return {
        ...a,
        properties: {
          ...a.properties,
          vibe_category: cat,
          category_emoji: categoryEmoji(cat),
          context_icon: contextIcon(timeContext),
          match_percentage: matchPct,
          relevance_score: score,
          distance_km: Number(distanceKm.toFixed(2)),
          why_message: why
        }
      };
    }).sort((x, y) => (y.properties.relevance_score || 0) - (x.properties.relevance_score || 0));
  }, [amenities, mapCenter, preferences, timeContext, isWeekend]);

  const topRecommended = useMemo(() => enrichedAmenities.slice(0, 10), [enrichedAmenities]);

  // Reviews derived sets and filters
  const reviewAmenityTypes = useMemo(() => {
    const set = new Set<string>();
    reviews.forEach(r => { if (r.amenity_type) set.add(String(r.amenity_type)); });
    return Array.from(set).sort();
  }, [reviews]);

  const reviewLifestyles = useMemo(() => {
    const set = new Set<string>();
    reviews.forEach(r => { if (r.lifestyle) set.add(String(r.lifestyle)); });
    return Array.from(set).sort();
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    let filtered = reviews;

    // Filter by selected location area
    if (selectedLocation) {
      filtered = filtered.filter(r =>
        r.area?.toLowerCase().includes(selectedLocation.toLowerCase()) ||
        r.location_name?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    // Apply other filters
    filtered = filtered.filter(r => {
      if (reviewFilters.sentiment !== 'all' && (r.sentiment || '').toLowerCase() !== reviewFilters.sentiment) return false;
      if (reviewFilters.amenity_type !== 'all' && (String(r.amenity_type || '').toLowerCase() !== reviewFilters.amenity_type)) return false;
      if (reviewFilters.time_bucket !== 'all' && (String((r as any).time_bucket || '').toLowerCase() !== reviewFilters.time_bucket)) return false;
      if (reviewFilters.lifestyle !== 'all' && (String(r.lifestyle || '').toLowerCase() !== reviewFilters.lifestyle)) return false;
      return true;
    });

    return filtered;
  }, [reviews, reviewFilters, selectedLocation]);

  const reviewStats = useMemo(() => {
    if (filteredReviews.length === 0) return { count: 0, avgRating: 0, avgDwell: 0 };
    const sumR = filteredReviews.reduce((s, r) => s + (typeof r.rating === 'number' ? r.rating : Number(r.rating || 0)), 0);
    const sumD = filteredReviews.reduce((s, r) => s + (typeof r.dwell_time_mins === 'number' ? r.dwell_time_mins : Number(r.dwell_time_mins || 0)), 0);
    return {
      count: filteredReviews.length,
      avgRating: +(sumR / filteredReviews.length).toFixed(1),
      avgDwell: Math.round(sumD / filteredReviews.length || 0),
    };
  }, [filteredReviews]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Location Amenities Finder</h1>
          <p className="text-gray-600">Discover amenities around Coimbatore</p>
        </div>

        <Card className="p-6 mb-6 bg-white/80 backdrop-blur">
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-gray-500" />
            <Select value={selectedLocation} onValueChange={handleLocationChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your location in Coimbatore" />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {selectedLocation && (
          <div className="mb-6">
            {naturalCriteria && (
              <div className="mb-3 flex flex-wrap gap-2">
                {naturalCriteria.type ? (
                  <button
                    className="px-2 py-0.5 text-xs rounded-full bg-purple-600 text-white"
                    onClick={() => { const c = { ...naturalCriteria, type: null }; setNaturalCriteria(c); setAmenities(filterByNaturalCriteria(originalAmenities, c)); }}
                  >{naturalCriteria.type} ✕</button>
                ) : null}
                {naturalCriteria.location ? (
                  <button
                    className="px-2 py-0.5 text-xs rounded-full bg-purple-600 text-white"
                    onClick={() => { const c = { ...naturalCriteria, location: null }; setNaturalCriteria(c); setAmenities(filterByNaturalCriteria(originalAmenities, c)); }}
                  >{naturalCriteria.location} ✕</button>
                ) : null}
                {Array.isArray(naturalCriteria.amenities) ? naturalCriteria.amenities.map((am: string, idx: number) => (
                  <button
                    key={idx}
                    className="px-2 py-0.5 text-xs rounded-full bg-purple-600 text-white"
                    onClick={() => {
                      const next = (naturalCriteria.amenities || []).filter((x: string, i: number) => i !== idx);
                      const c = { ...naturalCriteria, amenities: next };
                      setNaturalCriteria(c);
                      setAmenities(filterByNaturalCriteria(originalAmenities, c));
                    }}
                  >{am} ✕</button>
                )) : null}
                {naturalCriteria.vibe ? (
                  <button
                    className="px-2 py-0.5 text-xs rounded-full bg-purple-600 text-white"
                    onClick={() => { const c = { ...naturalCriteria, vibe: null }; setNaturalCriteria(c); setAmenities(filterByNaturalCriteria(originalAmenities, c)); }}
                  >{naturalCriteria.vibe} ✕</button>
                ) : null}
                {naturalCriteria.cuisine ? (
                  <button
                    className="px-2 py-0.5 text-xs rounded-full bg-purple-600 text-white"
                    onClick={() => { const c = { ...naturalCriteria, cuisine: null }; setNaturalCriteria(c); setAmenities(filterByNaturalCriteria(originalAmenities, c)); }}
                  >{naturalCriteria.cuisine} ✕</button>
                ) : null}
                {naturalCriteria.budget ? (
                  <button
                    className="px-2 py-0.5 text-xs rounded-full bg-purple-600 text-white"
                    onClick={() => { const c = { ...naturalCriteria, budget: null }; setNaturalCriteria(c); setAmenities(filterByNaturalCriteria(originalAmenities, c)); }}
                  >{naturalCriteria.budget} ✕</button>
                ) : null}
                <button
                  className="px-2 py-0.5 text-xs rounded-full border border-purple-300 text-purple-700 bg-white"
                  onClick={() => { setNaturalCriteria(null); setAmenities(originalAmenities); }}
                >Clear all</button>
              </div>
            )}
            {naturalResults.length > 0 ? (
              <div className="mt-4">
                <div className="text-sm font-semibold text-purple-900 mb-2">Top matches</div>
                <div className="space-y-2">
                  {naturalResults.map((amenity, idx) => (
                    <Card
                      key={idx}
                      className="p-2 border-purple-200 hover:border-purple-400 cursor-pointer"
                      onClick={() => handleAmenityClick(amenity)}
                    >
                      <div className="flex items-start gap-2">
                        <div>{getAmenityIcon(amenity.properties)}</div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold">{getAmenityName(amenity.properties)}</div>
                          <div className="text-xs text-gray-600">{getAmenityDescription(amenity.properties)}</div>
                          {amenity.properties.why_message && (
                            <div className="text-xs mt-1 text-purple-700 bg-purple-50 p-1.5 rounded flex items-center gap-1.5 border border-purple-100 animate-fade-in">
                              <Sparkles className="h-3 w-3" />
                              {amenity.properties.why_message}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : naturalCriteria && (
              <div className="mt-4 text-center p-4 bg-purple-50 rounded-lg border border-purple-100 animate-fade-in">
                <p className="text-purple-800 font-medium">No exact matches found.</p>
                <p className="text-sm text-purple-600 mt-1">Try clearing some filters or searching for something else.</p>
              </div>
            )}
          </div>
        )}

        {selectedLocation && amenities.length > 0 && (
          <>
            <Card className="p-4 bg-white/80 backdrop-blur mb-6">
              <h3 className="text-lg font-semibold mb-3">Filter by Category</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${selectedCategory === cat.id
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                      }`}
                  >
                    {cat.icon}
                    <span className="font-medium">{cat.label}</span>
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${selectedCategory === cat.id ? 'bg-blue-600' : 'bg-gray-100'
                      }`}>
                      {categoryCounts[cat.id as keyof typeof categoryCounts]}
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-4 bg-white/80 backdrop-blur mb-0 h-[600px] flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Smart Recommendations</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-600">Preferences:</span>
                    <div className="flex flex-wrap gap-1">
                      {['food', 'shopping', 'health', 'education', 'fuel', 'worship'].map(p => (
                        <button
                          key={p}
                          onClick={() => togglePreference(p)}
                          className={`px-2 py-0.5 rounded-full text-[10px] border ${preferences.includes(p) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <SmartAmenityList
                    amenities={topRecommended}
                    timeContext={timeContext}
                    isWeekend={isWeekend}
                    message="AI-powered suggestions based on time, distance & preferences"
                    onAmenityClick={handleAmenityClick}
                  />
                </div>
              </Card>

              <Card className="p-6 bg-white/80 backdrop-blur h-[600px] flex flex-col">
                <h2 className="text-2xl font-bold mb-2">Reviews & Engagement</h2>
                <p className="text-sm text-gray-600 mb-4">From local visitors around {selectedLocation}</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-2 rounded border text-center">
                    <div className="text-xs text-gray-500">Reviews</div>
                    <div className="text-lg font-bold">{reviewStats.count}</div>
                  </div>
                  <div className="p-2 rounded border text-center">
                    <div className="text-xs text-gray-500">Avg Rating</div>
                    <div className="text-lg font-bold">{reviewStats.avgRating}</div>
                  </div>
                  <div className="p-2 rounded border text-center">
                    <div className="text-xs text-gray-500">Avg Dwell</div>
                    <div className="text-lg font-bold">{reviewStats.avgDwell}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Select value={reviewFilters.sentiment} onValueChange={(v) => setReviewFilters(f => ({ ...f, sentiment: v }))}>
                    <SelectTrigger><SelectValue placeholder="Sentiment" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sentiments</SelectItem>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={reviewFilters.time_bucket} onValueChange={(v) => setReviewFilters(f => ({ ...f, time_bucket: v }))}>
                    <SelectTrigger><SelectValue placeholder="Time" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Times</SelectItem>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                      <SelectItem value="night">Night</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={reviewFilters.amenity_type} onValueChange={(v) => setReviewFilters(f => ({ ...f, amenity_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Amenity Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {reviewAmenityTypes.map(t => (
                        <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={reviewFilters.lifestyle} onValueChange={(v) => setReviewFilters(f => ({ ...f, lifestyle: v }))}>
                    <SelectTrigger><SelectValue placeholder="Lifestyle" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Lifestyles</SelectItem>
                      {reviewLifestyles.map(t => (
                        <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 overflow-hidden">
                  {loadingReviews ? (
                    <p className="text-sm text-gray-500">Loading reviews…</p>
                  ) : filteredReviews.length === 0 ? (
                    <p className="text-sm text-gray-500">No reviews match current filters</p>
                  ) : (
                    <AnimatedList
                      items={filteredReviews.map((r, idx) => (
                        <Card key={idx} className="p-3 border-l-4 border-l-emerald-500">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-sm font-semibold text-gray-800">{r.reviewer_name || r.user_id || 'Unknown User'}</div>
                              <div className="text-xs text-gray-500">
                                {(r.location_name || r.area) ? `${r.location_name || r.area} • ` : ''}{r.amenity_type || 'Amenity'} • {(r as any).time_bucket || 'time'} • {r.visit_time}
                              </div>
                            </div>
                            <div className="text-xs text-gray-700">
                              <span className="font-bold">{typeof r.rating === 'number' ? r.rating : Number(r.rating || 0)}</span> ⭐
                              <span className={`ml-2 px-2 py-0.5 rounded-full ${String(r.sentiment).toLowerCase() === 'positive' ? 'bg-green-100 text-green-700' : String(r.sentiment).toLowerCase() === 'negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                {r.sentiment}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Dwell: {r.dwell_time_mins} mins • Area: {r.area}
                          </div>
                          {r.review_text && (
                            <div className="text-sm text-gray-800 mt-1 line-clamp-3">{r.review_text}</div>
                          )}
                        </Card>
                      ))}
                      showGradients={true}
                      displayScrollbar={true}
                    />
                  )}
                </div>
              </Card>

              <Card className="p-6 bg-white/80 backdrop-blur lg:col-span-2">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-blue-500" />
                  Interactive Map - {selectedLocation}
                </h2>
                <CoimbatoreSmartMap
                  center={mapCenter}
                  zoom={15}
                  markers={filteredMarkers}
                  height="500px"
                  selectedMarker={selectedAmenity ? {
                    coordinates: selectedAmenity.geometry.type === 'Point'
                      ? [selectedAmenity.geometry.coordinates[0], selectedAmenity.geometry.coordinates[1]]
                      : [selectedAmenity.geometry.coordinates[0]?.[0]?.[0] || mapCenter[0], selectedAmenity.geometry.coordinates[0]?.[0]?.[1] || mapCenter[1]],
                    title: getAmenityName(selectedAmenity.properties),
                    description: getAmenityDescription(selectedAmenity.properties)
                  } : null}
                />
                <div className="mt-3 text-sm text-gray-600 text-center animate-fade-in">
                  {selectedAmenity ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full font-medium">
                      <span className="animate-pulse">📍</span>
                      Focused on selected location
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      📍 Showing {filteredMarkers.length} locations on map
                    </span>
                  )}
                </div>
              </Card>

              <Card className="p-6 bg-white/80 backdrop-blur">
                <h2 className="text-2xl font-bold mb-4">Amenities in {selectedLocation}</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Showing {filteredAmenities.length} {selectedCategory === 'all' ? 'amenities' : categories.find(c => c.id === selectedCategory)?.label.toLowerCase()}
                </p>

                {selectedAmenity && (
                  <Card className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-lg animate-slide-in">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2">
                        <span className="animate-bounce">📍</span>
                        {getAmenityName(selectedAmenity.properties)}
                      </h3>
                      <button
                        onClick={() => {
                          setSelectedAmenity(null);
                          setMapillaryImages([]);
                          // Restore all markers when closing
                          const markers = filteredAmenities.slice(0, 100).map((feature: any) => {
                            const coords = feature.geometry.type === 'Point'
                              ? feature.geometry.coordinates
                              : feature.geometry.coordinates[0]?.[0] || [76.9558, 11.0168];
                            return {
                              coordinates: [coords[0], coords[1]] as [number, number],
                              title: getAmenityName(feature.properties),
                              description: feature.properties.amenity || feature.properties.shop || ''
                            };
                          });
                          setMapMarkers(markers);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200 hover:rotate-90"
                      >
                        ✕
                      </button>
                    </div>

                    {loadingImages && (
                      <p className="text-sm text-gray-600 mb-2">Loading street view images...</p>
                    )}

                    {mapillaryImages.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-blue-800 mb-2">📸 Street View Images</p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {mapillaryImages.map((img) => (
                            <img
                              key={img.id}
                              src={img.thumb_256_url}
                              alt="Street view"
                              className="h-32 w-48 object-cover rounded border-2 border-blue-200 flex-shrink-0 cursor-pointer hover:border-blue-400"
                              onClick={() => window.open(`https://www.mapillary.com/app/?pKey=${img.id}`, '_blank')}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 text-sm">
                      {selectedAmenity.properties.amenity && (
                        <p><strong>Type:</strong> {selectedAmenity.properties.amenity}</p>
                      )}
                      {selectedAmenity.properties.shop && (
                        <p><strong>Shop Type:</strong> {selectedAmenity.properties.shop}</p>
                      )}
                      {selectedAmenity.properties.cuisine && (
                        <p><strong>Cuisine:</strong> {selectedAmenity.properties.cuisine}</p>
                      )}
                      {selectedAmenity.properties['addr:street'] && (
                        <p><strong>Address:</strong> {selectedAmenity.properties['addr:street']}</p>
                      )}
                      {selectedAmenity.properties['addr:full'] && (
                        <p><strong>Full Address:</strong> {selectedAmenity.properties['addr:full']}</p>
                      )}
                      {selectedAmenity.properties.phone && (
                        <p><strong>Phone:</strong> {selectedAmenity.properties.phone}</p>
                      )}
                      {selectedAmenity.properties.website && (
                        <p><strong>Website:</strong> <a href={selectedAmenity.properties.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedAmenity.properties.website}</a></p>
                      )}
                      {selectedAmenity.properties.opening_hours && (
                        <p><strong>Hours:</strong> {selectedAmenity.properties.opening_hours}</p>
                      )}
                      {selectedAmenity.properties.rating && (
                        <p><strong>Rating:</strong> {selectedAmenity.properties.rating} ⭐</p>
                      )}
                      {selectedAmenity.properties.description && (
                        <p><strong>Description:</strong> {selectedAmenity.properties.description}</p>
                      )}
                      {selectedAmenity.properties.operator && (
                        <p><strong>Operator:</strong> {selectedAmenity.properties.operator}</p>
                      )}
                      {selectedAmenity.properties.email && (
                        <p><strong>Email:</strong> {selectedAmenity.properties.email}</p>
                      )}
                      {selectedAmenity.properties.wheelchair && (
                        <p><strong>Wheelchair Access:</strong> {selectedAmenity.properties.wheelchair}</p>
                      )}
                      {selectedAmenity.properties.wifi && (
                        <p><strong>WiFi:</strong> {selectedAmenity.properties.wifi}</p>
                      )}
                      {selectedAmenity.properties.parking && (
                        <p><strong>Parking:</strong> {selectedAmenity.properties.parking}</p>
                      )}
                    </div>
                  </Card>
                )}

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredAmenities.map((amenity, idx) => (
                    <Card
                      key={idx}
                      className={`transition-all duration-500 border-l-4 cursor-pointer animate-fade-in ${selectedAmenity === amenity
                        ? 'p-4 border-l-red-500 bg-gradient-to-r from-red-50 to-pink-50 shadow-xl scale-100 ring-2 ring-red-200'
                        : selectedAmenity
                          ? 'p-2 border-l-gray-300 bg-white opacity-40 scale-95 blur-[1px]'
                          : 'p-4 border-l-blue-500 hover:shadow-lg hover:scale-[1.02] hover:border-l-blue-600 hover:bg-blue-50'
                        }`}
                      onClick={() => handleAmenityClick(amenity)}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 transition-all ${selectedAmenity === amenity ? 'scale-100' : selectedAmenity ? 'scale-75' : 'scale-100'
                          }`}>
                          {getAmenityIcon(amenity.properties)}
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-bold text-gray-900 mb-1 transition-all ${selectedAmenity === amenity ? 'text-base' : selectedAmenity ? 'text-sm' : 'text-base'
                            }`}>
                            {getAmenityName(amenity.properties)}
                          </h3>
                          {(!selectedAmenity || selectedAmenity === amenity) && (
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {getAmenityDescription(amenity.properties)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>

            </div>
          </>
        )}
      </div>
      <CoimbatoreAssistant onSearch={handleAssistantSearch} />
    </div>
  );
};

export default LocationAmenities;
