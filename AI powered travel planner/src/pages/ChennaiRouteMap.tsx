import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { calculateMultiStopRoute } from '@/utils/routeUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation, Clock, MapPin, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CHENNAI_POINTS: [number, number][] = [
    [80.2707, 13.0827],       // Main Location (Chennai Center)
    [80.237617, 13.067439],   // Stop 1
    [80.244987, 13.035542],   // Stop 2
    [80.208984, 13.029385]    // Stop 3
];

const STOP_NAMES = [
    "Main Location",
    "Stop 1",
    "Stop 2",
    "Stop 3"
];

const ChennaiRouteMap = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<maplibregl.Map | null>(null);
    const [routeData, setRouteData] = useState<{
        lineString: [number, number][];
        totalDistanceKm: number;
        totalDurationMins: number;
        legDistancesKm: number[];
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const apiKey = import.meta.env.VITE_AWS_LOCATION_API_KEY;

    useEffect(() => {
        const fetchRoute = async () => {
            try {
                setLoading(true);
                const data = await calculateMultiStopRoute(CHENNAI_POINTS);
                setRouteData(data);
                setLoading(false);
            } catch (err: any) {
                console.error("Failed to fetch multi-stop route:", err);
                setError(err.message || "Failed to calculate route");
                setLoading(false);
            }
        };

        if (apiKey) {
            fetchRoute();
        } else {
            setError("Missing VITE_AWS_LOCATION_API_KEY in .env");
            setLoading(false);
        }
    }, [apiKey]);

    useEffect(() => {
        if (!mapContainer.current || !apiKey) return;

        // Initialize MapLibre
        const styleUrl = `https://maps.geo.ap-south-1.amazonaws.com/v2/styles/Standard/descriptor?key=${apiKey}`;

        const mapInstance = new maplibregl.Map({
            container: mapContainer.current,
            center: CHENNAI_POINTS[0],
            zoom: 11,
            style: styleUrl,
        });

        mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');

        mapInstance.on('load', () => {
            mapInstance.resize();

            // 1. Add Red Markers for all points
            CHENNAI_POINTS.forEach((coord, index) => {
                const el = document.createElement('div');

                // Google maps style Red Pin
                el.innerHTML = `
                  <div style="position: relative; top: -14px; display: flex; flex-direction: column; items-center;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.3));">
                      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#ea4335"/>
                    </svg>
                    <div style="position: absolute; top: 6px; width: 100%; text-align: center; color: white; font-size: 10px; font-weight: bold; pointer-events: none;">
                       ${index === 0 ? 'M' : index}
                    </div>
                  </div>
                `;
                el.className = 'cursor-pointer hover:scale-110 transition-transform';

                // Add popup showing the stop name
                const popup = new maplibregl.Popup({ offset: 25 }).setText(STOP_NAMES[index]);

                new maplibregl.Marker({ element: el })
                    .setLngLat(coord)
                    .setPopup(popup)
                    .addTo(mapInstance);
            });

            // 2. Draw Polyline Route if routeData is available
            if (routeData && routeData.lineString.length > 0) {
                mapInstance.addSource('route', {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'properties': {},
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': routeData.lineString
                        }
                    }
                });

                // Casing Outline
                mapInstance.addLayer({
                    'id': 'route-casing',
                    'type': 'line',
                    'source': 'route',
                    'layout': { 'line-join': 'round', 'line-cap': 'round' },
                    'paint': {
                        'line-color': '#1d4ed8',
                        'line-width': 8,
                        'line-opacity': 0.9
                    }
                });

                // Inner Core
                mapInstance.addLayer({
                    'id': 'route',
                    'type': 'line',
                    'source': 'route',
                    'layout': { 'line-join': 'round', 'line-cap': 'round' },
                    'paint': {
                        'line-color': '#3b82f6',
                        'line-width': 4,
                        'line-opacity': 1
                    }
                });

                // Fit bounds
                const bounds = new maplibregl.LngLatBounds();
                routeData.lineString.forEach(coord => bounds.extend([coord[0], coord[1]]));
                mapInstance.fitBounds(bounds, { padding: 80, duration: 1500 });
            }
        });

        setMap(mapInstance);

        return () => {
            mapInstance.remove();
        };
    }, [apiKey, routeData]);

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center">
            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Information Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <Navigation className="w-8 h-8 text-blue-600" />
                            Multi-Stop Route
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">Chennai Delivery / Tour Path</p>
                    </div>

                    <Card className="border-none shadow-xl shadow-blue-900/5 overflow-hidden rounded-3xl">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><MapPin className="w-24 h-24" /></div>
                            <h3 className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-1">Trip Overview</h3>

                            {loading ? (
                                <div className="h-16 flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span className="font-medium animate-pulse">Calculating optimal route...</span>
                                </div>
                            ) : error ? (
                                <div className="text-red-200 bg-red-900/30 p-3 rounded-lg text-sm mt-3">{error}</div>
                            ) : routeData ? (
                                <div className="grid grid-cols-2 gap-4 mt-4 relative z-10">
                                    <div>
                                        <p className="text-3xl font-black">{routeData.totalDistanceKm} <span className="text-lg font-bold text-blue-200">km</span></p>
                                        <p className="text-xs text-blue-100 mt-1 uppercase font-bold opacity-80">Total Distance</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black">{routeData.totalDurationMins} <span className="text-lg font-bold text-blue-200">min</span></p>
                                        <p className="text-xs text-blue-100 mt-1 uppercase font-bold opacity-80">Est. Time</p>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <CardContent className="p-0">
                            <div className="p-6">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Route Legs
                                </h4>

                                <div className="relative border-l-2 border-blue-100 ml-[11px] space-y-6 pb-2">
                                    {CHENNAI_POINTS.map((pt, idx) => (
                                        <div key={idx} className="relative">
                                            {/* Red Marker Dot */}
                                            <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white shadow-sm" />

                                            <div className="pl-6">
                                                <h5 className="font-bold text-slate-800 text-sm">{STOP_NAMES[idx]}</h5>
                                                <div className="flex items-center gap-1 mt-1 text-slate-400 text-xs font-medium">
                                                    <span>Lat: {pt[1].toFixed(4)}</span>
                                                    <span>•</span>
                                                    <span>Lng: {pt[0].toFixed(4)}</span>
                                                </div>

                                                {/* Distance to next stop */}
                                                {idx < CHENNAI_POINTS.length - 1 && routeData && (
                                                    <div className="mt-4 mb-2 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 text-xs font-bold shadow-sm">
                                                        <ArrowRight className="w-3 h-3" />
                                                        {routeData.legDistancesKm[idx]} km to next stop
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Map Panel */}
                <div className="lg:col-span-2 h-[60vh] lg:h-[80vh] bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                    <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

                    {loading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                            <div className="bg-white px-6 py-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                                <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                                <span className="font-bold text-slate-700 text-sm">Loading AWS Route...</span>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ChennaiRouteMap;
