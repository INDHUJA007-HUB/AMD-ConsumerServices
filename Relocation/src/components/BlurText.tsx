import { useRef, useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

const BlurText = ({
    text = '',
    delay = 200,
    className = '',
    animateBy = 'words',
    direction = 'top',
    threshold = 0.1,
    rootMargin = '0px',
    animationFrom,
    animationTo,
    easing = "easeOut",
    onAnimationComplete,
}: {
    text?: string;
    delay?: number;
    className?: string;
    animateBy?: 'words' | 'letters';
    direction?: 'top' | 'bottom';
    threshold?: number;
    rootMargin?: string;
    animationFrom?: any;
    animationTo?: any;
    easing?: any;
    onAnimationComplete?: () => void;
}) => {
    const elements = animateBy === 'words' ? text.split(' ') : text.split('');
    const [inView, setInView] = useState(false);
    const ref = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.unobserve(ref.current!);
                }
            },
            { threshold, rootMargin }
        );
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [threshold, rootMargin]);

    const defaultFrom = useMemo(
        () =>
            direction === 'top'
                ? { filter: 'blur(10px)', opacity: 0, y: -50 }
                : { filter: 'blur(10px)', opacity: 0, y: 50 },
        [direction]
    );

    const defaultTo = useMemo(
        () => ({
            filter: 'blur(0px)',
            opacity: 1,
            y: 0,
        }),
        []
    );

    const initial = animationFrom || defaultFrom;
    const animate = inView ? (animationTo || defaultTo) : initial;

    return (
        <p ref={ref} className={`flex flex-wrap ${className}`}>
            {elements.map((segment, index) => (
                <motion.span
                    key={index}
                    initial={initial}
                    animate={animate}
                    transition={{
                        duration: 0.5, // Fixed duration per word for smoothness
                        delay: (index * delay) / 1000,
                        ease: easing,
                    }}
                    className="inline-block mr-2 last:mr-0 will-change-[transform,filter,opacity]"
                    onAnimationComplete={
                        index === elements.length - 1 ? onAnimationComplete : undefined
                    }
                >
                    {segment === ' ' ? '\u00A0' : segment}
                </motion.span>
            ))}
        </p>
    );
};

export default BlurText;
