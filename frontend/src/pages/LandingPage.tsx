import { Link } from "react-router-dom";
import { Activity, BarChart3, Bell, Bot, CheckCircle2, GitBranch, Github, Lock, MessageSquareQuote, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button, Card } from "../components/ui";

const features = [
  { icon: Bot, title: "AI Engineering Intelligence", text: "Ask senior-level questions across repositories, pull requests, workflow health, risk signals, and productivity trends." },
  { icon: BarChart3, title: "Live Analytics", text: "KPIs, charts, churn, heatmaps, and repository health are calculated from synced PostgreSQL data." },
  { icon: Github, title: "GitHub Sync", text: "Repositories, commits, branches, issues, pull requests, reviews, workflows, releases, topics, languages, stars, and forks stay connected." },
  { icon: Activity, title: "Repository Insights", text: "Spot stale work, failing builds, inactive repositories, risky backlogs, and delivery bottlenecks before they pile up." },
  { icon: CheckCircle2, title: "Productivity Tracking", text: "Follow contribution cadence, review throughput, build reliability, and developer-level delivery patterns." },
  { icon: Users, title: "Team Collaboration", text: "Shared views help team leads align reviews, ownership, follow-up, and risk reduction." }
];

const previewBars = [76, 44, 91, 62, 84, 57, 70];
const faqs = [
  ["Does DevPulse need write access?", "No. The app is designed around read-only GitHub intelligence and does not push commits or merge pull requests."],
  ["Where does the data live?", "Synced GitHub metadata and analytics live in PostgreSQL, with background jobs coordinated through Redis when configured."],
  ["Can AI see source code?", "The default assistant uses structured analytics context. Source-code inclusion is controlled through user AI preferences."],
  ["What happens after login?", "GitHub OAuth creates a secure session, encrypts tokens at rest, creates per-user settings, syncs repositories, then opens the dashboard."]
];

export function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link to="/" className="brand"><span>DP</span><strong>DevPulse</strong></Link>
        <nav aria-label="Landing navigation">
          <a href="#features">Features</a>
          <a href="#screenshots">Screenshots</a>
          <a href="#faq">FAQ</a>
          <Link to="/login">Login</Link>
        </nav>
        <Link to="/login"><Button><Github size={18} /> Login with GitHub</Button></Link>
      </header>

      <section className="landing-hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={16} /> Engineering intelligence for GitHub teams</div>
          <h1>DevPulse</h1>
          <p>Turn repository activity, pull requests, workflows, reviews, and delivery signals into a live command center for engineering performance.</p>
          <div className="actions">
            <Link to="/login"><Button><Github size={18} /> Login with GitHub</Button></Link>
            <a href="#features"><Button variant="secondary">Explore Features</Button></a>
          </div>
          <div className="trust-row">
            <span><Lock size={15} /> HttpOnly sessions</span>
            <span><ShieldCheck size={15} /> Encrypted GitHub tokens</span>
            <span><Bell size={15} /> Live notifications</span>
          </div>
        </div>
        <div className="dashboard-preview" aria-label="Animated dashboard preview">
          <div className="preview-top">
            <span />
            <strong>Engineering Health</strong>
            <em>Live</em>
          </div>
          <div className="preview-stats">
            <div><strong>92%</strong><span>Build success</span></div>
            <div><strong>18</strong><span>Open PRs</span></div>
            <div><strong>84</strong><span>Health score</span></div>
          </div>
          <div className="preview-chart">
            {previewBars.map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}
          </div>
          <div className="preview-list">
            <p><GitBranch size={16} /> api-service risk reduced after workflow recovery</p>
            <p><Bot size={16} /> AI summary ready from synced project data</p>
          </div>
        </div>
      </section>

      <section className="landing-section" id="features">
        <div className="section-title">
          <h2>Everything a production engineering dashboard needs</h2>
          <p>Focused analytics, practical AI, and secure GitHub synchronization in one workflow.</p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <Card key={feature.title}>
              <feature.icon size={22} />
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="landing-section screenshots" id="screenshots">
        <div className="section-title">
          <h2>Built for scanning, decisions, and follow-through</h2>
          <p>Dashboards keep operational signals dense, readable, and connected to source repositories.</p>
        </div>
        <div className="screenshot-grid">
          <div className="screenshot-panel"><strong>Dashboard</strong><span>KPIs, trends, heatmap, churn, AI insight</span></div>
          <div className="screenshot-panel"><strong>Repository</strong><span>Health, risks, pull requests, workflows</span></div>
          <div className="screenshot-panel"><strong>AI Assistant</strong><span>Database-grounded engineering answers</span></div>
        </div>
      </section>

      <section className="landing-section">
        <div className="testimonial-grid">
          <Card>
            <MessageSquareQuote size={22} />
            <p className="lead">DevPulse gives our standups a single source of truth for delivery health and review bottlenecks.</p>
            <strong>Engineering Manager, Platform Team</strong>
          </Card>
          <Card>
            <MessageSquareQuote size={22} />
            <p className="lead">The AI assistant feels like asking a senior engineer to summarize the week from real data.</p>
            <strong>Team Lead, Product Engineering</strong>
          </Card>
        </div>
      </section>

      <section className="landing-section" id="faq">
        <div className="section-title">
          <h2>FAQ</h2>
          <p>Security, data, and workflow basics before connecting GitHub.</p>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <div className="brand"><span>DP</span><strong>DevPulse</strong></div>
        <div>
          <a href="mailto:contact@devpulse.local">Contact</a>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
        </div>
      </footer>
    </div>
  );
}
