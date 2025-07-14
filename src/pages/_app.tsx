import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram) {
      const tg = window.Telegram.WebApp;
      const theme = tg?.themeParams || {};
      document.body.style.backgroundColor = theme.bg_color || "#fff";
      document.body.style.color = theme.text_color || "#000";
    }
  }, []);
  return <Component {...pageProps} />;
}

export default MyApp;
