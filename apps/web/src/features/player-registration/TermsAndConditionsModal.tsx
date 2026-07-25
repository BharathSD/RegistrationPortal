import { Modal } from "../../design-system";

const SECTIONS: Array<{ title: string; body: string }> = [
  {
    title: "1. Identity verification",
    body: "The mobile number you verify here becomes your permanent player identity across every tournament on this platform. You'll only need it — plus an OTP — to register for future tournaments once an admin has approved your profile.",
  },
  {
    title: "2. Accuracy of information",
    body: "You confirm that the personal details, date of birth, and contact information you provide are accurate. Providing false information may result in rejection of your registration or suspension of an already-verified profile.",
  },
  {
    title: "3. Admin review",
    body: "Your profile is reviewed by a tournament admin before it is verified. Admins may approve your registration, reject it with a reason, or request changes. Your cricket role, batting/bowling style, and experience level are assigned by an admin, not set by you.",
  },
  {
    title: "4. Data use & privacy",
    body: "Your emergency contact details are used only for safety purposes during tournaments and are visible to tournament admins. Any medical information you add later is visible only to tournament admins on a need-to-know basis, and never shown to other players.",
  },
  {
    title: "5. Communication consent",
    body: "By registering, you consent to receive OTPs, verification updates, and tournament confirmations via SMS and WhatsApp at the mobile number you provide.",
  },
  {
    title: "6. Code of conduct",
    body: "Once verified, you agree to follow the rules and code of conduct published for each tournament you register for, and to behave respectfully toward players, officials, and organizers at all times.",
  },
];

export function TermsAndConditionsModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="Terms & Conditions" footer={null}>
      <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1 text-sm">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="font-semibold text-text-primary">{section.title}</p>
            <p className="mt-1 text-text-secondary">{section.body}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
}
