import { useState, useEffect, useRef } from "react";

export const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastValidKeyboardHeight = useRef(0);

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
        const newHeight = heightDifference;
        lastValidKeyboardHeight.current = newHeight;
        setKeyboardHeight(newHeight);
      } else {
        // When keyboard is closing, add small debounce to prevent intermediate values
        debounceTimeoutRef.current = setTimeout(() => {
          setKeyboardHeight(0);
          lastValidKeyboardHeight.current = 0;
        }, 50); // Very short debounce to smooth the transition
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