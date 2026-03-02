import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { withAPIKey } from '@aws/amazon-location-utilities-auth-helper';

interface CoimbatoreMapProps {
    apiKey: string;
    mapName?: string;
    region?: string;
    className?: string;
    lineString?: [number, number][]; // Array of [longitude, latitude] coordinates for the route
    alternateRoutes?: {
        lineString?: [number, number][];
        duration?: number;
        distance?: number;
    }[];
    activeRouteDetails?: {
        durationMins: number;
        cost: number;
    };
    mode?: 'car' | 'bus' | 'walk';
}

const CoimbatoreMap: React.FC<CoimbatoreMapProps> = ({
    apiKey,
    mapName = 'ExploreMap', // Using standard Overture/HERE Explore map as default fallback
    region = 'ap-south-1', // Default region for India
    className = '',
    lineString,
    alternateRoutes,
    activeRouteDetails,
    mode = 'car'
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<maplibregl.Map | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!mapContainer.current || !apiKey) return;

        let mapInstance: maplibregl.Map;

        const initializeMap = async () => {
            try {
                setError(null);

                // When using an API Key, the standard approach with AWS Location V2 is to point directly to the style descriptor. 
                const styleName = mapName === 'default' || mapName === 'ExploreMap' ? 'Standard' : mapName;
                const styleUrl = `https://maps.geo.${region}.amazonaws.com/v2/styles/${styleName}/descriptor?key=${apiKey}`;

                mapInstance = new maplibregl.Map({
                    container: mapContainer.current!,
                    center: [76.9616, 11.0168], // Coordinates for Coimbatore
                    zoom: 12, // Default zoom level
                    style: styleUrl,
                });

                // Add navigation controls (zoom in/out, rotation)
                mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');

                // Optional: Ensure the map resizes correctly if the container changes
                mapInstance.on('load', () => {
                    mapInstance.resize();

                    // Add the route lines if provided
                    if (lineString && lineString.length > 0) {
                        try {
                            // Determine colors based on travel mode
                            const isBus = mode === 'bus';
                            const isWalk = mode === 'walk';

                            const casingColor = isWalk ? '#c2410c' : isBus ? '#047857' : '#1d4ed8'; // Dark Orange / Dark Emerald / Dark Blue
                            const coreColor = isWalk ? '#f97316' : isBus ? '#10b981' : '#3b82f6';   // Bright Orange / Bright Emerald / Bright Blue
                            const startPinColor = isWalk ? 'bg-orange-500' : isBus ? 'bg-emerald-500' : 'bg-blue-500';
                            const startPulseColor = isWalk ? 'border-orange-400' : isBus ? 'border-emerald-400' : 'border-blue-400';

                            // Map of bg colors for the label
                            const labelBgColor = isWalk ? '#f97316' : isBus ? '#10b981' : '#1d4ed8';

                            const formatDuration = (mins: number) => {
                                if (mins < 60) return `${mins} min`;
                                const hrs = Math.floor(mins / 60);
                                const m = mins % 60;
                                return m > 0 ? `${hrs} hr ${m} min` : `${hrs} hr`;
                            };

                            // 1. Draw Alternate Routes First (so they appear underneath the main route)
                            if (alternateRoutes && alternateRoutes.length > 0) {
                                alternateRoutes.forEach((altRoute, idx) => {
                                    const altLineString = altRoute.lineString;
                                    if (!altLineString || altLineString.length === 0) return;

                                    const sourceId = `alt-route-${idx}`;
                                    mapInstance.addSource(sourceId, {
                                        'type': 'geojson',
                                        'data': {
                                            'type': 'Feature',
                                            'properties': {},
                                            'geometry': {
                                                'type': 'LineString',
                                                'coordinates': altLineString
                                            }
                                        }
                                    });

                                    // Alternate Casing (Grey Outline)
                                    mapInstance.addLayer({
                                        'id': `${sourceId}-casing`,
                                        'type': 'line',
                                        'source': sourceId,
                                        'layout': {
                                            'line-join': 'round',
                                            'line-cap': 'round'
                                        },
                                        'paint': {
                                            'line-color': '#9ca3af', // Gray-400
                                            'line-width': 8,
                                            'line-opacity': 0.7
                                        }
                                    });

                                    // Alternate Core (Light Grey Inner)
                                    mapInstance.addLayer({
                                        'id': `${sourceId}-core`,
                                        'type': 'line',
                                        'source': sourceId,
                                        'layout': {
                                            'line-join': 'round',
                                            'line-cap': 'round'
                                        },
                                        'paint': {
                                            'line-color': '#d1d5db', // Gray-300
                                            'line-width': 4,
                                            'line-opacity': 1
                                        }
                                    });

                                    // Alternate Route Floating Label
                                    if (altRoute.duration && activeRouteDetails) {
                                        const timeDiff = altRoute.duration - activeRouteDetails.durationMins;
                                        if (timeDiff !== 0) { // Only show label if it's meaningfully different
                                            const diffStr = timeDiff > 0 ? `+${timeDiff} min` : `${timeDiff} min`;
                                            const diffColor = timeDiff > 0 ? '#ef4444' : '#10b981'; // Red if slower, Green if faster
                                            const middleCoord = altLineString[Math.floor(altLineString.length / 2)];

                                            const altEl = document.createElement('div');
                                            altEl.className = 'bg-white text-gray-700 shadow-md rounded-lg px-2 py-1 text-xs font-bold border border-gray-200 flex flex-col items-center z-10';
                                            altEl.innerHTML = `
                                                <div style="color: ${diffColor}; display: flex; align-items: center; gap: 4px;">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
                                                    ${diffStr}
                                                </div>
                                                <div style="color: #6b7280; font-size: 10px; font-weight: 500;">No tolls</div>
                                            `;
                                            new maplibregl.Marker({ element: altEl, anchor: 'bottom' })
                                                .setLngLat(middleCoord)
                                                .addTo(mapInstance);
                                        }
                                    }
                                });
                            }

                            // 2. Draw Main Route
                            mapInstance.addSource('route', {
                                'type': 'geojson',
                                'data': {
                                    'type': 'Feature',
                                    'properties': {},
                                    'geometry': {
                                        'type': 'LineString',
                                        'coordinates': lineString
                                    }
                                }
                            });

                            // Add Casing (Outline) for the Route
                            mapInstance.addLayer({
                                'id': 'route-casing',
                                'type': 'line',
                                'source': 'route',
                                'layout': {
                                    'line-join': 'round',
                                    'line-cap': 'round'
                                },
                                'paint': {
                                    'line-color': casingColor,
                                    'line-width': 8,
                                    'line-opacity': 0.9
                                }
                            });

                            // Add Core Route Line
                            mapInstance.addLayer({
                                'id': 'route',
                                'type': 'line',
                                'source': 'route',
                                'layout': {
                                    'line-join': 'round',
                                    'line-cap': 'round'
                                },
                                'paint': {
                                    'line-color': coreColor,
                                    'line-width': 4,
                                    'line-opacity': 1
                                }
                            });

                            // Active Route Floating Label
                            if (activeRouteDetails) {
                                const middleCoord = lineString[Math.floor(lineString.length / 2)];
                                const activeEl = document.createElement('div');
                                activeEl.className = `shadow-lg rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-sm px-3 py-1.5 flex flex-col items-start font-sans text-sm font-bold border-2 border-white z-20`;
                                activeEl.style.backgroundColor = labelBgColor;
                                activeEl.style.color = 'white';
                                activeEl.innerHTML = `
                                    <div style="display: flex; align-items: center; gap: 4px;">
                                        ${formatDuration(activeRouteDetails.durationMins)}
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 2px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                    </div>
                                    <div style="font-size: 13px; font-weight: 600;">₹${activeRouteDetails.cost.toFixed(2)}</div>
                                `;
                                new maplibregl.Marker({ element: activeEl, anchor: 'bottom-right', offset: [-5, -5] })
                                    .setLngLat(middleCoord)
                                    .addTo(mapInstance);
                            }

                            // Fit map to route bounds with dynamic padding
                            const bounds = new maplibregl.LngLatBounds();
                            lineString.forEach(coord => {
                                bounds.extend([coord[0], coord[1]]); // [lon, lat]
                            });

                            // Calculate optimal padding based on container size
                            const width = mapContainer.current?.clientWidth || 400;
                            const height = mapContainer.current?.clientHeight || 400;
                            const padding = {
                                top: Math.min(height * 0.1, 50),
                                bottom: Math.min(height * 0.1, 50),
                                left: Math.min(width * 0.1, 40),
                                right: Math.min(width * 0.1, 40)
                            };

                            mapInstance.fitBounds(bounds, {
                                padding,
                                duration: 1500, // Smooth transition
                                maxZoom: 16 // Prevent zooming in too close on very short trips
                            });

                            // Add markers for Start and End
                            const startCoord = lineString[0];
                            const endCoord = lineString[lineString.length - 1];

                            // Create custom marker elements
                            const startEl = document.createElement('div');
                            startEl.className = `w-5 h-5 rounded-full border-[3px] border-white ${startPinColor} shadow-lg relative flex items-center justify-center`;

                            // Add a pulse ring to the start marker for clarity
                            const pulse = document.createElement('div');
                            pulse.className = `absolute w-full h-full rounded-full border-2 ${startPulseColor} animate-ping opacity-60`;
                            startEl.appendChild(pulse);

                            const endEl = document.createElement('div');
                            // Google maps style End Pin (Red drop)
                            endEl.innerHTML = `
                              <div style="position: relative; top: -12px;">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.25));">
                                  <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#ea4335"/>
                                </svg>
                              </div>
                            `;
                            endEl.className = 'flex items-center justify-center';

                            // Add a small inner dot for the end marker
                            const endInner = document.createElement('div');
                            endInner.className = 'absolute inset-0 m-auto w-1 h-1 bg-white rounded-full';
                            endEl.appendChild(endInner);

                            new maplibregl.Marker({ element: startEl })
                                .setLngLat(startCoord)
                                .addTo(mapInstance);

                            new maplibregl.Marker({ element: endEl })
                                .setLngLat(endCoord)
                                .addTo(mapInstance);

                        } catch (e) {
                            console.error("Error drawing route on map:", e);
                        }
                    }
                });

                setMap(mapInstance);
            } catch (err) {
                console.error('Failed to initialize AWS Location map:', err);
                // Help the user identify the issue since AWS Maps require specific resource creation
                setError(`Failed to load map '${mapName}'. In AWS Console > Amazon Location > Maps, ensure you have created a map resource exactly named '${mapName}'.`);
            }
        };

        initializeMap();

        // Cleanup function to remove map instance on unmount
        return () => {
            if (mapInstance) {
                mapInstance.remove();
            }
        };
    }, [apiKey, mapName, region, lineString]);

    return (
        <div className={`relative w-full h-full min-h-[400px] border border-slate-200 rounded-xl overflow-hidden shadow-sm ${className}`}>

            {/* Map Container */}
            <div
                ref={mapContainer}
                className="absolute inset-0 w-full h-full"
            />

            {/* API Key Missing Overlay */}
            {!apiKey && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 backdrop-blur-sm z-10">
                    <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-slate-200 max-w-sm">
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">API Key Required</h3>
                        <p className="text-sm text-slate-600">
                            Please provide your AWS Location API key to display the map of Coimbatore.
                        </p>
                    </div>
                </div>
            )}

            {/* Error Overlay */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-100/90 backdrop-blur-sm z-10">
                    <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-red-200 max-w-sm">
                        <h3 className="text-lg font-semibold text-red-600 mb-2">Map Error</h3>
                        <p className="text-sm text-slate-600">{error}</p>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CoimbatoreMap;
