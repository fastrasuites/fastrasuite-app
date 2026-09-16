import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppWrapper from "./AppWrapper";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fastra Suite",
  description: "Premium Logistics and Suite Management",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fastra Suite",
  },
};

export const viewport: Viewport = {
  themeColor: "#4C8EDA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <AppWrapper>
          {children}
          <PwaInstallPrompt />
        </AppWrapper>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                var isLocalhost = Boolean(
                  window.location.hostname === 'localhost' ||
                  window.location.hostname === '[::1]' ||
                  window.location.hostname.match(/^127(?:\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
                );

                if (isLocalhost) {
                  // In local development, unregister any active service worker to avoid ChunkLoadError and caching issues
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (var r of registrations) {
                      r.unregister();
                    }
                  });
                } else {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('Service Worker registration failed: ', err);
                  });
                }
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
