import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Button } from "../../../design-system";
import { StadiumBackdrop } from "../../../components/ui/StadiumBackdrop";

export function ClosingCta() {
  return (
    <section className="relative isolate overflow-hidden bg-pitch px-4 py-16 text-center text-white">
      <StadiumBackdrop />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
        className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-5"
      >
        <ShieldCheck className="h-8 w-8 text-gold" aria-hidden="true" />
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Your cricket identity starts here.</h2>
        <p className="text-white/75">Verification takes minutes. It works everywhere, from here on.</p>
        <Link to="/register">
          <Button size="lg">Create Your Cricket ID</Button>
        </Link>
      </motion.div>
    </section>
  );
}
