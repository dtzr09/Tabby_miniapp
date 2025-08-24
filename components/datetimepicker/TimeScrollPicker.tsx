import { Box } from "@mui/material";
import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../src/contexts/ThemeContext";

export const TIME_ITEM_HEIGHT = 28; // Slightly taller for better row gap spacing
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
  }, [value, type]);

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

      if (type === "hour") {
        adjustedIndex = Math.max(0, Math.min(11, adjustedIndex));
        const newValue = adjustedIndex + 1;
        onChange(newValue);
      } else {
        adjustedIndex = Math.max(0, Math.min(max, adjustedIndex));
        onChange(adjustedIndex);
      }

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
        onChange(newValue);
      } else {
        const newValue = Math.max(0, Math.min(max, value + direction));
        onChange(newValue);
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
      document.addEventListener("touchmove", handleGlobalTouchMove, { passive: false });
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
        height: "8rem", // Reduced overall height
        width: "2.5rem", // Slightly wider for better overlay fit
        overflow: "hidden",
        zIndex: 99,
        minWidth: "2.5rem", // Ensure minimum width
        maxWidth: "2.5rem", // Ensure maximum width
      }}
    >
      {/* Selection overlay - positioned at item level */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "0.2rem",
          right: "0.2rem",
          transform: "translateY(-50%)",
          height: "2rem",
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
            <Box key={`top-${i}`} sx={{ height: TIME_ITEM_HEIGHT }} />
          ))}

          {items.map((item) => {
            // Calculate distance from center for 3D cylindrical effect
            const itemIndex = items.indexOf(item);
            const selectedIndex = items.indexOf(value);
            const distanceFromCenter = itemIndex - selectedIndex;
            const absDistance = Math.abs(distanceFromCenter);

            // Calculate balanced skeuomorphic rotating dial transformation
            const rotationX = distanceFromCenter * 12; // Reduced rotation for more uniform spacing
            const scale = 1 - absDistance * 0.08; // Less dramatic scale to maintain spacing
            const opacity = Math.max(0.4, 1 - absDistance * 0.18); // Gentler fade for better visibility
            const translateZ = -absDistance * 8; // Less aggressive Z translation

            return (
              <Box
                key={item}
                sx={{
                  height: TIME_ITEM_HEIGHT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem",
                  color: item === value ? colors.text : colors.textSecondary,
                  px: "0.5rem", // Reduced padding for more compact design
                  fontWeight: item === value ? 600 : 400,
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
