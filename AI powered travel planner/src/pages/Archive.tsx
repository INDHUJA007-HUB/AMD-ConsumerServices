import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ArrowRight, ArrowLeft, User, MapPin, Car, Calendar, CheckCircle, Home, Compass, Sparkles } from "lucide-react";
import { HeroButton } from "@/components/HeroButton";
import GradientText from "@/components/GradientText";
import Dock from "@/components/Dock";

const Archive = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    duration: "",
    budget: "",
    transport: "",
    preferences: [] as string[]
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate form entrance
      gsap.from(".travel-header", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.from(".progress-bar", {
        scaleX: 0,
        duration: 1,
        delay: 0.3,
        ease: "power3.out",
        transformOrigin: "left",
      });

      gsap.from(".form-container", {
        y: 30,
        opacity: 0,
        duration: 0.6,
        delay: 0.5,
        ease: "power3.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const steps = [
    {
      title: "Personal Details",
      subtitle: "Tell us about yourself",
      icon: <User className="h-6 w-6" />,
      colors: ["#5227FF", "#FF9FFC"],
      fields: [
        { name: "name", label: "Full Name", type: "text", placeholder: "Enter your full name", icon: "👤" },
        { name: "email", label: "Email Address", type: "email", placeholder: "your@email.com", icon: "✉️" },
        { name: "phone", label: "Phone Number", type: "tel", placeholder: "+91 XXXXX XXXXX", icon: "📱" }
      ]
    },
    {
      title: "Travel Destination",
      subtitle: "Where do you want to go?",
      icon: <MapPin className="h-6 w-6" />,
      colors: ["#FF9FFC", "#B19EEF"],
      fields: [
        { name: "city", label: "Destination City", type: "select", options: ["Coimbatore", "Chennai", "Bangalore", "Mumbai", "Delhi"], icon: "🏙️" },
        { name: "duration", label: "Trip Duration", type: "select", options: ["1-2 days", "3-5 days", "1 week", "2 weeks", "1 month+"], icon: "⏰" },
        { name: "budget", label: "Budget Range", type: "select", options: ["₹1,000-5,000", "₹5,000-15,000", "₹15,000-30,000", "₹30,000+"], icon: "💰" }
      ]
    },
    {
      title: "Transportation",
      subtitle: "How will you travel?",
      icon: <Car className="h-6 w-6" />,
      colors: ["#B19EEF", "#7494ec"],
      fields: [
        { name: "transport", label: "Preferred Transport", type: "radio", options: ["Bus", "Train", "Flight", "Car Rental", "Local Transport Only"], icon: "🚗" }
      ]
    },
    {
      title: "Preferences",
      subtitle: "What interests you?",
      icon: <Calendar className="h-6 w-6" />,
      colors: ["#7494ec", "#5227FF"],
      fields: [
        { name: "preferences", label: "Travel Preferences", type: "checkbox", options: ["Budget-friendly", "Luxury", "Adventure", "Cultural", "Food & Cuisine", "Shopping", "Nature", "Historical Sites"], icon: "🎯" }
      ]
    }
  ];

  const dockItems = [
    { icon: <Home size={18} />, label: 'Home', onClick: () => navigate('/') },
    { icon: <Compass size={18} />, label: 'Planner', onClick: () => navigate('/plan') },
    { icon: <Compass size={18} />, label: 'Travel Planning', onClick: () => navigate('/archive') },
    { icon: <Home size={18} />, label: 'Archive', onClick: () => navigate('/archive') },
    { icon: <User size={18} />, label: 'Profile', onClick: () => navigate('/profile') },
  ];

  const handleInputChange = (name: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Animate out current step
      gsap.to(".form-container", {
        y: -20,
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          setCurrentStep(currentStep + 1);
          // Animate in new step
          gsap.fromTo(".form-container",
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.3 }
          );
        }
      });
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      gsap.to(".form-container", {
        y: 20,
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          setCurrentStep(currentStep - 1);
          gsap.fromTo(".form-container",
            { y: -20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.3 }
          );
        }
      });
    }
  };

  const handleSubmit = () => {
    // Success animation
    gsap.to(".form-container", {
      scale: 0.95,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        console.log("Travel Plan Data:", formData);
        alert("✨ Travel plan created! We'll send your personalized itinerary soon.");
        navigate('/');
      }
    });
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Full travel planning form
  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-surface-cool to-surface-warm py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <GradientText
            colors={["#5227FF", "#FF9FFC"]}
            animationSpeed={3}
            showBorder={false}
            className="text-4xl md:text-5xl font-bold font-display mb-4"
          >
            Travel Planning
          </GradientText>
          <p className="text-xl text-muted-foreground">Your Personal Travel Planning Guide</p>

        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="progress-bar bg-card rounded-2xl p-8 shadow-card border border-border/50">
            <div className="flex items-center justify-between mb-6">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${index <= currentStep
                      ? 'bg-hero-gradient text-white shadow-lg scale-110'
                      : 'bg-muted text-muted-foreground'
                    }`}>
                    {index < currentStep ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <div className={index === currentStep ? 'scale-110' : ''}>
                        {step.icon}
                      </div>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-4">
                      <div className={`h-2 rounded-full transition-all duration-500 ${index < currentStep ? 'bg-hero-gradient' : 'bg-muted'
                        }`} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <GradientText
                colors={currentStepData.colors}
                animationSpeed={4}
                showBorder={false}
                className="text-3xl font-bold font-display mb-2"
              >
                {currentStepData.title}
              </GradientText>
              <p className="text-muted-foreground text-lg">{currentStepData.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              ref={formRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="form-container bg-card/80 backdrop-blur-sm rounded-3xl shadow-card border border-border/50 p-8 md:p-12"
            >
              <div className="grid gap-8">
                {currentStepData.fields.map((field, fieldIndex) => (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: fieldIndex * 0.1 }}
                    className="space-y-3"
                  >
                    <label className="flex items-center text-lg font-semibold text-foreground">
                      <span className="text-2xl mr-3">{field.icon}</span>
                      {field.label}
                    </label>

                    {field.type === 'text' || field.type === 'email' || field.type === 'tel' ? (
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.name as keyof typeof formData] as string}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="w-full px-6 py-4 bg-background border-2 border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-lg placeholder:text-muted-foreground"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={formData[field.name as keyof typeof formData] as string}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="w-full px-6 py-4 bg-background border-2 border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-lg"
                      >
                        <option value="" className="text-muted-foreground">Select {field.label.toLowerCase()}</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option} className="text-foreground">{option}</option>
                        ))}
                      </select>
                    ) : field.type === 'radio' ? (
                      <div className="grid gap-4">
                        {field.options?.map((option, optionIndex) => (
                          <motion.label
                            key={option}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: optionIndex * 0.05 }}
                            className="flex items-center p-4 bg-background/50 border-2 border-border rounded-xl hover:border-primary/50 transition-all duration-300 cursor-pointer group"
                          >
                            <input
                              type="radio"
                              name={field.name}
                              value={option}
                              checked={formData.transport === option}
                              onChange={(e) => handleInputChange(field.name, e.target.value)}
                              className="mr-4 text-primary focus:ring-primary w-5 h-5"
                            />
                            <span className="text-lg text-foreground group-hover:text-primary transition-colors">
                              {option}
                            </span>
                          </motion.label>
                        ))}
                      </div>
                    ) : field.type === 'checkbox' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {field.options?.map((option, optionIndex) => (
                          <motion.label
                            key={option}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: optionIndex * 0.05 }}
                            className="flex items-center p-4 bg-background/50 border-2 border-border rounded-xl hover:border-primary/50 transition-all duration-300 cursor-pointer group"
                          >
                            <input
                              type="checkbox"
                              value={option}
                              checked={formData.preferences.includes(option)}
                              onChange={(e) => {
                                const currentPrefs = formData.preferences;
                                if (currentPrefs.includes(option)) {
                                  handleInputChange(field.name, currentPrefs.filter(p => p !== option));
                                } else {
                                  handleInputChange(field.name, [...currentPrefs, option]);
                                }
                              }}
                              className="mr-4 text-primary focus:ring-primary w-5 h-5"
                            />
                            <span className="text-foreground group-hover:text-primary transition-colors">
                              {option}
                            </span>
                          </motion.label>
                        ))}
                      </div>
                    ) : null}
                  </motion.div>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 mt-12">
                <HeroButton
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  variant={currentStep === 0 ? "ghost" : "outline"}
                  size="lg"
                  className={`flex items-center ${currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Previous
                </HeroButton>

                {currentStep === steps.length - 1 ? (
                  <HeroButton
                    onClick={handleSubmit}
                    size="lg"
                    className="bg-success hover:bg-success/90 text-success-foreground flex items-center"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Create My Travel Plan
                  </HeroButton>
                ) : (
                  <HeroButton
                    onClick={handleNext}
                    size="lg"
                    className="flex items-center"
                  >
                    Next Step
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </HeroButton>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <Dock
        items={dockItems}
        panelHeight={68}
        baseItemSize={50}
        magnification={70}
      />
    </div>
  );
};

export default Archive;
