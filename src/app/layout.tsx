import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Meridian - SEO Semantic Cocoon Planner",
  description: "Visual semantic cocoon and topical authority planning tool for SEO professionals",
  keywords: ["SEO", "semantic cocoon", "content planning", "topical authority", "internal linking"],
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

// Script to prevent flash of wrong theme
const themeScript = `
  (function() {
    const stored = localStorage.getItem('meridian-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored === 'dark' || (stored !== 'light' && prefersDark);
    if (isDark) document.documentElement.classList.add('dark');
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} ${spaceMono.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
