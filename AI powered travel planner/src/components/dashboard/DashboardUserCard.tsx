import { useRef, useEffect } from "react";
import gsap from "gsap";
import { User, Sparkles, MapPin, Calendar, Briefcase } from "lucide-react";

const DashboardUserCard = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  const userName = typeof window !== "undefined" ? localStorage.getItem("userName") || "Guest" : "Guest";
  const workplace = typeof window !== "undefined" ? localStorage.getItem("workplace") || null : null;

  useEffect(() => {
    if (!cardRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(avatarRef.current, {
        scale: 0,
        rotation: -180,
        duration: 0.8,
        ease: "back.out(1.4)",
      });
      gsap.from(nameRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.6,
        delay: 0.2,
        ease: "power3.out",
      });
      gsap.from(badgeRef.current, {
        x: -20,
        opacity: 0,
        duration: 0.5,
        delay: 0.35,
        ease: "power2.out",
      });
      gsap.from(infoRef.current?.children || [], {
        y: 15,
        opacity: 0,
        duration: 0.4,
        stagger: 0.08,
        delay: 0.5,
        ease: "power2.out",
      });
    }, cardRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={cardRef}
      className="dashboard-user-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-blue-50/80 to-purple-50/80 border border-blue-100/80 shadow-lg shadow-blue-100/30 p-6"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div
          ref={avatarRef}
          className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-white/50"
        >
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-center sm:text-left min-w-0">
          <div ref={badgeRef} className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Your dashboard
          </div>
          <p ref={nameRef} className="text-2xl font-bold font-display bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
            Hello, {userName}
          </p>
          <div ref={infoRef} className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-blue-500" />
              Profile active
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-purple-500" />
              Plan your city
            </span>
            {workplace && (
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-indigo-500" />
                {workplace}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-500" />
              Smart insights
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardUserCard;
