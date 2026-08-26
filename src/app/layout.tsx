import type { Metadata } from "next";
import { IBM_Plex_Mono, Poppins, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Baguette — The project operating system",
  description:
    "Describe a project in plain language. Approve the plan. Run it on a board, a timeline, dashboards, a weekly status, and a risk radar.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${ibmPlexMono.variable} ${sourceSerif.variable} h-full bg-foam antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full bg-foam font-sans text-ink">{children}</body>
    </html>
  );
}
