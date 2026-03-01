import { Card } from '@/components/ui/card';
import AnimatedList from './AnimatedList';

interface SmartAmenityCardProps {
  amenity: {
    properties: {
      name: string;
      vibe_category: string;
      category_emoji: string;
      context_icon: string;
      match_percentage: number;
      relevance_score: number;
      distance_km?: number;
      why_message: string;
      [key: string]: any;
    };
    geometry: {
      coordinates: [number, number];
    };
  };
  onClick?: () => void;
}

export const SmartAmenityCard = ({ amenity, onClick }: SmartAmenityCardProps) => {
  const { properties } = amenity;
  const matchPercentage = properties.match_percentage || 0;
  
  // Progress circle color based on score
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };
  
  const scoreColor = getScoreColor(matchPercentage);
  
  return (
    <Card
      className="p-3 hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-500 hover:border-l-purple-500"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {/* Category Emoji + Progress Circle */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <span className="text-2xl">{properties.category_emoji || '📍'}</span>
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 transform -rotate-90">
              <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="none" className="text-gray-200" />
              <circle
                cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="none"
                strokeDasharray={`${2 * Math.PI * 16}`}
                strokeDashoffset={`${2 * Math.PI * 16 * (1 - matchPercentage / 100)}`}
                className={`${scoreColor} transition-all duration-500`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-[10px] font-bold ${scoreColor}`}>{matchPercentage}%</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <h3 className="font-semibold text-sm text-gray-900 truncate">{properties.name || 'Unnamed Place'}</h3>
            <span className="text-base flex-shrink-0">{properties.context_icon || '⏰'}</span>
          </div>
          <p className="text-xs text-blue-600 italic truncate mb-1">{properties.why_message}</p>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">{properties.vibe_category || 'place'}</span>
            {properties.distance_km && <span>📍 {properties.distance_km}km</span>}
          </div>
        </div>
      </div>
    </Card>
  );
};

interface SmartAmenityListProps {
  amenities: any[];
  timeContext: string;
  isWeekend: boolean;
  message: string;
  onAmenityClick?: (amenity: any) => void;
}

export const SmartAmenityList = ({
  amenities,
  timeContext,
  isWeekend,
  message,
  onAmenityClick
}: SmartAmenityListProps) => {
  const getTimeIcon = () => {
    const icons = {
      morning: '☀️',
      afternoon: '🌤️',
      evening: '🌆',
      night: '🌙'
    };
    return icons[timeContext as keyof typeof icons] || '⏰';
  };
  
  const amenityItems = amenities.map((amenity, index) => (
    <SmartAmenityCard
      key={index}
      amenity={amenity}
      onClick={() => onAmenityClick?.(amenity)}
    />
  ));
  
  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getTimeIcon()}</span>
            <h2 className="text-base font-bold text-gray-900">
              {timeContext.charAt(0).toUpperCase() + timeContext.slice(1)}
            </h2>
            {isWeekend && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-semibold rounded-full">🎉 Weekend</span>}
          </div>
          <span className="text-xs text-gray-600">{amenities.length} places</span>
        </div>
        <p className="text-xs text-gray-700 mt-1">{message}</p>
      </div>
      
      {/* Animated Scrollable List */}
      {amenities.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-gray-500">No amenities found</p>
        </Card>
      ) : (
        <AnimatedList
          items={amenityItems}
          onItemSelect={(item: any, index: number) => onAmenityClick?.(amenities[index])}
          showGradients={true}
          enableArrowNavigation={false}
          displayScrollbar={true}
        />
      )}
    </div>
  );
};
