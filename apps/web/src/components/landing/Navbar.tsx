"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Briefcase } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

export interface NavbarProps {
  brandName?: string;
  brandSuffix?: string;
  logoHref?: string;
  links?: NavLink[];
  loginHref?: string;
  signUpHref?: string;
  signUpLabel?: string;
  className?: string;
}

const defaultLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Paycheck Calculator", href: "/calculator" },
];

const calculatorMenuLinks = [
  {
    label: "Paycheck Calculator",
    href: "/calculator",
    description: "Estimate your pay and taxes by period.",
  },
  {
    label: "Paycheck Planner",
    href: "/calculator/planner",
    description: "Plan expenses against your net income.",
  },
];

export function Navbar({
  brandName = "interntools",
  brandSuffix = ".fyi",
  logoHref = "/",
  links = defaultLinks,
  loginHref = "/login",
  signUpHref = "/signup",
  signUpLabel = "Sign Up",
  className,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const isCalculatorSectionActive =
    pathname === "/calculator" || pathname.startsWith("/calculator/");

  const isLinkActive = (href: string, explicitActive?: boolean) => {
    if (explicitActive !== undefined) return explicitActive;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      className={cn(
        "fixed top-0 w-full z-40 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md",
        className,
      )}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href={logoHref}
            className="shrink-0 flex items-center space-x-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Briefcase className="size-5 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">
              {brandName}
              <span className="text-primary">{brandSuffix}</span>
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {links.map((link) => {
              if (link.href === "/calculator") {
                return (
                  <NavigationMenu key={link.label} viewport={false}>
                    <NavigationMenuList>
                      <NavigationMenuItem>
                        <NavigationMenuTrigger
                          onClick={(event) => {
                            event.preventDefault();
                            router.push(link.href);
                          }}
                          className={cn(
                            navigationMenuTriggerStyle(),
                            "bg-transparent",
                            isCalculatorSectionActive
                              ? "text-primary"
                              : "text-muted-foreground",
                          )}
                        >
                          {link.label}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent className="w-auto min-w-88 p-1">
                          {calculatorMenuLinks.map((item) => {
                            const itemActive =
                              pathname === item.href ||
                              pathname.startsWith(`${item.href}/`);
                            return (
                              <NavigationMenuLink
                                key={item.href}
                                asChild
                                active={itemActive}
                                className="rounded-md p-3"
                              >
                                <Link href={item.href}>
                                  <div className="font-medium">
                                    {item.label}
                                  </div>
                                  <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
                                    {item.description}
                                  </p>
                                </Link>
                              </NavigationMenuLink>
                            );
                          })}
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    </NavigationMenuList>
                  </NavigationMenu>
                );
              }

              const active = isLinkActive(link.href, link.active);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "bg-transparent",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="h-8 w-28 rounded-md bg-muted animate-pulse" />
            ) : isAuthenticated && user ? (
              <>
                <Link
                  href="/"
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  Hi, {user.username}
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await logout();
                    router.push("/");
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link
                  href={loginHref}
                  className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
                >
                  Log in
                </Link>
                <Button
                  asChild
                  className="bg-primary hover:bg-primary-dark dark:text-black text-white px-5 py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow-md"
                >
                  <Link href={signUpHref}>{signUpLabel}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
