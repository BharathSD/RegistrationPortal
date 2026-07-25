import { LandingHeader } from "./sections/LandingHeader";
import { Hero } from "./sections/Hero";
import { WhyPlayersLoveIt } from "./sections/WhyPlayersLoveIt";
import { HowItWorks } from "./sections/HowItWorks";
import { Testimonials } from "./sections/Testimonials";
import { OrganizerCallout } from "./sections/OrganizerCallout";
import { Faq } from "./sections/Faq";
import { ClosingCta } from "./sections/ClosingCta";

/**
 * Header → Hero → Why players love it → How it works → Testimonials →
 * Organizer path → FAQ → closing CTA → footer. Each section is its own
 * file (see ./sections) so this stays a table of contents, not a
 * 500-line component.
 *
 * This page owns its own header/footer instead of using the shared
 * PublicShell — the nav here has real in-page anchor links (#trust,
 * #how-it-works, #organizers, #faq) that only make sense on this page;
 * Login/Register keep PublicShell's minimal chrome since they're task
 * flows, not something to navigate around.
 */
export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <Hero />
        <WhyPlayersLoveIt />
        <HowItWorks />
        <Testimonials />
        <OrganizerCallout />
        <Faq />
        <ClosingCta />
      </main>
      <footer className="border-t border-border bg-surface py-6 text-center text-xs text-text-secondary">
        © {new Date().getFullYear()} Aviyukthas Player Hub. One identity, every tournament.
      </footer>
    </div>
  );
}
