import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface BlindsRevealProps {
    children: React.ReactNode;
    blindsCount?: number;
}

const BlindsReveal = ({ children, blindsCount = 50 }: BlindsRevealProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const blindsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !blindsRef.current) return;

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    scrub: 0.5,
                    pin: true,
                    start: 'top top',
                    end: '+=150%',
                },
            });

            tl.to('.blind-box', {
                force3D: true,
                duration: 1,
                xPercent: 100,
                ease: 'power1.inOut',
                stagger: { amount: 1 },
            })
                .to('.blind-box', { ease: 'power1.out', duration: 1, rotation: '45deg' }, 0)
                .to('.blind-box', { ease: 'power1.in', duration: 1, rotation: '0deg' }, 1);
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="relative w-full h-screen overflow-hidden">
            {/* Blinds overlay */}
            <div ref={blindsRef} className="absolute inset-0 z-10 pointer-events-none">
                {Array.from({ length: blindsCount }).map((_, i) => (
                    <div
                        key={i}
                        className="blind-box absolute left-0 bg-gradient-to-r from-blue-600 to-purple-600"
                        style={{
                            height: `${100 / blindsCount}vh`,
                            width: '50vw',
                            top: `${(i * 100) / blindsCount}vh`,
                            marginBottom: '-0.2vh',
                        }}
                    />
                ))}
            </div>

            {/* Content */}
            <div className="relative z-0 h-full">{children}</div>
        </div>
    );
};

export default BlindsReveal;
