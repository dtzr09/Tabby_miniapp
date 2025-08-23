import { Box } from "@mui/material";
import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../src/contexts/ThemeContext";
import { ITEM_HEIGHT, SPACER_ITEMS } from "./TimeScrollPicker";

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

        // Account for spacer items at top + scroll to center the item
        const targetScroll =
          (SPACER_ITEMS + scrollValue) * ITEM_HEIGHT - ITEM_HEIGHT;
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

      // Find nearest item accounting for spacers
      let adjustedIndex =
        Math.round((scrollTop + ITEM_HEIGHT) / ITEM_HEIGHT) - SPACER_ITEMS;

      adjustedIndex = Math.max(0, Math.min(1, adjustedIndex));
      const newValue = periods[adjustedIndex];
      onChange(newValue);

      // Snap to centered position
      const targetScroll =
        (SPACER_ITEMS + adjustedIndex) * ITEM_HEIGHT - ITEM_HEIGHT;

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
    }, 50);
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent default touch behavior
    setIsDragging(true);
    const clientY = "clientY" in e ? e.clientY : e.touches[0].clientY;
    setStartY(clientY);
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop);
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const clientY = "clientY" in e ? e.clientY : e.touches[0].clientY;
    const walk = (clientY - startY) * -1;
    scrollRef.current.scrollTop = scrollTop + walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => {
      snapToNearestItem();
    }, 10);
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
    const handleGlobalMouseMove = (e: MouseEvent | TouchEvent) => {
      if (isDragging && scrollRef.current) {
        e.preventDefault();
        const clientY = "clientY" in e ? e.clientY : e.touches[0].clientY;
        const walk = (clientY - startY) * -1;
        scrollRef.current.scrollTop = scrollTop + walk;
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
      document.addEventListener("touchmove", handleGlobalMouseMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("touchmove", handleGlobalMouseMove);
      document.removeEventListener("touchend", handleGlobalMouseUp);
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
        height: "8rem",
        overflow: "hidden",
        zIndex: 99,
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
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        onWheel={handleWheel}
        style={{
          scrollBehavior: isDragging ? "auto" : "smooth",
          touchAction: "pan-y", // Allow only vertical scrolling on touch
        }}
      >
        <Box>
          {/* Extra items at top for centering */}
          {Array.from({ length: 4 }, (_, i) => (
            <Box key={`top-${i}`} sx={{ height: ITEM_HEIGHT }} />
          ))}

          {periods.map((period) => (
            <Box
              key={period}
              sx={{
                height: ITEM_HEIGHT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
                color: period === value ? colors.text : colors.textSecondary,
                fontWeight: period === value ? 500 : 400,
              }}
            >
              {period}
            </Box>
          ))}

          {/* Extra items at bottom for centering */}
          {Array.from({ length: 4 }, (_, i) => (
            <Box key={`bottom-${i}`} sx={{ height: "2.5rem" }} />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default PeriodScrollPicker;
