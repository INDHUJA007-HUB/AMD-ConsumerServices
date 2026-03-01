import { motion } from 'framer-motion';
import './GradientText.css';

interface GradientTextProps {
  children: React.ReactNode;
  colors: string[];
  animationSpeed?: number;
  showBorder?: boolean;
  className?: string;
}

export default function GradientText({
  children,
  colors,
  animationSpeed = 8,
  showBorder = false,
  className = ""
}: GradientTextProps) {
  // Validate colors array - default to purple-pink gradient if invalid
  const validatedColors = colors.length >= 2 ? colors : ["#5227FF", "#FF9FFC"];
  
  // Validate animationSpeed - default to 8 if invalid
  const validatedSpeed = animationSpeed > 0 ? animationSpeed : 8;
  
  // Create gradient string from colors
  const gradientString = `linear-gradient(90deg, ${validatedColors.join(', ')})`;
  
  return (
    <motion.span
      className={`gradient-text ${showBorder ? 'gradient-text-border' : ''} ${className}`}
      style={{
        backgroundImage: gradientString,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        backgroundSize: '200% auto',
        animation: `gradient-shift ${validatedSpeed}s ease infinite`
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.span>
  );
}
