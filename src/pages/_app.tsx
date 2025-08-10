import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "../contexts/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  init,
  isTMA,
  disableVerticalSwipes,
  viewport,
} from "@telegram-apps/sdk";

const queryClient = new QueryClient();
// Extend the Window interface to include Telegram
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        themeParams?: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
          accent_text_color?: string;
          destructive_text_color?: string;
          header_bg_color?: string;
          section_bg_color?: string;
          section_header_text_color?: string;
          section_separator_color?: string;
          subtitle_text_color?: string;
          bottom_bar_bg_color?: string;
        };
        onEvent?: (eventType: string, eventHandler: () => void) => void;
        lockOrientation?: (orientation: string) => void;
      };
    };
  }
}

const applyViewportHeight = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tg = (window as any).Telegram?.WebApp;
  const h = tg?.viewportStableHeight || tg?.viewportHeight; // Telegram’s real height
  const vv = window.visualViewport?.height; // iOS/Safari fallback
  const best = h ? `${h}px` : vv ? `${vv}px` : null;
  if (best) document.documentElement.style.setProperty("--app-height", best);
};

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    async function initTg() {
      if (await isTMA()) {
        init();

        if (viewport.mount.isAvailable()) {
          await viewport.mount();
          viewport.expand();
        }

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (viewport.requestFullscreen.isAvailable() && isMobile) {
          await viewport.requestFullscreen();
          disableVerticalSwipes();
          // viewport.lockOrientation("portrait");
        }

        // ✅ Apply height once after setup
        applyViewportHeight();

        // ✅ Listen for Telegram viewport changes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).Telegram?.WebApp?.onEvent?.(
          "viewportChanged",
          applyViewportHeight
        );

        // ✅ Fallback for browser visual viewport changes (iOS keyboard, rotation, etc.)
        window.visualViewport?.addEventListener("resize", applyViewportHeight);
      }
    }

    initTg();
  }, []);

  return (
    <>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <Component {...pageProps} />
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
}

export default MyApp;
