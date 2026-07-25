import { ChevronDown } from "lucide-react";
import { SectionHeading } from "../../../components/ui/SectionHeading";

const FAQS = [
  {
    question: "Do I need to register again for every tournament?",
    answer:
      "No. Once your identity is verified, every future tournament only needs your mobile number and a one-time code.",
  },
  {
    question: "How long does verification take?",
    answer: "Most profiles are reviewed within 24–48 hours by a tournament organizer.",
  },
  {
    question: "Is my personal information safe?",
    answer: "Your personal details are only visible to organizers / Inspirers — never to other players.",
  },
  {
    question: "What if my registration is rejected?",
    answer: "You will see the reason directly on your dashboard, and you can update your profile and resubmit.",
  },
  {
    question: "Is there a cost to register?",
    answer: "Creating your Cricket ID is free. Individual tournament / league fees will be charged.",
  },
];

/** Native <details>/<summary> — full keyboard and screen-reader support with no ARIA state to manage by hand. */
export function Faq() {
  return (
    <section id="faq" className="border-y border-border bg-surface px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <SectionHeading title="Frequently asked questions" />

        <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-canvas">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-text-primary marker:content-none">
                {faq.question}
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-text-secondary transition-transform duration-base group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-3 text-sm text-text-secondary">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
