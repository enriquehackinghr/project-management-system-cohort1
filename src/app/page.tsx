import { Closing, Footer, Principles } from "@/components/landing/Closing";
import { Features } from "@/components/landing/Features";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ProductShowcase } from "@/components/landing/ProductShowcase";

export default function Home() {
  return (
    <div id="top" className="min-h-full bg-paper">
      <div className="landing-hero-dark flex min-h-dvh flex-col">
        <Header />
        <Hero />
      </div>
      <main>
        <ProductShowcase />
        <HowItWorks />
        <Principles />
        <Features />
        <Closing />
      </main>
      <Footer />
    </div>
  );
}
