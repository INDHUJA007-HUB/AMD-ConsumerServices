import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { MapPin, DollarSign, TrendingUp, Zap, Utensils, Bus, Brain, AlertCircle, Sparkles, Lightbulb, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { loadLivingCosts, LivingCostItem, loadZomatoRestaurantsCoimbatore, ZomatoRestaurant } from '@/services/datasetsApi';
import { haversineDistance } from '@/services/featureEngineering';

type Lifestyle = 'Frugal' | 'Balanced' | 'Premium';

interface PredictionResult {
    predicted_cost: number;
    breakdown: {
        base_rent: number;
        electricity_bill: number;
        estimated_food: number;
    };
    explanations: Record<string, number>;
    ai_summary: string;
    units_consumed: number;
}

interface Optimization {
    type: string;
    suggestion: string;
    savings: number;
}

const PredictiveExpenseModel = () => {
    const [lifestyle, setLifestyle] = useState<Lifestyle>('Balanced');
    const [acHours, setAcHours] = useState<number>(4);
    const [rent, setRent] = useState<number>(8500);
    const [distToCenter, setDistToCenter] = useState<number>(3.5);
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);
    const [optimizations, setOptimizations] = useState<Optimization[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const { data: livingCosts = [] } = useQuery<LivingCostItem[]>({
        queryKey: ['livingCosts'],
        queryFn: loadLivingCosts,
        staleTime: Infinity,
    });

    const { data: restaurants = [] } = useQuery<ZomatoRestaurant[]>({
        queryKey: ['restaurants'],
        queryFn: loadZomatoRestaurantsCoimbatore,
        staleTime: Infinity,
    });

    const multipliers = { 'Frugal': 0.8, 'Balanced': 1.0, 'Premium': 1.5 };
    const [selectedContext, setSelectedContext] = useState<any>(null);

    useEffect(() => {
        const loadContext = () => {
            const contextStr = localStorage.getItem('selectedStayContext');
            if (contextStr) {
                const context = JSON.parse(contextStr);
                setSelectedContext(context);
                if (context.acUsageHours) setAcHours(context.acUsageHours);
                if (context.distToCenter) setDistToCenter(context.distToCenter);
            }
        };

        loadContext();
        window.addEventListener('storage_update', loadContext);
        return () => window.removeEventListener('storage_update', loadContext);
    }, []);

    useEffect(() => {
        const fetchPrediction = async () => {
            setIsLoading(true);
            try {
                const inexpensiveMeal = livingCosts.find(c => c.item?.toLowerCase().includes('meal'))?.priceInr || 110;
                const internet = livingCosts.find(c => c.item?.toLowerCase().includes('internet'))?.priceInr || 686;

                const payload = {
                    rent: rent,
                    food_index: inexpensiveMeal,
                    utility_index: internet + 1200,
                    lifestyle_multiplier: multipliers[lifestyle],
                    dist_to_center: distToCenter,
                    ac_hours: acHours,
                    selected_stay: selectedContext,
                    nearby_premium: lifestyle === 'Premium' && selectedContext ?
                        restaurants.filter((r: any) => {
                            const d = haversineDistance(selectedContext.lat, selectedContext.lon, parseFloat(r.latitude), parseFloat(r.longitude));
                            return d < 2 && (parseFloat(r.aggregate_rating) > 4.0 || (r.price_range && parseInt(r.price_range) >= 3));
                        }).slice(0, 3).map((r: any) => `${r.name} (${r.cuisines})`) : []
                };

                const response = await fetch('http://localhost:8000/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const data = await response.json();
                setPrediction(data);

                const optResponse = await fetch('http://localhost:8000/optimize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ params: payload }),
                });
                const optData = await optResponse.json();
                setOptimizations(optData.optimizations);
            } catch (error) {
                console.error("Failed to fetch ML prediction", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (livingCosts.length > 0) {
            fetchPrediction();
        }
    }, [lifestyle, acHours, rent, distToCenter, livingCosts]);

    return (
        <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-purple-200 bg-white/80 backdrop-blur-sm shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                        <CardTitle className="flex items-center gap-2 text-purple-700">
                            <Brain className="h-6 w-6" />
                            AI Predictive Engine
                        </CardTitle>
                        <CardDescription>
                            Hyper-personalized survival cost based on XGBoost & TNEB Electricity Slabs.
                        </CardDescription>
                        {selectedContext && (
                            <div className="mt-2 p-2 bg-purple-100 border border-purple-200 rounded text-[10px] text-purple-700 font-medium flex items-center gap-2">
                                <Sparkles className="h-3 w-3" />
                                Analyzing Stay: {selectedContext.name}
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-purple-500" />
                                Lifestyle Preference
                            </label>
                            <Select value={lifestyle} onValueChange={(value: Lifestyle) => setLifestyle(value)}>
                                <SelectTrigger className="w-full border-purple-200 focus:ring-purple-500">
                                    <SelectValue placeholder="Select lifestyle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Frugal">🍀 Frugal (Essential Needs)</SelectItem>
                                    <SelectItem value="Balanced">🏠 Balanced (Comfortable)</SelectItem>
                                    <SelectItem value="Premium">💎 Premium (High-End)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-red-500" />
                                Environmental Context
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-[10px] text-blue-600 font-bold uppercase">Monthly Rent</p>
                                    <p className="text-lg font-bold text-blue-900">₹{rent.toLocaleString()}</p>
                                    <p className="text-[9px] text-blue-500 italic">Derived from selection</p>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                    <p className="text-[10px] text-purple-600 font-bold uppercase">AC Usage</p>
                                    <p className="text-lg font-bold text-purple-900">{acHours} hrs/day</p>
                                    <p className="text-[9px] text-purple-500 italic">{acHours > 6 ? "⚠️ Slab Jump Active" : "Normal Slab"}</p>
                                </div>
                                <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                                    <p className="text-[10px] text-orange-600 font-bold uppercase">Travel Distance</p>
                                    <p className="text-lg font-bold text-orange-900">{distToCenter.toFixed(1)} km</p>
                                    <p className="text-[9px] text-orange-500 italic">To Workplace</p>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase">Location Type</p>
                                    <p className="text-lg font-bold text-emerald-900">{distToCenter < 3 ? "Urban Hub" : "Suburban"}</p>
                                    <p className="text-[9px] text-emerald-500 italic">Based on Hub Proximity</p>
                                </div>
                            </div>
                        </div>

                        {/* Local Amenities Breakdown */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                                <Utensils className="h-4 w-4 text-orange-500" />
                                Local Spend Opportunities
                            </h4>
                            <div className="space-y-2">
                                {restaurants
                                    .map(r => ({
                                        ...r,
                                        distance: haversineDistance(
                                            Number(selectedContext?.lat || 0),
                                            Number(selectedContext?.lon || 0),
                                            Number(r.latitude || 0),
                                            Number(r.longitude || 0)
                                        )
                                    }))
                                    .filter(r => r.distance < 2.5)
                                    .sort((a, b) => a.distance - b.distance)
                                    .slice(0, 3)
                                    .map((res, i) => (
                                        <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100">
                                            <div>
                                                <p className="text-xs font-bold text-gray-800">{res.name}</p>
                                                <p className="text-[9px] text-gray-500">{res.cuisines?.split(',').slice(0, 2).join(',')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-orange-600">₹{res.average_cost_for_two ? res.average_cost_for_two / 2 : 200}</p>
                                                <p className="text-[9px] text-gray-400">{res.distance.toFixed(1)} km away</p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {prediction && (
                            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100 animate-in fade-in slide-in-from-bottom-2">
                                <h4 className="text-xs font-bold text-purple-600 uppercase mb-2 flex items-center gap-2">
                                    <Brain className="h-3 w-3" />
                                    AI Survival Insight
                                </h4>
                                <p className="text-sm text-gray-700 leading-relaxed italic">
                                    "{prediction.ai_summary}"
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-purple-200 bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <DollarSign className="h-24 w-24" />
                        </div>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <TrendingUp className="h-6 w-6" />
                                Total Predicted Spend
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-6xl font-bold mb-2">
                                ₹{prediction?.predicted_cost.toLocaleString('en-IN') || "---"}
                            </div>
                            <p className="text-purple-100 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Monthly survival estimate for Coimbatore
                            </p>
                        </CardContent>
                    </Card>

                    {prediction && (
                        <Card className="border-purple-200 bg-white/80 backdrop-blur-sm shadow-md">
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                                    <Brain className="h-4 w-4" />
                                    Explainable AI (SHAP Impact)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {Object.entries(prediction.explanations).map(([key, value]) => {
                                    const impact = Math.abs(value);
                                    const maxImpact = Math.max(...Object.values(prediction.explanations));
                                    const percentage = (impact / maxImpact) * 100;

                                    return (
                                        <div key={key}>
                                            <div className="flex justify-between text-[11px] mb-1">
                                                <span className="capitalize font-medium text-gray-600">
                                                    {key.replace(/_/g, ' ')}
                                                </span>
                                                <span className={value > 0 ? "text-red-500" : "text-green-500"}>
                                                    {value > 0 ? "+" : "-"}₹{Math.abs(Math.round(value))}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1">
                                                <div
                                                    className={`h-1 rounded-full ${value > 0 ? "bg-red-400" : "bg-green-400"}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {optimizations.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4 animate-in fade-in duration-700">
                    {optimizations.map((opt, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                            <div className="p-2 bg-emerald-500 rounded-lg text-white">
                                <Lightbulb className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-emerald-800 text-sm">{opt.type}</h4>
                                <p className="text-xs text-emerald-700 mb-2">{opt.suggestion}</p>
                                <span className="text-xs font-bold text-emerald-600">Save ₹{opt.savings.toLocaleString()} / month</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PredictiveExpenseModel;
