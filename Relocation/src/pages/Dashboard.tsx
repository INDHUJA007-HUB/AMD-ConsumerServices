import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Calculator, Utensils, Train, BedDouble, Building2 } from 'lucide-react';
import SmartStayFinder from '@/components/dashboard/SmartStayFinder';
import PredictiveExpenseModel from '@/components/dashboard/PredictiveExpenseModel';
import TravelOptimizer from '@/components/dashboard/TravelOptimizer';
import DashboardUserCard from '@/components/dashboard/DashboardUserCard';
import PGs from '@/pages/PGs';
import HouseOnRent from '@/pages/HouseOnRent';
import Dock from '@/components/Dock';
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
                                Relocation Dashboard
                            </h1>
                            <p ref={subtitleRef} className="text-sm text-gray-600 mt-1">
                                Plan your move with AI-powered insights
                            </p>
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
                    <TabsList ref={tabsListRef} className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-8 bg-white/60 backdrop-blur-sm border border-blue-100 p-1 rounded-xl">
                        <TabsTrigger
                            value="stay"
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all"
                        >
                            <Home className="h-4 w-4" />
                            <span className="hidden sm:inline">Smart Stay Finder</span>
                            <span className="sm:hidden">Stay</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="expense"
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all"
                        >
                            <Calculator className="h-4 w-4" />
                            <span className="hidden sm:inline">Expense Calculator</span>
                            <span className="sm:hidden">Expense</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="commute"
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all"
                        >
                            <Train className="h-4 w-4" />
                            <span className="hidden sm:inline">Commute Planner</span>
                            <span className="sm:hidden">Commute</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="pgs"
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all"
                        >
                            <BedDouble className="h-4 w-4" />
                            <span className="hidden sm:inline">PGs</span>
                            <span className="sm:hidden">PGs</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="rent"
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg transition-all"
                        >
                            <Building2 className="h-4 w-4" />
                            <span className="hidden sm:inline">House On Rent</span>
                            <span className="sm:hidden">Rent</span>
                        </TabsTrigger>
                    </TabsList>

                    <div ref={contentRef}>
                        <TabsContent value="stay" className="mt-0">
                            <SmartStayFinder />
                        </TabsContent>

                        <TabsContent value="expense" className="mt-0">
                            <PredictiveExpenseModel />

                            {/* Service Description */}
                            <div className="mt-8 p-6 bg-white/60 backdrop-blur-sm border border-purple-100 rounded-xl">
                                <h3 className="text-lg font-semibold text-purple-700 mb-3 flex items-center gap-2">
                                    <Calculator className="h-5 w-5" />
                                    How to use the Predictive Expense Model
                                </h3>
                                <div className="space-y-4 text-gray-700 leading-relaxed text-sm lg:text-base">
                                    <p>
                                        Moving to a new city involves complex financial planning. This AI-powered survival cost model helps you estimate your monthly budget in Coimbatore based on real-time market data.
                                    </p>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-50">
                                            <h4 className="font-semibold text-purple-600 mb-1">1. Select Lifestyle</h4>
                                            <p>Choose between <strong>Frugal</strong> (essential spending), <strong>Balanced</strong> (comfortable living), or <strong>Premium</strong> (high-end experiences) to see how costs scale.</p>
                                        </div>
                                        <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-50">
                                            <h4 className="font-semibold text-purple-600 mb-1">2. Review Breakdown</h4>
                                            <p>Analyze the percentage distribution across Food, Utilities, Transport, and Entertainment to prioritize your spending.</p>
                                        </div>
                                    </div>
                                    <p className="italic text-xs text-gray-500 mt-2">
                                        * Costs are estimates based on aggregated datasets and may vary depending on specific locational choices and fluctuating market prices.
                                    </p>
                                </div>
                            </div>
                        </TabsContent>


                        <TabsContent value="commute" className="mt-0">
                            <TravelOptimizer />
                        </TabsContent>

                        <TabsContent value="pgs" className="mt-0">
                            <PGs />
                        </TabsContent>

                        <TabsContent value="rent" className="mt-0">
                            <HouseOnRent />
                        </TabsContent>
                    </div>
                </Tabs>
            </main>
            <Dock
                activeLabel={{
                    stay: 'Smart Stay',
                    expense: 'Expense',
                    commute: 'Commute',
                    pgs: 'PGs',
                    rent: 'Rent',
                }[activeTab]}
                items={[
                    { label: 'Smart Stay', icon: <Home className="h-6 w-6" />, onClick: () => setActiveTab('stay') },
                    { label: 'Expense', icon: <Calculator className="h-6 w-6" />, onClick: () => setActiveTab('expense') },
                    { label: 'Commute', icon: <Train className="h-6 w-6" />, onClick: () => setActiveTab('commute') },
                    { label: 'PGs', icon: <BedDouble className="h-6 w-6" />, onClick: () => setActiveTab('pgs') },
                    { label: 'Rent', icon: <Building2 className="h-6 w-6" />, onClick: () => setActiveTab('rent') },
                ]}
            />
        </div>
    );
};

export default Dashboard;
