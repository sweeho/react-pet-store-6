import { Link } from "react-router";

import { NAV_AREAS } from "@/constants/navigation";

interface AreaPlaceholderProps {
  href: string;
}

// Stand-in page for a primary area until its capability lands; the capability replaces the
// page file that renders this.
const AreaPlaceholder = ({ href }: AreaPlaceholderProps) => {
  const area = NAV_AREAS.find((a) => a.href === href);

  return (
    <main className="mx-auto max-w-3xl px-8 py-6">
      <h1 className="text-2xl font-semibold">{area?.label ?? href}</h1>
      <p className="text-muted-foreground mt-1">{area?.description}</p>
      <Link to="/" className="text-primary mt-6 inline-block text-sm font-medium hover:underline">
        Back to Home
      </Link>
    </main>
  );
};

export default AreaPlaceholder;
