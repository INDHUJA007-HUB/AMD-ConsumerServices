
import { forwardRef, useMemo, useRef, useEffect, useState, FunctionComponent } from 'react';
import { motion } from 'framer-motion';

// FontVariationSettings type to define the shape of settings
type FontVariationSettings = {
    [key: string]: number;
};

// Props interface for VariableProximity
interface VariableProximityProps {
    label: string;
    fromFontVariationSettings: string;
    toFontVariationSettings: string;
    containerRef: React.RefObject<HTMLElement>;
    radius?: number;
    falloff?: 'linear' | 'exponential' | 'gaussian';
    className?: string; // Added className prop
    onClick?: () => void; // Added onClick prop
    style?: React.CSSProperties; // Added style prop
}

const VariableProximity: FunctionComponent<VariableProximityProps> = (props) => {
    const {
        label,
        fromFontVariationSettings,
        toFontVariationSettings,
        containerRef,
        radius = 50,
        falloff = 'linear',
        className = '',
        onClick,
        style,
    } = props;

    const [letterSettings, setLetterSettings] = useState<FontVariationSettings[]>([]);
    const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

    // Parse font variation settings string into an object
    const parseSettings = (settingsStr: string): FontVariationSettings => {
        return settingsStr
            .split(',')
            .reduce((acc, setting) => {
                const [key, value] = setting.trim().split(' ');
                if (key && value) {
                    acc[key.replace(/['"]/g, '')] = parseFloat(value);
                }
                return acc;
            }, {} as FontVariationSettings);
    };

    const fromSettings = useMemo(
        () => parseSettings(fromFontVariationSettings),
        [fromFontVariationSettings]
    );
    const toSettings = useMemo(
        () => parseSettings(toFontVariationSettings),
        [toFontVariationSettings]
    );

    // Calculate the distance between the cursor and the center of the letter
    const calculateDistance = (
        x: number,
        y: number,
        span: HTMLSpanElement
    ): number => {
        const rect = span.getBoundingClientRect();
        const letterCenterX = rect.left + rect.width / 2;
        const letterCenterY = rect.top + rect.height / 2;
        return Math.sqrt(
            Math.pow(x - letterCenterX, 2) + Math.pow(y - letterCenterY, 2)
        );
    };

    // Calculate the interpolated value based on the distance
    const calculateInterpolatedValue = (
        start: number,
        end: number,
        distance: number
    ): number => {
        if (distance > radius) return start;

        const t = 1 - distance / radius;
        const easedT =
            falloff === 'linear'
                ? t
                : falloff === 'exponential'
                    ? Math.pow(t, 2)
                    : Math.exp(-Math.pow(distance / (radius / 2), 2)); // gaussian

        return start + (end - start) * easedT;
    };

    useEffect(() => {
        // Initialize listener
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();

            // Check if cursor is within the container
            if (
                e.clientX < containerRect.left ||
                e.clientX > containerRect.right ||
                e.clientY < containerRect.top ||
                e.clientY > containerRect.bottom
            ) {
                // Return to default settings if outside container
                setLetterSettings(
                    label.split('').map(() => fromSettings)
                );
                return;
            }

            const newSettings = label.split('').map((_, index) => {
                const span = letterRefs.current[index];
                if (!span) return fromSettings;

                const distance = calculateDistance(e.clientX, e.clientY, span);
                const settings: FontVariationSettings = {};

                for (const axis in fromSettings) {
                    settings[axis] = calculateInterpolatedValue(
                        fromSettings[axis],
                        toSettings[axis],
                        distance
                    );
                }
                return settings;
            });

            setLetterSettings(newSettings);
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Initial setup
        setLetterSettings(label.split('').map(() => fromSettings));

        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [
        label,
        fromSettings,
        toSettings,
        containerRef,
        radius,
        falloff,
    ]);

    return (
        <motion.span
            className={`${className} inline-block`}
            onClick={onClick}
            style={style}
        >
            {label.split('').map((char, index) => {
                const settings = letterSettings[index];
                const fontVariationSettings = settings
                    ? Object.entries(settings)
                        .map(([axis, value]) => `'${axis}' ${value}`)
                        .join(', ')
                    : '';

                return (
                    <motion.span
                        key={index}
                        ref={(el) => { letterRefs.current[index] = el; }}
                        style={{
                            fontVariationSettings,
                            display: 'inline-block',
                            transition: 'font-variation-settings 0.1s ease', // Smooth transition
                        }}
                    >
                        {char === ' ' ? '\u00A0' : char}
                    </motion.span>
                );
            })}
        </motion.span>
    );
};

export default VariableProximity;
