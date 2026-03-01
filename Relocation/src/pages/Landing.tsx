import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { Brain, Wallet, MapPin, Compass, Home, Utensils, Train, Calendar, ArrowRight, Sparkles, Shield, TrendingDown, Archive, User, Settings, Users } from "lucide-react";
import { HeroButton } from "@/components/HeroButton";
import Dock from "@/components/Dock";
import DotGrid from "@/components/DotGrid";
import ClickSpark from "@/components/ClickSpark";
import BlurText from "@/components/BlurText";
import GradientText from "@/components/GradientText";
import "./LandingSwapper.css";

import relocationImg from "@/assets/relocation.jpg";
import tourismImg from "@/assets/tourism.jpg";
import featureAi from "@/assets/feature-ai.jpg";
import featureStay from "@/assets/feature-stay.jpg";
import featureFood from "@/assets/feature-food.jpg";
import featureTravel from "@/assets/feature-travel.jpg";
import featureBudget from "@/assets/feature-budget.jpg";
import featurePlaces from "@/assets/feature-places.jpg";
import "./LandingSwapper.css";

gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin);

const galleryFeatures = [
  { img: featureAi, title: "AI-Powered Decisions", desc: "Every suggestion backed by clear reasoning. Know WHY each option is the best for you.", icon: <Brain className="h-6 w-6" /> },
  { img: featureStay, title: "Smart Stay Finder", desc: "Best PG, hostel or hotel options ranked by budget, safety, and convenience.", icon: <Home className="h-6 w-6" /> },
  { img: featureFood, title: "Food & Expense Planner", desc: "Daily food costs, nearby restaurants, healthy & affordable options curated for you.", icon: <Utensils className="h-6 w-6" /> },
  { img: featureTravel, title: "Travel Route Optimizer", desc: "Best commute mode, daily cost, time savings — metro vs cab vs bus compared.", icon: <Train className="h-6 w-6" /> },
  { img: featureBudget, title: "Budget Optimization", desc: "Total cost breakdown with warnings. Never overspend again.", icon: <Wallet className="h-6 w-6" /> },
  { img: featurePlaces, title: "Places & Activities", desc: "Optimized daily itinerary with entry costs, best times, and local tips.", icon: <MapPin className="h-6 w-6" /> },
];

// Automatically pick up all .jpg images from src/assets/WhyNammaWay (if present)
const whyNammaImages = Object.entries(
  import.meta.glob("@/assets/WhyNammaWay/*.jpg", {
    eager: true,
    query: "?url",
    import: "default",
  })
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, mod]) => mod as string);



const Landing = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const galleryTrackRef = useRef<HTMLDivElement>(null);
  const featuresGridRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const getUsername = (): string | null => {
    try {
      return localStorage.getItem('userName');
    } catch (error) {
      console.warn('localStorage not available:', error);
      return null;
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('userName');
      window.location.reload();
    } catch (error) {
      console.warn('localStorage not available:', error);
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero text entrance
      gsap.from(".hero-title-word", {
        y: 100,
        opacity: 0,
        duration: 1,
        ease: "power4.out",
        stagger: 0.12,
      });
      gsap.from(".hero-subtitle", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.6,
        ease: "power3.out",
      });
      gsap.from(".hero-cta", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        delay: 0.9,
        ease: "power3.out",
      });

      // Image mask scroll transition (relocation → tourism)
      if (maskRef.current) {
        gsap.set(".mask-tourism", { clipPath: "circle(0% at 50% 50%)" });
        gsap.to(".mask-tourism", {
          clipPath: "circle(150% at 50% 50%)",
          ease: "none",
          scrollTrigger: {
            trigger: maskRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1,
            pin: true,
          },
        });
        gsap.from(".mask-text-1", {
          opacity: 0,
          y: 50,
          scrollTrigger: {
            trigger: maskRef.current,
            start: "top 80%",
            end: "top 30%",
            scrub: 1,
          },
        });
        gsap.fromTo(
          ".mask-text-2",
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            scrollTrigger: {
              trigger: maskRef.current,
              start: "40% top",
              end: "80% top",
              scrub: 1,
            },
          }
        );
      }

      // Horizontal scrolling gallery
      if (galleryTrackRef.current && galleryRef.current) {
        const totalWidth = galleryTrackRef.current.scrollWidth - window.innerWidth;
        gsap.to(galleryTrackRef.current, {
          x: -totalWidth,
          ease: "none",
          scrollTrigger: {
            trigger: galleryRef.current,
            start: "top top",
            end: () => `+=${totalWidth}`,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
          },
        });
      }

      // Features grid stagger
      if (featuresGridRef.current) {
        gsap.from(".feature-card", {
          y: 60,
          opacity: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: featuresGridRef.current,
            start: "top 80%",
          },
        });
      }

      // CTA section
      if (ctaRef.current) {
        gsap.from(ctaRef.current, {
          scale: 0.9,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 85%",
          },
        });
      }

      // Why NammaWay section subtle entrance
      gsap.from(".why-step-card", {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".why-nammaway",
          start: "top 80%",
        },
      });
      gsap.from(".why-image-card", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".why-nammaway",
          start: "top 80%",
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);



  const dockItems = [
    { icon: <Home size={18} />, label: 'Home', onClick: () => navigate('/') },
    { icon: <Compass size={18} />, label: 'Dashboard', onClick: () => navigate('/dashboard') },
    { icon: <MapPin size={18} />, label: 'Amenities', onClick: () => navigate('/amenities') },
    { icon: <Users size={18} />, label: 'Vibe Match', onClick: () => navigate('/vibe-match') },
    { icon: <Archive size={18} />, label: 'Archive', onClick: () => navigate('/archive') },
    { icon: <User size={18} />, label: 'Profile', onClick: () => navigate('/profile') },
    { icon: <Settings size={18} />, label: 'Settings', onClick: () => navigate('/settings') },
  ];

  const whySteps = [
    {
      title: "Explainable AI, not black-box guesses",
      subtitle: "Every suggestion tells you WHY.",
      points: [
        "Each decision comes with transparent reasoning tailored to your budget and lifestyle.",
        "Stay, travel, and food options ranked by comfort, safety, and convenience — not ads.",
        "Judges and users can inspect the logic behind every suggestion.",
      ],
    },
    {
      title: "Scroll that feels like a story",
      subtitle: "Smooth, cinematic transitions.",
      points: [
        "Images glide and fade as you move, matching the narrative you read.",
        "Optimized for both desktop and mobile using IntersectionObserver, not heavy scroll hacks.",
        "Inspired by scroll-driven image swappers for a portfolio-grade presentation.",
      ],
    },
    {
      title: "Your budget is the hero",
      subtitle: "Never lose money to bad decisions.",
      points: [
        "Daily cost breakdowns with warnings before you overspend.",
        "Route comparisons — metro vs cab vs bus — with clear savings.",
        "Smart alternatives that can save hundreds per day without feeling cheap.",
      ],
    },
    {
      title: "Local intelligence, not generic guides",
      subtitle: "Real Indian city context.",
      points: [
        "Area safety and liveability influence every stay recommendation.",
        "Day-by-day itineraries tuned for Indian traffic, weather, and culture.",
        "From relocation to weekend trips — the same AI understands your intent.",
      ],
    },
    {
      title: "Cultural journeys that feel personal",
      subtitle: "Temples, monuments and experiences that match your vibe.",
      points: [
        "Discover places that align with your faith, interests and travel style.",
        "Balance must‑visit icons with quieter, meaningful spaces locals love.",
        "Plan days that feel like a story, not a checklist.",
      ],
    },
    {
      title: "From first step to feeling at home",
      subtitle: "Relocation support beyond just where to stay.",
      points: [
        "Neighbourhood guidance for food, commute, safety and social life.",
        "Micro‑recommendations — from chai spots to late‑night pharmacies.",
        "NammaWay grows with you as your routine and comfort change.",
      ],
    },
  ] as const;

  const imageTrackSources =
    whyNammaImages.length > 0
      ? whyNammaImages.slice(0, whySteps.length)
      : [featureAi, featureStay, featureFood, featureTravel, featureBudget, featurePlaces];

  return (
    <ClickSpark
      sparkColor="#4F9CF9"
      sparkSize={12}
      sparkRadius={20}
      sparkCount={8}
      duration={500}
    >
      <div ref={containerRef} className="bg-background overflow-x-hidden">

        {/* ===== HERO ===== */}
        <section ref={heroRef} className="min-h-screen flex items-center justify-center relative">
          <div className="absolute inset-0 bg-white" />
          {/* DotGrid Animation */}
          <DotGrid
            dotSize={5}
            gap={30}
            baseColor="#4F9CF9"
            activeColor="#8B5CF6"
            proximity={120}
            shockRadius={300}
            shockStrength={8}
            resistance={600}
            returnDuration={2}
          />
          <div className="relative z-10 container max-w-5xl mx-auto px-4 text-center py-20">
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-5 py-2 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" /> AI-Powered City Companion
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold font-display text-secondary-foreground mb-6 leading-[0.95] flex flex-col items-center">
              <div className="flex items-center gap-3">
                <BlurText
                  text="Your"
                  delay={100}
                  animateBy="words"
                  direction="top"
                  className="text-black"
                />
                <span className="hero-title-word inline-block text-gradient">Smart</span>
                <BlurText
                  text="Guide"
                  delay={100}
                  animateBy="words"
                  direction="top"
                  className="text-black"
                />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <BlurText
                  text="to Any"
                  delay={100}
                  animateBy="words"
                  direction="top"
                  className="text-black"
                />
                <span className="hero-title-word inline-block text-gradient">Indian City</span>
              </div>
            </h1>

            <GradientText
              colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
              animationSpeed={8}
              showBorder={false}
              className="hero-subtitle text-lg md:text-xl max-w-2xl mx-auto mb-10"
            >
              Stop searching. Start deciding. AI that plans your stay, food, travel & budget — with clear reasoning for every choice.
            </GradientText>
            <div className="hero-cta flex flex-wrap items-center justify-center gap-4 mb-16">
              {getUsername() ? (
                <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-500">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#7494ec] to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg border-2 border-white">
                    {getUsername()?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-xl font-display font-medium text-black">
                    Welcome, <span className="text-gradient font-bold">{getUsername()}</span>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <HeroButton size="xl" onClick={() => navigate("/plan")}>
                      Continue Planning →
                    </HeroButton>
                    <HeroButton variant="ghost" size="xl" onClick={handleLogout}>
                      Logout
                    </HeroButton>
                  </div>
                </div>
              ) : (
                <>
                  <HeroButton size="xl" onClick={() => navigate("/login")}>
                    🚀 Plan Your City Now
                  </HeroButton>
                  <HeroButton variant="ghost" size="xl" onClick={() => {
                    maskRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}>
                    See How It Works ↓
                  </HeroButton>
                </>
              )}
            </div>
            <div
              className="relative flex flex-col items-center justify-center min-h-[200px] rounded-2xl p-8 border-2 border-dashed border-primary/25 bg-white/30 backdrop-blur-sm transition-colors hover:bg-white/50 hover:border-primary/35"
            >
              <div className="text-center max-w-2xl mx-auto">
                <p className="text-2xl md:text-3xl font-display text-foreground leading-relaxed tracking-wide">
                  We simplify your relocation journey with AI-driven insights, helping you find the perfect city, home, and lifestyle that fits your budget and personality.
                </p>
              </div>
            </div>
          </div>

        </section>

        {/* ===== IMAGE MASK SCROLL (Relocation → Tourism) ===== */}
        <section ref={maskRef} className="relative h-screen w-full overflow-hidden">
          {/* Base image: Relocation */}
          <div className="absolute inset-0">
            <img src={relocationImg} alt="Relocation" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-secondary/60" />
          </div>
          {/* Tourism image that reveals via clip-path */}
          <div className="mask-tourism absolute inset-0">
            <img src={tourismImg} alt="Tourism" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-primary/30" />
          </div>
          {/* Overlay text */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center px-4">
              <h2 className="mask-text-1 text-4xl md:text-6xl font-bold font-display text-primary-foreground mb-4">
                Relocating or Touring?
              </h2>
              <p className="mask-text-2 text-xl md:text-2xl text-primary-foreground/80 max-w-xl mx-auto">
                One AI. Both covered. Scroll to explore features →
              </p>
            </div>
          </div>
        </section>

        {/* ===== HORIZONTAL SCROLLING GALLERY ===== */}
        <section ref={galleryRef} className="relative overflow-hidden">
          <div
            ref={galleryTrackRef}
            className="flex items-stretch gap-0 will-change-transform"
            style={{ width: "fit-content" }}
          >
            {/* Intro panel */}
            <div className="flex-shrink-0 w-screen h-screen flex items-center justify-center bg-secondary px-8">
              <div className="max-w-lg text-center">
                <h2 className="text-4xl md:text-6xl font-bold font-display text-secondary-foreground mb-4">
                  Everything You <span className="text-gradient">Need</span>
                </h2>
                <p className="text-lg text-secondary-foreground/60">
                  Scroll horizontally to explore all the features that make NammaWay your ultimate city companion.
                </p>
              </div>
            </div>
            {/* Feature panels */}
            {galleryFeatures.map((f, i) => (
              <div key={i} className="flex-shrink-0 w-screen h-screen flex items-center">
                <div className="w-full h-full flex flex-col md:flex-row">
                  {/* Image half */}
                  <div className="w-full md:w-1/2 h-1/2 md:h-full relative overflow-hidden">
                    <img src={f.img} alt={f.title} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-secondary/80 hidden md:block" />
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent md:hidden" />
                  </div>
                  {/* Text half */}
                  <div className="w-full md:w-1/2 h-1/2 md:h-full flex items-center justify-center bg-secondary p-8 md:p-16">
                    <div className="max-w-md">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-xl bg-hero-gradient flex items-center justify-center text-primary-foreground">
                          {f.icon}
                        </div>
                        <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                          Feature {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <h3 className="text-3xl md:text-4xl font-bold font-display text-secondary-foreground mb-4">
                        {f.title}
                      </h3>
                      <p className="text-lg text-secondary-foreground/60 leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== WHY NAMMAWAY - NEW SCROLL REVEAL + IMAGE TRACK ===== */}
        <section className="why-nammaway py-24 bg-white">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-4">
                Why <span className="text-gradient">NammaWay</span>?
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Not just options. Decisions. With reasoning.
              </p>
              <p className="text-sm text-blue-600 mt-2">
                Now covering 15+ Coimbatore neighborhoods with AI-powered vibe matching!
              </p>
            </div>

            <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-10 lg:gap-16 items-start">
              {/* Text column */}
              <div className="space-y-12 md:space-y-14">
                {whySteps.map((block, index) => (
                  <div
                    key={index}
                    className="why-step-card rounded-2xl border bg-card/60 backdrop-blur-sm p-5 md:p-6 lg:p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/50"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-primary/80 mb-1">
                          Step {String(index + 1).padStart(2, "0")}
                        </p>
                        <h3 className="text-lg md:text-xl font-display font-semibold text-foreground">
                          {block.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground mb-4">
                      {block.subtitle}
                    </p>
                    <ul className="space-y-2.5 text-sm text-muted-foreground">
                      {block.points.map((point, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-primary/70" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Image grid column */}
              <div className="grid grid-cols-2 gap-4 md:gap-5 lg:gap-6">
                {imageTrackSources.map((img, index) => (
                  <div
                    key={index}
                    className="why-image-card relative aspect-[4/3] rounded-3xl overflow-hidden bg-muted shadow-md border border-border/70 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:border-primary/60"
                  >
                    <img
                      src={img}
                      alt={`Why NammaWay image ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-110"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary-foreground/80 mb-1">
                        Capture {String(index + 1).padStart(2, "0")}
                      </p>
                      <p className="text-xs md:text-sm font-medium text-white line-clamp-2">
                        {whySteps[index]?.title ?? "City moments that define your story."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="py-24 bg-secondary">
          <div ref={ctaRef} className="container max-w-3xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-5 py-2 text-sm font-semibold text-primary mb-6">
              <Sparkles className="h-4 w-4" /> Ready to decide smarter?
            </div>
            <h2 className="text-4xl md:text-6xl font-bold font-display text-secondary-foreground mb-6">
              Plan Your City.<br />
              <span className="text-gradient">In 5 Minutes.</span>
            </h2>
            <p className="text-lg text-secondary-foreground/60 mb-10 max-w-xl mx-auto">
              Enter your budget, purpose, and preferences. Our AI handles the rest — with full reasoning for every suggestion.
            </p>
            <HeroButton size="xl" onClick={() => navigate("/plan")}>
              🚀 Start Planning Now <ArrowRight className="h-5 w-5" />
            </HeroButton>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="py-12 bg-gradient-to-br from-blue-600 to-purple-600">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="flex flex-col items-center text-center text-white">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Compass className="h-6 w-6 text-white" />
                </div>
                <span className="font-display text-2xl font-bold">NammaWay</span>
              </div>
              <p className="text-white/80 text-sm">
                Built for hackathon — AI Personal Decision Engine for Indian Cities
              </p>
            </div>
          </div>
        </footer>

        {/* ===== DOCK ===== */}
        <Dock
          items={dockItems}
          panelHeight={68}
          baseItemSize={50}
          magnification={70}
        />
      </div >
    </ClickSpark >
  );
};

export default Landing;
