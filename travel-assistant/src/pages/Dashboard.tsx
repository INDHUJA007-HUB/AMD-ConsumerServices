import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Camera, Shield, Map } from 'lucide-react';
import SmartTravelPlanFinder from '@/components/dashboard/SmartTravelPlanFinder';
import DashboardUserCard from '@/components/dashboard/DashboardUserCard';
import VisualLinguist from '@/components/dashboard/VisualLinguist';
import CoimbatoreMap from '@/components/CoimbatoreMap';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('stay');
    const containerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const tabsListRef = useRef<HTMLDivElement>(null);
    const userCardRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const ctx = gsap.context(() => {
            gsap.from(headerRef.current, {
                y: -30,
                opacity: 0,
                duration: 0.6,
                ease: 'power3.out',
            });
            gsap.from(titleRef.current, {
                y: 20,
                opacity: 0,
                duration: 0.5,
                delay: 0.1,
                ease: 'power3.out',
            });
            gsap.from(subtitleRef.current, {
                y: 15,
                opacity: 0,
                duration: 0.4,
                delay: 0.2,
                ease: 'power3.out',
            });
            gsap.from(userCardRef.current, {
                y: 40,
                opacity: 0,
                duration: 0.7,
                delay: 0.25,
                ease: 'power3.out',
            });
            gsap.from(tabsListRef.current?.children || [], {
                y: 20,
                opacity: 0,
                duration: 0.4,
                stagger: 0.06,
                delay: 0.5,
                ease: 'power2.out',
            });
            gsap.from(contentRef.current, {
                y: 30,
                opacity: 0,
                duration: 0.5,
                delay: 0.7,
                ease: 'power3.out',
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    // Animate content when switching tabs
    useEffect(() => {
        if (!contentRef.current) return;
        gsap.fromTo(
            contentRef.current,
            { opacity: 0.7, y: 8 },
            { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
        );
    }, [activeTab]);

    return (
        <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header ref={headerRef} className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
                <div className="container max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 ref={titleRef} className="text-3xl font-bold font-display bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Travelling Dashboard
                            </h1>
                            <p ref={subtitleRef} className="text-sm text-gray-600 mt-1">
                                Plan your move with smart insights
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* AR Camera Button */}
                            <button
                                onClick={() => setActiveTab('vision')}
                                className="relative flex items-center justify-center w-10 h-10 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-600 shadow-sm transition-all hover:scale-110 hover:bg-indigo-100 group"
                                title="Launch AR Vision"
                            >
                                <Camera className="w-5 h-5" />
                                <span className="absolute -bottom-10 right-0 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">AR Camera</span>
                            </button>

                            {/* Safety Shield Icon */}
                            <div className="relative group cursor-help">
                                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-25"></div>
                                <div className="relative flex items-center justify-center w-10 h-10 bg-green-50 border border-green-200 rounded-full text-green-600 shadow-sm transition-transform hover:scale-110">
                                    <Shield className="w-5 h-5" />
                                </div>
                                {/* Tooltip */}
                                <div className="absolute right-0 top-12 w-48 bg-slate-900 text-white text-[10px] p-2 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[60] shadow-xl">
                                    <div className="font-bold text-green-400 mb-1 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                        SAFE ZONE ACTIVE
                                    </div>
                                    You are currently in a high-activity, well-lit area with a safety score of 9.2/10.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container max-w-7xl mx-auto px-4 py-8">
                <div ref={userCardRef} className="mb-8">
                    <DashboardUserCard />
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList ref={tabsListRef} className="grid w-full grid-cols-3 mb-8 bg-white/60 backdrop-blur-sm border border-blue-100 p-1 rounded-xl gap-1">
                        <TabsTrigger
                            value="stay"
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all"
                        >
                            <Home className="h-4 w-4" />
                            <span className="hidden sm:inline">Smart Travel Plan Finder</span>
                            <span className="sm:hidden">Travel Plan</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="vision"
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-lg transition-all"
                        >
                            <Camera className="h-4 w-4" />
                            <span className="hidden sm:inline">Live AR Camera</span>
                            <span className="sm:hidden">Camera</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="map"
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg transition-all"
                        >
                            <Map className="h-4 w-4" />
                            <span className="hidden sm:inline">Coimbatore Map</span>
                            <span className="sm:hidden">Map</span>
                        </TabsTrigger>
                    </TabsList>

                    <div ref={contentRef}>
                        <TabsContent value="stay" className="mt-0">
                            <SmartTravelPlanFinder />
                        </TabsContent>
                        <TabsContent value="vision" className="mt-0">
                            <VisualLinguist onBack={() => setActiveTab('stay')} />
                        </TabsContent>
                        <TabsContent value="map" className="mt-0 h-[600px]">
                            <CoimbatoreMap
                                apiKey={import.meta.env.VITE_AWS_LOCATION_API_KEY || ''}
                                mapName="default"
                                region="us-east-1"
                                className="w-full h-full shadow-lg border-blue-100"
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </main>
        </div>
    );
};

export default Dashboard;
