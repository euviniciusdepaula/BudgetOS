"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  format: (value: number) => string;
  duration?: number;
}

/** Contador animado — interpola suavemente até o valor atual. */
export function AnimatedNumber({
  value,
  format,
  duration = 0.7,
}: AnimatedNumberProps) {
  const previous = useRef(0);
  const [display, setDisplay] = useState(() => format(0));

  useEffect(() => {
    const controls = animate(previous.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(format(v)),
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, duration, format]);

  return <span className="tabular-nums">{display}</span>;
}
