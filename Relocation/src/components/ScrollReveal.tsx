import React, { useEffect, useRef, useState } from "react";
import "./ScrollReveal.css";

type ScrollRevealProps = {
  text: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
};

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  text,
  as = "p",
  className = "",
}) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.35,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const words = text.split(" ");
  const Tag = as as any;

  return (
    <Tag
      ref={containerRef as React.RefObject<any>}
      className={`scroll-reveal ${isVisible ? "scroll-reveal--visible" : ""} ${className}`}
    >
      {words.map((word, index) => (
        <span
          key={index}
          className="scroll-reveal__word"
          style={{ ["--delay" as string]: `${index * 40}ms` }}
        >
          {word}
          {index !== words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
};

export default ScrollReveal;
