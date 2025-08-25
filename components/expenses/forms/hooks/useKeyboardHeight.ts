import { useState, useEffect } from "react";

export const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Detect keyboard height
  useEffect(() => {
    const initialViewportHeight =
      window.visualViewport?.height || window.innerHeight;

    const handleViewportChange = () => {
      const currentViewportHeight =
        window.visualViewport?.height || window.innerHeight;
      const heightDifference = initialViewportHeight - currentViewportHeight;

      // If viewport shrunk significantly (likely keyboard), store the keyboard height
      if (heightDifference > 150) {
        // Threshold to detect keyboard
        setKeyboardHeight(heightDifference);
      } else {
        setKeyboardHeight(0);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
      return () => {
        window.visualViewport?.removeEventListener(
          "resize",
          handleViewportChange
        );
      };
    } else {
      // Fallback for older browsers
      window.addEventListener("resize", handleViewportChange);
      return () => {
        window.removeEventListener("resize", handleViewportChange);
      };
    }
  }, []);

  return keyboardHeight;
}; 