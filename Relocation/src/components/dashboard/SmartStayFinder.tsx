import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MapPin, User, Briefcase, Clock, Building2, Sparkles, Navigation, UtensilsCrossed, Wallet, Fan, Heart, Brain, Utensils, ShoppingBag, Store } from 'lucide-react';
import CollaborativeFilteringPanel from '@/components/dashboard/CollaborativeFilteringPanel';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CoimbatoreSmartMap from '@/components/CoimbatoreSmartMap';
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
    name: z.string().min(2, 'Name must be at least 2 characters'),
    reason: z.enum(['Education', 'Job', 'Internship', 'Business'], {
        required_error: 'Please select a reason for visit',
    }),
    duration: z.enum(['Short-term (Days)', 'Short-term (Months)', 'Long-term (Months)', 'Long-term (Years)'], {
        required_error: 'Please select duration',
    }),
    city: z.enum(['Coimbatore', 'Chennai', 'Trichy'], {
        required_error: 'Please select a city',
    }),
    place: z.string().min(2, 'Please specify the area/place'),
    workplace: z.string().optional(),
    budget: z.string().min(1, 'Please enter your budget'),
    lifestyle: z.enum(['Budget', 'Medium', 'Luxury'], {
        required_error: 'Please select a lifestyle',
    }),
    acUsageHours: z.string().min(1, 'Please enter AC usage hours'),
    preferences: z.string().optional(),
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

const SmartStayFinder = () => {
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState<FormValues | null>(null);
    const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [selectedStay, setSelectedStay] = useState<{ type: 'apiHotel' | 'pg' | 'house'; id: string } | null>(null);
    const queryClient = useQueryClient();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: localStorage.getItem("userName") || '',
            place: localStorage.getItem("startingLocation") || '',
            workplace: localStorage.getItem("workplace") || '',
            budget: '',
            lifestyle: 'Budget',
            acUsageHours: '6',
            preferences: '',
        },
    });

    const onSubmit = (data: FormValues) => {
        setFormData(data);
        setSubmitted(true);
        // Store user info in localStorage for DashboardUserCard
        if (data.name) {
            localStorage.setItem("userName", data.name);
        }
        if (data.workplace) {
            localStorage.setItem("workplace", data.workplace);
        } else {
            localStorage.removeItem("workplace");
        }

        // Trigger custom event for other components to refresh
        window.dispatchEvent(new Event("storage_update"));
    };

    const resetForm = () => {
        form.reset();
        setSubmitted(false);
        setFormData(null);
        setSelectedHotelId(null);
        setSelectedStay(null);
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

    // Enhance hotels with feature engineering
    const {
        data: enhancedHotels,
        isLoading: isLoadingFeatures,
    } = useQuery<EnhancedAccommodation[], Error>({
        queryKey: ['enhancedHotels', hotels, formData?.workplace],
        queryFn: async () => {
            if (!hotels || hotels.length === 0) return [];
            return enhanceAccommodations(hotels, formData?.workplace);
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

    const { data: workplaceCoords } = useQuery({
        queryKey: ['workplaceCoords', formData?.workplace],
        queryFn: async () => {
            if (!formData?.workplace) return null;
            return getWorkplaceCoordinates(formData.workplace);
        },
        enabled: !!formData?.workplace,
        staleTime: 1000 * 60 * 60, // 1 hour cache
    });

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
        queryKey: ['datasetFeatures', selectedStay?.type, selectedStay?.id, formData?.workplace],
        queryFn: async () => {
            if (!selectedStay || selectedStay.type === 'apiHotel') return null;
            const coords =
                selectedStay.type === 'pg'
                    ? pgs.find(p => p.id === selectedStay.id)
                    : houses.find(h => h.id === selectedStay.id);
            if (!coords) return null;
            return calculateFeatures(coords.latitude, coords.longitude, formData?.workplace);
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



    // Decision Intelligence Engine (MCDA) - Weighted Sum Model (WSM)
    const rankedStays = useMemo(() => {
        if (!enhancedHotels || enhancedHotels.length === 0) return [];

        // 1. Prepare data for normalization
        const data = enhancedHotels.map(h => {
            const price = h.price || 10000;
            const commute = h.features?.distToWorkplace || 10;
            const amenities = (h.features?.nearbyRestaurantsMessCount || 0) + (h.reviewScore ? h.reviewScore * 2 : 0);
            return { id: h.id, price, commute, amenities, hotel: h };
        });

        if (data.length === 0) return [];

        const minPrice = Math.min(...data.map(d => d.price));
        const maxPrice = Math.max(...data.map(d => d.price));
        const minCommute = Math.min(...data.map(d => d.commute));
        const maxCommute = Math.max(...data.map(d => d.commute));
        const minAmenities = Math.min(...data.map(d => d.amenities));
        const maxAmenities = Math.max(...data.map(d => d.amenities));

        // 2. Calculate WSM scores
        // Weights: Budget (50%), Commute (30%), Amenities/Safety (20%)
        return data.map(d => {
            const normPrice = maxPrice === minPrice ? 1 : 1 - (d.price - minPrice) / (maxPrice - minPrice);
            const normCommute = maxCommute === minCommute ? 1 : 1 - (d.commute - minCommute) / (maxCommute - minCommute);
            const normAmenities = maxAmenities === minAmenities ? 1 : (d.amenities - minAmenities) / (maxAmenities - minAmenities);

            const score = (normPrice * 0.5) + (normCommute * 0.3) + (normAmenities * 0.2);
            return {
                ...d.hotel,
                wsmScore: score,
                wsmBreakdown: { normPrice, normCommute, normAmenities }
            };
        }).sort((a, b) => b.wsmScore - a.wsmScore);
    }, [enhancedHotels]);

    const topRecommendations = useMemo(() => rankedStays.slice(0, 3), [rankedStays]);

    const [selectedContext, setSelectedContext] = useState<any>(null);

    useEffect(() => {
        const contextStr = localStorage.getItem('selectedStayContext');
        if (contextStr) {
            setSelectedContext(JSON.parse(contextStr));
        }
    }, []);

    const getNearbyAmenities = (lat?: number, lon?: number) => {
        if (!lat || !lon) return { eateries: [], markets: [], malls: [] };

        const eateries = restaurants
            .map(r => ({
                ...r,
                distance: haversineDistance(lat, lon, Number(r.latitude), Number(r.longitude))
            }))
            .filter(r => r.distance <= 3) // 3km radius for eateries
            .sort((a, b) => (a.distance || 0) - (b.distance || 0))
            .slice(0, 3);

        const hubs = [
            { name: "Brookefields Mall", lat: 11.0062, lon: 76.9606, type: "Mall" },
            { name: "Prozone Mall", lat: 11.0548, lon: 77.0011, type: "Mall" },
            { name: "Fun Republic Mall", lat: 11.0245, lon: 77.0106, type: "Mall" },
            { name: "Gandhipuram Market", lat: 10.9905, lon: 76.9614, type: "Market" },
            { name: "RS Puram Market", lat: 11.0045, lon: 76.9618, type: "Market" },
            { name: "Town Hall Market", lat: 10.9987, lon: 76.9623, type: "Market" },
        ];

        const sortedHubs = hubs
            .map(h => ({
                ...h,
                distance: haversineDistance(lat, lon, h.lat, h.lon)
            }))
            .sort((a, b) => a.distance - b.distance);

        return {
            eateries,
            markets: sortedHubs.filter(h => h.type === "Market").slice(0, 3),
            malls: sortedHubs.filter(h => h.type === "Mall").slice(0, 3)
        };
    };

    const topThreeAmenities = useMemo(() => {
        if (!topRecommendations || topRecommendations.length === 0) return [];
        return topRecommendations.map(h => ({
            id: h.id,
            amenities: getNearbyAmenities(h.latitude, h.longitude)
        }));
    }, [topRecommendations, restaurants]);

    const handleSelectStay = (hotel: any, type: 'select' | 'hold') => {
        const stayContext = {
            id: hotel.id,
            type: 'apiHotel',
            name: hotel.name,
            price: hotel.price,
            area: hotel.address || hotel.area,
            lat: hotel.latitude,
            lon: hotel.longitude,
            distToCenter: 5,
            selectionStatus: type === 'select' ? 'Locked' : 'Holding'
        };
        localStorage.setItem('selectedStayContext', JSON.stringify(stayContext));
        setSelectedContext(stayContext);
        window.dispatchEvent(new Event("storage_update"));
    };

    if (submitted && formData) {
        return (
            <>
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-600">
                            <Sparkles className="h-6 w-6" />
                            AI Recommendations for {formData.name}
                        </CardTitle>
                        <CardDescription>
                            Based on your preferences for {formData.city}. Currently optimized for Coimbatore stays.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 bg-white rounded-lg border border-blue-100">
                                <h3 className="font-semibold text-blue-700 mb-2">Your Details</h3>
                                <ul className="space-y-2 text-sm">
                                    <li><strong>Purpose:</strong> {formData.reason}</li>
                                    <li><strong>Duration:</strong> {formData.duration}</li>
                                    <li><strong>Location:</strong> {formData.place}, {formData.city}</li>
                                    {formData.workplace && (
                                        <li><strong>Workplace:</strong> {formData.workplace}</li>
                                    )}
                                </ul>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                                <h3 className="font-semibold text-purple-700 mb-2">Recommended Areas</h3>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-purple-600" />
                                        Near {formData.place} - Best connectivity
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-purple-600" />
                                        Budget-friendly options available
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-4">
                            <h3 className="font-semibold text-blue-700 mb-1">AI-Powered Stay Suggestions (Coimbatore)</h3>
                            {(isLoadingHotels || isLoadingFeatures) && (
                                <p className="text-sm text-gray-600">
                                    {isLoadingHotels ? 'Fetching nearby stays…' : 'Calculating proximity features…'}
                                </p>
                            )}
                            {isHotelsError && (
                                <p className="text-sm text-red-600">
                                    Unable to load live hotel data: {hotelsError?.message}
                                </p>
                            )}
                            {!isLoadingHotels && !isHotelsError && hotels && hotels.length === 0 && (
                                <p className="text-sm text-gray-600">
                                    No hotels found for Coimbatore right now. Try again in a moment.
                                </p>
                            )}

                            {!isLoadingHotels && !isLoadingFeatures && !isHotelsError && rankedStays && rankedStays.length > 0 && (
                                <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-4">
                                    {/* Map column */}
                                    <div className="space-y-3">
                                        <div className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                                            <h4 className="text-sm font-semibold text-blue-700 flex items-center gap-2 mb-3">
                                                <Sparkles className="h-4 w-4" />
                                                Decision Intelligence: Top 3 Recommendations
                                            </h4>
                                            <div className="space-y-2">
                                                {topRecommendations.map((h, idx) => (
                                                    <div key={h.id} className="text-xs p-2 bg-blue-50 rounded border border-blue-100 flex justify-between items-center">
                                                        <span>{idx + 1}. {h.name}</span>
                                                        <span className="font-bold text-blue-600">Score: {(h.wsmScore * 100).toFixed(1)}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-2 italic">
                                                Weighted Score: Budget (50%), Commute (30%), Amenities (20%)
                                            </p>
                                        </div>
                                        <div className="rounded-xl overflow-hidden border border-blue-200 bg-white shadow-sm h-64">
                                            <CoimbatoreSmartMap
                                                center={[76.9558, 11.0168]}
                                                zoom={12}
                                                markers={topRecommendations.map(h => ({
                                                    coordinates: [h.longitude || 76.9558, h.latitude || 11.0168],
                                                    title: h.name,
                                                    description: `₹${h.price} • Score: ${(h.wsmScore * 100).toFixed(0)}%`
                                                }))}
                                                height="100%"
                                            />
                                        </div>
                                    </div>

                                    {/* Hotels list */}
                                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                                        {rankedStays.map((hotel) => (
                                            <div
                                                key={`${hotel.id}-${hotel.name}`}
                                                className={`w-full text-left bg-white rounded-lg border ${topRecommendations.find(r => r.id === hotel.id) ? 'border-blue-400 ring-1 ring-blue-100' : 'border-blue-100'} px-3 py-2.5 hover:border-blue-400 hover:shadow-sm transition-all relative flex flex-col gap-3`}
                                            >
                                                {topRecommendations.find(r => r.id === hotel.id) && (
                                                    <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full shadow-sm z-10">
                                                        Top Result
                                                    </span>
                                                )}
                                                <div
                                                    className="cursor-pointer"
                                                    onClick={() => { setSelectedHotelId(hotel.id); setSelectedStay({ type: 'apiHotel', id: hotel.id }); }}
                                                >
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-gray-900 text-sm">
                                                                {hotel.name}
                                                            </h4>
                                                            <p className="text-xs text-gray-600">
                                                                {hotel.address ?? "Coimbatore, Tamil Nadu"}
                                                            </p>
                                                            {hotel.reviewScore && (
                                                                <p className="text-[11px] text-blue-700 mt-1">
                                                                    Rating: {hotel.reviewScore}
                                                                    {hotel.reviewCount
                                                                        ? ` • ${hotel.reviewCount} reviews`
                                                                        : ''}
                                                                </p>
                                                            )}
                                                            {/* Feature Engineering Results */}
                                                            {hotel.features && (
                                                                <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                                                                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                                                                        <Navigation className="h-3 w-3" />
                                                                        {hotel.features.nearestBusStopName
                                                                            ? `Bus: ${hotel.features.nearestBusStopName} (${hotel.features.distToBusStop.toFixed(2)} km)`
                                                                            : `Bus: ${hotel.features.distToBusStop.toFixed(2)} km`}
                                                                    </span>
                                                                    {hotel.features.distToWorkplace !== null && (
                                                                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100">
                                                                            <Briefcase className="h-3 w-3" />
                                                                            Work: {hotel.features.distToWorkplace.toFixed(2)} km
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            {hotel.price && (
                                                                <div className="text-blue-600 font-semibold text-sm">
                                                                    {hotel.currency ?? 'INR'} {Math.round(hotel.price)}
                                                                </div>
                                                            )}
                                                            <div className="text-[10px] text-blue-500 font-medium mt-1">
                                                                Score: {(hotel.wsmScore! * 100).toFixed(0)}%
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Nearby Recommendations for Top 3 */}
                                                    {topThreeAmenities.find(t => t.id === hotel.id) && (
                                                        <div className="mt-3 p-2 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-md border border-blue-100/50 space-y-2">
                                                            <p className="text-[10px] font-bold text-blue-700 flex items-center gap-1">
                                                                <Sparkles className="h-3 w-3" />
                                                                Nearby Hotspots
                                                            </p>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div className="space-y-1">
                                                                    <p className="text-[9px] font-semibold text-gray-500 flex items-center gap-1">
                                                                        <Utensils className="h-2 w-2" /> Eateries
                                                                    </p>
                                                                    {topThreeAmenities.find(t => t.id === hotel.id)?.amenities.eateries.map((e: any) => (
                                                                        <p key={e.res_id} className="text-[8px] text-gray-600 truncate">{e.name} ({e.distance.toFixed(1)}km)</p>
                                                                    ))}
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-[9px] font-semibold text-gray-500 flex items-center gap-1">
                                                                        <Store className="h-2 w-2" /> Markets
                                                                    </p>
                                                                    {topThreeAmenities.find(t => t.id === hotel.id)?.amenities.markets.map((m: any, idx: number) => (
                                                                        <p key={idx} className="text-[8px] text-gray-600 truncate">{m.name} ({m.distance.toFixed(1)}km)</p>
                                                                    ))}
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-[9px] font-semibold text-gray-500 flex items-center gap-1">
                                                                        <ShoppingBag className="h-2 w-2" /> Malls
                                                                    </p>
                                                                    {topThreeAmenities.find(t => t.id === hotel.id)?.amenities.malls.map((m: any, idx: number) => (
                                                                        <p key={idx} className="text-[8px] text-gray-600 truncate">{m.name} ({m.distance.toFixed(1)}km)</p>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => handleSelectStay(hotel, 'select')}
                                                        className={`flex-1 h-8 text-[11px] ${selectedContext?.id === hotel.id && selectedContext?.selectionStatus === 'Locked' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                                    >
                                                        {selectedContext?.id === hotel.id && selectedContext?.selectionStatus === 'Locked' ? 'Locked In' : 'Select for Now'}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleSelectStay(hotel, 'hold')}
                                                        className={`flex-1 h-8 text-[11px] border-blue-200 text-blue-600 ${selectedContext?.id === hotel.id && selectedContext?.selectionStatus === 'Holding' ? 'bg-orange-50 border-orange-200 text-orange-600' : ''}`}
                                                    >
                                                        {selectedContext?.id === hotel.id && selectedContext?.selectionStatus === 'Holding' ? 'On Hold' : 'Hold'}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {userLocation && hotelsNearUser.length > 0 && (
                                <div className="mt-4 bg-white rounded-lg border border-blue-100 p-3">
                                    <h4 className="font-semibold text-blue-700 text-sm">
                                        Hotels within 5 km of your location
                                    </h4>
                                    <div className="space-y-2 mt-2">
                                        {hotelsNearUser.slice(0, 8).map((hotel) => (
                                            <div key={hotel.id} className="flex justify-between items-start text-xs">
                                                <div>
                                                    <p className="font-medium text-gray-900">{hotel.name}</p>
                                                    <p className="text-gray-600">{hotel.address ?? "Coimbatore"}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedHotelId(hotel.id)}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    View details
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {workplaceCoords && (pgsNearWorkplace.length > 0 || housesNearWorkplace.length > 0) && (
                                <div className="mt-4 bg-white rounded-lg border border-purple-100 p-3">
                                    <h4 className="font-semibold text-purple-700 text-sm">
                                        Stays within 5 km of your workplace (PGs, Houses)
                                    </h4>
                                    <div className="space-y-2 mt-2">
                                        {pgsNearWorkplace.slice(0, 6).map((pg) => (
                                            <div key={pg.id} className="flex justify-between items-start text-xs">
                                                <div>
                                                    <p className="font-medium text-gray-900">{pg.name}</p>
                                                    <p className="text-gray-600">{pg.fullAddress ?? pg.area}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { setSelectedStay({ type: 'pg', id: pg.id }); setSelectedHotelId(null); }}
                                                    className="text-purple-700 hover:underline"
                                                >
                                                    View details
                                                </button>
                                            </div>
                                        ))}
                                        {housesNearWorkplace.slice(0, 6).map((house) => (
                                            <div key={house.id} className="flex justify-between items-start text-xs">
                                                <div>
                                                    <p className="font-medium text-gray-900">{house.name}</p>
                                                    <p className="text-gray-600">{house.fullAddress ?? house.area}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { setSelectedStay({ type: 'house', id: house.id }); setSelectedHotelId(null); }}
                                                    className="text-purple-700 hover:underline"
                                                >
                                                    View details
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(selectedHotelId || selectedStay) && (
                                <div className="mt-4 bg-white rounded-lg border border-blue-100 p-3 space-y-3">
                                    <h4 className="font-semibold text-blue-700 text-sm">
                                        Detailed info for selected stay
                                    </h4>

                                    {(selectedStay?.type === 'apiHotel') && (isLoadingDetails || isLoadingPayment || isLoadingPhotos || isLoadingFacilities || isLoadingDescription) && (
                                        <p className="text-xs text-gray-600">
                                            Loading hotel photos, facilities, description and payment options…
                                        </p>
                                    )}

                                    {/* Photos strip */}
                                    {(selectedStay?.type === 'apiHotel') && !isLoadingPhotos && photos && (
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {(Array.isArray(photos) ? photos : (photos?.data?.hotel_images ?? photos?.data ?? [])).slice(0, 10).map((img: any, idx: number) => {
                                                const url =
                                                    img?.url_max ??
                                                    img?.url_original ??
                                                    img?.url_square60 ??
                                                    img?.photo_url;

                                                if (!url) return null;

                                                return (
                                                    <img
                                                        key={idx}
                                                        src={url}
                                                        alt={`Hotel photo ${idx + 1}`}
                                                        className="h-24 w-32 rounded-md object-cover border border-blue-100 flex-shrink-0"
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}
                                    {(selectedStay?.type === 'apiHotel') && !isLoadingPhotos && !photos && (
                                        <p className="text-xs text-gray-600">No photos available for this property.</p>
                                    )}

                                    {/* Description */}
                                    {(selectedStay?.type === 'apiHotel') && !isLoadingDescription && descriptionInfo && (
                                        <p className="text-xs text-gray-700 leading-relaxed">
                                            {descriptionInfo?.data?.description ??
                                                descriptionInfo?.description ??
                                                descriptionInfo?.summary ??
                                                hotelDetails?.data?.hotel_description ??
                                                hotelDetails?.data?.description ??
                                                "Detailed description unavailable for this property."}
                                        </p>
                                    )}
                                    {(selectedStay?.type === 'apiHotel') && !isLoadingDescription && !descriptionInfo && (
                                        <p className="text-xs text-gray-600">No description available.</p>
                                    )}

                                    {/* Facilities */}
                                    {(selectedStay?.type === 'apiHotel') && !isLoadingFacilities && facilities && (
                                        <div className="text-xs text-gray-700 space-y-1">
                                            <p className="font-medium text-blue-700">Key facilities</p>
                                            <div className="flex flex-wrap gap-1">
                                                {(Array.isArray(facilities) ? facilities : (facilities?.data?.hotel_facilities ?? facilities?.data ?? [])).slice(0, 8).map((facility: any, idx: number) => (
                                                    <span key={idx} className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                                                        {facility?.name ??
                                                            facility?.facility_name ??
                                                            facility?.title ??
                                                            facility?.description ??
                                                            "Facility"}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(selectedStay?.type === 'apiHotel') && !isLoadingFacilities && !facilities && (
                                        <p className="text-xs text-gray-600">Facilities information not available.</p>
                                    )}

                                    {(selectedStay?.type === 'apiHotel') && !isLoadingPayment && paymentFeatures && (
                                        <div className="text-xs text-gray-700 space-y-1">
                                            <p className="font-medium text-blue-700">Payment options</p>
                                            <ul className="list-disc list-inside space-y-0.5">
                                                {(paymentFeatures?.data?.payment_features ??
                                                    paymentFeatures?.data ??
                                                    []
                                                ).slice(0, 6).map((feature: any, idx: number) => (
                                                    <li key={idx}>
                                                        {feature?.name ??
                                                            feature?.title ??
                                                            feature?.description ??
                                                            "Payment method available"}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {(selectedStay?.type === 'apiHotel') && !isLoadingPayment && !paymentFeatures && (
                                        <p className="text-xs text-gray-600">Payment information not available.</p>
                                    )}

                                    {selectedHotel?.features?.nearestBusStopName && selectedStay?.type === 'apiHotel' && (
                                        <div className="text-xs text-gray-700 space-y-1">
                                            <p className="font-medium text-blue-700">Nearby bus stop</p>
                                            <p>
                                                {selectedHotel.features.nearestBusStopName} • {selectedHotel.features.distToBusStop.toFixed(2)} km
                                            </p>
                                            {selectedHotel.features.nearestBusStopServices && selectedHotel.features.nearestBusStopServices.length > 0 && (
                                                <div>
                                                    <p className="font-medium text-blue-700 mt-1">Bus services</p>
                                                    <ul className="list-disc list-inside space-y-0.5">
                                                        {selectedHotel.features.nearestBusStopServices.slice(0, 6).map((svc, idx) => (
                                                            <li key={idx}>
                                                                {svc.name} — {svc.number}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {(selectedStay?.type === 'pg' || selectedStay?.type === 'house') && (() => {
                                        const item = selectedStay?.type === 'pg'
                                            ? pgs.find(p => p.id === selectedStay.id)
                                            : houses.find(h => h.id === selectedStay.id);
                                        if (!item) return null;
                                        return (
                                            <div className="space-y-2 text-xs text-gray-700">
                                                <p className="font-medium text-blue-700">Address</p>
                                                <p>{item.fullAddress ?? item.area}</p>
                                                {item.images && item.images.length > 0 && (
                                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                                        {item.images.slice(0, 8).map((url, idx) => (
                                                            <img key={idx} src={url} alt={`Image ${idx + 1}`} className="h-24 w-32 rounded-md object-cover border border-blue-100 flex-shrink-0" />
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="grid md:grid-cols-2 gap-2">
                                                    <div>
                                                        <p><strong>Monthly price:</strong> {item.pricePerMonth ?? 'Call for Price'}</p>
                                                        <p><strong>Room type:</strong> {item.roomType ?? 'N/A'}</p>
                                                        <p><strong>Food:</strong> {item.foodIncluded ?? 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p><strong>WiFi:</strong> {item.wifi ?? 'N/A'}</p>
                                                        <p><strong>AC:</strong> {item.ac ?? 'N/A'}</p>
                                                        <p><strong>Rating:</strong> {item.rating ?? 'N/A'} {item.reviewCount ? `• ${item.reviewCount} reviews` : ''}</p>
                                                    </div>
                                                </div>
                                                {datasetFeatures?.nearestBusStopName && (
                                                    <div className="mt-2">
                                                        <p className="font-medium text-blue-700">Nearby bus stop</p>
                                                        <p>{datasetFeatures.nearestBusStopName} • {datasetFeatures.distToBusStop.toFixed(2)} km</p>
                                                        {datasetFeatures.nearestBusStopServices && datasetFeatures.nearestBusStopServices.length > 0 && (
                                                            <div>
                                                                <p className="font-medium text-blue-700 mt-1">Bus services</p>
                                                                <ul className="list-disc list-inside space-y-0.5">
                                                                    {datasetFeatures.nearestBusStopServices.slice(0, 6).map((svc, idx) => (
                                                                        <li key={idx}>{svc.name} — {svc.number}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-2 border-t border-blue-100 mt-4">
                                        <Button
                                            onClick={() => {
                                                const stayContext = {
                                                    id: selectedStay.id,
                                                    type: selectedStay.type,
                                                    name: selectedStay.type === 'apiHotel' ? selectedHotel?.name : (pgs.find(p => p.id === selectedStay.id)?.name || houses.find(h => h.id === selectedStay.id)?.name),
                                                    price: selectedStay.type === 'apiHotel' ? selectedHotel?.price : (pgs.find(p => p.id === selectedStay.id)?.pricePerMonth || houses.find(h => h.id === selectedStay.id)?.pricePerMonth),
                                                    area: selectedStay.type === 'apiHotel' ? selectedHotel?.address : (pgs.find(p => p.id === selectedStay.id)?.area || houses.find(h => h.id === selectedStay.id)?.area),
                                                    lat: selectedStay.type === 'apiHotel' ? selectedHotel?.latitude : (pgs.find(p => p.id === selectedStay.id)?.latitude || houses.find(h => h.id === selectedStay.id)?.latitude),
                                                    lon: selectedStay.type === 'apiHotel' ? selectedHotel?.longitude : (pgs.find(p => p.id === selectedStay.id)?.longitude || houses.find(h => h.id === selectedStay.id)?.longitude),
                                                    distToCenter: selectedStay.type === 'apiHotel' ? 5 : 3.5 // Mock or calculate
                                                };
                                                localStorage.setItem('selectedStayContext', JSON.stringify(stayContext));
                                                window.dispatchEvent(new Event("storage_update"));
                                                alert(`"${stayContext.name}" has been locked in for analysis!`);
                                            }}
                                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white gap-2"
                                        >
                                            <Brain className="h-4 w-4" />
                                            Analyze this Stay
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── AI Collaborative Filtering Panel ── */}
                        <CollaborativeFilteringPanel
                            reason={formData.reason}
                            lifestyle={formData.lifestyle}
                            budget={Number(formData.budget) || 12000}
                            userName={formData.name}
                        />

                        <Button onClick={resetForm} variant="outline" className="w-full border-blue-300 text-blue-600 hover:bg-blue-50">
                            Start New Search
                        </Button>
                    </CardContent>
                </Card>
            </>
        );
    }

    return (
        <>
            <Card className="border-blue-200 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                        <MapPin className="h-6 w-6" />
                        Smart Stay Finder
                    </CardTitle>
                    <CardDescription>
                        Tell us about your relocation and we'll find the perfect stay
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

                            <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Briefcase className="h-4 w-4" />
                                            Reason for Visit
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                                                    <SelectValue placeholder="Select reason" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Education">Education</SelectItem>
                                                <SelectItem value="Job">Job</SelectItem>
                                                <SelectItem value="Internship">Internship</SelectItem>
                                                <SelectItem value="Business">Business</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="duration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Duration of Stay
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                                                    <SelectValue placeholder="Select duration" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Short-term (Days)">Short-term (Days)</SelectItem>
                                                <SelectItem value="Short-term (Months)">Short-term (Months)</SelectItem>
                                                <SelectItem value="Long-term (Months)">Long-term (Months)</SelectItem>
                                                <SelectItem value="Long-term (Years)">Long-term (Years)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            City
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                                                    <SelectValue placeholder="Select city" />
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

                            <FormField
                                control={form.control}
                                name="place"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            Specific Area/Place
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
                                name="workplace"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Briefcase className="h-4 w-4" />
                                            Workplace (Optional)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g., TIDEL Park, IT Park"
                                                {...field}
                                                className="border-blue-200 focus:border-blue-400"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                        <p className="text-xs text-gray-500 mt-1">
                                            We'll calculate distance from each accommodation to your workplace
                                        </p>
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="budget"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Wallet className="h-4 w-4" />
                                                Monthly Budget (INR)
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
                                    name="acUsageHours"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Fan className="h-4 w-4" />
                                                AC Usage (hrs/day)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="6"
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
                                    name="preferences"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Heart className="h-4 w-4" />
                                                Preferences
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="wifi, ac, food"
                                                    {...field}
                                                    className="border-blue-200 focus:border-blue-400"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                            >
                                Find My Perfect Stay
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </>
    );
};

export default SmartStayFinder;
