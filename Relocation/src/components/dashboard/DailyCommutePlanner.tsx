import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Train, Bus, Car, Bike, Clock, DollarSign } from 'lucide-react';

interface CommuteMode {
    name: string;
    icon: React.ReactNode;
    time: string;
    cost: string;
    color: string;
}

const DailyCommutePlanner = () => {
    const [selectedMode, setSelectedMode] = useState<string>('metro');

    const commuteModes: CommuteMode[] = [
        {
            name: 'Metro',
            icon: <Train className="h-5 w-5" />,
            time: '25-30 min',
            cost: '₹20-40/trip',
            color: 'from-blue-500 to-blue-600'
        },
        {
            name: 'Bus',
            icon: <Bus className="h-5 w-5" />,
            time: '35-45 min',
            cost: '₹15-25/trip',
            color: 'from-green-500 to-green-600'
        },
        {
            name: 'Cab',
            icon: <Car className="h-5 w-5" />,
            time: '20-25 min',
            cost: '₹100-150/trip',
            color: 'from-purple-500 to-purple-600'
        },
        {
            name: 'Bike',
            icon: <Bike className="h-5 w-5" />,
            time: '15-20 min',
            cost: '₹30-50/trip',
            color: 'from-orange-500 to-orange-600'
        },
    ];

    const selectedModeData = commuteModes.find(m => m.name.toLowerCase() === selectedMode);

    const calculateMonthlyCost = (costRange: string) => {
        const avg = costRange.match(/\d+/g)?.map(Number).reduce((a, b) => a + b, 0) || 0;
        return Math.round((avg / 2) * 2 * 22); // 2 trips per day, 22 working days
    };

    return (
        <div className="space-y-6">
            <Card className="border-indigo-200 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-indigo-600">
                        <Train className="h-6 w-6" />
                        Daily Commute & Travel Planner
                    </CardTitle>
                    <CardDescription>
                        Compare different commute options and costs
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {commuteModes.map((mode) => (
                            <Card
                                key={mode.name}
                                className={`cursor-pointer transition-all ${selectedMode === mode.name.toLowerCase()
                                        ? 'border-indigo-400 shadow-md scale-105'
                                        : 'border-indigo-100 hover:border-indigo-300'
                                    }`}
                                onClick={() => setSelectedMode(mode.name.toLowerCase())}
                            >
                                <CardContent className="p-4 text-center">
                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${mode.color} text-white mb-2`}>
                                        {mode.icon}
                                    </div>
                                    <div className="font-semibold text-gray-900">{mode.name}</div>
                                    <div className="text-xs text-gray-500 mt-1">{mode.time}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {selectedModeData && (
                        <div className="grid md:grid-cols-3 gap-4">
                            <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 text-indigo-600 mb-2">
                                        <Clock className="h-5 w-5" />
                                        <span className="font-semibold">Travel Time</span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">{selectedModeData.time}</div>
                                    <div className="text-sm text-gray-600 mt-1">per trip</div>
                                </CardContent>
                            </Card>

                            <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 text-indigo-600 mb-2">
                                        <DollarSign className="h-5 w-5" />
                                        <span className="font-semibold">Cost per Trip</span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">{selectedModeData.cost}</div>
                                    <div className="text-sm text-gray-600 mt-1">one way</div>
                                </CardContent>
                            </Card>

                            <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 text-indigo-600 mb-2">
                                        <DollarSign className="h-5 w-5" />
                                        <span className="font-semibold">Monthly Cost</span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        ₹{calculateMonthlyCost(selectedModeData.cost).toLocaleString('en-IN')}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">22 working days</div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
                <CardHeader>
                    <CardTitle className="text-indigo-600">Commute Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {commuteModes.map((mode) => (
                            <div key={mode.name} className="flex items-center justify-between p-3 bg-white rounded-lg border border-indigo-100">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${mode.color} flex items-center justify-center text-white`}>
                                        {mode.icon}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">{mode.name}</div>
                                        <div className="text-sm text-gray-600">{mode.time}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-indigo-600">{mode.cost}</div>
                                    <div className="text-xs text-gray-500">
                                        ₹{calculateMonthlyCost(mode.cost).toLocaleString('en-IN')}/mo
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DailyCommutePlanner;
