import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, Car, Bus, Footprints, Shield } from 'lucide-react';
import { generateRoutesFromAWS, RouteOption } from '../utils/routeUtils';
import CoimbatoreMap from './CoimbatoreMap'; // Ensure we import the map

interface SmartRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  coordinates?: [number, number];
  origin?: string;
  originCoords?: [number, number];
}

export default function SmartRouteModal({ isOpen, onClose, destination, coordinates, origin, originCoords }: SmartRouteModalProps) {
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'car' | 'bus' | 'walk'>('bus');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      generateRoutesFromAWS(destination, coordinates, origin, originCoords).then(data => {
        setRoutes(data);
        setLoading(false);
      });
    }
  }, [isOpen, destination, coordinates, origin, originCoords]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  const cabRoute = routes.find(r => r.id === 'fastest');
  const busRoute = routes.find(r => r.id === 'smartest');
  const walkRoute = routes.find(r => r.id === 'sustainable');

  const cabCost = cabRoute?.cost || 250;
  const busCost = busRoute?.cost || 25;
  const walkCost = walkRoute?.cost || 0;

  const cabTime = cabRoute?.duration || 24;
  const busTime = busRoute?.duration || 52;
  const walkTime = walkRoute?.duration || 75;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6"
          />

          {/* Dialog Wrapper */}
          <div className="fixed inset-0 z-[100000] flex items-center justify-center pointer-events-none p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-gray-50 rounded-3xl overflow-hidden shadow-[0_30px_100px_-15px_rgba(0,0,0,0.5)] pointer-events-auto flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white sticky top-0 z-20">
                <div className="flex items-center gap-3 text-gray-800">
                  <div className="w-10 h-10 rounded-2xl bg-[#0EA5E9] flex items-center justify-center text-white shadow-lg shadow-sky-200">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">Smart Route</h3>
                    <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">To {destination}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto bg-[#fafafa] no-scrollbar">
                <div className="p-6 space-y-5">
                  {loading ? (
                    <div className="w-full flex items-center justify-center py-10">
                      <div className="bg-white/95 backdrop-blur px-4 py-2 rounded-xl text-sm font-black text-gray-800 shadow-xl border border-gray-200 flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                        Routing from OSM...
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {/* Fastest (Cab) */}
                      <div
                        role="button"
                        onClick={() => setSelectedMode('car')}
                        className={`text-left group relative cursor-pointer p-5 rounded-3xl border-2 transition-all overflow-hidden ${selectedMode === 'car' ? 'border-[#0EA5E9] bg-sky-50/10' : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${selectedMode === 'car' ? 'bg-[#0EA5E9] text-white' : 'bg-[#F1F5F9] text-gray-400'}`}>
                              <Car className="w-7 h-7" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-[18px]">Fastest (Cab)</p>
                              <p className="text-[11px] font-black text-[#0EA5E9] uppercase tracking-wide mt-0.5">~ {cabTime} MINS • SAVE {busTime - cabTime}M</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-gray-900 leading-none">₹{cabCost}</p>
                          </div>
                        </div>
                        {selectedMode === 'car' && cabRoute?.pathOptions && (
                          <div className="mt-4 pt-4 border-t border-sky-100 flex flex-col gap-3">
                            <div className="h-48 w-full rounded-xl overflow-hidden mb-2 relative">
                              <CoimbatoreMap
                                apiKey={import.meta.env.VITE_AWS_LOCATION_API_KEY || ''}
                                mapName="default"
                                region="us-east-1"
                                className="w-full h-full border-0 absolute inset-0"
                                mode="car"
                                lineString={cabRoute?.geometry?.lineString}
                                alternateRoutes={cabRoute?.alternateGeometries}
                                activeRouteDetails={{ durationMins: cabTime, cost: cabCost }}
                              />
                              {cabRoute.geometry?.lineString && (
                                <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-[10px] font-bold text-sky-600 shadow-sm z-10 backdrop-blur-sm pointer-events-none">
                                  AWS Route Loaded ({cabRoute.geometry.lineString.length} points)
                                </div>
                              )}
                            </div>
                            <div className="text-[10px] font-black tracking-widest text-[#0EA5E9] uppercase flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-[#0EA5E9] animate-pulse" />
                              Live Location Availability
                            </div>
                            {cabRoute.pathOptions.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <div className="mt-0.5 w-5 h-5 rounded-md bg-sky-100 flex items-center justify-center text-sky-700 text-[10px] font-bold shrink-0 shadow-sm border border-sky-200">
                                  {String.fromCharCode(65 + idx)}
                                </div>
                                <div className="text-left">
                                  <p className="text-xs font-bold text-gray-800 leading-tight">{step.name}</p>
                                  <p className="text-[9px] text-gray-500 font-mono mt-0.5 tracking-tighter">LAT: {step.lat.toFixed(6)} • LON: {step.lon.toFixed(6)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Smartest (Bus) */}
                      <div
                        role="button"
                        onClick={() => setSelectedMode('bus')}
                        className={`text-left group relative cursor-pointer p-5 rounded-3xl border-2 transition-all overflow-hidden ${selectedMode === 'bus' ? 'border-[#059669] bg-[#F8FAFC]' : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'}`}
                      >
                        {selectedMode === 'bus' && (
                          <div className="absolute -top-3 left-6 bg-[#059669] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm z-10">AI Choice</div>
                        )}
                        <div className="flex items-center justify-between relative z-0">
                          <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${selectedMode === 'bus' ? 'bg-[#059669] text-white' : 'bg-[#F1F5F9] text-gray-400'}`}>
                              <Bus className="w-7 h-7" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-[18px]">Smartest (Bus/Auto)</p>
                              <p className="text-[11px] font-black text-[#059669] uppercase tracking-wide mt-0.5">~ {busTime} MINS • SAVE ₹{Math.max(0, cabCost - busCost)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-gray-900 leading-none">₹{busCost}</p>
                          </div>
                        </div>
                        {selectedMode === 'bus' && busRoute?.pathOptions && (
                          <div className="mt-4 pt-4 border-t border-emerald-100 flex flex-col gap-3 relative z-0">
                            <div className="h-48 w-full rounded-xl overflow-hidden mb-2 relative">
                              <CoimbatoreMap
                                apiKey={import.meta.env.VITE_AWS_LOCATION_API_KEY || ''}
                                mapName="default"
                                region="us-east-1"
                                className="w-full h-full border-0 absolute inset-0"
                                mode="bus"
                                lineString={busRoute?.geometry?.lineString}
                                alternateRoutes={busRoute?.alternateGeometries}
                                activeRouteDetails={{ durationMins: busTime, cost: busCost }}
                              />
                              {busRoute.geometry?.lineString && (
                                <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-[10px] font-bold text-emerald-600 shadow-sm z-10 backdrop-blur-sm pointer-events-none">
                                  AWS Route Loaded ({busRoute.geometry.lineString.length} points)
                                </div>
                              )}
                            </div>
                            <div className="text-[10px] font-black tracking-widest text-[#059669] uppercase flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                              Live Transit Stops
                            </div>
                            {busRoute.pathOptions.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <div className="mt-0.5 w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px] font-bold shrink-0 shadow-sm border border-emerald-200">
                                  {String.fromCharCode(65 + idx)}
                                </div>
                                <div className="text-left">
                                  <p className="text-xs font-bold text-gray-800 leading-tight">{step.name}</p>
                                  <p className="text-[9px] text-gray-500 font-mono mt-0.5 tracking-tighter">LAT: {step.lat.toFixed(6)} • LON: {step.lon.toFixed(6)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Sustainable (Walk) */}
                      <div
                        role="button"
                        onClick={() => setSelectedMode('walk')}
                        className={`text-left group relative cursor-pointer p-5 rounded-3xl border-2 transition-all overflow-hidden ${selectedMode === 'walk' ? 'border-[#EA580C] bg-orange-50/10' : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${selectedMode === 'walk' ? 'bg-[#EA580C] text-white' : 'bg-[#F1F5F9] text-gray-400'}`}>
                              <Footprints className="w-7 h-7" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-[18px]">Sustainable (Walk)</p>
                              <p className="text-[11px] font-black text-[#EA580C] uppercase tracking-wide mt-0.5">~ {walkTime} MINS • 1,500 STEPS</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-gray-900 leading-none">₹{walkCost}</p>
                          </div>
                        </div>
                        {selectedMode === 'walk' && walkRoute?.pathOptions && (
                          <div className="mt-4 pt-4 border-t border-orange-100 flex flex-col gap-3">
                            <div className="h-48 w-full rounded-xl overflow-hidden mb-2 relative">
                              <CoimbatoreMap
                                apiKey={import.meta.env.VITE_AWS_LOCATION_API_KEY || ''}
                                mapName="default"
                                region="us-east-1"
                                className="w-full h-full border-0 absolute inset-0"
                                mode="walk"
                                lineString={walkRoute?.geometry?.lineString}
                                alternateRoutes={walkRoute?.alternateGeometries}
                                activeRouteDetails={{ durationMins: walkTime, cost: walkCost }}
                              />
                              {walkRoute.geometry?.lineString && (
                                <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-[10px] font-bold text-orange-600 shadow-sm z-10 backdrop-blur-sm pointer-events-none">
                                  AWS Route Loaded ({walkRoute.geometry.lineString.length} points)
                                </div>
                              )}
                            </div>
                            <div className="text-[10px] font-black tracking-widest text-[#EA580C] uppercase flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-[#EA580C] animate-pulse" />
                              Safe Walk Corridors from Location
                            </div>
                            {walkRoute.pathOptions.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <div className="mt-0.5 w-5 h-5 rounded-md bg-orange-100 flex items-center justify-center text-orange-700 text-[10px] font-bold shrink-0 shadow-sm border border-orange-200">
                                  {String.fromCharCode(65 + idx)}
                                </div>
                                <div className="text-left">
                                  <p className="text-xs font-bold text-gray-800 leading-tight">{step.name}</p>
                                  <p className="text-[9px] text-gray-500 font-mono mt-0.5 tracking-tighter">LAT: {step.lat.toFixed(6)} • LON: {step.lon.toFixed(6)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              {!loading && (
                <div className="p-6 bg-white border-t border-gray-100">
                  <button
                    onClick={onClose}
                    className={`w-full py-4 rounded-xl font-bold text-[15px] tracking-wide text-white transition-all active:scale-[0.98] ${selectedMode === 'car' ? 'bg-[#0EA5E9] hover:bg-sky-600' : selectedMode === 'bus' ? 'bg-[#059669] hover:bg-emerald-700' : 'bg-[#EA580C] hover:bg-orange-700'}`}
                  >
                    CONFIRM {selectedMode === 'car' ? 'CAB' : selectedMode === 'bus' ? 'BUS' : 'WALK'} ROUTE
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}