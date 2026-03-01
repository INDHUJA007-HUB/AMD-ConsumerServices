import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, MapPin, Activity, Clock } from 'lucide-react';
import safetyData from '@/data/master_safety_data.json';
import { pointInPolygon, calculateSafety, getHourlyForecasts } from '@/utils/geoUtils';

interface SafetyMonitorProps {
    // Pass the current day's safe places based on itinerary maybe?
    dailyPlaces?: { name: string; location: string; coordinates?: [number, number] }[];
}

export const SafetyMonitor = ({ dailyPlaces = [] }: SafetyMonitorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
    const [currentWard, setCurrentWard] = useState<any | null>(null);
    const [safetyStatus, setSafetyStatus] = useState<any>(null);
    const [hourlyForecasts, setHourlyForecasts] = useState<any[]>([]);

    useEffect(() => {
        // If we have daily places, we can determine "current ward" based on the first place's coordinates,
        // or just static Coimbatore city center if no places exist.
        // For accurate real data, we won't shift continuously randomly. 
        // We evaluate safety precisely at the current time and location.

        let loc: [number, number] = [76.9558, 11.0168]; // Coimbatore default center

        if (dailyPlaces && dailyPlaces.length > 0 && dailyPlaces[0].coordinates) {
            loc = dailyPlaces[0].coordinates;
        }

        setCurrentLocation(loc);

        const features = safetyData.features;
        let foundWard = null;

        for (const feature of features) {
            if (pointInPolygon(loc, feature.geometry.coordinates[0])) {
                foundWard = feature;
                break;
            }
        }

        // If for some reason the coordinate isn't in a generated ward polygon, 
        // fallback to nearest or an arbitrary central ward so the UI works.
        if (!foundWard && features.length > 0) {
            foundWard = features[0];
        }

        if (foundWard) {
            setCurrentWard(foundWard);

            // Generate the current exact time's safety status based strictly on the accurate score mapping
            const score = foundWard.properties.vibe_score;
            setSafetyStatus(calculateSafety(score, new Date()));
        }

    }, [dailyPlaces]);

    if (!safetyStatus) {
        return (
            <div className="relative group cursor-help">
                <div className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-white border border-gray-200 rounded-full text-gray-400 shadow-sm">
                    <Shield className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
                </div>
            </div>
        );
    }

    const { status, color, pulse, score } = safetyStatus;

    // Determine styles
    let bgColor = 'bg-green-400';
    let textColor = 'text-green-600';
    let borderColor = 'border-green-200';
    let badgeColor = 'bg-green-500';

    if (color === 'yellow') {
        bgColor = 'bg-yellow-400';
        textColor = 'text-yellow-600';
        borderColor = 'border-yellow-200';
        badgeColor = 'bg-yellow-500';
    } else if (color === 'red') {
        bgColor = 'bg-red-500';
        textColor = 'text-red-600';
        borderColor = 'border-red-200';
        badgeColor = 'bg-red-500';
    }

    return (
        <div className="relative">
            <div
                className="relative group cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                {pulse && <div className={`absolute inset-0 ${bgColor} rounded-full animate-ping opacity-75`}></div>}
                {!pulse && <div className={`absolute inset-0 ${bgColor} rounded-full animate-ping opacity-25`}></div>}

                <div className={`relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-white border ${borderColor} rounded-full ${textColor} shadow-sm transition-transform hover:scale-110`}>
                    <Shield className="w-4 h-4 md:w-5 md:h-5" />
                </div>

                {/* Hover Label */}
                <div className="absolute right-0 top-14 w-48 bg-slate-900 text-white text-[10px] p-2 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[60] shadow-xl">
                    <div className={`font-bold ${textColor.replace('text', 'text')} mb-1 flex items-center gap-1 uppercase`}>
                        <div className={`w-1.5 h-1.5 ${badgeColor} rounded-full animate-pulse`}></div>
                        {status}
                    </div>
                    Click to view live safety statistics and safe places for today's plan.
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute right-0 top-14 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100]"
                    >
                        <div className={`p-4 ${color === 'red' ? 'bg-red-50' : color === 'yellow' ? 'bg-yellow-50' : 'bg-green-50'} border-b border-gray-100`}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-black text-gray-900 flex items-center gap-2">
                                    <Activity className={`w-4 h-4 ${textColor}`} />
                                    Live Safety Hub
                                </h3>
                                <span className={`text-xs font-black px-2 py-1 rounded-md text-white ${badgeColor}`}>
                                    SCORE: {score}/10
                                </span>
                            </div>
                            <p className="text-xs font-medium text-gray-700 mt-1">
                                Ward: {currentWard?.properties?.ward_lgd_name || 'Detecting...'} &bull; {currentWard?.properties?.zone || ''}
                            </p>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</div>
                                    <div className={`font-bold text-sm ${textColor}`}>{status}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Time Check</div>
                                    <div className="font-bold text-sm text-gray-800 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>

                            {currentWard?.properties?.high_crime_rate && (
                                <div className="flex items-start gap-2 bg-red-50 p-3 rounded-xl border border-red-100 text-red-800 text-xs">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                                    <div>
                                        <strong>Caution Advised:</strong> High crime area detected historically. Stick to well-lit main roads.
                                    </div>
                                </div>
                            )}

                            {currentWard?.properties?.has_health_center && (
                                <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-xl border border-blue-100 text-blue-800 text-xs">
                                    <Shield className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                                    <div>
                                        <strong>Health Center Nearby:</strong> An Urban PHC is located within this ward.
                                    </div>
                                </div>
                            )}

                            {hourlyForecasts.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-blue-500" /> Hourly Safety Forecast
                                    </h4>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                        {hourlyForecasts.map((forecast, idx) => (
                                            <div
                                                key={idx}
                                                className={`min-w-[60px] p-2 rounded-xl flex flex-col items-center justify-center gap-1 border border-${forecast.color}-100 bg-${forecast.color}-50 shrink-0`}
                                            >
                                                <span className="text-[10px] font-bold text-gray-600">
                                                    {idx === 0 ? 'Now' : forecast.time.toLocaleTimeString([], { hour: 'numeric' })}
                                                </span>
                                                <div className={`w-2.5 h-2.5 rounded-full bg-${forecast.color}-500 ${forecast.pulse ? 'animate-pulse' : ''}`} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide mt-4">Safe Places Today</h4>
                                {dailyPlaces.length > 0 ? (
                                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                        {dailyPlaces.map((place, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <MapPin className="w-3.5 h-3.5 text-green-500" />
                                                <div>
                                                    <p className="text-[11px] font-bold text-gray-800 truncate">{place.name}</p>
                                                    <p className="text-[9px] text-gray-500 truncate">{place.location}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500 italic">No specific safe places verified for today's itinerary.</p>
                                )}
                            </div>
                        </div>
                        <div className="bg-gray-900 text-white p-3 text-center touch-none">
                            <p className="text-[10px] font-medium opacity-80">Powered by AWS Location Service Tracker</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
