import { Box } from "@mui/material";
import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../src/contexts/ThemeContext";
import { ITEM_HEIGHT, SPACER_ITEMS } from "./TimeScrollPicker";

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
          (SPACER_ITEMS + value) * ITEM_HEIGHT - centerOffset + ITEM_HEIGHT / 2;
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
        Math.round((scrollTop + centerOffset - ITEM_HEIGHT / 2) / ITEM_HEIGHT) -
        SPACER_ITEMS;

      adjustedIndex = Math.max(0, Math.min(11, adjustedIndex));
      onChange(adjustedIndex);

      // Snap to centered position
      const targetScroll =
        (SPACER_ITEMS + adjustedIndex) * ITEM_HEIGHT -
        centerOffset +
        ITEM_HEIGHT / 2;

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

    // Snap after scroll stops with longer delay to prevent conflicts
    scrollTimeoutRef.current = setTimeout(() => {
      if (scrollRef.current) {
        isScrollingRef.current = false;
        snapToNearestItem();
      }
    }, 150);
  };

  // Keep only mouse drag for desktop, remove touch interference
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
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

      // Update value and reset scrolling flag after delay
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
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && scrollRef.current) {
        e.preventDefault();
        const walk = (e.clientY - startY) * -1;
        scrollRef.current.scrollTop = scrollTop + walk;
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
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
        height: "14rem",
        overflow: "hidden",
        zIndex: 99,
        flex: 1,
      }}
    >
      <Box
        ref={scrollRef}
        sx={{
          height: "100%",
          overflowY: "auto",
          scrollbarWidth: "none",
          cursor: isDragging ? "grabbing" : "grab",
          WebkitOverflowScrolling: "touch", // Enable momentum scrolling on iOS
          overscrollBehavior: "contain", // Prevent overscroll from affecting parent elements
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        style={{
          scrollBehavior: "auto", // Always use auto for responsive scrolling
        }}
      >
        <Box>
          {/* Extra items at top for centering */}
          {Array.from({ length: SPACER_ITEMS }, (_, i) => (
            <Box key={`top-${i}`} sx={{ height: ITEM_HEIGHT }} />
          ))}

          {months.map((month, index) => (
            <Box
              key={month}
              sx={{
                height: ITEM_HEIGHT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.95rem",
                color: index === value ? colors.text : colors.textSecondary,
                fontWeight: index === value ? 500 : 400,
                px: "0.5rem",
              }}
            >
              {month}
            </Box>
          ))}

          {/* Extra items at bottom for centering */}
          {Array.from({ length: SPACER_ITEMS }, (_, i) => (
            <Box key={`bottom-${i}`} sx={{ height: ITEM_HEIGHT }} />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default MonthScrollPicker;
