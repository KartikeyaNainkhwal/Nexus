"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Github,
  Kanban,
  LayoutDashboard,
  Linkedin,
  Mail,
  Shield,
  Sparkles,
  Star,
  Twitter,
  Users,
  Zap,
} from "lucide-react";
import { NexusLogo } from '@/components/shared/NexusLogo';
import { Button } from "@/components/ui/button";

/* ═══════════════════════════════════════════════════════════
   Animation helpers
   ═══════════════════════════════════════════════════════════ */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

/* ═══════════════════════════════════════════════════════════
   Data
   ═══════════════════════════════════════════════════════════ */
const LOGOS = [
  "Vercel", "Stripe", "Linear", "Notion", "Figma", "Slack",
];

const FEATURES = [
  {
    icon: Kanban,
    title: "Kanban Boards",
    description:
      "Drag-and-drop task management with customizable columns, priorities, and real-time status updates.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Beautiful charts and metrics. Track completion rates, team velocity, and project health at a glance.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Invite members, assign roles, and collaborate seamlessly with activity feeds and notifications.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Role-based access control, secure authentication, and organization-level data isolation.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Built on Next.js with optimistic UI updates, streaming SSR, and edge-ready middleware.",
  },
  {
    icon: LayoutDashboard,
    title: "Beautiful UI",
    description:
      "Glassmorphic design system with dark mode, smooth animations, and responsive layouts.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create your organization",
    description: "Sign up in seconds and set up your team workspace with a name and invite link.",
  },
  {
    step: "02",
    title: "Add projects & tasks",
    description: "Create projects, add tasks to your Kanban board, set priorities and due dates.",
  },
  {
    step: "03",
    title: "Ship faster together",
    description: "Track progress with real-time dashboards, collaborate with your team, and deliver.",
  },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for individuals and small teams getting started.",
    features: [
      "Up to 2 team members",
      "Up to 3 projects",
      "Kanban boards",
      "Basic analytics",
      "Activity feed",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Starter",
    price: "$9",
    period: "/mo",
    description: "Great for small teams that need room to grow.",
    features: [
      "Up to 5 team members",
      "Up to 10 projects",
      "Priority support",
      "Advanced analytics",
      "Custom project colors",
    ],
    cta: "Start Starter Plan",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For growing teams that need more power and flexibility.",
    features: [
      "Up to 25 team members",
      "Unlimited projects",
      "Priority support",
      "Advanced analytics",
      "Custom branding",
      "API access",
    ],
    cta: "Start Pro Plan",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/mo",
    description: "For large organizations with advanced security needs.",
    features: [
      "Unlimited team members",
      "Unlimited projects",
      "Dedicated support",
      "SSO & SAML",
      "Audit logs",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const FOOTER_LINKS: Record<string, { label: string; href: string }[]> = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "How it Works", href: "#how-it-works" },
  ],
  Resources: [
    { label: "Documentation", href: "/register" },
    { label: "Community", href: "/register" },
    { label: "Support", href: "/register" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/register" },
    { label: "Terms of Service", href: "/register" },
  ],
};

/* ═══════════════════════════════════════════════════════════
   Landing page
   ═══════════════════════════════════════════════════════════ */
export function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* ── Navigation ─────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-bg-base/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <NexusLogo className="h-8 w-8 text-accent" />
            <span className="text-lg font-bold text-text-primary">Nexus</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-text-muted hover:text-text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-text-muted hover:text-text-primary transition-colors">How it Works</a>
            <a href="#pricing" className="text-sm text-text-muted hover:text-text-primary transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="gap-1">
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28">
        {/* Glow orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-accent/20 blur-[120px]" />
          <div className="absolute top-60 -right-40 h-[300px] w-[400px] rounded-full bg-purple-500/15 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-6"
          >
            {/* Badge */}
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent-light">
              <Star className="h-3.5 w-3.5" /> Now in Public Beta
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-text-primary sm:text-6xl lg:text-7xl"
            >
              Project management{" "}
              <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
                that flows
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mx-auto max-w-2xl text-lg text-text-muted sm:text-xl"
            >
              Collaborate, track, and ship faster with Nexus. Beautiful Kanban boards,
              real-time dashboards, and seamless team collaboration — all in one place.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link href="/register">
                <Button size="lg" className="gap-2 px-8 text-base">
                  Start Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="gap-2 px-8 text-base">
                  See Features
                </Button>
              </a>
            </motion.div>
          </motion.div>

          {/* Dashboard screenshot mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="relative mx-auto mt-16 max-w-5xl"
          >
            <div className="glass rounded-2xl p-1.5 shadow-2xl shadow-accent/10">
              <div className="rounded-xl bg-bg-surface overflow-hidden">
                {/* Fake browser chrome */}
                <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="mx-auto flex h-7 w-80 items-center justify-center rounded-md bg-bg-elevated text-xs text-text-muted">
                    nexus.app/dashboard
                  </div>
                </div>
                {/* Dashboard mockup content */}
                <div className="p-6 space-y-4">
                  <div className="flex gap-4">
                    {/* Sidebar mock */}
                    <div className="hidden sm:block w-48 space-y-2">
                      {["Dashboard", "Projects", "Tasks", "Members"].map((item) => (
                        <div key={item} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-muted">
                          <div className="h-4 w-4 rounded bg-accent/20" />
                          {item}
                        </div>
                      ))}
                    </div>
                    {/* Main content mock */}
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: "Tasks", value: "128" },
                          { label: "Completed", value: "96" },
                          { label: "In Progress", value: "24" },
                          { label: "Team", value: "12" },
                        ].map((stat) => (
                          <div key={stat.label} className="rounded-lg bg-bg-elevated p-3">
                            <div className="text-xs text-text-muted">{stat.label}</div>
                            <div className="text-xl font-bold text-text-primary">{stat.value}</div>
                          </div>
                        ))}
                      </div>
                      {/* Chart placeholder */}
                      <div className="h-32 rounded-lg bg-bg-elevated flex items-end justify-around px-4 pb-4">
                        {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                          <div
                            key={i}
                            className="w-full max-w-[24px] rounded-t bg-gradient-to-t from-accent/60 to-accent"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Gradient fade at bottom */}
            <div className="absolute -bottom-1 left-0 right-0 h-20 bg-gradient-to-t from-bg-base to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* ── Trusted by logos ───────────────────────────── */}
      <section className="py-16 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-text-muted mb-8">
            Trusted by teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {LOGOS.map((name) => (
              <span
                key={name}
                className="text-lg font-semibold text-text-muted/50 tracking-wide"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm font-medium text-accent mb-2">
              Features
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl font-bold text-text-primary sm:text-4xl">
              Everything you need to ship faster
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mt-4 mx-auto max-w-2xl text-text-muted">
              From task management to analytics, Nexus gives your team the tools to
              collaborate effectively and deliver projects on time.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                custom={i}
                className="glass glass-hover rounded-2xl p-6 space-y-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────── */}
      <section id="how-it-works" className="py-20 sm:py-28 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm font-medium text-accent mb-2">
              How it works
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl font-bold text-text-primary sm:text-4xl">
              Up and running in minutes
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid gap-8 sm:grid-cols-3"
          >
            {STEPS.map((step, i) => (
              <motion.div
                key={step.step}
                variants={fadeUp}
                custom={i}
                className="relative text-center space-y-4"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-light text-white text-2xl font-bold shadow-lg shadow-accent/20">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {step.title}
                </h3>
                <p className="text-sm text-text-muted max-w-xs mx-auto">
                  {step.description}
                </p>
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-accent/40 to-accent/10" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────── */}
      <section id="pricing" className="py-20 sm:py-28 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm font-medium text-accent mb-2">
              Pricing
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl font-bold text-text-primary sm:text-4xl">
              Simple, transparent pricing
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mt-4 mx-auto max-w-xl text-text-muted">
              Start free and scale as your team grows. No hidden fees.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto"
          >
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                custom={i}
                className={`relative glass rounded-2xl p-6 space-y-6 ${plan.popular
                  ? "border-accent/40 shadow-lg shadow-accent/10 ring-1 ring-accent/20"
                  : "glass-hover"
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-medium text-white">
                    Most Popular
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">{plan.name}</h3>
                  <p className="mt-1 text-sm text-text-muted">{plan.description}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-text-primary">{plan.price}</span>
                  <span className="text-sm text-text-muted">{plan.period}</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-text-muted">
                      <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block">
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Section ────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent via-purple-600 to-accent-light p-12 sm:p-16 text-center"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20256%20256%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.85%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23n)%22%2F%3E%3C%2Fsvg%3E')] opacity-5" />

            <div className="relative space-y-6">
              <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                Ready to ship faster?
              </h2>
              <p className="mx-auto max-w-xl text-lg text-white/80">
                Join thousands of teams already using Nexus to manage projects,
                collaborate, and deliver results.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="gap-2 bg-white text-accent hover:bg-white/90 px-8 text-base font-semibold"
                  >
                    Start Free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-white/50">
                No credit card required · Free forever for small teams
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-border/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
            {/* Brand */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold text-text-primary">Nexus</span>
              </div>
              <p className="text-sm text-text-muted max-w-xs">
                Modern project management for teams that want to ship faster and collaborate better.
              </p>
              <div className="flex gap-4">
                {[
                  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
                  { icon: Github, href: "https://github.com", label: "GitHub" },
                  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
                  { icon: Mail, href: "mailto:hello@nexus.app", label: "Email" },
                ].map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-surface text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
              <div key={heading} className="space-y-3">
                <h4 className="text-sm font-semibold text-text-primary">{heading}</h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-text-muted hover:text-text-primary transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 border-t border-border/30 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-text-muted">
              &copy; {new Date().getFullYear()} Nexus. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="/register" className="text-xs text-text-muted hover:text-text-primary transition-colors">
                Privacy Policy
              </a>
              <a href="/register" className="text-xs text-text-muted hover:text-text-primary transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
