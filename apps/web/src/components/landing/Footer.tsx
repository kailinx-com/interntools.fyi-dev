import Link from "next/link";
import { Briefcase, Facebook, Heart, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

export interface FooterProps {
  brandName?: string;
  brandSuffix?: string;
  tagline?: string;
  socialLinks?: { type: "facebook" | "email"; href: string }[];
  linkGroups?: FooterLinkGroup[];
  copyright?: string;
  bottomLine?: React.ReactNode;
  className?: string;
}

const defaultLinkGroups: FooterLinkGroup[] = [
  {
    title: "Product",
    links: [
      { label: "Housing Search", href: "/housing" },
      { label: "Paycheck Calculator", href: "/calculator" },
      { label: "Community Notes", href: "/#community-notes" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/" },
      { label: "City Guides", href: "/housing" },
      { label: "Help Center", href: "/signup" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Settings", href: "/privacy#cookies" },
    ],
  },
];

const socialIcons = {
  facebook: Facebook,
  email: Mail,
};

export function Footer({
  brandName = "interntools",
  brandSuffix = ".fyi",
  tagline = "Making the intern experience transparent, safe, and rewarding.",
  socialLinks = [
    { type: "facebook", href: "https://facebook.com" },
    { type: "email", href: "mailto:hello@interntools.fyi" },
  ],
  linkGroups = defaultLinkGroups,
  copyright = "© 2024 interntools.fyi. All rights reserved.",
  bottomLine = (
    <span className="flex items-center gap-1">
      Made with <Heart className="inline size-3.5 text-primary fill-primary" />
      for students.
    </span>
  ),
  className,
}: FooterProps) {
  return (
    <footer
      className={cn(
        "bg-background-light dark:bg-background-dark pt-16 pb-8 border-t border-border",
        className,
      )}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Briefcase className="size-5 text-primary" />
              <span className="font-bold text-lg text-foreground">
                {brandName}
                <span className="text-primary">{brandSuffix}</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{tagline}</p>
            <div className="flex space-x-4">
              {socialLinks.map((item) => {
                const Icon = socialIcons[item.type];
                return (
                  <Link
                    key={item.type}
                    href={item.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label={item.type}
                  >
                    <Icon className="size-5" />
                  </Link>
                );
              })}
            </div>
          </div>
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h4 className="font-semibold text-foreground mb-4">
                {group.title}
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-8 flex flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">{copyright}</p>
          {bottomLine && (
            <div className="flex space-x-6 text-sm text-muted-foreground">
              {bottomLine}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
