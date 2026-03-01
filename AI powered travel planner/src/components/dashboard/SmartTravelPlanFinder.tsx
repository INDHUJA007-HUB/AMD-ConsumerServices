import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import AILoadingScreen from '@/components/AILoadingScreen';
import MasterItinerary from '@/components/dashboard/MasterItinerary';
import { mockCityPlan } from '@/data/mockCityPlan';
import { fetchCityPlan } from '@/services/api';
import { MapPin, User, Briefcase, Clock, Building2, Sparkles, Navigation, UtensilsCrossed, Wallet, Fan, Heart, Scan } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    searchHotelsInCoimbatore,
    getHotelDetails,
    getHotelPaymentFeatures,
    getHotelPhotos,
    getHotelFacilities,
    getDescriptionAndInfo,
    HotelSummary,
} from '@/services/bookingApi';
import { enhanceAccommodations, EnhancedAccommodation } from '@/services/featureEngineeringApi';
import { haversineDistance, getWorkplaceCoordinates, calculateFeatures } from '@/services/featureEngineering';
import { loadPGs, loadHouses, loadZomatoRestaurantsCoimbatore, loadBusTrajectoryPoints, loadLivingCosts, PGItem, HouseItem, ZomatoRestaurant, BusRoutePoint, LivingCostItem } from '@/services/datasetsApi';

const formSchema = z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    duration: z.string().min(1, 'Please enter number of days'),
    destinationPoint: z.enum(['Coimbatore', 'Chennai', 'Trichy'], {
        required_error: 'Please select a destination point',
    }),
    boardingPoint: z.string().optional(),
    modeOfTransport: z.enum(['Bus', 'Train', 'Metro', 'Flight'], {
        required_error: 'Please select mode of transport',
    }),
    transportCategory: z.string().optional(),
    budget: z.string().min(1, 'Please enter your travel budget'),
    lifestyle: z.enum(['Budget', 'Medium', 'Luxury'], {
        required_error: 'Please select a lifestyle',
    }),
    noOfMembers: z.string().optional(),
    placesToVisit: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type AssistantCandidate = {
    id: string;
    type: 'pg' | 'house';
    name: string;
    latitude: number;
    longitude: number;
    item: PGItem | HouseItem;
};

type ClusterResult = {
    assignments: number[];
    centroids: number[][];
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const parsePriceValue = (value?: string) => {
    if (!value) return undefined;
    const cleaned = value.replace(/[^\d.]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const toLifestyleValue = (value: 'Budget' | 'Medium' | 'Luxury') => {
    if (value === 'Luxury') return 3;
    if (value === 'Medium') return 2;
    return 1;
};

const matrixTranspose = (m: number[][]) => m[0].map((_, i) => m.map(row => row[i]));

const matrixMultiply = (a: number[][], b: number[][]) => {
    const rows = a.length;
    const cols = b[0].length;
    const shared = b.length;
    const out = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let i = 0; i < rows; i++) {
        for (let k = 0; k < shared; k++) {
            const aik = a[i][k];
            for (let j = 0; j < cols; j++) {
                out[i][j] += aik * b[k][j];
            }
        }
    }
    return out;
};

const matrixInverse = (m: number[][]) => {
    const n = m.length;
    const aug = m.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
    for (let i = 0; i < n; i++) {
        let pivot = aug[i][i];
        if (Math.abs(pivot) < 1e-9) {
            for (let r = i + 1; r < n; r++) {
                if (Math.abs(aug[r][i]) > 1e-9) {
                    const temp = aug[i];
                    aug[i] = aug[r];
                    aug[r] = temp;
                    pivot = aug[i][i];
                    break;
                }
            }
        }
        if (Math.abs(pivot) < 1e-9) return null;
        const invPivot = 1 / pivot;
        for (let j = 0; j < 2 * n; j++) {
            aug[i][j] *= invPivot;
        }
        for (let r = 0; r < n; r++) {
            if (r === i) continue;
            const factor = aug[r][i];
            if (factor === 0) continue;
            for (let j = 0; j < 2 * n; j++) {
                aug[r][j] -= factor * aug[i][j];
            }
        }
    }
    return aug.map(row => row.slice(n));
};

const trainLinearRegression = (data: Array<{ x: number[]; y: number }>) => {
    const x = data.map(d => d.x);
    const y = data.map(d => [d.y]);
    const xt = matrixTranspose(x);
    const xtx = matrixMultiply(xt, x);
    const xtxInv = matrixInverse(xtx);
    if (!xtxInv) return Array(x[0].length).fill(0);
    const xty = matrixMultiply(xt, y);
    const coef = matrixMultiply(xtxInv, xty).map((row) => row[0]);
    return coef;
};

const predictLinear = (coefficients: number[], x: number[]) => {
    return coefficients.reduce((sum, coef, idx) => sum + coef * x[idx], 0);
};

const kMeansCluster = (data: number[][], k: number) => {
    if (data.length === 0) return { assignments: [], centroids: [] };
    const centroids = [
        data[0].slice(),
        data[Math.floor(data.length / 2)].slice(),
        data[data.length - 1].slice(),
    ].slice(0, k);
    const assignments = new Array(data.length).fill(0);
    for (let iter = 0; iter < 8; iter++) {
        for (let i = 0; i < data.length; i++) {
            let best = 0;
            let bestDist = Infinity;
            for (let c = 0; c < centroids.length; c++) {
                const dist = data[i].reduce((sum, val, idx) => {
                    const d = val - centroids[c][idx];
                    return sum + d * d;
                }, 0);
                if (dist < bestDist) {
                    bestDist = dist;
                    best = c;
                }
            }
            assignments[i] = best;
        }
        const sums = Array.from({ length: centroids.length }, () => Array(data[0].length).fill(0));
        const counts = Array(centroids.length).fill(0);
        for (let i = 0; i < data.length; i++) {
            const cluster = assignments[i];
            counts[cluster] += 1;
            for (let d = 0; d < data[i].length; d++) {
                sums[cluster][d] += data[i][d];
            }
        }
        for (let c = 0; c < centroids.length; c++) {
            if (counts[c] === 0) continue;
            centroids[c] = sums[c].map((sum, idx) => sum / counts[c]);
        }
    }
    return { assignments, centroids };
};

const labelClusters = (centroids: number[][]) => {
    const rents = centroids.map(c => c[0]);
    const dist = centroids.map(c => c[1]);
    const food = centroids.map(c => c[2]);
    const median = (arr: number[]) => {
        const sorted = [...arr].sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)] ?? 0;
    };
    const rentMedian = median(rents);
    const distMedian = median(dist);
    const foodMedian = median(food);
    return centroids.map(c => {
        if (c[0] >= rentMedian && c[1] <= distMedian) return 'The Professional Hub';
        if (c[0] <= rentMedian && c[2] >= foodMedian) return 'The Student Zone';
        return 'The Suburban Chill';
    });
};

const calcStats = (values: number[]) => {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: sum / values.length,
    };
};

interface SmartTravelPlanFinderProps {
}

const SmartTravelPlanFinder = ({ }: SmartTravelPlanFinderProps) => {
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState<FormValues | null>(null);
    const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [selectedStay, setSelectedStay] = useState<{ type: 'apiHotel' | 'pg' | 'house'; id: string } | null>(null);
    const [showLoadingState, setShowLoadingState] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState<any>(null);
    const queryClient = useQueryClient();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            phone: '',
            email: '',
            duration: '',
            boardingPoint: '',
            modeOfTransport: 'Bus',
            destinationPoint: 'Coimbatore',
            transportCategory: '',
            budget: '',
            lifestyle: 'Budget',
            noOfMembers: '1',
            placesToVisit: '',
        },
    });

    const onSubmit = (data: FormValues) => {
        setFormData(data);
        setShowLoadingState(true);
        setSubmitted(true); // Triggers background queries to make loading authentic
        // Removed workplace localStorage as field was replaced
    };

    const resetForm = () => {
        form.reset();
        setSubmitted(false);
        setShowLoadingState(false);
        setFormData(null);
        setSelectedHotelId(null);
        setSelectedStay(null);
        setGeneratedPlan(null);
        queryClient.removeQueries({ queryKey: ['hotels', 'coimbatore'] });
    };

    useEffect(() => {
        if (!submitted) return;
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
            },
            () => {
                setUserLocation(null);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
        );
    }, [submitted]);

    const {
        data: hotels,
        isLoading: isLoadingHotels,
        isError: isHotelsError,
        error: hotelsError,
    } = useQuery<HotelSummary[], Error>({
        queryKey: ['hotels', 'coimbatore'],
        queryFn: searchHotelsInCoimbatore,
        enabled: submitted,
        staleTime: 1000 * 60 * 5,
    });

    const {
        data: enhancedHotels,
        isLoading: isLoadingFeatures,
    } = useQuery<EnhancedAccommodation[], Error>({
        queryKey: ['enhancedHotels', hotels],
        queryFn: async () => {
            if (!hotels || hotels.length === 0) return [];
            return enhanceAccommodations(hotels, undefined);
        },
        enabled: !!hotels && hotels.length > 0 && submitted,
        staleTime: 1000 * 60 * 10,
    });

    const { data: pgs = [] } = useQuery<PGItem[]>({
        queryKey: ['pgs'],
        queryFn: async () => loadPGs(),
        enabled: submitted,
        staleTime: 1000 * 60 * 60,
    });
    const { data: houses = [] } = useQuery<HouseItem[]>({
        queryKey: ['houses'],
        queryFn: async () => loadHouses(),
        enabled: submitted,
        staleTime: 1000 * 60 * 60,
    });
    const { data: restaurants = [] } = useQuery<ZomatoRestaurant[]>({
        queryKey: ['restaurants-coimbatore'],
        queryFn: async () => loadZomatoRestaurantsCoimbatore(),
        enabled: submitted,
        staleTime: 1000 * 60 * 60,
    });
    const { data: busRoutePoints = [] } = useQuery<BusRoutePoint[]>({
        queryKey: ['bus-trajectory-coimbatore'],
        queryFn: async () => loadBusTrajectoryPoints(),
        enabled: submitted,
        staleTime: 1000 * 60 * 60,
    });
    const { data: livingCosts = [] } = useQuery<LivingCostItem[]>({
        queryKey: ['living-costs-coimbatore'],
        queryFn: async () => loadLivingCosts(),
        enabled: submitted,
        staleTime: 1000 * 60 * 60,
    });
    const selectedHotel = useMemo(
        () => enhancedHotels?.find((h) => h.id === selectedHotelId) ?? null,
        [enhancedHotels, selectedHotelId]
    );

    const workplaceCoords = useMemo(
        () => null, // Workplace field was removed
        []
    );

    const hotelsNearUser = useMemo(() => {
        if (!enhancedHotels || !userLocation) return [];
        return enhancedHotels.filter(
            (h) =>
                h.latitude !== undefined &&
                h.longitude !== undefined &&
                haversineDistance(userLocation.lat, userLocation.lon, h.latitude!, h.longitude!) <= 5
        );
    }, [enhancedHotels, userLocation]);

    const hotelsNearWorkplace = useMemo(() => {
        if (!enhancedHotels || !workplaceCoords) return [];
        return enhancedHotels.filter(
            (h) =>
                h.latitude !== undefined &&
                h.longitude !== undefined &&
                haversineDistance(workplaceCoords.lat, workplaceCoords.lon, h.latitude!, h.longitude!) <= 5
        );
    }, [enhancedHotels, workplaceCoords]);

    const pgsNearWorkplace = useMemo(() => {
        if (!workplaceCoords || !pgs) return [];
        return pgs.filter(
            (p) => haversineDistance(workplaceCoords.lat, workplaceCoords.lon, p.latitude, p.longitude) <= 5
        );
    }, [pgs, workplaceCoords]);

    const housesNearWorkplace = useMemo(() => {
        if (!workplaceCoords || !houses) return [];
        return houses.filter(
            (h) => haversineDistance(workplaceCoords.lat, workplaceCoords.lon, h.latitude, h.longitude) <= 5
        );
    }, [houses, workplaceCoords]);

    const selectedCoords = useMemo(() => {
        if (selectedStay?.type === 'pg') {
            const item = pgs.find(p => p.id === selectedStay.id);
            return item ? { lat: item.latitude, lon: item.longitude } : null;
        }
        if (selectedStay?.type === 'house') {
            const item = houses.find(h => h.id === selectedStay.id);
            return item ? { lat: item.latitude, lon: item.longitude } : null;
        }
        if (selectedHotel) {
            return selectedHotel.latitude && selectedHotel.longitude ? { lat: selectedHotel.latitude, lon: selectedHotel.longitude } : null;
        }
        return null;
    }, [selectedStay, pgs, houses, selectedHotel]);

    const nearbyRestaurants = useMemo(() => {
        if (!selectedCoords || !restaurants) return [];
        return restaurants
            .filter(r => r.latitude !== undefined && r.longitude !== undefined)
            .map(r => ({
                ...r,
                distanceKm: haversineDistance(selectedCoords.lat, selectedCoords.lon, r.latitude!, r.longitude!),
            }))
            .filter(r => r.distanceKm <= 5)
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, 10);
    }, [restaurants, selectedCoords]);

    const { data: datasetFeatures } = useQuery({
        queryKey: ['datasetFeatures', selectedStay?.type, selectedStay?.id],
        queryFn: async () => {
            if (!selectedStay || selectedStay.type === 'apiHotel') return null;
            const coords =
                selectedStay.type === 'pg'
                    ? pgs.find(p => p.id === selectedStay.id)
                    : houses.find(h => h.id === selectedStay.id);
            if (!coords) return null;
            return calculateFeatures(coords.latitude, coords.longitude, undefined);
        },
        enabled: !!selectedStay && selectedStay.type !== 'apiHotel',
        staleTime: 1000 * 60 * 10,
    });
    const {
        data: hotelDetails,
        isLoading: isLoadingDetails,
    } = useQuery<any, Error>({
        queryKey: ['hotelDetails', selectedHotelId],
        queryFn: () => getHotelDetails(selectedHotelId as string),
        enabled: !!selectedHotelId,
        staleTime: 1000 * 60 * 10,
    });

    const {
        data: paymentFeatures,
        isLoading: isLoadingPayment,
    } = useQuery<any, Error>({
        queryKey: ['hotelPayment', selectedHotelId],
        queryFn: () => getHotelPaymentFeatures(selectedHotelId as string),
        enabled: !!selectedHotelId,
        staleTime: 1000 * 60 * 10,
    });

    const {
        data: photos,
        isLoading: isLoadingPhotos,
    } = useQuery<any, Error>({
        queryKey: ['hotelPhotos', selectedHotelId],
        queryFn: () => getHotelPhotos(selectedHotelId as string),
        enabled: !!selectedHotelId,
        staleTime: 1000 * 60 * 10,
    });

    const {
        data: facilities,
        isLoading: isLoadingFacilities,
    } = useQuery<any, Error>({
        queryKey: ['hotelFacilities', selectedHotelId],
        queryFn: () => getHotelFacilities(selectedHotelId as string),
        enabled: !!selectedHotelId,
        staleTime: 1000 * 60 * 10,
    });

    const {
        data: descriptionInfo,
        isLoading: isLoadingDescription,
    } = useQuery<any, Error>({
        queryKey: ['descriptionInfo', selectedHotelId],
        queryFn: () => getDescriptionAndInfo(selectedHotelId as string),
        enabled: !!selectedHotelId,
        staleTime: 1000 * 60 * 10,
    });

    const regressionCoefficients = useMemo(() => {
        const samples = [
            { lifestyle: 1, ac: 3, commute: 2, rent: 7000 },
            { lifestyle: 1, ac: 5, commute: 4, rent: 8500 },
            { lifestyle: 2, ac: 6, commute: 6, rent: 11000 },
            { lifestyle: 2, ac: 4, commute: 3, rent: 9500 },
            { lifestyle: 3, ac: 8, commute: 8, rent: 15000 },
            { lifestyle: 3, ac: 6, commute: 5, rent: 14000 },
            { lifestyle: 1, ac: 2, commute: 1, rent: 6500 },
            { lifestyle: 2, ac: 7, commute: 7, rent: 12000 },
            { lifestyle: 3, ac: 9, commute: 10, rent: 17000 },
        ];
        const data = samples.map((s) => {
            const y = s.rent + s.ac * 150 + s.commute * 350 + s.lifestyle * 1200 + 1800;
            return { x: [1, s.lifestyle, s.ac, s.commute, s.rent], y };
        });
        return trainLinearRegression(data);
    }, []);


    const livingCostSummary = useMemo(() => {
        const monthlyItems = livingCosts.filter((item) => item.item.toLowerCase().includes('monthly') || item.item.toLowerCase().includes('internet'));
        const monthlyTotal = monthlyItems.reduce((sum, item) => sum + (item.priceInr ?? 0), 0);
        return {
            monthlyItems,
            monthlyTotal,
        };
    }, [livingCosts]);

    const pgPriceStats = useMemo(() => {
        const prices = pgs.map((pg) => parsePriceValue(pg.pricePerMonth)).filter((v): v is number => v !== undefined);
        return calcStats(prices);
    }, [pgs]);

    const housePriceStats = useMemo(() => {
        const prices = houses.map((house) => parsePriceValue(house.pricePerMonth)).filter((v): v is number => v !== undefined);
        return calcStats(prices);
    }, [houses]);

    const priceRangeSummary = useMemo(() => {
        const pgText = pgPriceStats
            ? `PGs ₹${Math.round(pgPriceStats.min)} - ₹${Math.round(pgPriceStats.max)} (avg ₹${Math.round(pgPriceStats.avg)})`
            : 'PGs price range unavailable';
        const houseText = housePriceStats
            ? `Houses ₹${Math.round(housePriceStats.min)} - ₹${Math.round(housePriceStats.max)} (avg ₹${Math.round(housePriceStats.avg)})`
            : 'Houses price range unavailable';
        return `${pgText}; ${houseText}`;
    }, [pgPriceStats, housePriceStats]);


    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    const livingCostText = livingCostSummary.monthlyTotal > 0
        ? `Monthly essentials (transport + internet + phone) average ₹${Math.round(livingCostSummary.monthlyTotal)}`
        : 'Monthly essentials average not available';


    const googlePlacesKey =
        import.meta.env.VITE_GOOGLE_PLACES_KEY ||
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
        import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY;

    if (showLoadingState && formData) {
        return (
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl min-h-[60vh] flex items-center justify-center border border-blue-100 mt-6">
                <AILoadingScreen onComplete={async () => {
                    if (formData) {
                        const requestedDays = Number(formData.duration) || 3;
                        console.warn(`[SmartTravelPlanFinder] Requesting ${requestedDays} days for ${formData.destinationPoint}`);
                        const plan = await fetchCityPlan({
                            city: formData.destinationPoint as any,
                            days: requestedDays,
                            budget: parseInt(formData.budget) || 20000,
                            budgetType: 'monthly',
                            purpose: 'relocation',
                            foodPreference: 'both',
                            travelStyle: formData.lifestyle.toLowerCase() as any,
                            preferredPlaces: formData.placesToVisit,
                            boardingPoint: formData.boardingPoint,
                            modeOfTransport: formData.modeOfTransport,
                        });
                        console.warn(`[SmartTravelPlanFinder] Plan received: ${plan.dailyPlans.length} days`);
                        setGeneratedPlan(plan);
                    }
                    setShowLoadingState(false);
                }} />
            </div>
        );

    }

    if (submitted && !showLoadingState && generatedPlan) {
        // Render the new Master Itinerary View instead of the old output
        return (
            <div className="mt-8">
                <MasterItinerary
                    plan={generatedPlan}
                    onBack={resetForm}
                />
            </div>
        );
    }

    return (
        <>
            <Card className="border-blue-200 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                        <MapPin className="h-6 w-6" />
                        Smart Travel Plan Finder
                    </CardTitle>
                    <CardDescription>
                        Tell us about your trip and we'll find the perfect travel plan
                    </CardDescription>
                </CardHeader>
                <CardContent>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                            console.error('[SmartTravelPlanFinder] Form validation failed:', errors);
                        })} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Your Name
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your name" {...field} className="border-blue-200 focus:border-blue-400" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Briefcase className="h-4 w-4" />
                                                Phone Number
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="tel" placeholder="Enter phone number" {...field} className="border-blue-200 focus:border-blue-400" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Email Address
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="Enter email address" {...field} className="border-blue-200 focus:border-blue-400" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="duration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            No of Days
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Enter number of days" {...field} className="border-blue-200 focus:border-blue-400" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="boardingPoint"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            Boarding Point
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., RS Puram, Anna Nagar" {...field} className="border-blue-200 focus:border-blue-400" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="destinationPoint"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            Destination Point
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                                                    <SelectValue placeholder="Select destination" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Coimbatore">Coimbatore</SelectItem>
                                                <SelectItem value="Chennai">Chennai</SelectItem>
                                                <SelectItem value="Trichy">Trichy</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="modeOfTransport"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Navigation className="h-4 w-4" />
                                                Mode of Transport
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="border-blue-200 focus:border-blue-400">
                                                        <SelectValue placeholder="Select transport mode" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Bus">Bus</SelectItem>
                                                    <SelectItem value="Train">Train</SelectItem>
                                                    <SelectItem value="Metro">Metro</SelectItem>
                                                    <SelectItem value="Flight">Flight</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {form.watch('modeOfTransport') === 'Bus' && (
                                    <FormField
                                        control={form.control}
                                        name="transportCategory"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Navigation className="h-4 w-4" />
                                                    Transport Category
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="border-blue-200 focus:border-blue-400">
                                                            <SelectValue placeholder="Select category" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Sleeper">Sleeper</SelectItem>
                                                        <SelectItem value="Semi Sleeper">Semi Sleeper</SelectItem>
                                                        <SelectItem value="Seater">Seater</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                {form.watch('modeOfTransport') === 'Train' && (
                                    <FormField
                                        control={form.control}
                                        name="transportCategory"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Navigation className="h-4 w-4" />
                                                    Transport Category
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="border-blue-200 focus:border-blue-400">
                                                            <SelectValue placeholder="Select category" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="AC 1 Tier">AC 1 Tier</SelectItem>
                                                        <SelectItem value="AC 2 Tier">AC 2 Tier</SelectItem>
                                                        <SelectItem value="AC 3 Tier">AC 3 Tier</SelectItem>
                                                        <SelectItem value="Sleeper Class">Sleeper Class</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                {form.watch('modeOfTransport') === 'Flight' && (
                                    <FormField
                                        control={form.control}
                                        name="transportCategory"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Navigation className="h-4 w-4" />
                                                    Transport Category
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="border-blue-200 focus:border-blue-400">
                                                            <SelectValue placeholder="Select category" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Economy">Economy</SelectItem>
                                                        <SelectItem value="Business">Business</SelectItem>
                                                        <SelectItem value="First Class">First Class</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="budget"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Wallet className="h-4 w-4" />
                                                Travel Budget (INR)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="10000"
                                                    {...field}
                                                    className="border-blue-200 focus:border-blue-400"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="noOfMembers"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                No of Members
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="1"
                                                    {...field}
                                                    className="border-blue-200 focus:border-blue-400"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="lifestyle"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Sparkles className="h-4 w-4" />
                                                Lifestyle
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="border-blue-200 focus:border-blue-400">
                                                        <SelectValue placeholder="Select lifestyle" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Budget">Budget</SelectItem>
                                                    <SelectItem value="Medium">Medium</SelectItem>
                                                    <SelectItem value="Luxury">Luxury</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="placesToVisit"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="flex items-center gap-2">
                                                <Heart className="h-4 w-4" />
                                                Places to Visit
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g., Temples, Malls, Parks"
                                                    {...field}
                                                    className="border-blue-200 focus:border-blue-400"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Optional: Let us know your key interests to better personalize your plan.
                                            </p>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-6 text-lg shadow-md hover:shadow-lg transition-all">
                                    Find My Best Plan
                                </Button>

                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </>
    );
};

export default SmartTravelPlanFinder;
