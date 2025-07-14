import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";

// Extend the Window interface to include Telegram
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        themeParams?: {
          bg_color?: string;
          text_color?: string;
        };
      };
    };
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      const theme = tg?.themeParams || {};
      document.body.style.backgroundColor = theme.bg_color || '#fff';
      document.body.style.color = theme.text_color || '#000';
    }
  }, []);
  return <Component {...pageProps} />;
}

export default MyApp;
