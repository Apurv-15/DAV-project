import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Hook that triggers a crisp GSAP staggered entrance animation for `.gsap-reveal` elements
 * inside the container whenever dependencies change.
 */
export function useGsapPageReveal(
  containerRef: React.RefObject<HTMLElement | null>,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const targets = el.querySelectorAll('.gsap-reveal');
      if (targets.length > 0) {
        gsap.fromTo(
          targets,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.65,
            stagger: 0.055,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
          }
        );
      }
    }, el);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * GSAP Magnetic Wrapper / Button that subtly attracts to the user's cursor on hover
 * and springs back with elastic physics on mouse leave.
 */
interface MagneticButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  strength?: number;
  children: React.ReactNode;
}

export const MagneticButton = React.forwardRef<
  HTMLButtonElement,
  MagneticButtonProps
>(({ strength = 0.28, children, onMouseMove, onMouseLeave, ...rest }, externalRef) => {
  const internalRef = useRef<HTMLButtonElement | null>(null);

  const setRefs = (node: HTMLButtonElement | null) => {
    internalRef.current = node;
    if (typeof externalRef === 'function') {
      externalRef(node);
    } else if (externalRef) {
      (externalRef as React.MutableRefObject<HTMLButtonElement | null>).current =
        node;
    }
  };

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const node = internalRef.current;
    if (node) {
      const rect = node.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      gsap.to(node, {
        x: relX * strength,
        y: relY * strength,
        duration: 0.25,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
    onMouseMove?.(e);
  };

  const handleLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const node = internalRef.current;
    if (node) {
      gsap.to(node, {
        x: 0,
        y: 0,
        duration: 0.65,
        ease: 'elastic.out(1, 0.35)',
        overwrite: 'auto',
      });
    }
    onMouseLeave?.(e);
  };

  return (
    <button
      ref={setRefs}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      {...rest}
    >
      {children}
    </button>
  );
});
MagneticButton.displayName = 'MagneticButton';

/**
 * GSAP Animated Number Counter for tabular KPIs and metrics.
 */
interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 0.85,
  className = '',
}) => {
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const prevValueRef = useRef<number>(0);

  useEffect(() => {
    const node = spanRef.current;
    if (!node) return;

    const proxy = { val: prevValueRef.current };
    const tween = gsap.to(proxy, {
      val: value,
      duration,
      ease: 'power3.out',
      onUpdate: () => {
        if (!spanRef.current) return;
        const formatted =
          decimals > 0
            ? proxy.val.toFixed(decimals)
            : Math.round(proxy.val).toLocaleString();
        spanRef.current.textContent = `${prefix}${formatted}${suffix}`;
      },
    });

    prevValueRef.current = value;
    return () => {
      tween.kill();
    };
  }, [value, decimals, prefix, suffix, duration]);

  const initialFormatted =
    decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();

  return (
    <span ref={spanRef} className={className}>
      {prefix}
      {initialFormatted}
      {suffix}
    </span>
  );
};
