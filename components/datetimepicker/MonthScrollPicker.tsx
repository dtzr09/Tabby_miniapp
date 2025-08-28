import { Box } from "@mui/material";
import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../src/contexts/ThemeContext";
import { MONTH_YEAR_ITEM_HEIGHT, SPACER_ITEMS } from "./TimeScrollPicker";
import { smallHaptic } from "../../utils/haptics";

const MonthScrollPicker = ({
  value,
  onChange,
}: {
  value: number; // 0-11 for months
  onChange: (value: number) => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCenterValueRef = useRef<number | null>(null);
  const { colors } = useTheme();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    const setScrollPosition = () => {
      if (scrollRef.current && !isScrollingRef.current) {
        const containerHeight = scrollRef.current.clientHeight;
        const centerOffset = containerHeight / 2;
        // Position selected item exactly in center
        const targetScroll =
          (SPACER_ITEMS + value) * MONTH_YEAR_ITEM_HEIGHT -
          centerOffset +
          MONTH_YEAR_ITEM_HEIGHT / 2;
        scrollRef.current.scrollTop = Math.max(0, targetScroll);
      }
    };

    if (!isScrollingRef.current) {
      setScrollPosition();
      const timer = setTimeout(setScrollPosition, 100);
      return () => clearTimeout(timer);
    }
  }, [value]);

  const snapToNearestItem = (immediate = false) => {
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop;
      const containerHeight = scrollRef.current.clientHeight;
      const centerOffset = containerHeight / 2;

      // Find nearest item accounting for spacers and center offset
      let adjustedIndex =
        Math.round(
          (scrollTop + centerOffset - MONTH_YEAR_ITEM_HEIGHT / 2) /
            MONTH_YEAR_ITEM_HEIGHT
        ) - SPACER_ITEMS;

      adjustedIndex = Math.max(0, Math.min(11, adjustedIndex));

      onChange(adjustedIndex);

      // Snap to centered position
      const targetScroll =
        (SPACER_ITEMS + adjustedIndex) * MONTH_YEAR_ITEM_HEIGHT -
        centerOffset +
        MONTH_YEAR_ITEM_HEIGHT / 2;

      if (immediate) {
        scrollRef.current.scrollTop = Math.max(0, targetScroll);
      } else {
        scrollRef.current.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: "smooth",
        });
      }
    }
  };

  const handleScroll = () => {
    isScrollingRef.current = true;

    // Check for haptic feedback on scroll
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop;
      const containerHeight = scrollRef.current.clientHeight;
      const centerOffset = containerHeight / 2;

      // Calculate which value is currently in the center
      const centerIndex =
        Math.round(
          (scrollTop + centerOffset - MONTH_YEAR_ITEM_HEIGHT / 2) /
            MONTH_YEAR_ITEM_HEIGHT
        ) - SPACER_ITEMS;

      const adjustedIndex = Math.max(0, Math.min(11, centerIndex));

      // Trigger haptic feedback when a new value enters the center
      if (lastCenterValueRef.current !== adjustedIndex) {
        lastCenterValueRef.current = adjustedIndex;
        smallHaptic();
      }
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Snap faster after scroll stops
    scrollTimeoutRef.current = setTimeout(() => {
      if (scrollRef.current) {
        isScrollingRef.current = false;
        snapToNearestItem();
      }
    }, 100);
  };

  // Handle mouse down for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop);
    }
  };

  // Handle touch start for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (scrollRef.current && !isScrollingRef.current) {
      isScrollingRef.current = true;

      const direction = e.deltaY > 0 ? 1 : -1;
      const newValue = Math.max(0, Math.min(11, value + direction));

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      onChange(newValue);

      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 200);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setTimeout(() => {
        snapToNearestItem();
      }, 10);
    };
    const handleGlobalTouchEnd = () => {
      setIsDragging(false);
      setTimeout(() => {
        snapToNearestItem();
      }, 10);
    };
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && scrollRef.current) {
        e.preventDefault();
        const walk = (e.clientY - startY) * -1;
        scrollRef.current.scrollTop = scrollTop + walk;
      }
    };
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging && scrollRef.current) {
        e.preventDefault();
        const walk = (e.touches[0].clientY - startY) * -1;
        scrollRef.current.scrollTop = scrollTop + walk;
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
      document.addEventListener("touchmove", handleGlobalTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("touchmove", handleGlobalTouchMove);
      document.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [isDragging, startY, scrollTop]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Box
      sx={{
        position: "relative",
        height: "12rem", // Content height - smaller but scrollable
        width: "8rem", // Keep original width
        overflow: "hidden",
        zIndex: 99,
        minWidth: "8rem", // Ensure minimum width
        maxWidth: "8rem", // Ensure maximum width
        py: 3, // Add vertical padding to reduce effective picker height
        px: 2, // Add horizontal padding
      }}
    >
      {/* Selection overlay - shorter height for month picker */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "0.2rem",
          right: "0.2rem",
          transform: "translateY(-50%)",
          height: "1.5rem", // Shorter height for month/year
          borderRadius: 2,
          zIndex: 5,
        }}
      />

      <Box
        ref={scrollRef}
        sx={{
          position: "absolute", // Cover entire picker area for touch
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: "100%",
          overflowY: "auto",
          scrollbarWidth: "none",
          cursor: isDragging ? "grabbing" : "grab",
          WebkitOverflowScrolling: "touch", // Enable momentum scrolling on iOS
          overscrollBehavior: "contain", // Prevent overscroll from affecting parent elements
          touchAction: "pan-y", // Only allow vertical scrolling
          perspective: "600px", // Add perspective for 3D effect
          perspectiveOrigin: "center center", // Center the perspective
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onWheel={handleWheel}
        style={{
          scrollBehavior: "auto", // Always use auto for responsive scrolling
          willChange: "scroll-position", // Optimize for scrolling
        }}
      >
        <Box>
          {/* Extra items at top for centering */}
          {Array.from({ length: SPACER_ITEMS }, (_, i) => (
            <Box key={`top-${i}`} sx={{ height: MONTH_YEAR_ITEM_HEIGHT }} />
          ))}

          {months.map((month, index) => {
            // Calculate distance from center for 3D cylindrical effect
            const distanceFromCenter = index - value;
            const absDistance = Math.abs(distanceFromCenter);

            // Calculate skeuomorphic rotating dial transformation
            const rotationX = distanceFromCenter * 12; // Degrees of rotation for cylinder effect
            const scale = 1 - absDistance * 0.08; // Subtle scale reduction
            const opacity = Math.max(0.4, 1 - absDistance * 0.15); // Fade distant items
            const translateZ = -absDistance * 8; // Push distant items back in 3D space

            return (
              <Box
                key={month}
                sx={{
                  height: MONTH_YEAR_ITEM_HEIGHT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  fontSize: "1.3rem",
                  color: index === value ? colors.text : colors.textSecondary,
                  fontWeight: index === value ? 600 : 400,
                  pl: 1.5,
                  px: "0.5rem",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: `
                    perspective(600px) 
                    rotateX(${rotationX}deg) 
                    scale(${Math.max(0.7, scale)}) 
                    translateZ(${translateZ}px)
                  `,
                  opacity: opacity,
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                }}
              >
                {month}
              </Box>
            );
          })}

          {/* Extra items at bottom for centering */}
          {Array.from({ length: SPACER_ITEMS }, (_, i) => (
            <Box key={`bottom-${i}`} sx={{ height: MONTH_YEAR_ITEM_HEIGHT }} />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default MonthScrollPicker;
