import { Audience } from "@/components/landing/Audience";
import { Closing, Footer, Principles } from "@/components/landing/Closing";
import { Dashboards } from "@/components/landing/Dashboards";
import { Features } from "@/components/landing/Features";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Integrations } from "@/components/landing/Integrations";
import { Problem } from "@/components/landing/Problem";
import { ProductShowcase } from "@/components/landing/ProductShowcase";

export default function Home() {
  return (
    <div id="top" className="min-h-full">
      <Header />
      <main>
        <Hero />
        <Problem />
        <ProductShowcase />
        <HowItWorks />
        <Principles />
        <Features />
        <Dashboards />
        <Integrations />
        <Audience />
        <Closing />
      </main>
      <Footer />
    </div>
  );
}
