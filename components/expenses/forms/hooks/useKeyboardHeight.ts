import { useState, useEffect, useRef } from "react";

export const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect keyboard height
  useEffect(() => {
    const initialViewportHeight =
      window.visualViewport?.height || window.innerHeight;

    const handleViewportChange = () => {
      const currentViewportHeight =
        window.visualViewport?.height || window.innerHeight;
      const heightDifference = initialViewportHeight - currentViewportHeight;

      // Clear any existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // If viewport shrunk significantly (likely keyboard), update immediately
      if (heightDifference > 150) {
        setKeyboardHeight(heightDifference);
      } else {
        // When keyboard is closing, debounce the height reset to avoid flickering
        debounceTimeoutRef.current = setTimeout(() => {
          setKeyboardHeight(0);
        }, 100); // Small delay to smooth out the transition
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        window.visualViewport?.removeEventListener(
          "resize",
          handleViewportChange
        );
      };
    } else {
      // Fallback for older browsers
      window.addEventListener("resize", handleViewportChange);
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        window.removeEventListener("resize", handleViewportChange);
      };
    }
  }, []);

  return keyboardHeight;
}; 