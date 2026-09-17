/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  AppWindow,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Command,
  CreditCard,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api, auth, API_URL } from "@/lib/api";
import QRCode from "react-qr-code";
type AppRecord = {
  id: string;
  name: string;
  slug: string;
  url: string;
  environment: string;
  status: "healthy" | "degraded" | "maintenance";
  visitors: number;
  users: number;
  events: number;
  revenue: number;
  change: number;
  accent: string;
  initials: string;
};
type Profile = { name: string; email: string; mfa_enabled: boolean };
type Dashboard = {
  totals: { visitors: number; users: number; events: number; revenue: number };
  apps: AppRecord[];
  traffic: { day: string; visitors: number; users: number }[];
  live: { active: number; page_views: number; events: number };
};
type Payment = {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  application: string;
  plan_name: string | null;
  amount_minor: number;
  currency: string;
  status: string;
  created_at: string;
};
const nav = [
  ["overview", "Overview", LayoutDashboard],
  ["apps", "Applications", AppWindow],
  ["engagement", "Engagement", BarChart3],
  ["payments", "Payments", CreditCard],
  ["alerts", "Alerts", Bell],
  ["settings", "Settings", Settings],
] as const;
const compact = (v: number) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v || 0);
const money = (v: number, c = "USD") =>
  new Intl.NumberFormat("en", {
    style: "currency",
    currency: c,
    maximumFractionDigits: 0,
  }).format((v || 0) / 100);
export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const check = useCallback(
    () =>
      api<Profile>("/api/auth/me")
        .then(setProfile)
        .catch(() => {
          auth.clear();
          setProfile(null);
        })
        .finally(() => setLoading(false)),
    [],
  );
  useEffect(() => {
    if (auth.get()) check();
    else setLoading(false);
  }, [check]);
  if (loading)
    return (
      <div className="auth-page">
        <div className="auth-card">
          <RefreshCw className="spin" />
          <p>Loading AppScope…</p>
        </div>
      </div>
    );
  if (!profile)
    return (
      <Login
        onLogin={(p) => {
          setProfile(p);
          setError("");
        }}
        error={error}
        setError={setError}
      />
    );
  return (
    <DashboardApp
      profile={profile}
      onProfile={setProfile}
      onLogout={async () => {
        try {
          await api("/api/auth/logout", { method: "POST" });
        } catch {}
        auth.clear();
        setProfile(null);
      }}
    />
  );
}
function Login({
  onLogin,
  error,
  setError,
}: {
  onLogin: (p: Profile) => void;
  error: string;
  setError: (x: string) => void;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [temp, setTemp] = useState(""),
    [code, setCode] = useState("");
  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      if (temp) {
        const x = await api<{ token: string }>("/api/auth/mfa/verify", {
          method: "POST",
          body: JSON.stringify({ temp_token: temp, code }),
        });
        auth.set(x.token);
      } else {
        const x = await api<{
          token?: string;
          mfa_required: boolean;
          temp_token?: string;
        }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        if (x.mfa_required) {
          setTemp(x.temp_token!);
          return;
        }
        auth.set(x.token!);
      }
      onLogin(await api<Profile>("/api/auth/me"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-page">
      <form
        className="auth-card"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="auth-brand">
          <span className="brand-mark">
            <Command size={19} />
          </span>
          <strong>AppScope</strong>
        </div>
        <h1>{temp ? "Verify your identity" : "Administrator sign in"}</h1>
        <p>
          {temp
            ? "Enter the code from your authenticator app or a recovery code."
            : "This control center is restricted to the single administrator account."}
        </p>
        {error && <div className="form-error">{error}</div>}
        {temp ? (
          <>
            <Label htmlFor="code">Authentication code</Label>
            <Input
              id="code"
              autoFocus
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
            />
          </>
        ) : (
          <>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </>
        )}
        <Button disabled={busy}>
          {busy ? "Please wait…" : temp ? "Verify and continue" : "Sign in"}
        </Button>
        {temp && (
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setTemp("");
              setCode("");
            }}
          >
            Back to sign in
          </button>
        )}
      </form>
    </div>
  );
}
function DashboardApp({
  profile,
  onProfile,
  onLogout,
}: {
  profile: Profile;
  onProfile: (p: Profile) => void;
  onLogout: () => void;
}) {
  const [active, setActive] = useState("overview"),
    [data, setData] = useState<Dashboard | null>(null),
    [selected, setSelected] = useState("all"),
    [query, setQuery] = useState(""),
    [mobile, setMobile] = useState(false),
    [addOpen, setAddOpen] = useState(false),
    [notice, setNotice] = useState("");
  const load = useCallback(
    () =>
      api<Dashboard>("/api/dashboard?days=7")
        .then(setData)
        .catch((e) => setNotice(e.message)),
    [],
  );
  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);
  const apps = data?.apps || [];
  const filtered =
    selected === "all" ? apps : apps.filter((a) => a.id === selected);
  const totals = useMemo(
    () =>
      filtered.reduce(
        (t, a) => ({
          visitors: t.visitors + a.visitors,
          users: t.users + a.users,
          events: t.events + a.events,
          revenue: t.revenue + a.revenue,
        }),
        { visitors: 0, users: 0, events: 0, revenue: 0 },
      ),
    [filtered],
  );
  return (
    <div className="app-shell">
      <aside className={"side-rail " + (mobile ? "is-open" : "")}>
        <div className="brand">
          <span className="brand-mark">
            <Command size={18} />
          </span>
          <span>AppScope</span>
          <button className="mobile-close" onClick={() => setMobile(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="workspace">
          <div className="workspace-avatar">AD</div>
          <div>
            <strong>Admin workspace</strong>
            <span>Live control center</span>
          </div>
          <ChevronDown size={16} />
        </div>
        <nav className="main-nav">
          <p>Workspace</p>
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={active === id ? "active" : ""}
              onClick={() => {
                setActive(id);
                setMobile(false);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="rail-health">
          <div className="health-head">
            <span>
              <Gauge size={16} />
              API status
            </span>
            <strong>Online</strong>
          </div>
          <div className="health-track">
            <i />
          </div>
          <small>Refreshing every 5 seconds</small>
        </div>
        <div className="profile">
          <div className="avatar">{profile.name.slice(0, 2).toUpperCase()}</div>
          <div>
            <strong>{profile.name}</strong>
            <span>Administrator</span>
          </div>
          <button onClick={onLogout} aria-label="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      {mobile && (
        <button className="overlay" onClick={() => setMobile(false)} />
      )}
      <main className="main-panel">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobile(true)}>
            <Menu size={20} />
          </button>
          <div className="app-filter">
            <span>Viewing</span>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="all">All applications</option>
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="top-actions">
            <button className="icon-button" onClick={load}>
              <RefreshCw size={17} />
            </button>
            <Button className="add-button" onClick={() => setAddOpen(true)}>
              <Plus size={17} />
              Add application
            </Button>
          </div>
        </header>
        {notice && (
          <button className="notice" onClick={() => setNotice("")}>
            {notice} ×
          </button>
        )}
        <div className="content">
          {active === "overview" && (
            <Overview data={data} totals={totals} setActive={setActive} />
          )}{" "}
          {active === "apps" && (
            <Applications
              apps={apps}
              query={query}
              setQuery={setQuery}
              reload={load}
              onAdd={() => setAddOpen(true)}
              setNotice={setNotice}
            />
          )}{" "}
          {active === "engagement" && <Engagement />}
          {active === "payments" && <Payments apps={apps} />}{" "}
          {active === "alerts" && <Alerts />}
          {active === "settings" && (
            <SettingsPanel profile={profile} onProfile={onProfile} />
          )}
        </div>
      </main>
      <AddApp
        open={addOpen}
        setOpen={setAddOpen}
        onAdded={() => {
          load();
          setActive("apps");
        }}
      />
    </div>
  );
}
function PageHead({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions}
    </div>
  );
}
function Overview({
  data,
  totals,
  setActive,
}: {
  data: Dashboard | null;
  totals: Dashboard["totals"];
  setActive: (x: string) => void;
}) {
  const metrics = [
    [Users, "Unique visitors", compact(totals.visitors), "blue"],
    [Activity, "Identified users", compact(totals.users), "purple"],
    [Gauge, "Tracked events", compact(totals.events), "mint"],
    [CircleDollarSign, "Net revenue", money(totals.revenue), "gold"],
  ] as const;
  return (
    <>
      <PageHead
        eyebrow="Control center"
        title="Live operations"
        description="Real activity across your connected products."
      />
      <section className="metric-grid">
        {metrics.map(([Icon, label, value, tone]) => (
          <article className="metric-card" key={label}>
            <div className={"metric-icon " + tone}>
              <Icon size={19} />
            </div>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>
              <i className="live-dot" />
              Live database data
            </small>
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <article className="panel traffic-panel">
          <div className="panel-head">
            <div>
              <h2>Audience growth</h2>
              <p>Visitors and identified users · last 7 days</p>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <AreaChart
                data={data?.traffic || []}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="#e7eaf0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="#3979ff"
                  fill="#3979ff22"
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#7c5cff"
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="panel pulse-panel">
          <div className="panel-head">
            <div>
              <h2>Live pulse</h2>
              <p>Activity from the database</p>
            </div>
            <span className="live">
              <i />
              Live
            </span>
          </div>
          <strong className="live-number">{data?.live.active || 0}</strong>
          <span className="live-label">people active in 5 minutes</span>
          <div className="pulse-bars">
            {(data?.traffic || []).map((x, i) => (
              <i
                key={i}
                style={{
                  height: Math.max(8, Math.min(100, x.visitors / 10)) + "%",
                }}
              />
            ))}
          </div>
          <div className="pulse-foot">
            <span>
              Page views <b>{data?.live.page_views || 0}</b>
            </span>
            <span>
              Events <b>{data?.live.events || 0}</b>
            </span>
          </div>
        </article>
      </section>
      <article className="panel apps-panel">
        <div className="panel-head">
          <div>
            <h2>Applications</h2>
            <p>Performance at a glance</p>
          </div>
          <button className="text-button" onClick={() => setActive("apps")}>
            Manage
          </button>
        </div>
        <div className="app-rows">
          {(data?.apps || []).map((a) => (
            <div className="app-row" key={a.id}>
              <span className="app-logo" style={{ background: a.accent }}>
                {a.initials}
              </span>
              <div className="app-name">
                <strong>{a.name}</strong>
                <span>{a.slug}</span>
              </div>
              <Status value={a.status} />
              <div className="app-stat">
                <strong>{compact(a.users)}</strong>
                <span>users</span>
              </div>
              <div className="app-stat">
                <strong>{money(a.revenue)}</strong>
                <span>revenue</span>
              </div>
            </div>
          ))}
        </div>
      </article>
    </>
  );
}
function Status({ value }: { value: AppRecord["status"] }) {
  return (
    <span className={"status " + value}>
      <i />
      {value}
    </span>
  );
}
function AddApp({
  open,
  setOpen,
  onAdded,
}: {
  open: boolean;
  setOpen: (x: boolean) => void;
  onAdded: () => void;
}) {
  const [draft, setDraft] = useState({
      name: "",
      url: "",
      environment: "Production",
    }),
    [key, setKey] = useState(""),
    [error, setError] = useState("");
  const submit = async () => {
    setError("");
    try {
      const x = await api<AppRecord & { ingestion_key: string }>("/api/apps", {
        method: "POST",
        body: JSON.stringify(draft),
      });
      setKey(x.ingestion_key);
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create application");
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="dialog-panel">
        <DialogHeader>
          <DialogTitle>
            {key ? "Install tracking" : "Add an application"}
          </DialogTitle>
          <DialogDescription>
            {key
              ? "Copy this key now. It is shown only once."
              : "Register a website and begin collecting live activity."}
          </DialogDescription>
        </DialogHeader>
        {key ? (
          <div className="form-grid">
            <Label>Ingestion key</Label>
            <code className="secret-box">{key}</code>
            <p>Add tracker.js using the instructions in backend/README.md.</p>
            <Button
              onClick={() => {
                setOpen(false);
                setKey("");
                setError("");
                setDraft({ name: "", url: "", environment: "Production" });
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="form-grid">
            {error && <div className="form-error">{error}</div>}
            <Label>Name</Label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <Label>Website URL</Label>
            <Input
              placeholder="https://example.com"
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            />
            <Label>Environment</Label>
            <select
              value={draft.environment}
              onChange={(e) =>
                setDraft({ ...draft, environment: e.target.value })
              }
            >
              <option>Production</option>
              <option>Staging</option>
              <option>Development</option>
            </select>
            <Button onClick={submit}>Create application</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
function Applications({
  apps,
  query,
  setQuery,
  reload,
  onAdd,
  setNotice,
}: {
  apps: AppRecord[];
  query: string;
  setQuery: (x: string) => void;
  reload: () => void;
  onAdd: () => void;
  setNotice: (x: string) => void;
}) {
  const [deleting, setDeleting] = useState<AppRecord | null>(null);
  const shown = apps.filter(
    (a) =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.slug.toLowerCase().includes(query.toLowerCase()),
  );
  const toggle = async (a: AppRecord) => {
    try {
      await api(`/api/apps/${a.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: a.status === "maintenance" ? "healthy" : "maintenance",
        }),
      });
      reload();
    } catch (e) {
      setNotice((e as Error).message);
    }
  };
  const rotate = async (a: AppRecord) => {
    try {
      if (
        !confirm(
          `Rotate the ingestion key for ${a.name}? The existing tracker will stop working.`,
        )
      )
        return;
      const x = await api<{ ingestion_key: string }>(
        `/api/apps/${a.id}/rotate-key`,
        { method: "POST" },
      );
      prompt(
        "Copy the new key now. It will not be shown again.",
        x.ingestion_key,
      );
    } catch (e) {
      setNotice((e as Error).message);
    }
  };
  return (
    <>
      <PageHead
        eyebrow="Portfolio"
        title="Applications"
        description="Register and control every monitored website."
        actions={
          <Button onClick={onAdd}>
            <Plus size={17} />
            Add application
          </Button>
        }
      />
      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search applications"
          />
        </div>
      </div>
      <div className="app-card-grid">
        {shown.map((a) => (
          <article className="application-card" key={a.id}>
            <div className="application-top">
              <span className="app-logo large" style={{ background: a.accent }}>
                {a.initials}
              </span>
              <div>
                <button
                  aria-label={`Delete ${a.name}`}
                  onClick={() => setDeleting(a)}
                >
                  <Trash2 size={18} />
                </button>
                <button aria-label="Application menu">
                  <MoreHorizontal size={20} />
                </button>
              </div>
            </div>
            <h2>{a.name}</h2>
            <p>
              {a.slug} · {a.environment}
            </p>
            <div className="app-kpis">
              <div>
                <strong>{compact(a.visitors)}</strong>
                <span>Visitors</span>
              </div>
              <div>
                <strong>{compact(a.users)}</strong>
                <span>Users</span>
              </div>
              <div>
                <strong>{compact(a.events)}</strong>
                <span>Events</span>
              </div>
            </div>
            <div className="application-footer">
              <Status value={a.status} />
              <label>
                <span>Maintenance</span>
                <Switch
                  checked={a.status === "maintenance"}
                  onCheckedChange={() => toggle(a)}
                />
              </label>
            </div>
            <div className="key-row">
              <KeyRound size={15} />
              <span>Ingestion key</span>
              <code>stored securely</code>
              <button onClick={() => rotate(a)}>Rotate</button>
            </div>
          </article>
        ))}
      </div>
      {!shown.length && (
        <Empty text="No applications found. Add your first website to begin." />
      )}
      <DeleteAppDialog
        app={deleting}
        setApp={setDeleting}
        onDeleted={() => {
          reload();
          setNotice("Application deleted.");
        }}
      />
    </>
  );
}
function DeleteAppDialog({
  app,
  setApp,
  onDeleted,
}: {
  app: AppRecord | null;
  setApp: (x: AppRecord | null) => void;
  onDeleted: () => void;
}) {
  const [password, setPassword] = useState(""),
    [code, setCode] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const close = () => {
    setApp(null);
    setPassword("");
    setCode("");
    setError("");
    setBusy(false);
  };
  const submit = async () => {
    if (!app) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/apps/${app.id}`, {
        method: "DELETE",
        body: JSON.stringify({ password, code }),
      });
      close();
      onDeleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete application");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open={!!app}
      onOpenChange={(x) => {
        if (!x) close();
      }}
    >
      <DialogContent className="dialog-panel">
        <DialogHeader>
          <DialogTitle>Delete application</DialogTitle>
          <DialogDescription>
            This removes the application, visitors, events, payments, alerts,
            and saved provider connections.
          </DialogDescription>
        </DialogHeader>
        <div className="form-grid">
          {error && <div className="form-error">{error}</div>}
          <p>{app?.name}</p>
          <Label>Password</Label>
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Label>MFA code</Label>
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Required when MFA is enabled"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button
            variant="destructive"
            disabled={busy || !password}
            onClick={submit}
          >
            {busy ? "Deleting..." : "Delete application"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function Engagement() {
  const [rows, setRows] = useState<
    {
      event_name: string;
      application: string;
      count: number;
      percentage: number;
    }[]
  >([]);
  useEffect(() => {
    api<typeof rows>("/api/engagement?days=7").then(setRows);
  }, []);
  return (
    <>
      <PageHead
        eyebrow="Product analytics"
        title="Engagement"
        description="Live custom events sent by your connected products."
      />
      <article className="panel event-table">
        <div className="panel-head">
          <div>
            <h2>Top events</h2>
            <p>Last 7 days</p>
          </div>
        </div>
        {rows.map((x) => (
          <div className="table-row" key={x.event_name + x.application}>
            <code>{x.event_name}</code>
            <span>{x.application}</span>
            <strong>{compact(x.count)}</strong>
            <span>{x.percentage}%</span>
          </div>
        ))}
        {!rows.length && (
          <Empty text="Events will appear after tracker.js is installed." />
        )}
      </article>
    </>
  );
}
function Payments({ apps }: { apps: AppRecord[] }) {
  const [data, setData] = useState<any>({
      summary: {},
      transactions: [],
      connections: [],
    }),
    [open, setOpen] = useState(false);
  const load = useCallback(() => api<any>("/api/payments").then(setData), []);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <>
      <PageHead
        eyebrow="Revenue operations"
        title="Payments"
        description="Transactions normalized from connected payment providers."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus size={17} />
            Connect provider
          </Button>
        }
      />
      <section className="metric-grid payment-metrics">
        {[
          ["Gross volume", money(+data.summary.gross_volume || 0)],
          ["Customers", compact(+data.summary.customers || 0)],
          ["Payment success", `${data.summary.success_rate || 0}%`],
          ["Outstanding", money(+data.summary.outstanding || 0)],
        ].map(([a, b]) => (
          <article className="metric-card" key={a}>
            <span>{a}</span>
            <strong>{b}</strong>
            <small>Last 30 days</small>
          </article>
        ))}
      </section>
      <article className="panel payment-table">
        <div className="panel-head">
          <div>
            <h2>Recent transactions</h2>
            <p>Unified activity across all providers</p>
          </div>
        </div>
        <div className="payments-head">
          <span>Customer</span>
          <span>Application</span>
          <span>Plan</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Time</span>
        </div>
        {data.transactions.map((p: Payment) => (
          <div className="payments-row" key={p.id}>
            <div>
              <strong>{p.customer_name || "Unknown"}</strong>
              <span>{p.customer_email || "—"}</span>
            </div>
            <span>{p.application}</span>
            <span>{p.plan_name || "—"}</span>
            <strong>{money(+p.amount_minor, p.currency)}</strong>
            <span className={"payment-status " + p.status}>{p.status}</span>
            <span>{new Date(p.created_at).toLocaleString()}</span>
          </div>
        ))}
        {!data.transactions.length && (
          <Empty text="Transactions appear after a payment provider sends a webhook." />
        )}
      </article>
      <ConnectPayment
        open={open}
        setOpen={setOpen}
        apps={apps}
        onDone={() => {
          setOpen(false);
          load();
        }}
      />
    </>
  );
}
function ConnectPayment({
  open,
  setOpen,
  apps,
  onDone,
}: {
  open: boolean;
  setOpen: (x: boolean) => void;
  apps: AppRecord[];
  onDone: () => void;
}) {
  const [v, setV] = useState({
      application_id: "",
      provider: "stripe",
      display_name: "",
      api_key: "",
      webhook_secret: "",
    }),
    [url, setUrl] = useState("");
  const submit = async () => {
    const x = await api<{ webhook_url: string }>("/api/payment-connections", {
      method: "POST",
      body: JSON.stringify(v),
    });
    setUrl(x.webhook_url);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="dialog-panel">
        <DialogHeader>
          <DialogTitle>Connect payment provider</DialogTitle>
          <DialogDescription>
            Credentials are encrypted by the PHP API and never returned.
          </DialogDescription>
        </DialogHeader>
        {url ? (
          <div className="form-grid">
            <Label>Webhook URL</Label>
            <code className="secret-box">{url}</code>
            <p>
              Add this URL in your provider dashboard, subscribe to payment
              events, then close this window.
            </p>
            <Button onClick={onDone}>Done</Button>
          </div>
        ) : (
          <div className="form-grid">
            <Label>Application</Label>
            <select
              value={v.application_id}
              onChange={(e) => setV({ ...v, application_id: e.target.value })}
            >
              <option value="">Choose application</option>
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <Label>Provider</Label>
            <select
              value={v.provider}
              onChange={(e) => setV({ ...v, provider: e.target.value })}
            >
              <option value="stripe">Stripe</option>
              <option value="paystack">Paystack</option>
              <option value="flutterwave">Flutterwave</option>
            </select>
            <Label>API key</Label>
            <Input
              type="password"
              value={v.api_key}
              onChange={(e) => setV({ ...v, api_key: e.target.value })}
            />
            <Label>Webhook signing secret</Label>
            <Input
              type="password"
              value={v.webhook_secret}
              onChange={(e) => setV({ ...v, webhook_secret: e.target.value })}
            />
            <Button
              disabled={!v.application_id || !v.api_key || !v.webhook_secret}
              onClick={submit}
            >
              Connect securely
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
function Alerts() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    api<any[]>("/api/alerts").then(setRows);
  }, []);
  return (
    <>
      <PageHead
        eyebrow="Operations"
        title="Alerts"
        description="Operational and payment issues requiring attention."
      />
      <div className="alert-list">
        {rows.map((a) => (
          <article
            className={
              "panel alert-card " +
              (a.severity === "critical" ? "urgent" : a.severity)
            }
            key={a.id}
          >
            <span>
              {a.severity === "critical" ? <AlertTriangle /> : <CheckCircle2 />}
            </span>
            <div>
              <strong>{a.title}</strong>
              <p>{a.message}</p>
              <small>
                {a.application || "System"} ·{" "}
                {new Date(a.created_at).toLocaleString()}
              </small>
            </div>
          </article>
        ))}
        {!rows.length && <Empty text="No unresolved alerts." />}
      </div>
    </>
  );
}
function SettingsPanel({
  profile,
  onProfile,
}: {
  profile: Profile;
  onProfile: (p: Profile) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PageHead
        eyebrow="Security"
        title="Settings"
        description="Protect the only administrator account and configure integrations."
      />
      <div className="settings-grid">
        <article className="panel settings-card">
          <ShieldCheck />
          <div>
            <h2>Multi-factor authentication</h2>
            <p>
              {profile.mfa_enabled
                ? "MFA is enabled for this administrator."
                : "Add a time-based one-time password as a second login factor."}
            </p>
          </div>
          <button onClick={() => setOpen(true)}>
            {profile.mfa_enabled ? "Manage" : "Enable MFA"}
          </button>
        </article>
        <article className="panel settings-card">
          <WalletCards />
          <div>
            <h2>Payment providers</h2>
            <p>
              Connect providers from the Payments page and copy their unique
              webhook URLs.
            </p>
          </div>
        </article>
        <article className="panel settings-card">
          <Activity />
          <div>
            <h2>Telemetry endpoint</h2>
            <p>{API_URL}/api/events</p>
          </div>
        </article>
      </div>
      <MfaDialog
        open={open}
        setOpen={setOpen}
        profile={profile}
        onProfile={onProfile}
      />
    </>
  );
}
function MfaDialog({
  open,
  setOpen,
  profile,
  onProfile,
}: {
  open: boolean;
  setOpen: (x: boolean) => void;
  profile: Profile;
  onProfile: (p: Profile) => void;
}) {
  const [setup, setSetup] = useState<{
      secret: string;
      otpauth_uri: string;
    } | null>(null),
    [code, setCode] = useState(""),
    [codes, setCodes] = useState<string[]>([]);
  useEffect(() => {
    if (open && !profile.mfa_enabled && !setup)
      api<any>("/api/auth/mfa/setup", { method: "POST" }).then(setSetup);
  }, [open, profile.mfa_enabled, setup]);
  const confirmMfa = async () => {
    const x = await api<{ recovery_codes: string[] }>("/api/auth/mfa/confirm", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    setCodes(x.recovery_codes);
    onProfile({ ...profile, mfa_enabled: true });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="dialog-panel">
        <DialogHeader>
          <DialogTitle>Multi-factor authentication</DialogTitle>
          <DialogDescription>
            {profile.mfa_enabled
              ? "MFA is active. Disabling it requires your password and a current code through the API."
              : "Add the URI to any TOTP authenticator, then enter the current code."}
          </DialogDescription>
        </DialogHeader>
        {profile.mfa_enabled && !codes.length ? (
          <div className="success-box">
            <ShieldCheck />
            <strong>Your account is protected by MFA.</strong>
          </div>
        ) : codes.length ? (
          <div className="form-grid">
            <Label>Recovery codes — save them now</Label>
            <code className="recovery-codes">{codes.join("\n")}</code>
            <Button onClick={() => setOpen(false)}>I saved the codes</Button>
          </div>
        ) : (
          <div className="form-grid">
            <div className="qr-wrap">
              {setup ? (
                <QRCode value={setup.otpauth_uri} size={176} level="M" />
              ) : (
                <span className="qr-placeholder">Loading…</span>
              )}
            </div>
            <Label>Authenticator URI</Label>
            <code className="secret-box">
              {setup?.otpauth_uri || "Loading…"}
            </code>
            <Label>6-digit code</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
            />
            <Button disabled={code.length !== 6} onClick={confirmMfa}>
              Verify and enable
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <Activity />
      <p>{text}</p>
    </div>
  );
}
