import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Navigation, Car, Bus, Info, ArrowRight, CornerDownRight, Footprints, Sparkles, MoreVertical, ChevronDown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPortal } from 'react-dom';

export interface RouteInfo {
    origin: string;
    destination: string;
}

interface SmartRouteMapProps {
    isOpen: boolean;
    onClose: () => void;
    routeInfo: RouteInfo | null;
}

const SmartRouteMap: React.FC<SmartRouteMapProps> = ({ isOpen, onClose, routeInfo }) => {
    const [selectedMode, setSelectedMode] = useState<'cab' | 'bus' | 'walk'>('bus');
    const [showSafetyMap, setShowSafetyMap] = useState(false);

    if (!routeInfo) return null;

    // Generate some mock comparison data based on the route
    const cabCost = Math.floor(Math.random() * 150) + 150; // ₹150 - ₹300
    const busCost = Math.floor(Math.random() * 20) + 10;   // ₹10 - ₹30
    const walkCost = Math.floor(Math.random() * 5) + 5;    // ₹5 - ₹10 (Shared auto leg etc)

    const cabTime = Math.floor(Math.random() * 15) + 15;   // 15 - 30 mins
    const busTime = cabTime + Math.floor(Math.random() * 20) + 10; // 25 - 60 mins
    const walkTime = busTime + Math.floor(Math.random() * 20) + 15; // 40 - 80 mins

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6"
                    />

                    {/* Dialog Wrapper */}
                    <div className="fixed inset-0 z-[100000] flex items-center justify-center pointer-events-none p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-[0_30px_100px_-15px_rgba(0,0,0,0.5)] pointer-events-auto flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white sticky top-0 z-20">
                                <div className="flex items-center gap-3 text-gray-800">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                        <Navigation className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight">Smart Route Comparison</h3>
                                        <p className="text-[10px] text-blue-600 font-black tracking-[0.2em] uppercase">AI OPTIMIZED TRANSIT</p>
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
                            <div className="flex-1 overflow-y-auto bg-gray-50 no-scrollbar">

                                {/* Mock Map Area */}
                                <div className="relative w-full h-56 sm:h-64 bg-slate-100 overflow-hidden border-b border-gray-200">
                                    {/* Map Grid Pattern */}
                                    <div
                                        className="absolute inset-0 opacity-[0.05]"
                                        style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }}
                                    />

                                    {/* Safety Heatmap Overlays */}
                                    {showSafetyMap && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="absolute inset-0 pointer-events-none"
                                        >
                                            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-green-400/30 blur-[60px] rounded-full animate-pulse" />
                                            <div className="absolute top-1/2 left-2/3 w-1/4 h-1/4 bg-yellow-400/20 blur-[40px] rounded-full" />
                                            <div className="absolute bottom-1/4 left-1/3 w-1/3 h-1/3 bg-green-500/20 blur-[50px] rounded-full animate-pulse" />
                                        </motion.div>
                                    )}

                                    {/* Mock Map Elements */}
                                    <div className="absolute inset-0 flex items-center justify-between px-10 sm:px-24">
                                        {/* Origin Pin */}
                                        <motion.div
                                            initial={{ y: -20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="relative z-10 flex flex-col items-center"
                                        >
                                            <div className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-black text-gray-800 shadow-xl border border-gray-200 mb-2 truncate max-w-[120px] sm:max-w-[180px]">
                                                {routeInfo.origin}
                                            </div>
                                            <div className="w-6 h-6 rounded-full bg-white border-4 border-blue-500 shadow-lg flex items-center justify-center" />
                                        </motion.div>

                                        {/* Connecting Line */}
                                        <div className="absolute left-1/2 top-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 h-0.5 border-t-2 border-dashed border-blue-300" />

                                        {/* Destination Pin */}
                                        <motion.div
                                            initial={{ y: -20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                            className="relative z-10 flex flex-col items-center"
                                        >
                                            <div className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-black text-gray-800 shadow-xl border border-gray-200 mb-2 truncate max-w-[120px] sm:max-w-[180px]">
                                                {routeInfo.destination}
                                            </div>
                                            <div className="w-6 h-6 rounded-full bg-white border-4 border-red-500 shadow-lg flex items-center justify-center" />
                                        </motion.div>
                                    </div>

                                    {/* Map Controls */}
                                    <div className="absolute bottom-4 left-4">
                                        <button
                                            onClick={() => setShowSafetyMap(!showSafetyMap)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 ${showSafetyMap ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}
                                        >
                                            <Shield className="w-3.5 h-3.5" />
                                            {showSafetyMap ? 'Safety Overlay Active' : 'Show Safety Map'}
                                        </button>
                                    </div>
                                </div>

                                {/* Comparison Cards */}
                                <div className="p-6 space-y-4">
                                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Select Transit Option</h4>

                                    <div className="grid gap-3">
                                        {/* fastest (Cab) */}
                                        <button
                                            onClick={() => setSelectedMode('cab')}
                                            className={`group relative p-4 rounded-2xl border-2 transition-all ${selectedMode === 'cab' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-100 bg-white hover:border-blue-200'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selectedMode === 'cab' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                        <Car className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">Fastest (Cab)</p>
                                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">~ {cabTime} mins • Save {busTime - cabTime}m</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-gray-900">₹{cabCost}</p>
                                                </div>
                                            </div>
                                        </button>

                                        {/* Smartest (Bus) */}
                                        <button
                                            onClick={() => setSelectedMode('bus')}
                                            className={`group relative p-4 rounded-2xl border-2 transition-all ${selectedMode === 'bus' ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-100 bg-white hover:border-emerald-200'}`}
                                        >
                                            <div className="absolute -top-3 left-4 bg-emerald-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">AI Choice</div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selectedMode === 'bus' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                        <Bus className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">Smartest (Bus/Auto)</p>
                                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">~ {busTime} mins • Save ₹{cabCost - busCost}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-gray-900">₹{busCost}</p>
                                                </div>
                                            </div>
                                        </button>

                                        {/* Sustainable */}
                                        <button
                                            onClick={() => setSelectedMode('walk')}
                                            className={`group relative p-4 rounded-2xl border-2 transition-all ${selectedMode === 'walk' ? 'border-orange-500 bg-orange-50/20' : 'border-gray-100 bg-white hover:border-orange-200'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selectedMode === 'walk' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                        <Footprints className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">Sustainable (Walk)</p>
                                                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-tight">~ {walkTime} mins • 1,500 Steps</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-gray-900">₹{walkCost}</p>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 bg-white border-t border-gray-100">
                                <button
                                    onClick={onClose}
                                    className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-[0.98] ${selectedMode === 'cab' ? 'bg-blue-600' : selectedMode === 'bus' ? 'bg-emerald-600' : 'bg-orange-600'}`}
                                >
                                    CONFIRM {selectedMode.toUpperCase()} ROUTE
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default SmartRouteMap;
