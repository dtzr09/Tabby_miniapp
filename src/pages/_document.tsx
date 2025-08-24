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
          /* Prevent keyboard from resizing viewport */
          html {
            height: 100%;
            overflow: hidden;
          }
          body {
            height: 100%;
            overflow: hidden;
            position: fixed;
            width: 100%;
            top: 0;
            left: 0;
          }
          #__next {
            height: 100vh;
            overflow: hidden;
          }
        `}</style>
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
