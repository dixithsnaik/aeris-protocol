import { BrokerageCalculator } from "../../components/sections/BrokerageCalculator";
import { Hero } from "../../components/sections/Hero";
import { PropertyPassport } from "../../components/sections/PropertyPassport";
import { VerificationAlpha } from "../../components/sections/VerificationAlpha";

export function LandingPage() {
  return (
    <>
      <Hero />
      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 sm:px-8 lg:grid-cols-2">
        <BrokerageCalculator />
        <PropertyPassport />
      </section>
      <VerificationAlpha />
    </>
  );
}
