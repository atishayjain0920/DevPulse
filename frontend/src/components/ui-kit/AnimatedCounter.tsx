import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

/** Tweens a numeric value on mount / when `value` changes. SSR-safe. */
export function AnimatedCounter({
  value,
  duration = 0.9,
  format = (n) => n.toLocaleString(),
  className,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(latest),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return <span className={className}>{format(Math.round(display))}</span>;
}
