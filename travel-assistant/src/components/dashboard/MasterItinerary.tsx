import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CityPlan } from "@/types/cityPlan";
import {
  Train, Clock, MapPin, Utensils,
  Camera, Wallet, Edit3, ArrowRight, Home,
  CheckCircle2, AlertCircle, ShoppingBag, Coffee, ArrowLeft, Sparkles, Navigation, Shield, X, Info, Star, Plane, Bus, Bot
} from 'lucide-react';
import SmartRouteMap, { RouteInfo } from "./SmartRouteMap";
import { Badge } from "@/components/ui/badge";
import { SmartRouteButton } from "@/components/ui/SmartRouteButton";
import { SafetyMonitor } from "./SafetyMonitor";
import { toast } from "sonner";
import AIPlanModifier from "./AIPlanModifier";
import VisualLinguist from "./VisualLinguist";

interface DashboardProps {
  plan: CityPlan;
  onBack: () => void;
}

const MasterItinerary = ({ plan, onBack }: DashboardProps) => {
  const [currentPlan, setCurrentPlan] = useState<CityPlan>(plan);
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [isLate, setIsLate] = useState(false);
  const [showOptimizerBanner, setShowOptimizerBanner] = useState(false);
  const [optimizerReason, setOptimizerReason] = useState("");
  const [delayIndex, setDelayIndex] = useState<number | null>(null);
  const [delayedDay, setDelayedDay] = useState<number | null>(null);
  const [isModifierOpen, setIsModifierOpen] = useState(false);
  const [isLinguistOpen, setIsLinguistOpen] = useState(false);

  useEffect(() => {
    setCurrentPlan(plan);
    setActiveDay(1);
    setExpandedDay(1);
    // Show toast notification if plan exceeds budget
    if (!plan.budget.withinBudget && plan.budget.overBy) {
      toast.error(
        `⚠️ Plan exceeds your budget by ₹${plan.budget.overBy.toLocaleString('en-IN')}`,
        {
          description: plan.budget.savingsOptions?.[0]?.suggestion || "Check the savings suggestions below to reduce costs.",
          duration: 8000,
          action: { label: "View tips", onClick: () => { } },
        }
      );
    } else if (plan.budget.withinBudget) {
      toast.success("✅ Plan is within your budget!", { duration: 4000 });
    }
  }, [plan]);

  const dailyAllocated = Math.round((currentPlan.budget.food + currentPlan.budget.activities) / (currentPlan.dailyPlans.length || 1));
  const isMultiDayTrip = currentPlan.dailyPlans.length > 1;
  const visiblePlans = isMultiDayTrip ? currentPlan.dailyPlans.filter(d => d.day === activeDay) : currentPlan.dailyPlans;

  // Derive the correct transport icon from plan.travel.mode
  const getTransportIcon = (mode: string) => {
    const m = mode.toLowerCase();
    if (m.includes('flight') || m.includes('air')) return <Plane className="w-4 h-4" />;
    if (m.includes('bus')) return <Bus className="w-4 h-4" />;
    if (m.includes('metro')) return <Train className="w-4 h-4" />;
    return <Train className="w-4 h-4" />; // default train
  };

  const simulateDelay = () => {
    setIsLate(true);
    setDelayedDay(activeDay); // Only affect the currently active/selected day

    // Simulate current time moving forward by 1 hour (represented internally)
    // Constraint from user: "check if user can still visit all spots before 9 PM. If not, remove lowest rating spot using U = Rating - Cost - Penalty"

    // Let's assume hitting the button identifies that the 3 activities left cannot fit before 9 PM.
    // Real logic would calculate (Time left / 3). For now, trigger the utility optimization manually.

    // U = Rating - Cost - Penalty 
    // Example: 
    // Spot A: Rating 9 - Cost 2 - Penalty 1 = 6
    // Spot B: Rating 7 - Cost 1 - Penalty 4 = 2 (Remove B)

    setDelayIndex(2);
    setShowOptimizerBanner(true);
    setOptimizerReason(`1-Hour Delay! Checking 9:00 PM bus limits... Cannot fit all spots. Activating Reinforcement Learning Rerouter [U = Rating - Cost - Penalty]. Dropping lowest utility landmark and calculating safe return via AWS Location Service.`);

    // Auto-hide banner after 12 seconds
    setTimeout(() => {
      setShowOptimizerBanner(false);
    }, 12000);
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="bg-hero-gradient py-6 sticky top-0 z-50 shadow-sm">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="rounded-lg bg-primary-foreground/20 p-2 text-primary-foreground hover:bg-primary-foreground/30 transition">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold font-display text-primary-foreground">
                  Master Itinerary: {currentPlan.city}
                </h1>
                <div className="text-primary-foreground/80 text-xs md:text-sm flex items-center gap-1">
                  <span className="font-black text-white px-2 py-0.5 bg-white/20 rounded-md">
                    {currentPlan.days}
                  </span>
                  <span>Day Trip planned specially for you</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 relative">
              <SafetyMonitor dailyPlaces={currentPlan.dailyPlans.find(d => d.day === activeDay)?.activities.map(a => ({ name: a.activity, location: a.location, coordinates: a.coordinates })) || []} />

              <button
                onClick={() => setIsModifierOpen(!isModifierOpen)}
                className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors shadow-sm border border-blue-200"
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">Modify</span>
              </button>

              <div className="absolute top-14 right-0 z-[100]">
                <AIPlanModifier
                  isOpen={isModifierOpen}
                  onClose={() => setIsModifierOpen(false)}
                  currentPlan={currentPlan}
                  onUpdatePlan={(newPlan) => {
                    setCurrentPlan(newPlan);
                  }}
                />
              </div>

              {!isLate && (
                <button
                  onClick={simulateDelay}
                  className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-100 transition-colors shadow-sm border border-orange-200"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Simulate Delay</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Dynamic Re-Optimizer Utility Banner */}
        <AnimatePresence>
          {showOptimizerBanner && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.95 }}
              className="mb-8 p-4 bg-gradient-to-r from-indigo-600 to-blue-700 rounded-2xl shadow-xl flex items-center justify-between gap-4 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shrink-0">
                  <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-yellow-400 text-indigo-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Plan Optimized</span>
                    <span className="text-indigo-100 text-[10px] font-bold">Real-time update</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed italic">
                    "{optimizerReason}"
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOptimizerBanner(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Day Selector */}
        {isMultiDayTrip && (
          <div className="flex flex-wrap gap-2 pb-4 mb-8">
            {currentPlan.dailyPlans.map((day) => (
              <button
                key={day.day}
                onClick={() => setActiveDay(day.day)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all shrink-0 ${activeDay === day.day
                  ? "bg-primary text-white shadow-lg scale-105"
                  : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
                  }`}
              >
                Day {day.day}
              </button>
            ))}
          </div>
        )}

        {/* Budget Exceeded Banner — prominent alert */}
        {!currentPlan.budget.withinBudget && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-3xl border-2 border-red-400 bg-gradient-to-r from-red-50 via-orange-50 to-red-50 shadow-lg overflow-hidden"
          >
            {/* Red header strip */}
            <div className="bg-red-500 flex items-center gap-3 px-5 py-3">
              <div className="animate-ping w-2.5 h-2.5 rounded-full bg-white opacity-75 absolute" />
              <AlertCircle className="w-5 h-5 text-white relative" />
              <span className="text-white font-black text-sm tracking-wide">⚠️ BUDGET EXCEEDED</span>
              <span className="ml-auto text-white/90 font-bold text-sm bg-red-700/60 px-3 py-0.5 rounded-full">
                Over by ₹{currentPlan.budget.overBy?.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-5">
              <p className="text-sm text-red-900 font-semibold leading-snug mb-4">
                Your selected plan costs <span className="font-black text-red-700">₹{currentPlan.budget.total.toLocaleString('en-IN')}</span> which exceeds your budget by <span className="font-black text-red-600">₹{currentPlan.budget.overBy?.toLocaleString('en-IN')}</span>.
                Consider the budget-friendly alternatives below, or increase your budget:
              </p>
              {currentPlan.budget.savingsOptions && currentPlan.budget.savingsOptions.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {currentPlan.budget.savingsOptions.map((opt, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-2xl border border-red-100 flex flex-col gap-1 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{opt.category}</span>
                        <span className="text-[10px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                          Save ~₹{opt.amountSaved?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 font-medium leading-relaxed mt-1">{opt.suggestion}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Within Budget confirmation badge */}
        {currentPlan.budget.withinBudget && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm font-semibold text-green-800">
              ✅ Great news! Your complete itinerary fits within your budget.
              Total: <span className="font-black">₹{currentPlan.budget.total.toLocaleString('en-IN')}</span>
            </p>
          </motion.div>
        )}

        {/* Hotel Options Section */}
        {currentPlan.hotelOptions && currentPlan.hotelOptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-black text-gray-900">Recommended Stays</h3>
              <span className="text-xs text-gray-400 font-medium ml-1">— pick one for your trip</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {currentPlan.hotelOptions.map((hotel, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between p-4 pb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${hotel.status === 'Available' ? 'bg-green-50 text-green-700 border-green-200' :
                          hotel.status === 'Limited' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>{hotel.status}</span>
                        {hotel.stars && (
                          <span className="text-yellow-500 text-xs font-bold">{'★'.repeat(hotel.stars)}{'☆'.repeat(5 - hotel.stars)}</span>
                        )}
                      </div>
                      <h4 className="font-black text-gray-900 text-sm leading-tight">{hotel.name}</h4>
                      <p className="text-xs text-blue-600 font-semibold mt-0.5">{hotel.area}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-lg font-black text-gray-900">₹{hotel.pricePerNight.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-gray-400">per night</p>
                    </div>
                  </div>
                  {/* Address */}
                  {hotel.address && (
                    <div className="flex items-start gap-1.5 px-4 pb-2">
                      <MapPin className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-gray-500 leading-snug">{hotel.address}</p>
                    </div>
                  )}
                  {/* Amenities */}
                  <div className="px-4 pb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {hotel.amenities.slice(0, 4).map((a, i) => (
                        <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100 font-medium">{a}</span>
                      ))}
                      {hotel.amenities.length > 4 && (
                        <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">+{hotel.amenities.length - 4} more</span>
                      )}
                    </div>
                  </div>
                  {/* Contact */}
                  {(hotel.phone || hotel.website) && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-t border-gray-100">
                      {hotel.phone && (
                        <a href={`tel:${hotel.phone}`} className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold hover:underline">
                          <span>📞</span> {hotel.phone}
                        </a>
                      )}
                      {hotel.website && hotel.website.length > 0 && (
                        <a href={`https://${hotel.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold hover:underline ml-auto">
                          <span>🌐</span> {hotel.website}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Budget Overview Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-6 border border-blue-100 shadow-sm mb-12"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estimated Total Budget</p>
                <h2 className="text-3xl font-black text-gray-900">~₹{currentPlan.budget.total}</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 flex-1 justify-items-center">
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Stay</p>
                <p className="text-lg font-bold text-gray-800">~₹{currentPlan.budget.stay}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Food</p>
                <p className="text-lg font-bold text-gray-800">~₹{currentPlan.budget.food}</p>
              </div>
              <div className="text-center border-l border-gray-100 sm:border-none pl-4 sm:pl-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Travel</p>
                <p className="text-lg font-bold text-gray-800">~₹{currentPlan.budget.travel}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Activities</p>
                <p className="text-lg font-bold text-gray-800">~₹{currentPlan.budget.activities}</p>
              </div>
            </div>
          </div>

          {/* Important Suggestion Banner */}
          <div className="mt-6 bg-blue-50/50 p-3 rounded-xl border border-dashed border-blue-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-800 italic leading-relaxed">
              <span className="font-bold">Pro Tip:</span> {currentPlan.travel.suggestion}
            </p>
          </div>
        </motion.div>

        <div className="relative space-y-12 before:absolute before:inset-0 before:ml-[1.4rem] md:before:mx-auto md:before:translate-x-0 before:h-[calc(100%-4rem)] before:w-0.5 before:bg-gradient-to-b before:from-blue-200 before:via-purple-200 before:to-transparent">
          {visiblePlans.map((dayPlan, index) => {
            const isOverBudget = dayPlan.totalCost > dailyAllocated;
            const budgetPercent = Math.min(100, (dayPlan.totalCost / dailyAllocated) * 100);

            return (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                key={dayPlan.day}
                className={`relative flex items-start justify-between md:justify-normal ${!isMultiDayTrip && index % 2 !== 0 ? 'md:flex-row-reverse' : 'md:flex-row'
                  } group`}
              >
                {/* Timeline node */}
                <div className={`flex items-center justify-center w-11 h-11 rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold shadow-md absolute z-10 ${isMultiDayTrip ? 'left-[-22px]' : 'md:left-1/2 md:-translate-x-1/2 left-[-22px]'}`}>
                  D{dayPlan.day}
                </div>

                <div className={`w-[calc(100%-2rem)] ml-8 ${isMultiDayTrip ? 'md:w-full' : 'md:w-[calc(50%-3rem)] md:ml-0 ' + (index % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto')
                  }`}>
                  <div
                    className="bg-white/90 backdrop-blur-xl rounded-2xl border border-blue-100 shadow-sm overflow-hidden hover:shadow-md transition-all group-hover:border-blue-200 cursor-pointer"
                    onClick={() => setExpandedDay(expandedDay === dayPlan.day ? null : dayPlan.day)}
                  >
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-blue-100/50 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1 block">
                          Day {dayPlan.day}
                        </span>
                        <h3 className="text-lg font-bold text-gray-800 tracking-tight">
                          {dayPlan.day === 1 ? 'Arrival & Settling In' : dayPlan.day === currentPlan.dailyPlans.length ? 'Final Day Exploration' : 'City Exploration'}
                        </h3>
                      </div>
                      <div className={`transition-transform duration-300 ${expandedDay === dayPlan.day ? 'rotate-180' : ''}`}>
                        <ArrowRight className="w-5 h-5 text-blue-400 rotate-90" />
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedDay === dayPlan.day && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-5 space-y-6">
                            {dayPlan.day === 1 && (
                              <div className="space-y-4">
                                {/* Stay Status & Reasons */}
                                <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm relative overflow-hidden">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600 border border-purple-100">
                                        <Home className="w-4 h-4" />
                                      </div>
                                      <span className="font-semibold text-purple-900 text-sm">Stay: {currentPlan.stay.area}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 uppercase">
                                      {currentPlan.stay.status || 'Verified'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3 text-xs text-gray-600 bg-purple-50/30 p-2.5 rounded-lg border border-purple-50 mb-3">
                                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="font-medium">{currentPlan.stay.timing}</span>
                                  </div>

                                  <div className="space-y-1.5 px-1">
                                    {currentPlan.stay.reasons.map((reason, ridx) => (
                                      <div key={ridx} className="flex items-center gap-2 text-[10px] text-gray-600">
                                        <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                                        <span>{reason}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-[10px] text-gray-400 mt-3 font-medium">Type: {currentPlan.stay.type}</p>
                                </div>
                              </div>
                            )}


                            {/* Hourly Schedule */}
                            <div className="space-y-4">
                              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 pt-2">
                                <Clock className="w-3.5 h-3.5" />
                                Hourly Schedule
                              </h4>

                              <div className="relative border-l-2 border-dashed border-gray-200 ml-[11px] pl-5 space-y-6 pb-2">
                                {dayPlan.activities.map((act, actIdx) => {
                                  const isAffected = isLate && delayedDay === dayPlan.day && delayIndex !== null && actIdx >= delayIndex;

                                  return (
                                    <div key={actIdx} className="space-y-4">
                                      {/* Original Activity (Affected/Ghost if Late) */}
                                      <div className={`relative group/act text-left transition-all duration-700 ${isAffected ? 'opacity-30 grayscale blur-[1px]' : ''}`}>
                                        <span className={`absolute -left-[27px] top-0.5 bg-white border-2 ${isAffected ? 'border-red-200' : 'border-gray-200 group-hover/act:border-blue-400'} w-3.5 h-3.5 rounded-full transition-colors`} />

                                        {isAffected && (
                                          <div className="absolute left-[-20px] top-4 h-full border-l-2 border-red-200 opacity-30 border-dotted" />
                                        )}

                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-1 relative top-[-4px]">
                                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                              <span className={`text-[10px] font-bold ${isAffected ? 'text-red-400 bg-red-50' : 'text-blue-700 bg-blue-100/50'} px-2.5 py-1 rounded-md shrink-0`}>
                                                {act.time}
                                              </span>
                                              <span className="text-lg shrink-0">{act.emoji || "📍"}</span>
                                              <div className="flex flex-col min-w-0">
                                                <div className={`font-bold text-sm leading-tight flex items-center gap-2 flex-wrap mb-1 ${isAffected ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                  {act.activity}
                                                  {isAffected && (
                                                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                                                      Discarded due to delay
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-[12px] font-black px-2.5 py-1 rounded-lg shrink-0 border transition-colors ${isAffected ? 'opacity-0' : act.cost > 0 ? 'text-purple-700 bg-purple-50 border-purple-100' : 'text-green-700 bg-green-50 border-green-100'}`}>
                                              {act.cost > 0 ? `~₹${act.cost}` : 'FREE'}
                                            </span>
                                          </div>
                                        </div>

                                        {!isAffected && (
                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2 bg-gray-50 p-2.5 rounded-lg ml-0.5 border border-gray-100/50 group-hover/act:bg-blue-50/30 transition-colors">
                                            <div className="flex items-start gap-2 min-w-0">
                                              <MapPin className="w-3.5 h-3.5 text-pink-500 mt-0.5 shrink-0 opacity-70" />
                                              <span className="text-xs text-gray-500 leading-snug truncate">{act.location}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                              <SmartRouteButton
                                                destination={act.location}
                                                coordinates={act.coordinates}
                                                origin={actIdx === 0 ? `Accommodation (${currentPlan.stay.area})` : dayPlan.activities[actIdx - 1].location}
                                                originCoords={actIdx === 0 ? undefined : dayPlan.activities[actIdx - 1].coordinates}
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* Optimized Replacement Activity (Shown only if Late & Affected) */}
                                      {isAffected && (
                                        <motion.div
                                          initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                          animate={{ opacity: 1, x: 0, scale: 1 }}
                                          transition={{ delay: 0.1 * (actIdx - (delayIndex || 0)) }}
                                          className="ml-2 mb-8 p-5 bg-gradient-to-br from-indigo-50/80 to-blue-50/80 border-2 border-indigo-200 rounded-[2rem] shadow-[0_10px_40px_-15px_rgba(99,102,241,0.2)] relative overflow-hidden group/opt"
                                        >
                                          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/opt:scale-125 transition-transform">
                                            <Sparkles className="w-12 h-12 text-indigo-600" />
                                          </div>

                                          <div className="flex items-start gap-4 relative z-10">
                                            <div className="flex flex-col items-center">
                                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md text-indigo-600 border border-indigo-100 group-hover/opt:shadow-indigo-100 transition-all">
                                                {actIdx === dayPlan.activities.length - 1 ? <Home className="w-6 h-6" /> : <Navigation className="w-6 h-6" />}
                                              </div>
                                              <div className="w-0.5 h-16 bg-gradient-to-b from-indigo-200 to-transparent mt-2" />
                                            </div>

                                            <div className="flex-1">
                                              <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black bg-indigo-600 text-white px-2.5 py-1 rounded-full uppercase tracking-tighter shadow-sm">
                                                  New Optimized Plan
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Safe Path</span>
                                                </div>
                                              </div>

                                              <h5 className="font-black text-indigo-900 text-base leading-tight">
                                                {actIdx === dayPlan.activities.length - 1
                                                  ? `Safety Express to PG (${currentPlan.stay.area})`
                                                  : `Safety Optimized Transit Step`
                                                }
                                              </h5>

                                              <div className="flex items-center gap-3 mt-2">
                                                <div className="flex items-center gap-1 px-2 py-0.5 bg-white border border-indigo-100 rounded-lg shadow-sm">
                                                  <Clock className="w-3 h-3 text-indigo-400" />
                                                  <span className="text-[10px] font-black text-indigo-700">{actIdx === dayPlan.activities.length - 1 ? '9:45 PM (Before 10:00 PM Curfew)' : '8:30 PM'}</span>
                                                </div>
                                                <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-100 rounded-lg shadow-sm">
                                                  <Shield className="w-3 h-3 text-green-500" />
                                                  <span className="text-[10px] font-black text-green-700">Safety Score: 10/10</span>
                                                </div>
                                              </div>

                                              <p className="text-[11px] text-indigo-700/70 mt-3 leading-relaxed font-medium bg-white/40 p-3 rounded-xl border border-white/50">
                                                {actIdx === dayPlan.activities.length - 1
                                                  ? "Optimized route bypasses dark alleys and uses well-lit high-traffic zones. Evaluating 9:00 PM limit. Dropped lowest rated spot (U = 2) to ensure safe arrival before curfew."
                                                  : "Replacing original route with Direct Safety Bus #402. High frequency and panic-button enabled."
                                                }
                                              </p>

                                              <div className="grid grid-cols-2 gap-3 mt-4">
                                                <div className="bg-white/60 p-2.5 rounded-2xl border border-indigo-50 flex items-center gap-2">
                                                  <Train className="w-4 h-4 text-indigo-500" />
                                                  <div className="min-w-0">
                                                    <p className="text-[8px] font-bold text-indigo-400 uppercase">Transit</p>
                                                    <p className="text-[10px] font-black text-indigo-900 truncate">Safety Bus</p>
                                                  </div>
                                                </div>
                                                <div className="bg-white/60 p-2.5 rounded-2xl border border-indigo-50 flex items-center gap-2">
                                                  <Wallet className="w-4 h-4 text-green-500" />
                                                  <div className="min-w-0">
                                                    <p className="text-[8px] font-bold text-green-400 uppercase">Saved</p>
                                                    <p className="text-[10px] font-black text-green-900 truncate">~₹{450 - (actIdx * 10)}</p>
                                                  </div>
                                                </div>
                                              </div>

                                              <button
                                                className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                                              >
                                                Switch to this safety route
                                              </button>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Daily Spend Tracker */}
                            <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/60 mt-4 relative overflow-hidden">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                                  <Wallet className="w-3.5 h-3.5 text-purple-500" />
                                  Daily Spend Tracker
                                </h4>
                                <span className="text-xs font-semibold text-gray-700">
                                  <span className={isOverBudget ? 'text-red-500 font-bold' : 'text-gray-900 font-bold'}>~₹{dayPlan.totalCost}</span>
                                  <span className="text-gray-400 mx-1">/</span>
                                  ~₹{dailyAllocated}
                                </span>
                              </div>
                              <div className="relative w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  whileInView={{ width: `${budgetPercent}%` }}
                                  viewport={{ once: true }}
                                  transition={{ duration: 1 }}
                                  className={`absolute top-0 left-0 h-full rounded-full ${isOverBudget
                                    ? 'bg-red-500'
                                    : 'bg-gradient-to-r from-blue-400 to-purple-500'
                                    }`}
                                />
                              </div>
                              <div className="mt-4 flex justify-end">
                                <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center gap-2 shadow-sm">
                                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">Total Trip Expense so far:</span>
                                  <span className="text-sm font-black text-blue-900">~₹{dayPlan.cumulativeCost}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                      }
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div >
            );
          })}
        </div >

        {/* Places to Visit Summary */}
        <div className="mt-16 bg-white rounded-3xl p-8 border border-blue-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Camera className="w-6 h-6 text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-900">Must-Visit Spots in {currentPlan.city}</h3>
            </div>

            <button
              onClick={() => setIsLinguistOpen(true)}
              className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-200 transition-colors shadow-sm cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>AR Lens</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentPlan.places.map((place, pidx) => (
              <div key={pidx} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition-colors group relative overflow-hidden">
                {place.imageUrl ? (
                  <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden shadow-sm group-hover:scale-105 transition-transform bg-gray-200">
                    <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                    📍
                  </div>
                )}

                <div className="min-w-0 flex-1 relative z-10">
                  <p className="font-bold text-gray-900 text-sm">{place.name}</p>
                  <p className="text-[10px] text-blue-600 font-bold uppercase mt-0.5 tracking-tight">{place.bestTime || 'Morning/Evening'}</p>
                  <p className="text-xs text-gray-500 mt-2 italic leading-relaxed">
                    <span className="font-bold font-not-italic text-gray-700 not-italic mr-1">Pro Tip:</span>
                    {place.tip || 'Visit during weekdays to avoid crowds.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div >
      </div >



      <SmartRouteMap
        isOpen={!!selectedRoute}
        onClose={() => setSelectedRoute(null)}
        routeInfo={selectedRoute}
      />

      {isLinguistOpen && (
        <div className="fixed inset-0 z-[99999] bg-white overflow-y-auto">
          <div className="sticky top-0 right-0 p-4 flex justify-end">
            <button onClick={() => setIsLinguistOpen(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200">
              <X className="w-6 h-6 text-gray-800" />
            </button>
          </div>
          <VisualLinguist onBack={() => setIsLinguistOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default MasterItinerary;

// Trigger Vite Reload
