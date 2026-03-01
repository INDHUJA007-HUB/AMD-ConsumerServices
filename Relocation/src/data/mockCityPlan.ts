import { CityPlan } from "@/types/cityPlan";

export const mockCityPlan: CityPlan = {
  city: "Bangalore",
  stay: {
    area: "BTM Layout",
    type: "PG / Shared Room",
    costPerMonth: 8000,
    costPerDay: 267,
    rating: 4.3,
    reasons: [
      "Low rent compared to central areas",
      "Close to IT hubs (Silk Board, HSR)",
      "Abundant food options nearby",
      "Well connected by metro & bus",
    ],
    distanceToHub: "3.5 km to nearest IT park",
  },
  food: {
    dailyCostRange: [150, 250],
    suggestions: [
      { name: "Vidyarthi Bhavan Style Mess", type: "South Indian Thali", avgCost: 70 },
      { name: "BTM Food Street", type: "Street Food", avgCost: 50 },
      { name: "Amma's Kitchen", type: "Home-style Meals", avgCost: 90 },
      { name: "Local Darshini", type: "Quick Bites", avgCost: 40 },
    ],
  },
  travel: {
    mode: "Metro + Bus",
    dailyCost: 60,
    timeSaved: "40 mins vs auto/cab",
    suggestion: "Get a BMTC monthly pass (₹1200) — saves ₹600/month vs daily tickets",
  },
  places: [
    { name: "Lalbagh Botanical Garden", bestTime: "7:00 AM - 9:00 AM", entryCost: 20, duration: "2 hours", tip: "Visit early morning for pleasant weather" },
    { name: "Cubbon Park", bestTime: "6:00 AM - 8:00 AM", entryCost: 0, duration: "1.5 hours", tip: "Free entry — great for morning walks" },
    { name: "Bangalore Palace", bestTime: "10:00 AM - 12:00 PM", entryCost: 230, duration: "2 hours", tip: "Photography charges extra" },
    { name: "Commercial Street", bestTime: "4:00 PM - 7:00 PM", entryCost: 0, duration: "3 hours", tip: "Best for budget shopping — bargain hard!" },
    { name: "Nandi Hills", bestTime: "5:00 AM (sunrise)", entryCost: 20, duration: "Half day", tip: "Go on weekday — weekend crowds are massive" },
  ],
  budget: {
    stay: 8000,
    food: 6000,
    travel: 1800,
    activities: 1200,
    total: 17000,
    withinBudget: true,
  },
  dailyPlans: [
    {
      day: 1,
      activities: [
        { time: "7:00 AM", activity: "Visit Lalbagh Garden", cost: 20, location: "Lalbagh" },
        { time: "9:30 AM", activity: "Breakfast at Vidyarthi Bhavan", cost: 120, location: "Basavanagudi" },
        { time: "11:00 AM", activity: "Bangalore Palace Tour", cost: 230, location: "Palace Grounds" },
        { time: "1:00 PM", activity: "Lunch at local mess", cost: 90, location: "Near Palace" },
        { time: "3:00 PM", activity: "Cubbon Park walk", cost: 0, location: "Cubbon Park" },
        { time: "5:00 PM", activity: "Shopping at Commercial Street", cost: 500, location: "Commercial Street" },
        { time: "8:00 PM", activity: "Dinner at BTM Food Street", cost: 150, location: "BTM Layout" },
      ],
      totalCost: 1110,
    },
    {
      day: 2,
      activities: [
        { time: "5:00 AM", activity: "Sunrise at Nandi Hills", cost: 20, location: "Nandi Hills" },
        { time: "10:00 AM", activity: "Brunch at local café", cost: 200, location: "MG Road" },
        { time: "12:00 PM", activity: "UB City Mall exploration", cost: 0, location: "UB City" },
        { time: "2:00 PM", activity: "Lunch at Koshy's", cost: 350, location: "St. Marks Road" },
        { time: "4:00 PM", activity: "ISKCON Temple visit", cost: 0, location: "Rajajinagar" },
        { time: "7:00 PM", activity: "Dinner at VV Puram Food Street", cost: 200, location: "VV Puram" },
      ],
      totalCost: 770,
    },
    {
      day: 3,
      activities: [
        { time: "8:00 AM", activity: "Breakfast at Darshini", cost: 60, location: "BTM Layout" },
        { time: "10:00 AM", activity: "Bannerghatta National Park", cost: 320, location: "Bannerghatta" },
        { time: "1:00 PM", activity: "Lunch at park canteen", cost: 150, location: "Bannerghatta" },
        { time: "4:00 PM", activity: "Tipu Sultan's Palace", cost: 15, location: "City Market" },
        { time: "6:00 PM", activity: "Evening at Brigade Road", cost: 100, location: "Brigade Road" },
        { time: "8:30 PM", activity: "Dinner at local restaurant", cost: 180, location: "BTM Layout" },
      ],
      totalCost: 825,
    },
  ],
};
