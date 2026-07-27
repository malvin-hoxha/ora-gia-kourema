import { AboutSection } from "../components/home/AboutSection";
import { HeroSection } from "../components/home/HeroSection";
import { ServicesSection } from "../components/home/ServicesSection";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";

export function HomePage() {
  return (
    <>
      <Header />

      <main>
        <HeroSection />
        <ServicesSection />
        <AboutSection />
      </main>

      <Footer />
    </>
  );
}