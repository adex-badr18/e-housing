import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  UserPlus,
  LogIn,
  ClipboardList,
  CheckCircle2,
  Building2,
  FileCheck,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-oau-navy border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo + Name */}
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0 flex items-center">
              <Image
                src="/oaulogo.png"
                alt="OAU Logo"
                width={180}
                height={30}
                className="object-contain h-10 w-auto rounded-sm"
                loading="eager"
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-oau-cream text-sm font-semibold leading-tight tracking-wide">
                Obafemi Awolowo University
              </p>
              <p className="text-oau-gold text-xs leading-tight">
                Staff Housing System
              </p>
            </div>
          </Link>

          {/* Right nav */}
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-oau-cream hover:text-oau-gold text-sm font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 whitespace-nowrap"
          >
            <LogIn className="size-4" />
            Staff Login
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ── Hero Section ──────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center bg-oau-navy overflow-hidden"
      aria-label="Hero"
    >
      {/* Decorative radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 15% 60%, rgba(228,187,103,0.07) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 20%, rgba(228,187,103,0.05) 0%, transparent 45%)
          `,
        }}
      />
      {/* Top gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgb(228,187,103)]/40 to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-32 pt-36">
        {/* Institution badge */}
        <div className="inline-flex items-center gap-2 border border-[rgb(228,187,103)]/40 rounded-full px-4 py-1.5 mb-8">
          <div className="size-1.5 rounded-full bg-[rgb(228,187,103)]" />
          <span className="text-oau-gold text-xs font-medium tracking-widest uppercase">
            Official Housing Portal
          </span>
        </div>

        {/* Main heading */}
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-oau-cream leading-tight mb-6">
          Staff Housing{" "}
          <span className="text-oau-gold italic">Allocation</span>
          {" & "}Management System
        </h1>

        {/* Tagline */}
        <p className="text-oau-cream text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-12">
          A seamless digital platform for staff housing applications, allocation,
          and management at{" "}
          <span className="text-oau-gold font-medium">
            Obafemi Awolowo University, Ile-Ife
          </span>
          .
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            id="hero-staff-login"
            href="/login"
            className="flex items-center gap-2 bg-[rgb(228,187,103)] text-[rgb(27,34,50)] font-semibold px-7 py-3.5 rounded-xl hover:bg-[rgb(228,187,103)]/90 transition-all hover:scale-105 active:scale-100 shadow-lg shadow-[rgb(228,187,103)]/20"
          >
            Staff Login
            <ArrowRight className="size-4" />
          </Link>
          <Link
            id="hero-register"
            href="/register"
            className="flex items-center gap-2 border border-oau-cream/30 text-oau-cream font-medium px-7 py-3.5 rounded-xl hover:bg-white/5 hover:border-oau-cream/50 transition-all"
          >
            Register as Staff
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-oau-cream/30">
        <span className="text-[10px] tracking-widest uppercase">Scroll</span>
        <ChevronDown className="size-4 animate-bounce" />
      </div>
    </section>
  );
}

// ── Portal Cards ──────────────────────────────────────────────────────────────
const portals = [
  {
    id: "admin-portal-card",
    icon: ShieldCheck,
    label: "Administration Portal",
    description:
      "For Housing Secretaries, Estate Officers, DVC Admins, Electrical Officers, and Superadmin.",
    badge: "Restricted Access",
    cta: "Admin Login",
    href: "/admin/login",
    accent: "rgb(228,187,103)",
    ctaVariant: "gold" as const,
  },
  {
    id: "register-portal-card",
    icon: UserPlus,
    label: "New Staff Registration",
    description:
      "Register with your OAU credentials to access the staff housing application portal.",
    badge: null,
    cta: "Register Now",
    href: "/register",
    accent: "rgb(27,34,50)",
    ctaVariant: "outline" as const,
  },
  {
    id: "staff-portal-card",
    icon: LogIn,
    label: "Staff Portal",
    description:
      "Sign in to manage your housing application, allocation status, and tenancy details.",
    badge: null,
    cta: "Staff Login",
    href: "/login",
    accent: "rgb(27,34,50)",
    ctaVariant: "navy" as const,
  },
];

function PortalsSection() {
  return (
    <section
      id="portals"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-white"
      aria-label="Portal Access"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-oau-gold text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            Portal Access
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[rgb(27,34,50)]">
            Choose Your Portal
          </h2>
          <p className="text-[rgb(27,34,50)]/55 mt-3 text-base max-w-lg mx-auto">
            Select the appropriate portal to access the system based on your
            role.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {portals.map((portal) => {
            const Icon = portal.icon;
            const isGold = portal.ctaVariant === "gold";
            const isNavy = portal.ctaVariant === "navy";

            return (
              <div
                key={portal.id}
                id={portal.id}
                className="group flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
                style={{ borderTop: `4px solid ${portal.accent}` }}
              >
                <div className="p-7 flex flex-col flex-1 gap-5">
                  {/* Icon + badge row */}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="size-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isGold
                          ? "rgba(228,187,103,0.12)"
                          : "rgba(27,34,50,0.07)",
                      }}
                    >
                      <Icon
                        className="size-6"
                        style={{ color: portal.accent }}
                      />
                    </div>
                    {portal.badge && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[rgb(228,187,103)] bg-[rgb(228,187,103)]/10 border border-[rgb(228,187,103)]/25 rounded-full px-2.5 py-1 whitespace-nowrap">
                        <ShieldCheck className="size-3" />
                        {portal.badge}
                      </span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <h3 className="font-heading text-xl font-semibold text-[rgb(27,34,50)] mb-2">
                      {portal.label}
                    </h3>
                    <p className="text-sm text-[rgb(27,34,50)]/55 leading-relaxed">
                      {portal.description}
                    </p>
                  </div>

                  {/* CTA */}
                  <Link href={portal.href} className="block">
                    <span
                      className={[
                        "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200",
                        isGold
                          ? "bg-[rgb(228,187,103)] text-[rgb(27,34,50)] hover:bg-[rgb(213,174,92)]"
                          : isNavy
                            ? "bg-[rgb(27,34,50)] text-[rgba(246,244,238,1)] hover:bg-[rgb(37,46,66)]"
                            : "border-2 border-[rgb(27,34,50)] text-[rgb(27,34,50)] hover:bg-[rgb(27,34,50)] hover:text-[rgba(246,244,238,1)]",
                      ].join(" ")}
                    >
                      {portal.cta}
                      <ArrowRight className="size-4" />
                    </span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Features Section ──────────────────────────────────────────────────────────
const features = [
  {
    icon: ClipboardList,
    title: "Online Application",
    description:
      "Submit and track housing applications entirely online. No paperwork, no queues.",
  },
  {
    icon: CheckCircle2,
    title: "Multi-Stage Review",
    description:
      "Transparent review by Housing Secretaries, Estate Officers, and DVC Admin.",
  },
  {
    icon: Building2,
    title: "Allocation Management",
    description:
      "Fair, point-based allocation with real-time status updates for all applicants.",
  },
  {
    icon: FileCheck,
    title: "Exit & Clearance",
    description:
      "Streamlined inspection and clearance workflow for staff vacating university housing.",
  },
];

function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-24 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: "rgba(27,34,50,0.03)" }}
      aria-label="System Features"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-oau-gold text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            What We Offer
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[rgb(27,34,50)]">
            A Complete Housing Solution
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-[rgb(228,187,103)]/30 transition-all duration-300 group"
              >
                <div className="size-11 rounded-lg bg-[rgb(228,187,103)]/10 flex items-center justify-center mb-4 group-hover:bg-[rgb(228,187,103)]/20 transition-colors">
                  <Icon className="size-5 text-oau-gold" />
                </div>
                <h3 className="font-semibold text-[rgb(27,34,50)] mb-2 text-sm">
                  {feature.title}
                </h3>
                <p className="text-xs text-[rgb(27,34,50)]/55 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-oau-navy border-t border-white/10 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Logo + Name */}
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0 flex items-center">
            <Image
              src="/oaulogo.png"
              alt="OAU Logo"
              width={180}
              height={30}
              className="object-contain h-10 w-auto rounded-sm"
            />
          </div>
          <div>
            <p className="text-oau-cream text-sm font-semibold leading-tight">
              Obafemi Awolowo University
            </p>
            <p className="text-oau-gold text-xs leading-tight">
              Staff Housing Management System
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center sm:text-right">
          <p className="text-oau-cream/40 text-xs">
            &copy; {year} Obafemi Awolowo University. All rights reserved.
          </p>
          <p className="text-oau-cream/30 text-xs mt-0.5">
            Official housing portal. For support, contact the Housing Unit.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <PortalsSection />
        <FeaturesSection />
      </main>
      <Footer />
    </>
  );
}
