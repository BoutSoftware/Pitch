"use client";

import React, { useRef, useState, useEffect, ReactNode, ElementType, ComponentPropsWithoutRef } from 'react';

interface FadeInDivProps<T extends ElementType = 'div'> {
  as?: T;
  children: ReactNode;
  delay?: number; // milliseconds
  duration?: number; // milliseconds
  className?: string;
  style?: React.CSSProperties;
}

function FadeInDiv<T extends ElementType = 'div'>({ as, children, delay = 0, duration = 600, className = '', style, ...rest }: FadeInDivProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof FadeInDivProps>) {
  const Component = as || 'div';
  const ref = useRef<null | HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let timeoutId: NodeJS.Timeout;

    // Use a lower threshold so the element starts fading in earlier,
    // which helps avoid layout shifts and scrollbars appearing.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timeoutId = setTimeout(() => setIsVisible(true), delay + 100); // Adding a small buffer to ensure visibility
          observer.disconnect();
        }
      },
      { threshold: 0.1 } // Lower threshold for earlier trigger
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [delay]);

  return (
    <Component
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
}

export default FadeInDiv;