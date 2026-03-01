/**
 * contextAwareFilter.ts
 * Smart amenity recommendation engine with context-aware filtering
 */

export type TimeContext = 'morning' | 'afternoon' | 'evening' | 'night';
export type DayType = 'weekday' | 'weekend';

export interface VibeWeights {
  vibe_morning: number;
  vibe_afternoon: number;
  vibe_evening: number;
  vibe_night: number;
  vibe_category?: string;
}

export interface AmenityFeature {
  type: string;
  geometry: any;
  properties: VibeWeights & {
    name?: string;
    amenity?: string;
    [key: string]: any;
  };
}

/**
 * Get current time context based on hour of day
 */
export const getTimeContext = (): TimeContext => {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 14) return 'afternoon';
  if (hour >= 14 && hour < 22) return 'evening';
  return 'night';
};

/**
 * Get day type (weekday or weekend)
 */
export const getDayType = (): DayType => {
  const day = new Date().getDay();
  return (day === 0 || day === 6) ? 'weekend' : 'weekday';
};

/**
 * Get vibe score for an amenity based on current time
 */
export const getVibeScore = (
  amenity: AmenityFeature,
  timeContext?: TimeContext
): number => {
  const context = timeContext || getTimeContext();
  const vibeKey = `vibe_${context}` as keyof VibeWeights;
  return amenity.properties[vibeKey] || 0.5;
};

/**
 * Filter and sort amenities by contextual relevance
 */
export const filterByContext = (
  amenities: AmenityFeature[],
  options: {
    timeContext?: TimeContext;
    minScore?: number;
    limit?: number;
  } = {}
): AmenityFeature[] => {
  const {
    timeContext = getTimeContext(),
    minScore = 0.3,
    limit
  } = options;

  // Score and filter
  const scored = amenities
    .map(amenity => ({
      amenity,
      score: getVibeScore(amenity, timeContext)
    }))
    .filter(item => item.score >= minScore)
    .sort((a, b) => b.score - a.score);

  const filtered = scored.map(item => item.amenity);
  return limit ? filtered.slice(0, limit) : filtered;
};

/**
 * Get top recommendations for current time
 */
export const getTopRecommendations = (
  amenities: AmenityFeature[],
  count: number = 10
): AmenityFeature[] => {
  return filterByContext(amenities, { limit: count });
};

/**
 * Group amenities by vibe category
 */
export const groupByCategory = (
  amenities: AmenityFeature[]
): Record<string, AmenityFeature[]> => {
  const grouped: Record<string, AmenityFeature[]> = {};
  
  amenities.forEach(amenity => {
    const category = amenity.properties.vibe_category || 'other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(amenity);
  });
  
  return grouped;
};

/**
 * Get contextual message for current time
 */
export const getContextMessage = (): string => {
  const context = getTimeContext();
  const dayType = getDayType();
  
  const messages = {
    morning: {
      weekday: "Good morning! Here are the best spots to start your day ☕",
      weekend: "Happy weekend morning! Perfect time for breakfast and exercise 🌅"
    },
    afternoon: {
      weekday: "Lunch time! Check out these popular spots nearby 🍽️",
      weekend: "Afternoon vibes! Great time for shopping and dining 🛍️"
    },
    evening: {
      weekday: "Evening recommendations for dinner and relaxation 🌆",
      weekend: "Weekend evening! Entertainment and dining hotspots 🎉"
    },
    night: {
      weekday: "Late night essentials and 24/7 services 🌙",
      weekend: "Night owls! Here's what's open late 🦉"
    }
  };
  
  return messages[context][dayType];
};

/**
 * Get emoji for amenity category
 */
export const getCategoryEmoji = (category: string): string => {
  const emojiMap: Record<string, string> = {
    cafe: '☕',
    restaurant: '🍽️',
    fast_food: '🍔',
    bar: '🍺',
    pub: '🍻',
    gym: '💪',
    park: '🌳',
    playground: '🎮',
    supermarket: '🛒',
    mall: '🏬',
    hospital: '🏥',
    clinic: '⚕️',
    pharmacy: '💊',
    school: '🎓',
    college: '📚',
    library: '📖',
    temple: '🛕',
    church: '⛪',
    mosque: '🕌',
    bank: '🏦',
    atm: '💳',
    fuel: '⛽',
    parking: '🅿️',
    default: '📍'
  };
  
  return emojiMap[category] || emojiMap.default;
};

/**
 * Calculate relevance score with multiple factors
 */
export const calculateRelevanceScore = (
  amenity: AmenityFeature,
  userLocation?: [number, number],
  options: {
    timeWeight: number;
    distanceWeight: number;
    popularityWeight: number;
  } = {
    timeWeight: 0.5,
    distanceWeight: 0.3,
    popularityWeight: 0.2
  }
): number => {
  let score = 0;
  
  // Time-based score
  const vibeScore = getVibeScore(amenity);
  score += vibeScore * options.timeWeight;
  
  // Distance score (if user location provided)
  if (userLocation && amenity.geometry?.coordinates) {
    const [lon, lat] = amenity.geometry.coordinates;
    const distance = haversineDistance(
      userLocation[0],
      userLocation[1],
      lat,
      lon
    );
    const distanceScore = Math.max(0, 1 - (distance / 5)); // 5km max
    score += distanceScore * options.distanceWeight;
  }
  
  // Popularity score (if available)
  const rating = amenity.properties.rating || 0;
  const popularityScore = rating / 5; // Normalize to 0-1
  score += popularityScore * options.popularityWeight;
  
  return score;
};

/**
 * Haversine distance calculation (km)
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
