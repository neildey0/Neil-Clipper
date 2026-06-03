import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoboVids Editor - Automated Robotics Video Assembly Line",
  description: "Create high-impact short-form robotics videos using automated VO transcription, B-roll keyword auto-mapping, and programmatic Remotion rendering.",
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased select-none">
        {children}
      </body>
    </html>
  );
}
