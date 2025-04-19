"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimation, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedBeamProps {
  className?: string;
  containerRef: React.RefObject<HTMLDivElement>;
  fromRef: React.RefObject<HTMLDivElement>;
  toRef: React.RefObject<HTMLDivElement>;
  curvature?: number;
  reverse?: boolean;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  delay?: number;
  duration?: number;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
}

export function AnimatedBeam({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  pathColor = "gray",
  pathWidth = 2,
  pathOpacity = 0.2,
  gradientStartColor = "#ffaa40",
  gradientStopColor = "#9c40ff",
  delay = 0,
  duration = 2,
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}: AnimatedBeamProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const progress = useMotionValue(delay ? 0 : -1);
  const controls = useAnimation();

  useEffect(() => {
    const updatePath = () => {
      const container = containerRef.current;
      const from = fromRef.current;
      const to = toRef.current;
      const path = pathRef.current;

      if (!container || !from || !to || !path) return;

      const containerRect = container.getBoundingClientRect();
      const fromRect = from.getBoundingClientRect();
      const toRect = to.getBoundingClientRect();

      const startX = fromRect.left - containerRect.left + fromRect.width / 2 + startXOffset;
      const startY = fromRect.top - containerRect.top + fromRect.height / 2 + startYOffset;
      const endX = toRect.left - containerRect.left + toRect.width / 2 + endXOffset;
      const endY = toRect.top - containerRect.top + toRect.height / 2 + endYOffset;

      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      const cp1x = midX + curvature;
      const cp1y = startY;
      const cp2x = midX - curvature;
      const cp2y = endY;

      const pathData = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

      path.setAttribute("d", pathData);
    };

    updatePath();
    window.addEventListener("resize", updatePath);
    return () => window.removeEventListener("resize", updatePath);
  }, [containerRef, fromRef, toRef, curvature, startXOffset, startYOffset, endXOffset, endYOffset]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const startAnimation = async () => {
      await controls.start({
        strokeDasharray: ["0, 1000", "1000, 0"],
        transition: {
          duration,
          repeat: Infinity,
          ease: "linear",
          delay,
        },
      });
    };

    if (delay) {
      timeout = setTimeout(startAnimation, delay * 1000);
    } else {
      startAnimation();
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [controls, delay, duration]);

  return (
    <svg
      className={cn(
        "pointer-events-none absolute left-0 top-0 h-full w-full",
        className,
      )}
      style={{
        opacity: pathOpacity,
      }}
    >
      <path
        ref={pathRef}
        d=""
        fill="none"
        stroke={pathColor}
        strokeWidth={pathWidth}
      />
      <motion.path
        ref={pathRef}
        d=""
        fill="none"
        stroke={`url(#gradient-${gradientStartColor}-${gradientStopColor})`}
        strokeWidth={pathWidth}
        strokeDasharray="0, 1000"
        animate={controls}
      />
      <defs>
        <motion.linearGradient
          id={`gradient-${gradientStartColor}-${gradientStopColor}`}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={gradientStartColor} />
          <stop offset="1" stopColor={gradientStopColor} />
        </motion.linearGradient>
      </defs>
    </svg>
  );
}
