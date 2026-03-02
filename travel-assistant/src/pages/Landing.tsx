import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { Brain, Wallet, MapPin, Compass, Home, Utensils, Train, Calendar, ArrowRight, Sparkles, Shield, TrendingDown, Archive, User, Settings } from "lucide-react";
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
import featureFood from "@/assets/feature-voice.png";
import featureTravel from "@/assets/feature-visual.png";
import featureBudget from "@/assets/feature-itinerary.png";
import featurePlaces from "@/assets/feature-places.jpg";
import "./LandingSwapper.css";

gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin);

const galleryFeatures = [
  { img: featureAi, title: "Hyper-Local Smart Navigator", desc: "A cost-conscious routing engine that compares buses, autos, and cabs to find the cheapest and most time-efficient path for your specific budget", icon: <MapPin className="h-6 w-6" /> },
  { img: featureStay, title: "Real-Time Safety & Vibe Monitor", desc: "A geospatial alert system that uses live location and time-of-day data to score area safety and recommend secure transport in quiet zones", icon: <Shield className="h-6 w-6" /> },
  { img: featureFood, title: "Voice-First Conversational Guide (NLP)", desc: "A hands-free guide that uses natural language to answer complex queries about local prices, directions, and budget-friendly food on the go", icon: <Brain className="h-6 w-6" /> },
  { img: featureTravel, title: "Visual Linguist (Computer Vision)", desc: "An image-recognition tool that instantly translates Tamil signs or menus and provides cultural context and pricing advice via your camera", icon: <Compass className="h-6 w-6" /> },
  { img: featureBudget, title: "Dynamic Itinerary Re-Optimizer", desc: "An adaptive planner that recalculates your daily schedule in real-time based on traffic delays, weather changes, or unexpected spending", icon: <TrendingDown className="h-6 w-6" /> },
];

// Automatically pick up all .jpg images from src/assets/WhyNammaWay (if present)
let imageTrackSources = Object.entries(
  import.meta.glob("@/assets/WhyNammaWay/*.jpg", {
    eager: true,
    query: "?url",
    import: "default",
  })
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, mod]) => mod as string);

if (imageTrackSources.length >= 2) {
  imageTrackSources[1] = "https://th.bing.com/th/id/OIP.XgnBd3jECQz-5FNLERN6xgHaEJ?w=311&h=180&c=7&r=0&o=7&dpr=1.6&pid=1.7&rm=3";
}



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
      gsap.from(".hero-stat", {
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        delay: 1.1,
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

      // Why NammaWay animations removed from GSAP to use native Intersection Observer
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Native Intersection Observer for Why NammaWay fade-in
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('opacity-0', 'translate-y-10');
            entry.target.classList.add('opacity-100', 'translate-y-0');
            // Stop observing once animated if you only want it to happen once
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach((el) => observer.observe(el));

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const handleArchiveClick = () => {
    navigate('/archive');
  };

  const dockItems = [
    {
      icon: <Home size={18} />,
      label: 'Home',
      onClick: () => {
        console.log('Home clicked');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (window.location.pathname !== '/') {
          navigate('/');
        }
      }
    },
    { icon: <Compass size={18} />, label: 'Dashboard', onClick: () => { console.log('Dashboard clicked'); navigate('/dashboard'); } },
    { icon: <User size={18} />, label: 'Profile', onClick: () => { console.log('Profile clicked'); navigate('/profile'); } },
    { icon: <Settings size={18} />, label: 'Settings', onClick: () => { console.log('Settings clicked'); navigate('/settings'); } },
  ];

  const whySteps = [
    {
      title: "From Search to Strategy",
      subtitle: "Every suggestion tells you WHY.",
      points: [
        "While other apps give you a \"list\" of 100 options, NammaWay uses Decision Intelligence to pick the Top 1 based on your specific budget, work location, and lifestyle",
      ],
    },
    {
      title: "Financial Certainty",
      subtitle: "Smooth, cinematic transitions.",
      points: [
        "It is the only platform that provides a \"Total Survival Budget,\" predicting hidden costs like electricity slabs, commute fares, and local food prices so you never have a mid-month financial crisis.",
      ],
    },
    {
      title: "The \"Guardian\" Factor",
      subtitle: "Never lose money to bad decisions.",
      points: [
        "Beyond navigation, it offers Active Safety Monitoring by analyzing street \"vibes\" and lighting in real-time, ensuring you aren't just taking the fastest route, but the safest one for a newcomer.",
      ],
    },
  ] as const;

  const imageTrackSources = [
    "https://tse2.mm.bing.net/th/id/OIP.MJWukQPop2YDlMQnFlU_2AHaE7?rs=1&pid=ImgDetMain&o=7&rm=3",
    "https://tse2.mm.bing.net/th/id/OIP.ybmdntnrSGEU4g8mxHPIKAHaE8?rs=1&pid=ImgDetMain&o=7&rm=3",
    "https://tse4.mm.bing.net/th/id/OIP.exh919hJfjRd_nU7-PTHdAAAAA?rs=1&pid=ImgDetMain&o=7&rm=3"
  ];

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
                  text="Plan your"
                  delay={100}
                  animateBy="words"
                  direction="top"
                  className="text-black"
                />
                <span className="hero-title-word inline-block text-gradient">travel</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <BlurText
                  text="to any"
                  delay={100}
                  animateBy="words"
                  direction="top"
                  className="text-black"
                />
                <span className="hero-title-word inline-block text-gradient">city</span>
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
                <HeroButton variant="ghost" size="xl" onClick={() => {
                  maskRef.current?.scrollIntoView({ behavior: "smooth" });
                }}>
                  See How It Works ↓
                </HeroButton>
              )}
            </div>
            <div
              className="relative flex flex-col items-center justify-center min-h-[200px] rounded-2xl p-8 border-2 border-dashed border-primary/25 bg-white/30 backdrop-blur-sm transition-colors hover:bg-white/50 hover:border-primary/35"
            >
              <div className="text-center max-w-2xl mx-auto">
                <p className="text-2xl md:text-3xl font-display text-foreground leading-relaxed tracking-wide">
                  We simplify your travel experience with AI-driven insights, helping you discover the perfect stay, local transit, and hidden gems that fit your budget and travel style
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
                  Scroll horizontally to explore all the features that make NammaWay your ultimate travel companion.
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
            </div>

            <div className="flex flex-col space-y-12 md:space-y-14">
              {whySteps.map((block, index) => (
                <div key={index} className="grid md:grid-cols-2 gap-6 items-stretch">
                  {/* Text Box */}
                  <div className="why-step-card animate-on-scroll opacity-0 translate-y-10 rounded-2xl border bg-card/60 backdrop-blur-sm p-5 md:p-6 lg:p-7 transition-all duration-700 hover:-translate-y-1 hover:shadow-xl hover:border-primary/50 flex flex-col justify-center h-full">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
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

                  {/* Corresponding Image Box */}
                  <div className="why-image-card animate-on-scroll opacity-0 translate-y-10 relative rounded-3xl overflow-hidden bg-muted shadow-md border border-border/70 transition-all duration-700 hover:-translate-y-1 hover:shadow-2xl hover:border-primary/60 h-full w-full">
                    <img
                      src={imageTrackSources[index % imageTrackSources.length]}
                      alt={`Why NammaWay - ${block.title}`}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-110"
                    />
                    <div className={`pointer-events-none absolute inset-0 ${index === 2 ? 'bg-black/40' : 'bg-gradient-to-t from-black/60 via-black/10 to-transparent'}`} />
                    <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 z-10">
                      <p className="text-xs md:text-sm font-medium text-white line-clamp-2">
                        {block.title}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
