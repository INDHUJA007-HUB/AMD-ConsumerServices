import { useState } from "react";
import { motion } from "framer-motion";
import { HeroButton } from "@/components/HeroButton";
import { MapPin, Wallet, Calendar, Utensils, Train, Target, Briefcase, Scan } from "lucide-react";
import { UserInput } from "@/types/cityPlan";
import { toast } from "sonner";

const cities = ["Bangalore", "Mumbai", "Delhi", "Chennai", "Hyderabad", "Pune", "Kolkata", "Jaipur", "Goa", "Kochi"];

interface InputFormProps {
  onSubmit: (input: UserInput) => void;
}

const InputForm = ({ onSubmit }: InputFormProps) => {
  const [form, setForm] = useState<UserInput>({
    city: "Bangalore",
    budget: 20000,
    budgetType: "monthly",
    purpose: "tourism",
    days: 3,
    foodPreference: "both",
    travelStyle: "budget",
    preferredPlaces: "",
    workplace: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.city) {
      toast.error("Please select a destination city.");
      return;
    }
    onSubmit(form);
  };

  const update = <K extends keyof UserInput>(key: K, value: UserInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <motion.form
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto card-elevated rounded-2xl bg-card p-6 md:p-8 space-y-6"
    >
      {/* City */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
          <MapPin className="h-4 w-4 text-primary" /> Destination City
        </label>
        <div className="flex flex-wrap gap-2">
          {cities.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => update("city", c)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${form.city === c
                ? "bg-hero-gradient text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
            <Wallet className="h-4 w-4 text-primary" /> Budget (₹)
          </label>
          <input
            type="number"
            value={form.budget}
            onChange={(e) => update("budget", Number(e.target.value))}
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            min={500}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Budget Type</label>
          <div className="flex gap-2">
            {(["daily", "monthly"] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => update("budgetType", t)}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${form.budgetType === t
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
              >
                {t === "daily" ? "Per Day" : "Per Month"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Purpose & Days */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
            <Target className="h-4 w-4 text-primary" /> Purpose
          </label>
          <div className="flex gap-2">
            {([
              { value: "tourism" as const, label: "🧳 Tourism" },
              { value: "relocation" as const, label: "🧑‍💼 Relocation" },
            ]).map((p) => (
              <button
                type="button"
                key={p.value}
                onClick={() => update("purpose", p.value)}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${form.purpose === p.value
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
            <Calendar className="h-4 w-4 text-primary" /> Number of Days
          </label>
          <input
            type="number"
            value={form.days}
            onChange={(e) => update("days", Number(e.target.value))}
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            min={1}
            max={365}
          />
        </div>
      </div>

      {/* Food & Travel Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
            <Utensils className="h-4 w-4 text-primary" /> Food Preference
          </label>
          <div className="flex gap-2">
            {([
              { value: "veg" as const, label: "🥬 Veg" },
              { value: "nonveg" as const, label: "🍗 Non-veg" },
              { value: "both" as const, label: "🍽️ Both" },
            ]).map((f) => (
              <button
                type="button"
                key={f.value}
                onClick={() => update("foodPreference", f.value)}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${form.foodPreference === f.value
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
            <Train className="h-4 w-4 text-primary" /> Travel Style
          </label>
          <div className="flex gap-2">
            {([
              { value: "budget" as const, label: "💰 Budget" },
              { value: "comfort" as const, label: "✨ Comfort" },
            ]).map((t) => (
              <button
                type="button"
                key={t.value}
                onClick={() => update("travelStyle", t.value)}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${form.travelStyle === t.value
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preferred Places (Optional) */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
          <MapPin className="h-4 w-4 text-primary" /> Preferred Places (Optional)
        </label>
        <input
          type="text"
          value={form.preferredPlaces || ""}
          onChange={(e) => update("preferredPlaces", e.target.value)}
          placeholder="e.g., Isha Yoga Center, Marudamalai, RS Puram"
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Separate multiple places with commas
        </p>
      </div>

      {/* Workplace (Optional) */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
          <Briefcase className="h-4 w-4 text-primary" /> Workplace (Optional)
        </label>
        <input
          type="text"
          value={form.workplace || ""}
          onChange={(e) => update("workplace", e.target.value)}
          placeholder="e.g., TIDEL Park, IT Park"
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground mt-1">
          We'll calculate distance from accommodations to your workplace
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <HeroButton type="submit" size="xl" className="flex-1">
          🚀 Generate My City Plan
        </HeroButton>

      </div>
    </motion.form>
  );
};

export default InputForm;
