import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Bot,
  Check,
  GitPullRequest,
  Github,
  LineChart,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/devpulse/Logo";

export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <LogosStrip />
      <Features />
      <DashboardPreview />
      <HowItWorks />
      <MetricsShowcase />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ---------------- Navigation ---------------- */

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Hero ---------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-20 text-center">
        <div className="animate-rise mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          Now with AI-powered insights
        </div>

        <h1 className="animate-rise mx-auto mt-8 max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
          Engineering intelligence,
          <br />
          <span className="text-muted-foreground">without the spreadsheets.</span>
        </h1>

        <p className="animate-rise mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
          DevPulse connects to GitHub and turns repository activity into a living
          dashboard — PR insights, workflow health, developer productivity, and
          AI recommendations, all in one place.
        </p>

        <div className="animate-rise mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 sm:w-auto"
          >
            <Github className="h-4 w-4" />
            Continue with GitHub
          </Link>
          <Link
            to="/app/dashboard"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-surface px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent sm:w-auto"
          >
            View live demo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Free for personal repos · Read-only GitHub scope · SOC-2 aligned
        </p>
      </div>
    </section>
  );
}

/* ---------------- Logos ---------------- */

function LogosStrip() {
  const names = ["Vercel", "Linear", "Supabase", "Stripe", "Notion", "Raycast"];
  return (
    <section className="border-b border-border/60 py-10">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Trusted by engineering teams shipping every day
        </p>
        <div className="grid grid-cols-3 items-center gap-8 opacity-60 md:grid-cols-6">
          {names.map((n) => (
            <div key={n} className="text-center text-sm font-semibold tracking-tight text-muted-foreground">
              {n}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Features ---------------- */

const FEATURES = [
  {
    icon: Github,
    title: "GitHub sync",
    body: "Connect your organization in seconds. DevPulse backfills history and stays live with webhooks.",
  },
  {
    icon: LineChart,
    title: "Repository analytics",
    body: "Commits, contributors, languages, and velocity — surfaced without a single custom query.",
  },
  {
    icon: GitPullRequest,
    title: "Pull request insights",
    body: "Track cycle time, review latency, and merge health across every PR your team ships.",
  },
  {
    icon: Workflow,
    title: "Workflow monitoring",
    body: "See CI pipelines, run times, and failure hotspots in one focused workflow view.",
  },
  {
    icon: Bot,
    title: "AI recommendations",
    body: "An engineering copilot that highlights bottlenecks and drafts weekly summaries for you.",
  },
  {
    icon: ShieldCheck,
    title: "Repository health",
    body: "Composite health scores flag risks in dependencies, test coverage, and review coverage.",
  },
];

function Features() {
  return (
    <section id="features" className="border-b border-border/60 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Platform"
          title="Everything your team needs to ship better."
          subtitle="One dashboard for repository health, developer productivity, and engineering KPIs — with an AI assistant on top."
        />
        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group bg-background p-6 transition-colors hover:bg-surface"
            >
              <div className="grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-primary transition-colors group-hover:border-primary/40">
                <f.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-5 text-[15px] font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Dashboard preview ---------------- */

function DashboardPreview() {
  return (
    <section className="border-b border-border/60 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Dashboard"
          title="A control room for your codebase."
          subtitle="Skim the health of every repo, spot regressions before they land, and get answers from the AI panel."
        />
        <div className="relative mt-14">
          <div className="pointer-events-none absolute -inset-2 rounded-2xl bg-primary/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-xl border border-border bg-surface shadow-elevated">
            <MockDashboard />
          </div>
        </div>
      </div>
    </section>
  );
}

function MockDashboard() {
  return (
    <div className="relative grid grid-cols-[220px_1fr]">
      <span className="absolute right-3 top-3 z-10 rounded-full border border-border bg-background/80 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground backdrop-blur">
        Illustrative preview
      </span>
      {/* Sidebar */}
      <aside className="hidden border-r border-border bg-sidebar p-4 md:block">
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="grid h-6 w-6 place-items-center rounded bg-primary text-primary-foreground">
            <Activity className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm font-semibold tracking-tight">DevPulse</span>
        </div>
        <nav className="space-y-1 text-sm">
          {[
            ["Dashboard", true],
            ["Repositories", false],
            ["Pull requests", false],
            ["AI workspace", false],
            ["Reports", false],
            ["Settings", false],
          ].map(([label, active]) => (
            <div
              key={label as string}
              className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />
              {label}
            </div>
          ))}
        </nav>
      </aside>
      {/* Main */}
      <div className="p-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Overview
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">
              Engineering health
            </div>
          </div>
          <div className="hidden gap-2 md:flex">
            <div className="rounded-md border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
              Last 30 days
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Cycle time", "2.4d", "−12%", "success"],
            ["PR throughput", "142", "+18%", "success"],
            ["Health score", "94", "Optimum", "info"],
            ["Open risks", "3", "Attention", "warning"],
          ].map(([label, value, delta, tone]) => (
            <div
              key={label as string}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                {label}
              </div>
              <div className="mt-2 font-mono text-2xl font-semibold tracking-tight">
                {value}
              </div>
              <div
                className={`mt-1.5 text-[11px] ${
                  tone === "success"
                    ? "text-success"
                    : tone === "warning"
                      ? "text-warning"
                      : "text-info"
                }`}
              >
                {delta}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-4 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-medium">Deployment velocity</div>
              <div className="text-xs text-muted-foreground">7d · 30d · 90d</div>
            </div>
            <PreviewChart />
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/[0.06] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <div className="text-xs font-semibold uppercase tracking-widest text-primary">
                AI insight
              </div>
            </div>
            <p className="text-sm leading-relaxed">
              Review latency on{" "}
              <span className="font-mono">pulse-core</span> is 22% above your
              org average. Two PRs have been idle for 3+ days.
            </p>
            <button className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
              View recommendation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewChart() {
  // Static SVG line chart — no runtime cost, always crisp.
  const points =
    "0,60 40,55 80,58 120,42 160,45 200,30 240,34 280,22 320,28 360,15 400,20 440,10";
  return (
    <svg viewBox="0 0 440 90" className="h-32 w-full">
      <defs>
        <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <polygon
        points={`${points} 440,90 0,90`}
        fill="url(#lg)"
      />
    </svg>
  );
}

/* ---------------- How it works ---------------- */

function HowItWorks() {
  const steps = [
    {
      icon: Github,
      title: "Connect GitHub",
      body: "One click OAuth. Read-only scope. DevPulse never writes to your repos.",
    },
    {
      icon: Zap,
      title: "Auto-sync history",
      body: "We backfill commits, PRs, workflows, and reviewers — usually within a minute.",
    },
    {
      icon: Sparkles,
      title: "Get insights",
      body: "Live dashboards, weekly AI summaries, and recommendations tailored to your team.",
    },
  ];
  return (
    <section id="how" className="border-b border-border/60 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="How it works"
          title="Value in under two minutes."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-md border border-border bg-background font-mono text-xs text-muted-foreground">
                  0{i + 1}
                </span>
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="mt-5 text-base font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Metrics showcase ---------------- */

function MetricsShowcase() {
  const bullets = [
    "DORA metrics out of the box (deploy frequency, lead time, MTTR, change fail rate).",
    "Per-repo health scoring with weighted signals for reviews, tests, and risk.",
    "Contributor profiles with contribution heatmap and language breakdown.",
    "Weekly AI summaries emailed to team leads — no more manual reporting.",
  ];
  return (
    <section className="border-b border-border/60 py-24">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 md:grid-cols-2 md:items-center">
        <div>
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Why DevPulse
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Built for the way modern engineering teams actually work.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Stop stitching together GitHub Insights, spreadsheets, and Slack
            standups. DevPulse gives leads and ICs the same source of truth.
          </p>
          <ul className="mt-8 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-foreground/90">{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono uppercase tracking-widest">
              Weekly AI summary
            </span>
            <span>Example output</span>
          </div>
          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              <span className="font-semibold text-foreground">Highlights.</span>{" "}
              Team merged 42 PRs (+18% vs last week). Cycle time dropped to 2.4
              days. Two flaky workflows fixed.
            </p>
            <p>
              <span className="font-semibold text-foreground">Watch.</span>{" "}
              <span className="font-mono">pulse-core</span> shows rising review
              latency. Consider rotating a second reviewer.
            </p>
            <p>
              <span className="font-semibold text-foreground">Suggested actions.</span>{" "}
              Break down PR #1284 (1.2k LOC) into smaller units. Add codeowner
              rules for <span className="font-mono">/auth</span>.
            </p>
          </div>
          <div className="mt-6 flex gap-2">
            <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
              Open in workspace
            </button>
            <button className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
              Share
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */

const FAQS = [
  {
    q: "Does DevPulse write to my repositories?",
    a: "No. DevPulse uses a read-only GitHub scope. We never push commits, open PRs, or modify settings.",
  },
  {
    q: "How long does the initial sync take?",
    a: "Most personal orgs sync in under a minute. Larger orgs with 100+ repos usually finish within 10 minutes.",
  },
  {
    q: "Which metrics are supported?",
    a: "DORA metrics, cycle time, PR throughput, review latency, workflow reliability, contributor activity, and repository health scores.",
  },
  {
    q: "Can I self-host?",
    a: "Enterprise self-hosting is on the roadmap. Reach out to be part of the pilot.",
  },
];

function FAQ() {
  return (
    <section id="faq" className="border-b border-border/60 py-24">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeader eyebrow="FAQ" title="Frequently asked." />
        <div className="mt-10 divide-y divide-border rounded-xl border border-border bg-surface">
          {FAQS.map((f) => (
            <details key={f.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
                {f.q}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */

function FinalCTA() {
  return (
    <section className="border-b border-border/60 py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
          See your engineering signal.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Two minutes to connect. Zero risk. Cancel your spreadsheets.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <Github className="h-4 w-4" />
            Continue with GitHub
          </Link>
          <Link
            to="/app/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-medium text-foreground hover:bg-accent"
          >
            View demo dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */

function Footer() {
  return (
    <footer className="py-16">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-12 px-6 md:flex-row">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm text-muted-foreground">
            Engineering intelligence for teams that value velocity and craft.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-12 md:grid-cols-3">
          <FooterCol
            title="Product"
            links={["Features", "Dashboard", "AI workspace", "Reports"]}
          />
          <FooterCol
            title="Company"
            links={["About", "Blog", "Careers", "Contact"]}
          />
          <FooterCol
            title="Resources"
            links={["Docs", "Changelog", "Privacy", "Terms"]}
          />
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl items-center justify-between border-t border-border/60 px-6 pt-6 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} DevPulse. All rights reserved.</span>
        <span className="font-mono">Built for engineers.</span>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-semibold uppercase tracking-widest text-foreground">
        {title}
      </div>
      {links.map((l) => (
        <a
          key={l}
          href="#"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {l}
        </a>
      ))}
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {eyebrow}
      </div>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-pretty text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}
