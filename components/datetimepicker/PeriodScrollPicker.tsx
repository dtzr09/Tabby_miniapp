import { Box } from "@mui/material";
import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../src/contexts/ThemeContext";
import { TIME_ITEM_HEIGHT, SPACER_ITEMS } from "./TimeScrollPicker";

const PeriodScrollPicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { colors } = useTheme();

  const periods = ["AM", "PM"];

  useEffect(() => {
    const setScrollPosition = () => {
      if (scrollRef.current) {
        const scrollValue = value === "AM" ? 0 : 1;
        const containerHeight = scrollRef.current.clientHeight;
        const centerOffset = containerHeight / 2;

        // Position selected item exactly in center with overlay
        const targetScroll =
          (SPACER_ITEMS + scrollValue) * TIME_ITEM_HEIGHT -
          centerOffset +
          TIME_ITEM_HEIGHT / 2;
        scrollRef.current.scrollTop = Math.max(0, targetScroll);
      }
    };

    setScrollPosition();
    const timer = setTimeout(setScrollPosition, 100);

    return () => clearTimeout(timer);
  }, [value]);

  const snapToNearestItem = (immediate = false) => {
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop;
      const containerHeight = scrollRef.current.clientHeight;
      const centerOffset = containerHeight / 2;

      // Find nearest item accounting for spacers and centering
      let adjustedIndex =
        Math.round(
          (scrollTop + centerOffset - TIME_ITEM_HEIGHT / 2) / TIME_ITEM_HEIGHT
        ) - SPACER_ITEMS;

      adjustedIndex = Math.max(0, Math.min(1, adjustedIndex));
      const newValue = periods[adjustedIndex];
      onChange(newValue);

      // Snap to centered position
      const targetScroll =
        (SPACER_ITEMS + adjustedIndex) * TIME_ITEM_HEIGHT -
        centerOffset +
        TIME_ITEM_HEIGHT / 2;

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

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Snap immediately after scroll stops
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      snapToNearestItem();
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
    if (scrollRef.current) {
      const direction = e.deltaY > 0 ? 1 : -1;
      const currentIndex = value === "AM" ? 0 : 1;
      const newIndex = Math.max(0, Math.min(1, currentIndex + direction));
      onChange(periods[newIndex]);
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
        height: "8rem", // Reduced overall height
        width: "3rem", // Wider for AM/PM text and better overlay coverage
        overflow: "hidden",
        zIndex: 99,
        minWidth: "3rem", // Ensure minimum width
        maxWidth: "3rem", // Ensure maximum width
      }}
    >
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
            <Box key={`top-${i}`} sx={{ height: TIME_ITEM_HEIGHT }} />
          ))}

          {periods.map((period, index) => {
            // Calculate distance from center for 3D cylindrical effect
            const valueIndex = periods.indexOf(value);
            const distanceFromCenter = index - valueIndex;
            const absDistance = Math.abs(distanceFromCenter);

            // Calculate balanced skeuomorphic rotating dial transformation
            const rotationX = distanceFromCenter * 12; // Reduced rotation for more uniform spacing
            const scale = 1 - absDistance * 0.08; // Less dramatic scale to maintain spacing
            const opacity = Math.max(0.4, 1 - absDistance * 0.18); // Gentler fade for better visibility
            const translateZ = -absDistance * 8; // Less aggressive Z translation

            return (
              <Box
                key={period}
                sx={{
                  height: TIME_ITEM_HEIGHT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem",
                  color: period === value ? colors.text : colors.textSecondary,
                  fontWeight: period === value ? 600 : 400,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: `
                    perspective(500px) 
                    rotateX(${rotationX}deg) 
                    scale(${Math.max(0.6, scale)}) 
                    translateZ(${translateZ}px)
                  `,
                  opacity: opacity,
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                }}
              >
                {period}
              </Box>
            );
          })}

          {/* Extra items at bottom for centering */}
          {Array.from({ length: SPACER_ITEMS }, (_, i) => (
            <Box key={`bottom-${i}`} sx={{ height: TIME_ITEM_HEIGHT }} />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default PeriodScrollPicker;
