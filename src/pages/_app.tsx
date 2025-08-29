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
  backButton,
} from "@telegram-apps/sdk";
import { expenseUpdateBroadcaster } from "../../utils/expenseUpdateBroadcaster";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Immediate staleness for instant updates
      staleTime: 0,
      // Short cache time for mobile
      gcTime: 60000, // 1 minute
      // Always refetch to ensure fresh data
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      // Quick retry for mobile networks
      retry: 1,
      retryDelay: 500,
      // Online first for immediate updates
      networkMode: 'online',
    },
  },
});

// Initialize the expense update broadcaster with the query client
expenseUpdateBroadcaster.setQueryClient(queryClient);
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
        setViewportSettings?: (settings: {
          viewport_height?: boolean;
          expand_media_previews?: boolean;
        }) => void;
      };
    };
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize Eruda for mobile debugging - only on client side
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      import('eruda').then((eruda) => {
        eruda.default.init();
      });
    }

    function applyViewportHeight() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tg = (window as any).Telegram?.WebApp;
      const h = tg?.viewportStableHeight || tg?.viewportHeight;
      const vv = window.visualViewport?.height;
      const best = h ? `${h}px` : vv ? `${vv}px` : null;
      if (best)
        document.documentElement.style.setProperty("--app-height", best);
    }

    async function initTg() {
      if (await isTMA()) {
        init();

        // Unmount back button immediately after init to prevent auto-mounting
        try {
          if (backButton.isMounted()) {
            backButton.unmount();
          }
        } catch (err) {
          console.warn("Failed to unmount back button on init:", err);
        }

        // Enable viewport height adjustments and safe areas
        window.Telegram?.WebApp?.setViewportSettings?.({
          viewport_height: true,
          expand_media_previews: true,
        });
        if (viewport.mount.isAvailable()) {
          await viewport.mount();
          viewport.expand();
        }

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (viewport.requestFullscreen.isAvailable() && isMobile) {
          await viewport.requestFullscreen();
          disableVerticalSwipes();
        }

        // Give Telegram a tick to finish layout before measuring
        requestAnimationFrame(() => {
          applyViewportHeight();
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).Telegram?.WebApp?.onEvent?.(
          "viewportChanged",
          applyViewportHeight
        );
        window.visualViewport?.addEventListener("resize", applyViewportHeight);
      } else {
        // Browser fallback - skip on desktop
        const setFromVV = () => {
          document.documentElement.style.setProperty(
            "--app-height",
            `${window.visualViewport?.height || window.innerHeight}px`
          );
        };
        setFromVV();
        window.addEventListener("resize", setFromVV);
        window.visualViewport?.addEventListener("resize", setFromVV);
      }
    }

    initTg();

    // Cleanup function to clean up the broadcaster
    return () => {
      expenseUpdateBroadcaster.cleanup();
    };
  }, []);

  return (
    <>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <div className="app">
            <Component {...pageProps} />
          </div>
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
}

export default MyApp;
