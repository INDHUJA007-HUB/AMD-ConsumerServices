import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import InputForm from "@/components/InputForm";
import MasterItinerary from "@/components/dashboard/MasterItinerary";
import { UserInput, CityPlan } from "@/types/cityPlan";
import { mockCityPlan } from "@/data/mockCityPlan";
import heroBg from "@/assets/hero-bg.jpg";
import { Compass, Brain, Wallet, MapPin } from "lucide-react";
import AILoadingScreen from "@/components/AILoadingScreen";

import { fetchCityPlan } from "@/services/api";
import VisualLinguist from "@/components/dashboard/VisualLinguist";
import { Scan, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: <Brain className="h-6 w-6" />, title: "Smart Decisions", desc: "Every suggestion backed by reasoning" },
  { icon: <Wallet className="h-6 w-6" />, title: "Budget Optimized", desc: "Stay within your budget, always" },
  { icon: <MapPin className="h-6 w-6" />, title: "Local Intelligence", desc: "Real insights from Indian cities" },
  { icon: <Compass className="h-6 w-6" />, title: "Complete Planning", desc: "Stay, food, travel & activities" },
];

const Index = () => {
  const [plan, setPlan] = useState<CityPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingInput, setPendingInput] = useState<UserInput | null>(null);

  const handleSubmit = (_input: UserInput) => {
    setPendingInput(_input);
    setIsGenerating(true);
  };

  const handleGenerationComplete = async () => {
    if (pendingInput) {
      try {
        const newPlan = await fetchCityPlan(pendingInput);
        console.log("Plan generated:", newPlan.days, "days");
        setPlan({ ...newPlan }); // Spreading to force a fresh object reference
      } catch (error) {
        console.error("Failed to generate plan", error);
      } finally {
        setIsGenerating(false);
        setPendingInput(null);
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isGenerating ? (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <AILoadingScreen onComplete={handleGenerationComplete} />
        </motion.div>
      ) : plan ? (
        <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <MasterItinerary plan={plan} onBack={() => setPlan(null)} />
        </motion.div>
      ) : (
        <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* Hero */}
          <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0">
              <img src={heroBg} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-secondary/80 backdrop-blur-sm" />
            </div>
            <div className="relative z-10 container max-w-4xl mx-auto px-4 py-20 text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <span className="inline-block rounded-full bg-primary/20 px-4 py-1.5 text-sm font-semibold text-primary mb-6">
                  🧠 Smart City Companion
                </span>
                <h1 className="text-4xl md:text-6xl font-bold font-display text-secondary-foreground mb-4 leading-tight">
                  Your Smart Guide to<br />
                  <span className="text-gradient">Any Indian City</span>
                </h1>
                <p className="text-lg md:text-xl text-secondary-foreground/70 max-w-2xl mx-auto mb-8">
                  Stop searching. Start deciding. Smart engine that plans your stay, food, travel & budget — with clear reasoning for every choice.
                </p>
              </motion.div>

              {/* Feature pills */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-wrap justify-center gap-3 mb-8"
              >
                {features.map((f, i) => (
                  <div key={i} className="glass-surface flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-secondary-foreground/90">
                    <span className="text-primary">{f.icon}</span>
                    {f.title}
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Input Form Section */}
          <div className="container max-w-4xl mx-auto px-4 -mt-10 relative z-20 pb-20">
            <InputForm onSubmit={handleSubmit} />
          </div>
        </motion.div>
      )}

    </AnimatePresence>
  );
};

export default Index;
