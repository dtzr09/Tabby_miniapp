import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <style>{`
          /* Prevent keyboard from resizing viewport - force fixed height */
          :root {
            --app-height: 100vh;
          }
          html, body {
            height: var(--app-height);
            overflow: hidden;
            position: fixed;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          html {
            touch-action: manipulation;
            -webkit-text-size-adjust: 100%;
          }
          body {
            top: 0;
            left: 0;
            overscroll-behavior: none;
          }
          #__next {
            height: var(--app-height);
            overflow: hidden;
            position: relative;
          }
          /* Force fixed viewport height */
          @supports (height: 100dvh) {
            :root {
              --app-height: 100dvh;
            }
          }
        `}</style>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Lock the viewport height immediately
            function setAppHeight() {
              const vh = window.innerHeight;
              document.documentElement.style.setProperty('--app-height', vh + 'px');
            }
            // Set immediately and lock it
            setAppHeight();
            // Don't update on resize to prevent keyboard interference
            let initialHeight = window.innerHeight;
            window.addEventListener('resize', function() {
              // Only update if it's a significant change (not keyboard)
              if (Math.abs(window.innerHeight - initialHeight) > 150) {
                initialHeight = window.innerHeight;
                setAppHeight();
              }
            });
          `
        }} />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://telegram.org/js/telegram-web-app.js" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
