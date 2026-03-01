import { UserInput, CityPlan, DailyPlan } from "../types/cityPlan";

const cityData: Record<string, any> = {
    "Bangalore": {
        places: [
            { name: "Lalbagh Botanical Garden", cost: 20 },
            { name: "Cubbon Park", cost: 0 },
            { name: "Bangalore Palace", cost: 230 },
            { name: "Commercial Street", cost: 0 },
            { name: "Nandi Hills", cost: 20 },
            { name: "Bannerghatta National Park", cost: 320 },
            { name: "ISKCON Temple", cost: 0 },
            { name: "UB City Mall", cost: 0 },
            { name: "Tipu Sultan's Palace", cost: 15 },
        ],
        stayAreas: ["BTM Layout", "HSR Layout", "Indiranagar", "Koramangala"],
        foodPlaces: ["Vidyarthi Bhavan", "BTM Food Street", "Amma's Kitchen", "Local Darshini", "Koshy's"],
    },
    "Mumbai": {
        places: [
            { name: "Gateway of India", cost: 0 },
            { name: "Marine Drive", cost: 0 },
            { name: "Elephanta Caves", cost: 600 },
            { name: "Colaba Causeway", cost: 0 },
            { name: "Siddhivinayak Temple", cost: 0 },
            { name: "Juhu Beach", cost: 0 },
        ],
        stayAreas: ["Andheri", "Bandra", "Colaba", "Powai"],
        foodPlaces: ["Kyani & Co", "Bademiya", "Café Mondegar", "Brittania & Co"],
    }
};

export const fetchCityPlan = async (input: UserInput): Promise<CityPlan> => {
    // Parse days robustly
    const requestedDays = Math.max(1, parseInt(String(input.days ?? 3), 10) || 3);
    const totalDays = requestedDays;
    const boardingPoint = input.boardingPoint || "Your Departure Location";

    console.warn(`[GENERATOR] ✅ Generating ${totalDays}-day plan for ${input.city}. Input days: ${input.days}`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const { city, budget, budgetType, travelStyle } = input;

    // --- 3-TIER LIFESTYLE CONFIG (Indian city standards) ---
    type LifestyleTier = {
        stayType: string;
        stayArea: string;
        stayCostPerDay: number;
        BREAKFAST_COST: number;
        LUNCH_COST: number;
        DINNER_COST: number;
        ATTRACTION_COST: number;
        preferredPlaceCost: number;
        isComfort: boolean;
        trainCost: number;
        busCost: number;
        flightCost: number;
        defaultTransport: string;
        defaultTransportCost: number;
        defaultTransportSuggestion: string;
        savingsSuggestion: string;
        stayReason: string[];
    };

    const tier = ((): LifestyleTier => {
        const style = (travelStyle || "budget").toLowerCase();
        if (style === "luxury" || style === "comfort") {
            return {
                stayType: "5-Star Hotel / Premium Resort",
                stayArea: "Race Course Road / Avinashi Road",
                stayCostPerDay: 4500,
                BREAKFAST_COST: 350,
                LUNCH_COST: 700,
                DINNER_COST: 900,
                ATTRACTION_COST: 500,
                preferredPlaceCost: 800,
                isComfort: true,
                trainCost: 800,
                busCost: 500,
                flightCost: 6500,
                defaultTransport: "Premium Private Cab (Innova / SUV)",
                defaultTransportCost: 800,
                defaultTransportSuggestion: "Book an outstation cab for full flexibility — Savaari or Zoomcar are reliable options in Coimbatore.",
                savingsSuggestion: "Downgrade to Medium lifestyle to save ₹2000–₹3000 per day on stay and dining alone.",
                stayReason: ["5-Star amenities & spa", "24/7 concierge service", "Airport pickup included", "Premium city view rooms"],
            };
        }
        if (style === "medium") {
            return {
                stayType: "3-Star Hotel / Service Apartment",
                stayArea: "RS Puram / Peelamedu",
                stayCostPerDay: 1500,
                BREAKFAST_COST: 180,
                LUNCH_COST: 350,
                DINNER_COST: 400,
                ATTRACTION_COST: 250,
                preferredPlaceCost: 400,
                isComfort: false,
                trainCost: 400,
                busCost: 200,
                flightCost: 3500,
                defaultTransport: "Ola / Uber Cab",
                defaultTransportCost: 250,
                defaultTransportSuggestion: "Use Ola/Uber for city travel — reliable and affordable. Book Outstation option for day trips.",
                savingsSuggestion: "Switch to Budget style to save ₹800–₹1200/day on accommodation and transport.",
                stayReason: ["Centrally located", "Free breakfast included", "AC rooms", "Good cleanliness rating"],
            };
        }
        // Budget (default)
        return {
            stayType: "Budget Hotel / PG / Hostel",
            stayArea: "Gandhipuram / Saibaba Colony",
            stayCostPerDay: 500,
            BREAKFAST_COST: 70,
            LUNCH_COST: 150,
            DINNER_COST: 160,
            ATTRACTION_COST: 100,
            preferredPlaceCost: 200,
            isComfort: false,
            trainCost: 150,
            busCost: 80,
            flightCost: 2200,
            defaultTransport: "TNSTC Bus / Auto",
            defaultTransportCost: 70,
            defaultTransportSuggestion: "Use TNSTC City Bus — the cheapest and most convenient way to get around Coimbatore. App: Chalo Bus.",
            savingsSuggestion: "You're already on the most economical plan. Look for group discounts on attractions to save more.",
            stayReason: ["Cheapest zone in the city", "Close to bus stand", "Abundant street food", "Walking distance to market"],
        };
    })();

    // Transport config based on selected mode of transport
    const selectedMode = (input.modeOfTransport || "").toLowerCase();
    const transportConfig: Record<string, { mode: string; dailyCost: number; timeSaved: string; suggestion: string; availability: string; ticketStatus: "Available" | "Limited" | "Sold Out" }> = {
        train: {
            mode: "Train",
            dailyCost: tier.trainCost,
            timeSaved: "Travel time depends on train class",
            suggestion: tier.isComfort
                ? "Book 1st AC / 2nd AC for premium comfort. Use IRCTC Tatkal quota if booking last minute."
                : "Book Sleeper / 3AC class — safe and economical. Reserve at least 3 days ahead on IRCTC.",
            availability: "Seats Limited",
            ticketStatus: "Limited"
        },
        bus: {
            mode: tier.isComfort ? "Private Luxury Bus (AC Sleeper)" : "Government / Private Bus",
            dailyCost: tier.busCost,
            timeSaved: "Affordable but slower than train",
            suggestion: tier.isComfort
                ? "Book AC Sleeper on RedBus — SETC Premium or KPN Travels for comfortable overnight journeys."
                : "SETC buses are safe and connect most Tamil Nadu cities. Book through redbus.in.",
            availability: "Seats Available",
            ticketStatus: "Available"
        },
        metro: {
            mode: "Metro Rail",
            dailyCost: 80,
            timeSaved: "Fastest within city limits",
            suggestion: "Get a Chennai Metro Smart Card — saves 10% on every ride and avoids queue.",
            availability: "Running every 5 mins",
            ticketStatus: "Available"
        },
        flight: {
            mode: tier.isComfort ? "Business Class Flight" : "Economy Flight",
            dailyCost: tier.flightCost,
            timeSaved: "Fastest option — under 1 hour",
            suggestion: tier.isComfort
                ? "Book Business Class on Air India / Vistara for premium lounge access and extra baggage."
                : "Book 2-3 weeks ahead on Indigo or SpiceJet for best fares. Carry only cabin baggage.",
            availability: "Seats Available",
            ticketStatus: "Limited"
        },
    };
    const travelInfo = transportConfig[selectedMode] || {
        mode: tier.defaultTransport,
        dailyCost: tier.defaultTransportCost,
        timeSaved: tier.isComfort ? "45 mins saved vs city bus" : "Economical on-demand travel",
        suggestion: tier.defaultTransportSuggestion,
        availability: "Available on demand",
        ticketStatus: "Available" as const
    };
    const travelCostPerDay = travelInfo.dailyCost;

    // Meal costs from tier
    const BREAKFAST_COST = tier.BREAKFAST_COST;
    const LUNCH_COST = tier.LUNCH_COST;
    const DINNER_COST = tier.DINNER_COST;
    const ATTRACTION_COST = tier.ATTRACTION_COST;

    const data = cityData[city] || cityData["Bangalore"];

    // Parse preferred places
    const preferredPlacesList = input.preferredPlaces
        ? input.preferredPlaces.split(',').map(p => p.trim()).filter(p => p.length > 0)
        : [];

    // --- REAL-TIME DATA FETCHING via Overpass API ---
    const fetchLivePlaces = async (amenity: string, tag: string = 'amenity') => {
        try {
            // Bounding box for Coimbatore
            const query = `[out:json][timeout:10];node["${tag}"="${amenity}"](10.95,76.90,11.05,77.05);out 20;`;
            const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
            if (!res.ok) return [];
            const data = await res.json();
            return data.elements
                .filter((e: any) => e.tags && e.tags.name && e.lat && e.lon)
                .map((e: any) => ({
                    name: e.tags.name,
                    lat: e.lat,
                    lon: e.lon
                }));
        } catch (e) {
            console.warn(`Failed to fetch live ${amenity}:`, e);
            return [];
        }
    };

    // Run fetches in parallel for speed
    const [liveRestaurants, liveAttractions, liveHotels] = await Promise.all([
        fetchLivePlaces("restaurant"),
        fetchLivePlaces("attraction", "tourism"),
        fetchLivePlaces("hotel", "tourism")
    ]);

    // Tier-specific hotel fallbacks with full details (real Coimbatore hotels)
    type HotelEntry = { name: string; area: string; address?: string; stars?: number; pricePerNight: number; amenities: string[]; phone?: string; website?: string; status: "Available" | "Limited" | "Fully Booked" };
    const hotelFallbacksByTier: Record<string, HotelEntry[]> = {
        luxury: [
            { name: "Taj Coimbatore", area: "Race Course Road", address: "37, Race Course Road, Coimbatore - 641018", stars: 5, pricePerNight: 6500, amenities: ["Infinity Pool", "Spa & Wellness", "Fine Dining", "Airport Transfer", "24/7 Concierge", "Business Center"], phone: "+91-422-6660000", website: "tajhotels.com", status: "Available" },
            { name: "The Residency Towers", area: "Avinashi Road", address: "1076, Avinashi Road, Coimbatore - 641018", stars: 5, pricePerNight: 5500, amenities: ["Rooftop Pool", "Multi-Cuisine Restaurant", "Fitness Center", "Conference Rooms", "24/7 Room Service"], phone: "+91-422-2212414", website: "theresidency.in", status: "Available" },
            { name: "Le Meridien Coimbatore", area: "Avinashi Road", address: "Empire Estate, Avinashi Road, Coimbatore - 641014", stars: 5, pricePerNight: 5000, amenities: ["Outdoor Pool", "Spa", "All-Day Dining", "Bar & Lounge", "Valet Parking"], phone: "+91-422-4244000", website: "marriott.com", status: "Limited" },
            { name: "Four Points by Sheraton", area: "Sidhapudur", address: "83-B, Avinashi Road, Coimbatore - 641011", stars: 4, pricePerNight: 4000, amenities: ["Pool", "Restaurant", "Gym", "Free WiFi", "Pet Friendly"], phone: "+91-422-4501000", website: "marriott.com", status: "Available" },
        ],
        comfort: [
            { name: "Taj Coimbatore", area: "Race Course Road", address: "37, Race Course Road, Coimbatore - 641018", stars: 5, pricePerNight: 6500, amenities: ["Infinity Pool", "Spa & Wellness", "Fine Dining", "Airport Transfer"], phone: "+91-422-6660000", website: "tajhotels.com", status: "Available" },
            { name: "The Residency Towers", area: "Avinashi Road", address: "1076, Avinashi Road, Coimbatore - 641018", stars: 5, pricePerNight: 5500, amenities: ["Rooftop Pool", "Multi-Cuisine Restaurant", "24/7 Room Service"], phone: "+91-422-2212414", website: "theresidency.in", status: "Available" },
        ],
        medium: [
            { name: "Radisson Blu Hotel Coimbatore", area: "Avinashi Road", address: "Avinashi Road, Coimbatore - 641014", stars: 4, pricePerNight: 3500, amenities: ["Outdoor Pool", "Restaurant", "Gym", "Free WiFi", "Business Center"], phone: "+91-422-6613333", website: "radissonhotels.com", status: "Available" },
            { name: "Aloft Coimbatore", area: "Peelamedu", address: "Adjacent to Coimbatore International Airport, Peelamedu", stars: 4, pricePerNight: 2800, amenities: ["Pool", "WXYZ Bar", "Restaurant", "Pet Friendly", "Free WiFi"], phone: "+91-422-4400000", website: "marriott.com", status: "Limited" },
            { name: "Hotel Heritage Inn", area: "RS Puram", address: "38, Sivasamy Road, RS Puram, Coimbatore - 641002", stars: 3, pricePerNight: 1800, amenities: ["AC Rooms", "Restaurant", "Free WiFi", "Room Service", "Parking"], phone: "+91-422-2543333", website: "heritageinncbe.com", status: "Available" },
            { name: "Hotel Sri Balaji", area: "RS Puram", address: "7/1, Bharathiar Road, RS Puram, Coimbatore - 641002", stars: 3, pricePerNight: 1500, amenities: ["AC Rooms", "Veg Restaurant", "Free WiFi", "Daily Housekeeping"], phone: "+91-422-2550707", website: "hotelsribalaji.com", status: "Available" },
        ],
        budget: [
            { name: "OYO Flagship – Gandhipuram", area: "Gandhipuram", address: "127, DB Road, Gandhipuram, Coimbatore - 641012", stars: 2, pricePerNight: 600, amenities: ["AC Rooms", "Free WiFi", "Geyser", "Daily Housekeeping", "24/7 Check-in"], phone: "+91-9313313131", website: "oyorooms.com", status: "Available" },
            { name: "Zostel Coimbatore", area: "RS Puram", address: "15, 3rd Street, RS Puram, Coimbatore - 641002", stars: 2, pricePerNight: 450, amenities: ["Dormitory & Private Rooms", "Common Lounge", "Free WiFi", "Travel Desk", "Laundry"], phone: "+91-9999999999", website: "zostel.com", status: "Available" },
            { name: "Hotel Kalpana", area: "Gandhipuram", address: "74, Cross Cut Road, Gandhipuram, Coimbatore - 641012", stars: 2, pricePerNight: 700, amenities: ["AC & Non-AC Rooms", "Veg Restaurant", "Room Service", "Free WiFi"], phone: "+91-422-2380444", website: "hotelkalpana.in", status: "Limited" },
            { name: "Hotel Sree Annapoorna", area: "Saibaba Colony", address: "10, Nanjappa Road, Saibaba Colony, Coimbatore", stars: 2, pricePerNight: 500, amenities: ["Simple Rooms", "Veg Restaurant below", "24/7 Reception", "Local Transport Desk"], phone: "+91-422-2462222", website: "", status: "Available" },
        ],
    };

    const tierKey = (travelStyle || 'budget').toLowerCase() === 'luxury' || (travelStyle || '').toLowerCase() === 'comfort' ? 'luxury' :
        (travelStyle || '').toLowerCase() === 'medium' ? 'medium' : 'budget';
    const styleFallbacks: HotelEntry[] = hotelFallbacksByTier[tierKey] || hotelFallbacksByTier['budget'];

    // Use live hotels if available (enrich with tier pricing), else fall back to curated list
    const safeHotels: HotelEntry[] = liveHotels.length > 0
        ? liveHotels.slice(0, 4).map((h: any) => ({
            name: h.name,
            area: tier.stayArea,
            pricePerNight: tier.stayCostPerDay,
            stars: tier.isComfort ? 5 : (tierKey === 'medium' ? 3 : 2),
            amenities: tier.stayReason,
            status: "Available" as const
        }))
        : styleFallbacks;

    // Recommended = first hotel; all shown in hotel options list
    const recommendedHotel = safeHotels[0];


    // Fallbacks just in case the API is rate-limited
    const safeRestaurants = liveRestaurants.length > 5 ? liveRestaurants : [
        { name: "Annapoorna Gowrishankar", lat: 11.0168, lon: 76.9558 },
        { name: "Hari Bhavan", lat: 11.0023, lon: 76.9634 },
        { name: "Sree Annapoorna", lat: 11.0183, lon: 76.9723 },
        { name: "Junior Kuppanna", lat: 11.0145, lon: 76.9654 },
        { name: "Valarmathi Kongunattu", lat: 11.0056, lon: 76.9667 }
    ];
    const safeAttractions = liveAttractions.length > 5 ? liveAttractions : [
        { name: "Marudhamalai Temple", lat: 11.0456, lon: 76.8483, imageUrl: "/places/marudhamalai_temple.png" },
        { name: "GD Naidu Museum", lat: 11.0133, lon: 76.9745, imageUrl: "/places/gd_naidu_museum.png" },
        { name: "VOC Park and Zoo", lat: 11.0034, lon: 76.9655, imageUrl: "/places/voc_park.png" },
        { name: "Brookefields Mall", lat: 11.0112, lon: 76.9543, imageUrl: "/places/brookefields_mall.png" },
        { name: "Isha Yoga Center", lat: 10.9750, lon: 76.7371, imageUrl: "/places/isha_yoga_center.png" },
        { name: "Gass Forest Museum", lat: 11.0167, lon: 76.9456, imageUrl: "/places/gass_forest_museum.png" }
    ];

    // --- GENERATE DAILY PLANS ---
    const dailyPlans: DailyPlan[] = [];
    let cumulative = 0;

    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
        const activities: any[] = [];

        // Breakfast
        const bfastIdx = ((dayNum - 1) * 3) % safeRestaurants.length;
        const bfast = safeRestaurants[bfastIdx];
        activities.push({
            time: "8:30 AM",
            activity: `Breakfast at ${bfast.name}`,
            cost: BREAKFAST_COST,
            location: `${bfast.name}, ${city}`,
            coordinates: [bfast.lon, bfast.lat],
            emoji: "🍳",
            status: "Open",
            availability: "60% Occupied",
            safetyScore: 9.5,
            closingTime: "11:00 AM"
        });

        // Preferred Places (max 2 per day)
        const dayPreferred = preferredPlacesList.slice((dayNum - 1) * 2, dayNum * 2);
        dayPreferred.forEach((placeName, idx) => {
            const match = safeAttractions.find(a =>
                a.name.toLowerCase().includes(placeName.toLowerCase()) ||
                placeName.toLowerCase().includes(a.name.toLowerCase()) ||
                (placeName.toLowerCase().includes('isha') && a.name.toLowerCase().includes('isha'))
            );

            activities.push({
                time: idx === 0 ? "10:30 AM" : "11:45 AM",
                activity: `Visit ${match ? match.name : placeName}`,
                cost: tier.preferredPlaceCost,
                location: `${match ? match.name : placeName}, ${city}`,
                coordinates: match ? [match.lon, match.lat] : undefined,
                imageUrl: match ? match.imageUrl : undefined,
                emoji: "⭐",
                status: "Open",
                availability: "Tickets Available",
                safetyScore: 9.1,
                closingTime: "6:00 PM"
            });
        });

        // Default Place (one per day)
        // Offset by preferred places count so we don't pick the same place if possible
        const defPlaceIdx = ((dayNum - 1) + preferredPlacesList.length) % safeAttractions.length;
        const defPlace = safeAttractions[defPlaceIdx];
        activities.push({
            time: "3:30 PM",
            activity: `Explore ${defPlace.name}`,
            cost: ATTRACTION_COST,
            location: `${defPlace.name}, ${city}`,
            coordinates: [defPlace.lon, defPlace.lat],
            emoji: "🏛️",
            status: "Open",
            availability: "Crowded",
            safetyScore: 8.8,
            closingTime: "7:00 PM",
            imageUrl: defPlace.imageUrl
        });

        // Lunch & Dinner
        const lunchIdx = ((dayNum - 1) * 3 + 1) % safeRestaurants.length;
        const lunch = safeRestaurants[lunchIdx];
        const dinnerIdx = ((dayNum - 1) * 3 + 2) % safeRestaurants.length;
        const dinner = safeRestaurants[dinnerIdx];

        activities.push(
            {
                time: "1:30 PM",
                activity: `Lunch at ${lunch.name}`,
                cost: LUNCH_COST,
                location: `${lunch.name}, ${city}`,
                coordinates: [lunch.lon, lunch.lat],
                emoji: "🍱",
                status: "Open",
                availability: "Queue: 10 mins",
                safetyScore: 9.3,
                closingTime: "4:00 PM"
            },
            {
                time: "7:30 PM",
                activity: `Dinner at ${dinner.name}`,
                cost: DINNER_COST,
                location: `${dinner.name}, ${city}`,
                coordinates: [dinner.lon, dinner.lat],
                emoji: "🎭",
                status: "Open",
                availability: "Reservation Recommended",
                safetyScore: 9.0,
                closingTime: "11:30 PM"
            }
        );

        const dayTotal = activities.reduce((sum, a) => sum + a.cost, 0);
        cumulative += dayTotal;

        dailyPlans.push({
            day: dayNum,
            activities,
            totalCost: dayTotal,
            cumulativeCost: cumulative
        });
    }

    console.warn(`[GENERATOR] ✅ Generated ${dailyPlans.length} days in plan`);

    // Totals from actual activity data
    const totalFoodCost = dailyPlans.reduce((sum, p) =>
        sum + p.activities
            .filter(a => a.activity.includes("Breakfast") || a.activity.includes("Lunch") || a.activity.includes("Dinner"))
            .reduce((s, a) => s + a.cost, 0), 0);
    const totalActivitiesCost = dailyPlans.reduce((sum, p) =>
        sum + p.activities
            .filter(a => !a.activity.includes("Breakfast") && !a.activity.includes("Lunch") && !a.activity.includes("Dinner"))
            .reduce((s, a) => s + a.cost, 0), 0);
    const totalStayCost = tier.stayCostPerDay * totalDays;
    const totalTravelCost = travelCostPerDay * totalDays;
    const calculatedTotal = totalStayCost + totalFoodCost + totalTravelCost + totalActivitiesCost;

    const userFullBudget = budgetType === "daily" ? (budget * totalDays) : budget;
    const isOverBudget = calculatedTotal > userFullBudget;

    const savingsOptions: { category: string; suggestion: string; amountSaved: number }[] = [];
    if (isOverBudget) {
        if (tier.isComfort) {
            savingsOptions.push({
                category: "Lifestyle Downgrade",
                suggestion: tier.savingsSuggestion,
                amountSaved: Math.round(tier.stayCostPerDay * totalDays * 0.5)
            });
        }

        const freeOrCheapPlaces = data.places ? data.places.filter((p: any) => p.cost === 0 || p.cost <= 30) : [];
        if (freeOrCheapPlaces.length > 0) {
            savingsOptions.push({
                category: "Activities",
                suggestion: `Replace premium entry spots with free attractions like ${freeOrCheapPlaces.slice(0, 2).map((p: any) => p.name).join(" and ")}.`,
                amountSaved: Math.round(totalActivitiesCost * 0.5)
            });
        }

        const localDineName = safeRestaurants[0]?.name || "local street vendors";
        savingsOptions.push({
            category: "Dining",
            suggestion: `Opt for budget meals at local restaurants like ${localDineName}. Estimated saving: ~₹${(LUNCH_COST + DINNER_COST - 150 - 100) * totalDays}.`,
            amountSaved: Math.round((LUNCH_COST + DINNER_COST - 250) * totalDays)
        });
    }

    return {
        city,
        days: totalDays,
        isStrict: true,
        stay: {
            area: recommendedHotel?.area || tier.stayArea,
            type: recommendedHotel?.name || tier.stayType,
            costPerMonth: Math.round(tier.stayCostPerDay * 30),
            costPerDay: tier.stayCostPerDay,
            rating: tier.isComfort ? 4.8 : (travelStyle === 'medium' ? 4.2 : 3.6),
            reasons: tier.stayReason,
            distanceToHub: "3km from commercial center",
            status: "Open",
            timing: "Check-in: 12 PM | Check-out: 11 AM",
        },
        food: {
            dailyCostRange: [BREAKFAST_COST + LUNCH_COST + DINNER_COST - 100, BREAKFAST_COST + LUNCH_COST + DINNER_COST + 100],
            suggestions: safeRestaurants.slice(0, 3).map((f: any) => ({ name: f.name, type: "Local Cuisine", avgCost: LUNCH_COST, status: "Open" })),
        },
        travel: {
            mode: travelInfo.mode,
            dailyCost: travelCostPerDay,
            timeSaved: travelInfo.timeSaved,
            suggestion: travelInfo.suggestion,
            availability: travelInfo.availability,
            ticketStatus: travelInfo.ticketStatus,
        },
        places: [
            ...preferredPlacesList.map(placeName => {
                const match = safeAttractions.find(a =>
                    a.name.toLowerCase().includes(placeName.toLowerCase()) ||
                    placeName.toLowerCase().includes(a.name.toLowerCase()) ||
                    (placeName.toLowerCase().includes('isha') && a.name.toLowerCase().includes('isha'))
                );
                return {
                    name: match ? match.name : placeName,
                    entryCost: tier.preferredPlaceCost,
                    status: "Open",
                    availability: "Available",
                    imageUrl: match ? match.imageUrl : undefined
                };
            }),
            ...safeAttractions
                .filter(a => !preferredPlacesList.some(p => p.toLowerCase().includes('isha') && a.name.toLowerCase().includes('isha') || a.name.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(a.name.toLowerCase())))
                .map((p: any) => ({ name: p.name, entryCost: ATTRACTION_COST, status: "Open", availability: "Available", imageUrl: p.imageUrl }))
        ].slice(0, Math.max(8, totalDays)),
        budget: {
            stay: totalStayCost,
            food: totalFoodCost,
            travel: totalTravelCost,
            activities: totalActivitiesCost,
            total: Math.round(calculatedTotal),
            withinBudget: !isOverBudget,
            overBy: isOverBudget ? Math.round(calculatedTotal - userFullBudget) : 0,
            savingsOptions
        },
        dailyPlans,
        totalCost: Math.round(calculatedTotal),
        boardingPoint,
        hotelOptions: safeHotels,
    };
};
