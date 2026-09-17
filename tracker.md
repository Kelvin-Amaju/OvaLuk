import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
variable: "--font-geist-sans",
subsets: ["latin"],
});

const geistMono = Geist_Mono({
variable: "--font-geist-mono",
subsets: ["latin"],
});

export const metadata: Metadata = {
title: "Jobuddy - AI Job Search Assistant",
description:
"Jobuddy is an AI-powered job search assistant that helps you find your dream job faster. Upload your resume and let Jobuddy analyze it to provide personalized job recommendations, smart search capabilities, and more.",
};

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!;

export default function RootLayout({
children,
}: Readonly<{
children: React.ReactNode;
}>) {
return (
<html
lang="en"
className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} >
<body className="min-h-full flex flex-col">{children}</body>

      <Script
        id="consentmanager"
        src="https://cdn.consentmanager.net/delivery/autoblocking/be74b4bce2e0c.js"
        strategy="beforeInteractive"
        data-cmp-ab="1"
        data-cmp-host="b.delivery.consentmanager.net"
        data-cmp-cdn="cdn.consentmanager.net"
        data-cmp-codesrc="16"
      />

      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />

      <Script id="google-tag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>

      <script async src="https://pineserver.test/app/monitor/backend/public/tracker.js"

data-api="https://pineserver.test/app/monitor/backend/public"
data-key="ask_35930350ad2c13d04fd7e04615c40aef3d79bcf107d9ddf2"></script>
</html>
);
}
