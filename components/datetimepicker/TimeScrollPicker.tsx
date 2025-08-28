import { Box } from "@mui/material";
import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../src/contexts/ThemeContext";
import { mediumHaptic } from "../../utils/haptics";

export const TIME_ITEM_HEIGHT = 38; // Balanced height for proper spacing
export const MONTH_YEAR_ITEM_HEIGHT = 32; // Larger height for month/year pickers
export const ITEM_HEIGHT = 32; // Default for time pickers
export const SPACER_ITEMS = 2; // Reduced spacers for 5-item view
// Time picker scroll component
const TimeScrollPicker = ({
  type,
  value,
  onChange,
  max,
}: {
  type: string;
  value: number;
  onChange: (value: number) => void;
  max: number;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { colors } = useTheme();

  useEffect(() => {
    const setScrollPosition = () => {
      if (scrollRef.current) {
        const scrollValue = type === "hour" ? value - 1 : value;
        const containerHeight = scrollRef.current.clientHeight;
        const centerOffset = containerHeight / 2;

        // Position selected item exactly in center with overlay - account for padding
        const targetScroll =
          (SPACER_ITEMS + scrollValue) * TIME_ITEM_HEIGHT -
          centerOffset +
          TIME_ITEM_HEIGHT / 2; // Adjusted offset to center items in overlay
        scrollRef.current.scrollTop = Math.max(0, targetScroll);
      }
    };

    setScrollPosition();
    const timer = setTimeout(setScrollPosition, 100);

    return () => clearTimeout(timer);
  }, [value, type]);

  const snapToNearestItem = (immediate = false) => {
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop;
      const containerHeight = scrollRef.current.clientHeight;
      const centerOffset = containerHeight / 2;

      // Find nearest item accounting for spacers, centering, and padding
      let adjustedIndex =
        Math.round(
          (scrollTop + centerOffset - TIME_ITEM_HEIGHT / 2) / TIME_ITEM_HEIGHT
        ) - SPACER_ITEMS;

      let newValue;
      if (type === "hour") {
        adjustedIndex = Math.max(0, Math.min(11, adjustedIndex));
        newValue = adjustedIndex + 1;
      } else {
        adjustedIndex = Math.max(0, Math.min(max, adjustedIndex));
        newValue = adjustedIndex;
      }

      // Only trigger haptic feedback if the value actually changed
      const currentValue = value;
      if (newValue !== currentValue) {
        mediumHaptic();
        onChange(newValue);
      }

      // Snap to centered position - account for padding
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

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Snap faster after scroll stops
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

      if (type === "hour") {
        const newValue = Math.max(1, Math.min(12, value + direction));
        if (newValue !== value) {
          mediumHaptic();
          onChange(newValue);
        }
      } else {
        const newValue = Math.max(0, Math.min(max, value + direction));
        if (newValue !== value) {
          mediumHaptic();
          onChange(newValue);
        }
      }
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const items =
    type === "hour"
      ? Array.from({ length: 12 }, (_, i) => i + 1)
      : Array.from({ length: max + 1 }, (_, i) => i);

  return (
    <Box
      sx={{
        position: "relative",
        height: "12rem", // Further increased overall height
        width: "4rem", // Much wider for better touch area
        overflow: "hidden",
        zIndex: 99,
        minWidth: "4rem", // Ensure minimum width
        maxWidth: "4rem", // Ensure maximum width
      }}
    >
      {/* Selection overlay - positioned at item level */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "0.5rem",
          right: "0.5rem",
          transform: "translateY(-50%)",
          height: "2.25rem",
          borderRadius: 2,
          zIndex: 5,
        }}
      />

      <Box
        ref={scrollRef}
        sx={{
          position: "absolute", // Cover entire picker area for touch
          top: "8px", // Create top padding space
          left: "8px", // Create left padding space
          right: "8px", // Create right padding space
          bottom: "8px", // Create bottom padding space
          height: "calc(100% - 16px)", // Adjust height for vertical padding
          overflowY: "auto",
          scrollbarWidth: "none",
          cursor: isDragging ? "grabbing" : "grab",
          WebkitOverflowScrolling: "touch", // Enable momentum scrolling on iOS
          overscrollBehavior: "contain", // Prevent overscroll from affecting parent elements
          touchAction: "pan-y", // Only allow vertical scrolling
          perspective: "1000px", // iOS-style perspective for natural curve
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

          {items.map((item) => {
            // Calculate distance from center for 3D cylindrical effect
            const itemIndex = items.indexOf(item);
            const selectedIndex = items.indexOf(value);
            const distanceFromCenter = itemIndex - selectedIndex;
            const absDistance = Math.abs(distanceFromCenter);

            // Calculate iOS-style cylindrical transformation
            const rotationX = distanceFromCenter * 15; // iOS-like rotation angle
            const cylinderRadius = 80; // Larger radius for natural iOS curve

            // Calculate position on cylinder surface
            const radians = (rotationX * Math.PI) / 180;
            const translateZ = cylinderRadius * (Math.cos(radians) - 1);

            // iOS-style opacity and scaling
            const scale = Math.max(0.8, 1 - absDistance * 0.1);
            const opacity = Math.max(0.2, 1 - Math.pow(absDistance, 1.5) * 0.3);

            return (
              <Box
                key={item}
                sx={{
                  height: TIME_ITEM_HEIGHT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  color: item === value ? colors.text : colors.textSecondary,
                  px: "1.5rem", // Extra padding for comfortable spacing
                  fontWeight: item === value ? 600 : 400,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: `
                    rotateX(${rotationX}deg) 
                    translateZ(${translateZ}px)
                    scale(${scale})
                  `,
                  opacity: opacity,
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                }}
              >
                {type === "hour" ? item : item.toString().padStart(2, "0")}
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

export default TimeScrollPicker;
