import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Bus, Building, Bike, Car, Navigation, Sparkles, IndianRupee } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { loadPGs, loadHouses, loadBusTrajectoryPoints, PGItem, HouseItem, BusRoutePoint, getTravelAdvice, TravelAdvice } from '@/services/datasetsApi';
import { getWorkplaceCoordinates, haversineDistance, calculateCommuteDetails, CommuteDetail } from '@/services/featureEngineering';

const TravelOptimizer = () => {
    const [workplace, setWorkplace] = useState('TIDEL Park, Coimbatore');
    const [submittedWorkplace, setSubmittedWorkplace] = useState('TIDEL Park');
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [askRoutes, setAskRoutes] = useState(false);
    const [preference, setPreference] = useState<'cheapest' | 'balanced' | 'fastest'>('balanced');

    const { data: pgs = [] } = useQuery<PGItem[]>({ queryKey: ['pgs'], queryFn: loadPGs, staleTime: Infinity });
    const { data: houses = [] } = useQuery<HouseItem[]>({ queryKey: ['houses'], queryFn: loadHouses, staleTime: Infinity });
    const { data: busRoutePoints = [] } = useQuery<BusRoutePoint[]>({ queryKey: ['bus-trajectory-coimbatore'], queryFn: loadBusTrajectoryPoints, staleTime: Infinity });

    const { data: workplaceCoords } = useQuery({
        queryKey: ['workplaceCoords', submittedWorkplace],
        queryFn: () => getWorkplaceCoordinates(submittedWorkplace),
        enabled: !!submittedWorkplace
    });

    const accommodations = useMemo(() => [...pgs, ...houses], [pgs, houses]);

    const areaScores = useMemo(() => {
        if (!workplaceCoords || accommodations.length === 0) return [];

        const areas: { [key: string]: { totalCommuteTime: number; busFrequencyScore: number; count: number } } = {};

        accommodations.forEach(acc => {
            if (!acc.area) return;

            const firstMileTime = 10; // Assume 10 mins walk to nearest bus stop
            const lastMileTime = 10; // Assume 10 mins walk from bus stop to workplace

            let nearestBusStopDist = Infinity;
            busRoutePoints.forEach(point => {
                const dist = haversineDistance(acc.latitude, acc.longitude, point.latitude, point.longitude);
                if (dist < nearestBusStopDist) {
                    nearestBusStopDist = dist;
                }
            });

            const transitLegTime = nearestBusStopDist * 15; // Simplified time calculation

            const totalCommuteTime = firstMileTime + transitLegTime + lastMileTime;

            const busFrequencyScore = busRoutePoints.filter(p => haversineDistance(acc.latitude, acc.longitude, p.latitude, p.longitude) < 2).length;

            if (!areas[acc.area]) {
                areas[acc.area] = { totalCommuteTime: 0, busFrequencyScore: 0, count: 0 };
            }
            areas[acc.area].totalCommuteTime += totalCommuteTime;
            areas[acc.area].busFrequencyScore += busFrequencyScore;
            areas[acc.area].count++;
        });

        return Object.entries(areas).map(([name, data]) => {
            const avgCommuteTime = data.totalCommuteTime / data.count;
            const areaScore = (1 / avgCommuteTime) * 100 + data.busFrequencyScore;

            // Get Commute Details for this area
            // We use the first accommodation coordinate as proxy for the area center
            const proxyAcc = accommodations.find(a => a.area === name);
            const dist = proxyAcc ? haversineDistance(proxyAcc.latitude, proxyAcc.longitude, workplaceCoords.lat, workplaceCoords.lon) : 5;
            const commuteOptions = calculateCommuteDetails(dist, name, submittedWorkplace);

            return {
                name,
                distance: dist,
                avgCommuteTime,
                busFrequencyScore: data.busFrequencyScore,
                areaScore,
                commuteOptions
            };
        }).sort((a, b) => b.areaScore - a.areaScore);

    }, [workplaceCoords, accommodations, busRoutePoints]);

    const handleOptimize = () => {
        setSubmittedWorkplace(workplace);
    };

    const { data: advice, isFetching: isAdviceLoading, refetch: refetchAdvice } = useQuery<TravelAdvice>({
        queryKey: ['travel-advice', origin, destination],
        queryFn: () => getTravelAdvice(origin, destination, 'Coimbatore'),
        enabled: askRoutes && !!origin && !!destination,
        staleTime: 0,
    });

    const handleGetDirections = () => {
        setAskRoutes(true);
        refetchAdvice();
    };

    return (
        <Card className="border-indigo-200 bg-white/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-600">
                    <MapPin className="h-6 w-6" />
                    Travel Optimizer
                </CardTitle>
                <CardDescription>
                    AI-powered, Coimbatore-style directions with costs, times, and bus roadmaps.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="mt-2 space-y-3 p-4 rounded-lg border border-indigo-100 bg-white/70">
                    <h4 className="font-semibold text-indigo-700 flex items-center gap-2">
                        <Navigation className="h-5 w-5" />
                        Point-to-Point Directions (Bus, Rapido, Auto, Cab)
                    </h4>
                    <div className="flex flex-col md:flex-row gap-2">
                        <Input
                            value={origin}
                            onChange={(e) => setOrigin(e.target.value)}
                            placeholder="From (e.g., Gandhipuram Bus Stand)"
                        />
                        <Input
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder="To (e.g., TIDEL Park Coimbatore)"
                        />
                        <Button onClick={handleGetDirections} disabled={!origin || !destination} className="bg-indigo-600 hover:bg-indigo-700">
                            Get Directions
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Preference:</span>
                        <div className="inline-flex rounded-lg border overflow-hidden">
                            <button className={`px-3 py-1 text-xs ${preference==='cheapest'?'bg-indigo-600 text-white':'bg-white text-gray-700'}`} onClick={()=>setPreference('cheapest')}>Cheapest</button>
                            <button className={`px-3 py-1 text-xs ${preference==='balanced'?'bg-indigo-600 text-white':'bg-white text-gray-700'}`} onClick={()=>setPreference('balanced')}>Balanced</button>
                            <button className={`px-3 py-1 text-xs ${preference==='fastest'?'bg-indigo-600 text-white':'bg-white text-gray-700'}`} onClick={()=>setPreference('fastest')}>Fastest</button>
                        </div>
                    </div>
                    {isAdviceLoading && <p className="text-sm text-gray-500">Fetching routes...</p>}
                    {!isAdviceLoading && advice && (() => {
                        const plan = advice.plan || {};
                        const cheapest = advice.recommended_by_budget;
                        const fastest = advice.recommended_by_time;
                        const preferred = preference === 'cheapest' ? cheapest : preference === 'fastest' ? fastest : null;
                        const modes: Array<{ key: keyof typeof plan; label: string; icon: JSX.Element }> = [
                            { key: 'bus', label: 'City Bus', icon: <Bus className="h-4 w-4 text-blue-500" /> },
                            { key: 'rapido', label: 'Rapido', icon: <Bike className="h-4 w-4 text-orange-500" /> },
                            { key: 'auto', label: 'Auto', icon: <Navigation className="h-4 w-4 text-yellow-600" /> },
                            { key: 'cab', label: 'Cab', icon: <Car className="h-4 w-4 text-gray-700" /> },
                        ];
                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {modes.map((m) => {
                                    const item: any = (plan as any)[m.key] || {};
                                    const steps: string[] = Array.isArray(item.steps) ? item.steps : [];
                                    const stations: string[] = Array.isArray(item.stations) ? item.stations : [];
                                    const isRecommended = preferred ? preferred === m.key : false;
                                    return (
                                        <div key={m.key as string} className={`p-4 rounded-xl border ${isRecommended ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-gray-200 bg-white'}`}>
                                            {isRecommended && (
                                                <div className="mb-1 inline-flex items-center gap-1 text-[10px] font-bold bg-green-600 text-white px-2 py-0.5 rounded-full">
                                                    <Sparkles className="h-3 w-3" /> Recommended
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-bold flex items-center gap-1.5 text-gray-800">
                                                    {m.icon}
                                                    {m.label}
                                                </span>
                                                <span className="text-xs font-semibold text-indigo-700">
                                                    <IndianRupee className="inline h-3 w-3" />{item.est_cost_inr ?? '—'} • {item.est_time_mins ?? '—'} mins
                                                </span>
                                            </div>
                                            <ul className="list-disc list-inside space-y-1 text-[12px] text-gray-700">
                                                {steps.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                            {stations.length > 0 && (
                                                <div className="mt-2">
                                                    <div className="text-[11px] font-semibold text-blue-700">Stations Roadmap</div>
                                                    <div className="text-[11px] text-gray-700">{stations.join(' → ')}</div>
                                                </div>
                                            )}
                                            {item.notes && <p className="text-[11px] text-gray-500 mt-2 italic">{item.notes}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>

                {submittedWorkplace && areaScores.length > 0 && workplaceCoords && (
                    <div className="space-y-6">
                        <h3 className="font-semibold text-indigo-700 text-lg flex items-center gap-2">
                            <Navigation className="h-5 w-5" />
                            Best Areas to stay for {submittedWorkplace}
                        </h3>
                        <div className="space-y-8">
                            {areaScores.slice(0, 3).map((area, index) => (
                                <div key={area.name} className={`rounded-xl border p-6 transition-all ${index === 0 ? 'border-indigo-300 bg-indigo-50/50 shadow-md' : 'border-gray-100 bg-white'}`}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                        <div>
                                            <h4 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                                                <Building className="h-6 w-6 text-indigo-500" />
                                                {area.name}
                                            </h4>
                                            <p className="text-sm text-gray-500 mt-1">Approx. {area.distance.toFixed(1)} km from your workplace</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white px-3 py-1.5 rounded-lg border border-indigo-100 flex items-center gap-2 shadow-sm">
                                                <Clock className="h-4 w-4 text-indigo-600" />
                                                <span className="font-bold text-indigo-900">{area.avgCommuteTime.toFixed(0)} mins</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {area.commuteOptions.map((opt) => (
                                            <div
                                                key={opt.mode}
                                                className={`relative p-4 rounded-xl border flex flex-col gap-2 transition-all hover:shadow-md ${opt.recommendation ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-gray-200 bg-white'}`}
                                            >
                                                {opt.recommendation && (
                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                                        <Sparkles className="h-2 w-2" /> PERFECT MATCH
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-bold flex items-center gap-1.5 text-gray-800">
                                                        {opt.mode === "Bus" && <Bus className="h-4 w-4 text-blue-500" />}
                                                        {opt.mode === "Rapido" && <Bike className="h-4 w-4 text-orange-500" />}
                                                        {opt.mode === "Auto" && <Navigation className="h-4 w-4 text-yellow-600" />}
                                                        {opt.mode === "Cab" && <Car className="h-4 w-4 text-gray-700" />}
                                                        {opt.mode}
                                                    </span>
                                                    <span className="text-sm font-extrabold text-indigo-700">₹{opt.price}</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-[11px] text-gray-500 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> {opt.timeMins} mins
                                                    </div>
                                                    {opt.busNumbers && (
                                                        <div className="space-y-1">
                                                            <div className="text-[10px] font-medium bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded w-fit">
                                                                Buses: {opt.busNumbers.join(", ")}
                                                            </div>
                                                            <div className="text-[9px] text-blue-600 font-semibold uppercase">
                                                                Service: 8:00 AM - 9:00 PM (Every 15m)
                                                            </div>
                                                        </div>
                                                    )}
                                                    <p className="text-[10px] text-gray-400 mt-1 italic">{opt.details}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default TravelOptimizer;
