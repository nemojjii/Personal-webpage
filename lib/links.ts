import { site } from "@/site.config";

export interface ProfessionalLink {
  key: string;
  label: string;
  href: string;
  /** What to show as the link text — the handle, not the raw URL. */
  display: string;
}

const LABELS: Record<string, string> = {
  email: "Email",
  github: "GitHub",
  scholar: "Google Scholar",
  orcid: "ORCID",
  linkedin: "LinkedIn",
};

function display(key: string, value: string): string {
  if (key === "email") return value;
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/**
 * Every professional link that has actually been filled in.
 * Empty values in site.config are skipped, so nothing renders a dead link.
 */
export function professionalLinks(): ProfessionalLink[] {
  const fromLinks = Object.entries(site.links)
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([key, value]) => ({
      key,
      label: LABELS[key] ?? key,
      href: key === "email" ? `mailto:${value}` : value,
      display: display(key, value),
    }));

  const extra = site.extraLinks.map((link) => ({
    key: link.href,
    label: link.label,
    href: link.href,
    display: display("", link.href),
  }));

  return [...fromLinks, ...extra];
}

export const hasContactDetails = () => professionalLinks().length > 0;
