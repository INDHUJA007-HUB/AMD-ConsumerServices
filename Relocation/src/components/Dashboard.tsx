import { motion } from "framer-motion";
import { CityPlan } from "@/types/cityPlan";
import SectionCard from "@/components/SectionCard";
import StatCard from "@/components/StatCard";
import ReasonCard from "@/components/ReasonCard";
import { HeroButton } from "@/components/HeroButton";
import {
  Home, Utensils, Train, MapPin, Wallet, Clock, Star, CheckCircle, AlertTriangle, ArrowLeft, Calendar,
  IndianRupee, TrendingDown, Shield, Navigation
} from "lucide-react";

interface DashboardProps {
  plan: CityPlan;
  onBack: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const Dashboard = ({ plan, onBack }: DashboardProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-hero-gradient py-6">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="rounded-lg bg-primary-foreground/20 p-2 text-primary-foreground hover:bg-primary-foreground/30 transition">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold font-display text-primary-foreground">
                  Your {plan.city} Plan
                </h1>
                <p className="text-primary-foreground/80 text-sm">AI-optimized city survival guide</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-primary-foreground/20 px-4 py-2 text-primary-foreground text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              {plan.budget.withinBudget ? "Within Budget" : "Over Budget"}
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Row */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<IndianRupee className="h-5 w-5" />} label="Total Cost" value={`₹${plan.budget.total.toLocaleString()}`} subtitle="Estimated total" />
          <StatCard icon={<Home className="h-5 w-5" />} label="Stay" value={`₹${plan.budget.stay.toLocaleString()}`} subtitle={plan.stay.area} />
          <StatCard icon={<Utensils className="h-5 w-5" />} label="Food" value={`₹${plan.budget.food.toLocaleString()}`} subtitle={`₹${plan.food.dailyCostRange[0]}-${plan.food.dailyCostRange[1]}/day`} />
          <StatCard icon={<Train className="h-5 w-5" />} label="Travel" value={`₹${plan.budget.travel.toLocaleString()}`} subtitle={plan.travel.mode} />
        </motion.div>

        {/* Stay Recommendation */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          <SectionCard icon={<Home className="h-5 w-5" />} title="Stay Recommendation" subtitle="AI-selected best area" badge={`⭐ ${plan.stay.rating}`}>
            <div className="space-y-3">
              <div className="rounded-xl bg-surface-warm p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold font-display text-lg text-foreground">{plan.stay.area}</h4>
                  <span className="text-sm font-semibold text-primary">₹{plan.stay.costPerMonth.toLocaleString()}/mo</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.stay.type} • {plan.stay.distanceToHub}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Why this area?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {plan.stay.reasons.map((r, i) => (
                    <ReasonCard key={i} icon={[<TrendingDown className="h-4 w-4" />, <Shield className="h-4 w-4" />, <Utensils className="h-4 w-4" />, <Navigation className="h-4 w-4" />][i % 4]} title={r} reason="AI-verified factor" />
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </motion.div>

        {/* Food & Travel Row */}
        <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SectionCard icon={<Utensils className="h-5 w-5" />} title="Food Planner" subtitle="Daily meal suggestions">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-surface-warm p-3">
                <span className="text-sm font-medium text-foreground">Expected daily cost</span>
                <span className="text-sm font-bold text-primary">₹{plan.food.dailyCostRange[0]} – ₹{plan.food.dailyCostRange[1]}</span>
              </div>
              {plan.food.suggestions.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.type}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">₹{s.avgCost}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard icon={<Train className="h-5 w-5" />} title="Travel Optimizer" subtitle="Smart commute plan">
            <div className="space-y-3">
              <div className="rounded-xl bg-surface-warm p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Train className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold font-display text-foreground">{plan.travel.mode}</p>
                    <p className="text-sm text-muted-foreground">₹{plan.travel.dailyCost}/day</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="h-3.5 w-3.5 text-success" />
                  <span className="text-xs font-medium text-success">Saves {plan.travel.timeSaved}</span>
                </div>
              </div>
              <ReasonCard icon={<TrendingDown className="h-4 w-4" />} title="Pro Tip" reason={plan.travel.suggestion} savings="Money Saver" />
            </div>
          </SectionCard>
        </motion.div>

        {/* Places to Visit */}
        <motion.div {...fadeUp} transition={{ delay: 0.4 }}>
          <SectionCard icon={<MapPin className="h-5 w-5" />} title="Places to Visit" subtitle="Optimized itinerary" badge={`${plan.places.length} spots`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {plan.places.map((p, i) => (
                <div key={i} className="rounded-xl bg-surface-cool p-4 card-elevated">
                  <h4 className="font-bold text-sm text-foreground mb-1">{p.name}</h4>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {p.bestTime}</div>
                    <div className="flex items-center gap-1.5"><Wallet className="h-3 w-3" /> ₹{p.entryCost} entry • {p.duration}</div>
                  </div>
                  <p className="mt-2 text-xs font-medium text-primary">💡 {p.tip}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </motion.div>

        {/* Budget Breakdown */}
        <motion.div {...fadeUp} transition={{ delay: 0.5 }}>
          <SectionCard icon={<Wallet className="h-5 w-5" />} title="Budget Breakdown" subtitle="Complete cost analysis">
            <div className="space-y-4">
              {[
                { label: "Stay", value: plan.budget.stay, color: "bg-primary" },
                { label: "Food", value: plan.budget.food, color: "bg-accent" },
                { label: "Travel", value: plan.budget.travel, color: "bg-info" },
                { label: "Activities", value: plan.budget.activities, color: "bg-success" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold text-foreground">₹{item.value.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-700`}
                      style={{ width: `${(item.value / plan.budget.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="rounded-xl bg-surface-warm p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Estimated Cost</p>
                  <p className="text-2xl font-bold font-display text-foreground">₹{plan.budget.total.toLocaleString()}</p>
                </div>
                <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${plan.budget.withinBudget ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                  {plan.budget.withinBudget ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  {plan.budget.withinBudget ? "Within Budget" : `Over by ₹${plan.budget.overBy?.toLocaleString()}`}
                </div>
              </div>
            </div>
          </SectionCard>
        </motion.div>

        {/* Daily Plans */}
        <motion.div {...fadeUp} transition={{ delay: 0.6 }}>
          <SectionCard icon={<Calendar className="h-5 w-5" />} title="Daily Itinerary" subtitle="Optimized day-by-day plan">
            <div className="space-y-6">
              {plan.dailyPlans.map((day) => (
                <div key={day.day}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold font-display text-foreground">Day {day.day}</h4>
                    <span className="text-sm font-semibold text-primary">₹{day.totalCost} total</span>
                  </div>
                  <div className="relative pl-6 space-y-3">
                    <div className="absolute left-2.5 top-1 bottom-1 w-px bg-border" />
                    {day.activities.map((act, i) => (
                      <div key={i} className="relative flex items-start gap-3">
                        <div className="absolute -left-6 top-1 h-5 w-5 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{act.activity}</p>
                            <p className="text-xs text-muted-foreground">{act.time} • {act.location}</p>
                          </div>
                          <span className="text-xs font-semibold text-foreground">₹{act.cost}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </motion.div>

        {/* Back Button */}
        <div className="text-center pb-8">
          <HeroButton variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" /> Plan Another City
          </HeroButton>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
