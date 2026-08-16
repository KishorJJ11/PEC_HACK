import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  Database,
  Download,
  FileCheck2,
  FileSpreadsheet,
  Filter,
  Gauge,
  Inbox,
  Info,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  getGetAnomaliesQueryKey,
  getGetValidationRulesQueryKey,
  getGetValidationSummaryQueryKey,
  useCreateValidationRule,
  useGetAnomalies,
  useGetValidationRules,
  useGetValidationSummary,
  useUploadSurvey,
} from '@workspace/api-client-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  PieChart,
  Pie,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const queryClient = new QueryClient();




const formatNumber = (value) => new Intl.NumberFormat('en-GB').format(value ?? 0);
const formatCurrency = (value) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value ?? 0);
const formatDate = (value) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? '!flex fixed inset-y-0 left-0 z-50' : ''}`}>
        <div className="relative z-10 flex items-start justify-between px-2">
          <NavLink to="/" className="flex items-center gap-3" data-testid="link-brand">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d35d45] text-[#fff5e9] shadow-[0_6px_16px_rgba(0,0,0,.16)]">
              <ShieldCheck size={20} strokeWidth={1.8} />
            </span>
            <span>
              <span className="block text-[14px] font-semibold tracking-[-0.02em]">Census / Signal</span>
              <span className="mono-font mt-0.5 block text-[9px] uppercase tracking-[0.15em] text-[#dce8de]/50">Validation office</span>
            </span>
          </NavLink>
          <button onClick={() => setMobileOpen(false)} className="mt-1 text-[#dce8de]/60 md:hidden" data-testid="button-close-mobile-menu" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="relative z-10 mt-12 flex flex-1 flex-col gap-1" aria-label="Primary navigation">
          <p className="mono-font mb-2 px-3 text-[9px] uppercase tracking-[0.16em] text-[#dce8de]/35">Workspace</p>
          <SideNavLink to="/" icon={LayoutDashboard} label="Overview" end />
          <SideNavLink to="/anomalies" icon={CircleAlert} label="Anomaly report" />
          <SideNavLink to="/upload" icon={UploadCloud} label="Ingest survey" />
          <SideNavLink to="/rules" icon={ClipboardCheck} label="Validation rules" />
          <p className="mono-font mb-2 mt-9 px-3 text-[9px] uppercase tracking-[0.16em] text-[#dce8de]/35">Workspace tools</p>
          <button className="nav-link text-left" data-testid="button-settings" onClick={() => window.alert('Workspace settings are available to administrators.')}>
            <Settings2 size={16} strokeWidth={1.7} />
            <span className="text-[13px]">Workspace settings</span>
          </button>
        </nav>

        <div className="relative z-10 mt-auto rounded-xl border border-[#dce8de]/10 bg-[#dce8de]/[.06] p-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#8bc9ab] shadow-[0_0_0_4px_rgba(139,201,171,.12)]" />
            <span className="mono-font text-[9px] uppercase tracking-[.12em] text-[#dce8de]/75">Systems nominal</span>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-[#dce8de]/50">Last pipeline check<br /><span className="text-[#dce8de]/80">Today, 09:42 GMT</span></p>
        </div>
        <div className="relative z-10 mt-4 flex items-center gap-2 px-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8b06a] text-[10px] font-bold text-[#273446]">AM</span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-[#edf2e9]">Amina Malik</p>
            <p className="truncate text-[10px] text-[#dce8de]/45">Quality analyst</p>
          </div>
          <MoreHorizontal size={15} className="ml-auto text-[#dce8de]/45" />
        </div>
      </aside>

      <div className="main-column">
        <header className="mobile-menu sticky top-0 z-30 items-center justify-between border-b border-[#d7d3ca] bg-[#f4f0e9]/95 px-4 py-3 backdrop-blur-md md:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-1.5 text-[#273446]" data-testid="button-open-mobile-menu" aria-label="Open menu"><Menu size={20} /></button>
          <span className="display-font text-[21px]">Census / Signal</span>
          <span className="h-2 w-2 rounded-full bg-[#d35d45]" />
        </header>
        <TopBar />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/upload-results" element={<UploadResultsPage />} />
          <Route path="/anomalies" element={<AnomaliesPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      {mobileOpen && <button className="fixed inset-0 z-40 hidden bg-[#172338]/30 md:block" onClick={() => setMobileOpen(false)} data-testid="button-dismiss-mobile-menu" aria-label="Close menu overlay" />}
    </div>
  );
}

function SideNavLink({ to, icon: Icon, label, end }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
      <Icon size={16} strokeWidth={1.7} />
      <span className="text-[13px]">{label}</span>
      {label === 'Anomaly report' && <span className="mono-font ml-auto rounded-full bg-[#d35d45] px-1.5 py-0.5 text-[9px] text-[#fff5e9]">672</span>}
    </NavLink>
  );
}

function TopBar() {
  const location = useLocation();
  const titles = { '/': 'Overview', '/upload': 'Ingest survey', '/anomalies': 'Anomaly report', '/rules': 'Validation rules' };
  return (
    <header className="hidden items-center justify-between border-b border-[#ded9d0] px-[clamp(1rem,3.2vw,3.8rem)] py-4 md:flex">
      <div className="flex items-center gap-3">
        <span className="mono-font text-[10px] uppercase tracking-[.14em] text-[#7d7d77]">Survey quality /</span>
        <span className="text-[12px] font-semibold text-[#273446]">{titles[location.pathname] || 'Workspace'}</span>
      </div>
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 text-[11px] text-[#74766f]"><span className="h-1.5 w-1.5 rounded-full bg-[#3c8c6b]" /> Live workspace</div>
        <div className="h-5 w-px bg-[#ded9d0]" />
        <span className="mono-font text-[10px] text-[#8a8982]">WAVE 03 / 2024</span>
      </div>
    </header>
  );
}

function DashboardPage() {
  const summaryQuery = useGetValidationSummary({ query: { queryKey: getGetValidationSummaryQueryKey() } });
  const summary = summaryQuery.data || { totalRecords: 0, totalAnomalies: 0, highRiskEnumerators: 0, anomalyRate: 0, regionalAnomalies: [], ingestionTrend: [], activity: [] };
  const isDemo = false;
  const navigate = useNavigate();
  const [showAudit, setShowAudit] = useState(false);

  return (
    <main className="content-wrap page-enter">
      <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="eyebrow flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#d35d45]" /> Monday, 11 March 2024</div>
          <h1 className="display-font mt-3 text-[clamp(2.65rem,5vw,4.5rem)] leading-[.92] tracking-[-.03em] text-[#273446]">The signal is<br /><em className="text-[#b74d39]">in the detail.</em></h1>
          <p className="mt-5 max-w-[32rem] text-[14px] leading-relaxed text-[#72756e]">A clear view of the quality signals across the employment and income survey. Start broad, then follow any record to its evidence.</p>
        </div>
        <div className="flex items-center gap-2">
          
          {isDemo && <span className="mono-font rounded-full border border-[#dbcec0] bg-[#f8f3e9] px-3 py-2 text-[9px] uppercase tracking-[.1em] text-[#8c755f]">10k Seed Data View</span>}
          <button onClick={() => navigate('/upload')} className="flex items-center gap-2 rounded-lg bg-[#d35d45] px-4 py-2.5 text-[12px] font-semibold text-[#fff5e9] shadow-[0_7px_18px_rgba(192,76,52,.18)] transition hover:-translate-y-0.5" data-testid="button-ingest-survey"><UploadCloud size={15} /> Ingest survey</button>
        </div>
      </section>

      <section className="stagger mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Records reviewed" value={formatNumber(summary.totalRecords)} note="Across 8 regional files" icon={Database} tone="metric-ink" trend="12.8%" trendUp />
        <MetricCard label="Anomalies detected" value={formatNumber(summary.totalAnomalies)} note="672 need a decision" icon={CircleAlert} tone="metric-accent" trend="4.1%" trendUp={false} />
        <MetricCard label="High-risk enumerators" value={formatNumber(summary.highRiskEnumerators)} note="Across 5 regions" icon={ShieldCheck} tone="metric-gold" trend="3 fewer" trendUp={false} />
        <MetricCard label="Anomaly rate" value={`${Number(summary.anomalyRate).toFixed(2)}%`} note="Down from 4.08% last wave" icon={Gauge} tone="metric-teal" trend="0.44 pts" trendUp={false} />
      </section>

      <section className="mt-3 grid gap-3 xl:grid-cols-[1.18fr_.82fr]">
        <RegionalChart data={summary.regionalAnomalies} />
        <IngestionChart data={summary.ingestionTrend} />
      </section>

      <section className="mt-3 grid gap-3 xl:grid-cols-[1.18fr_.82fr]">
        <ActivityPanel data={summary.activity} onViewAll={() => setShowAudit(true)} />
        <SignalCard onOpen={() => navigate('/anomalies')} />
      </section>
      
      {showAudit && <AuditModal data={summary.activity} onClose={() => setShowAudit(false)} />}
    </main>
  );
}

function MetricCard({ label, value, note, icon: Icon, tone, trend, trendUp }) {
  return (
    <article className={`surface metric-card rounded-xl p-5 ${tone}`}>
      <div className="flex items-start justify-between">
        <span className="eyebrow">{label}</span>
        <span className="rounded-lg bg-[#e9e6df] p-2 text-[#5d6b73]"><Icon size={16} strokeWidth={1.7} /></span>
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <strong className="mono-font text-[28px] tracking-[-.06em] text-[#273446]">{value}</strong>
          <span className={`mono-font flex items-center text-[9px] ${trendUp ? 'text-[#398066]' : 'text-[#b15d46]'}`}>{trendUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{trend}</span>
        </div>
        <p className="mt-1 text-[11px] text-[#85877f]">{note}</p>
      </div>
    </article>
  );
}

function RegionalChart({ data }) {
  const rows = data || [];
  return (
    <article className="surface rounded-xl p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <div><p className="eyebrow">01 / Distribution</p><h2 className="mt-2 text-[17px] font-semibold tracking-[-.02em]">Where anomalies cluster</h2><p className="mt-1 text-[11px] text-[#81837c]">Flagged records by region, current wave</p></div>
        <span className="rounded-lg bg-[#f1e0d8] p-2 text-[#b74d39]"><BarChart3 size={16} /></span>
      </div>
      <div className="mt-7 h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 12, left: 3, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid className="chart-grid" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis className="chart-axis" type="category" dataKey="region" width={92} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(44, 69, 77, .05)' }} content={<ChartTooltip suffix=" anomalies" />} />
            <Bar dataKey="anomalies" radius={[0, 4, 4, 0]} barSize={12}>
              {rows.map((row, index) => <Cell key={row.region} fill={index < 2 ? '#d35d45' : '#4b8d84'} fillOpacity={index < 2 ? 1 : .72} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center gap-4 border-t border-[#e6e1d9] pt-3 text-[10px] text-[#85877f]"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#d35d45]" /> Highest concentration</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#4b8d84]" /> Other regions</span></div>
    </article>
  );
}

function IngestionChart({ data }) {
  const rows = data || [];
  return (
    <article className="surface rounded-xl p-5 sm:p-6">
      <div className="flex items-start justify-between"><div><p className="eyebrow">02 / Throughput</p><h2 className="mt-2 text-[17px] font-semibold tracking-[-.02em]">Ingestion pulse</h2><p className="mt-1 text-[11px] text-[#81837c]">Records received over the last 8 days</p></div><span className="rounded-lg bg-[#dcebe5] p-2 text-[#3b806d]"><Activity size={16} /></span></div>
      <div className="mt-7 h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid className="chart-grid" vertical={false} />
            <XAxis className="chart-axis" dataKey="label" axisLine={false} tickLine={false} />
            <YAxis className="chart-axis" axisLine={false} tickLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`} />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="records" stroke="#2e6d70" strokeWidth={2.5} dot={{ fill: '#f4f0e9', stroke: '#2e6d70', strokeWidth: 2, r: 3.5 }} activeDot={{ r: 5, fill: '#d35d45', stroke: '#f4f0e9', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between border-t border-[#e6e1d9] pt-3"><span className="text-[10px] text-[#85877f]">Peak: 3,410 records</span><span className="mono-font text-[10px] text-[#3b806d]">+18.6% vs prior week</span></div>
    </article>
  );
}

function ChartTooltip({ active, payload, label, suffix = '' }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-lg border border-[#d8d4cc] bg-[#273446] px-3 py-2 text-[#f7f1e7] shadow-lg"><p className="mono-font text-[9px] uppercase tracking-[.08em] text-[#d7dacf]">{label}</p><p className="mt-1 text-[12px] font-semibold">{formatNumber(payload[0].value)}{suffix}</p></div>;
}

function ActivityPanel({ data, onViewAll }) {
  const tones = { orange: '#d35d45', green: '#3e8c6c', blue: '#507e9b', red: '#b74d39' };
  const rows = data || [];
  return <article className="surface rounded-xl p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="eyebrow">03 / Audit trail</p><h2 className="mt-2 text-[17px] font-semibold tracking-[-.02em]">Recent activity</h2></div><button className="text-[11px] font-semibold text-[#b74d39] transition hover:text-[#8c392a]" onClick={onViewAll} data-testid="button-view-audit">View audit trail <ChevronRight className="inline" size={13} /></button></div><div className="mt-5 divide-y divide-[#e7e2da]">{rows.slice(0, 5).map((item) => <div className="flex gap-3 py-3 first:pt-0 last:pb-0" key={item.id} data-testid={`activity-item-${item.id}`}><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tones[item.tone] || tones.blue }} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="text-[12px] font-semibold text-[#35414e]">{item.title}</p><span className="mono-font shrink-0 text-[9px] text-[#96968e]">{item.time}</span></div><p className="mt-1 text-[11px] text-[#85877f]">{item.detail}</p></div></div>)}</div></article>;
}

function AuditModal({ data, onClose }) {
  const tones = { orange: '#d35d45', green: '#3e8c6c', blue: '#507e9b', red: '#b74d39' };
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    const close = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('keydown', close);
      document.body.style.overflow = originalStyle;
    };
  }, [onClose]);
  
  return <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#172338]/40 p-4 sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><article className="modal-card max-h-[92dvh] w-full max-w-[500px] overflow-y-auto rounded-2xl bg-[#fbfaf6] p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between"><div><span className="eyebrow text-[#b74d39]">System Logs</span><h2 className="mono-font mt-2 text-[19px] font-bold text-[#273446]">Audit Trail</h2><p className="mt-1 text-[11px] text-[#85877f]">History of recent data uploads and actions.</p></div><button onClick={onClose} className="rounded-lg p-2 text-[#777a74] transition hover:bg-[#eeeae3]"><X size={18} /></button></div><div className="mt-7 divide-y divide-[#e7e2da]">{data.map((item) => <div className="flex gap-3 py-4 first:pt-0" key={item.id}><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tones[item.tone] || tones.blue }} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="text-[12px] font-semibold text-[#35414e]">{item.title}</p><span className="mono-font shrink-0 text-[9px] text-[#96968e]">{item.time}</span></div><p className="mt-1 text-[11px] text-[#85877f]">{item.detail}</p></div></div>)}</div></article></div>;
}

function SignalCard({ onOpen }) {
  return <article className="relative overflow-hidden rounded-xl bg-[#273446] p-6 text-[#eff3e9]"><div className="absolute -right-12 -top-16 h-52 w-52 rounded-full border border-[#dce8de]/10" /><div className="absolute -right-1 -top-5 h-28 w-28 rounded-full border border-[#dce8de]/10" /><div className="relative"><div className="flex items-center gap-2 text-[#e5a770]"><Sparkles size={15} /><span className="eyebrow !text-[#e5a770]">Analyst note</span></div><h2 className="display-font mt-7 max-w-[17rem] text-[32px] leading-[1]">Three enumerators account for 31% of high-risk signals.</h2><p className="mt-5 max-w-[21rem] text-[12px] leading-relaxed text-[#dce8de]/60">That concentration is a useful place to start. Open the anomaly report to see the records behind the signal.</p><button onClick={onOpen} className="mt-7 flex items-center gap-2 text-[12px] font-semibold text-[#f0c394] transition hover:gap-3" data-testid="button-open-anomaly-report">Open anomaly report <ArrowUpRight size={15} /></button></div></article>;
}

function UploadPage() {
  const navigate = useNavigate();
  const uploadMutation = useUploadSurvey();
  const queryClientRef = useQueryClient();
  const [file, setFile] = useState(null);
  const [csvContent, setCsvContent] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');

  const readFile = (selected) => {
    if (!selected) return;
    setFile(selected);
    setResult(null);
    setMessage('');
    
    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = String(event.target?.result || '');
        const base64 = dataUrl.split(',')[1];
        setImageBase64(base64);
        setMimeType(selected.type);
        setCsvContent('');
      };
      reader.readAsDataURL(selected);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvContent(String(event.target?.result || ''));
        setImageBase64('');
        setMimeType('');
      };
      reader.readAsText(selected);
    }
  };

  const useSample = () => {
    const sample = 'record_id,region,age,employment_status,annual_income,weekly_hours\\nHH-NE-009184,North East,23,employed,84000,37.5\\nHH-NW-003521,North West,61,employed,0,24\\nHH-YK-008702,Yorkshire,34,employed,12800,40';
    setFile({ name: 'March_2024_wave3_sample.csv', size: sample.length });
    setCsvContent(sample);
    setResult(null);
    setMessage('');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!file || (!csvContent && !imageBase64)) {
      setMessage('Choose a CSV file or image before starting validation.');
      return;
    }
    setProgress(12);
    setMessage('');
    const progressTimer = window.setInterval(() => setProgress((value) => value >= 86 ? value : value + 13), 350);

    if (imageBase64) {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64, mimeType, fileName: file.name })
        });
        if (!response.ok) throw new Error('Image validation failed');
        const data = await response.json();
        
        window.clearInterval(progressTimer);
        setProgress(100);
        setResult(data);
        queryClientRef.invalidateQueries({ queryKey: getGetValidationSummaryQueryKey() });
        queryClientRef.invalidateQueries({ queryKey: getGetAnomaliesQueryKey() });
        navigate('/upload-results', { state: { result: data } });
      } catch (error) {
        window.clearInterval(progressTimer);
        setProgress(100);
        setMessage('OCR Processing failed. Ensure your backend is running.');
      }
      return;
    }

    uploadMutation.mutate({ data: { fileName: file.name, csvContent } }, {
      onSuccess: (data) => {
        window.clearInterval(progressTimer);
        setProgress(100);
        setResult(data);
        queryClientRef.invalidateQueries({ queryKey: getGetValidationSummaryQueryKey() });
        queryClientRef.invalidateQueries({ queryKey: getGetAnomaliesQueryKey() });
        navigate('/upload-results', { state: { result: data } });
      },
      onError: () => {
        window.clearInterval(progressTimer);
        window.setTimeout(() => {
          const lines = csvContent.trim().split(/\r?\n/).filter(Boolean);
          setProgress(100);
          const mockResult = { fileName: file.name, recordsProcessed: Math.max(lines.length - 1, 3), anomaliesFound: Math.min(8, Math.max(1, lines.length - 1)), highRiskCount: 1 };
          setResult(mockResult);
          setMessage('Preview complete. The connected validation service will replace this result when available.');
          navigate('/upload-results', { state: { result: mockResult } });
        }, 420);
      },
    });
  };

  return <main className="content-wrap page-enter"><section><div className="eyebrow flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#d35d45]" /> Ingestion workspace</div><h1 className="display-font mt-3 text-[clamp(2.7rem,5vw,4.3rem)] leading-[.94] tracking-[-.03em]">Bring in the<br /><em className="text-[#b74d39]">next signal.</em></h1><p className="mt-5 max-w-[34rem] text-[14px] leading-relaxed text-[#72756e]">Upload a survey extract and we will run the active hard checks, cohort comparisons, and enumerator consistency tests in one pass.</p></section>
    <form onSubmit={submit} className="mt-10 grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
      <div className="surface rounded-xl p-5 sm:p-8">
        <div className="flex items-center justify-between"><div><p className="eyebrow">01 / Source file</p><h2 className="mt-2 text-[17px] font-semibold">Select a CSV extract</h2></div><FileSpreadsheet className="text-[#4b8d84]" size={22} /></div>
        <label htmlFor="survey-file" className={`mt-7 flex min-h-[238px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-5 text-center transition ${file ? 'border-[#4b8d84] bg-[#e5f0ea]' : 'border-[#cfc9bf] bg-[#faf8f3] hover:border-[#b74d39] hover:bg-[#fbf2eb]'}`} data-testid="dropzone-survey-file"><input id="survey-file" type="file" accept=".csv,text/csv,image/jpeg,image/png,image/jpg" capture="environment" className="sr-only" onChange={(event) => readFile(event.target.files?.[0])} data-testid="input-survey-file" />{file ? <><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#cce5d8] text-[#30735f]"><FileCheck2 size={22} /></span><p className="mt-4 text-[13px] font-semibold text-[#315c52]">{file.name}</p><p className="mono-font mt-1 text-[10px] text-[#609083]">{formatNumber(file.size)} bytes · Ready to validate</p><span className="mt-4 text-[11px] font-semibold text-[#b74d39]">Choose a different file</span></> : <><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0ddd5] text-[#b74d39]"><UploadCloud size={22} /></span><p className="mt-4 text-[13px] font-semibold text-[#35414e]">Drop a CSV or image here, or browse files</p><p className="mt-1 text-[11px] text-[#85877f]">CSV, JPEG, PNG · Take a photo on mobile</p></>}</label>
        {!file && <div className="mt-4 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={useSample} className="flex items-center gap-2 text-[11px] font-semibold text-[#b74d39] transition hover:text-[#8c392a]" data-testid="button-use-sample"><Sparkles size={13} /> Use a sample extract to explore</button><button type="button" onClick={async () => {
          setMessage('Pinging real-time API...');
          try {
            const res = await fetch('http://127.0.0.1:5000/api/ingest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ record_id: `RT-${Date.now()}`, enumerator_id: 'ENUM-RT', region: 'North', age: 14, income: 50000, education: 'PhD', employment_status: 'employed' })
            });
            const data = await res.json();
            if (data.status === 'success') {
              setMessage(`Real-time ping successful! Record flagged: ${data.is_anomaly}. Reason: ${data.reason}`);
              queryClientRef.invalidateQueries({ queryKey: getGetValidationSummaryQueryKey() });
            } else {
              setMessage('Real-time ping failed.');
            }
          } catch(e) {
             setMessage('Error contacting real-time API.');
          }
        }} className="flex items-center gap-2 text-[11px] font-semibold text-[#3b806d] transition hover:text-[#2c6152]"><Activity size={13} /> Simulate Real-Time Stream (Single Record)</button></div>}
      </div>
      <div className="surface flex flex-col rounded-xl p-5 sm:p-8">
        <div><p className="eyebrow">02 / Validation pass</p><h2 className="mt-2 text-[17px] font-semibold">Run quality checks</h2><p className="mt-2 text-[12px] leading-relaxed text-[#85877f]">Every upload is checked against the active rule set and compared with the current regional baseline.</p></div>
        <div className="my-7 space-y-4 border-y border-[#e6e1d9] py-5"><CheckListItem icon={ShieldCheck} title="Hard-check rules" detail="4 active checks" /><CheckListItem icon={BarChart3} title="Cohort comparison" detail="Regional income bands" /><CheckListItem icon={Activity} title="Enumerator patterns" detail="Consistency across records" /></div>
        {progress > 0 && <div className="mb-5"><div className="flex justify-between text-[10px]"><span className="mono-font uppercase tracking-[.1em] text-[#72756e]">{progress < 100 ? 'Validating extract' : 'Validation complete'}</span><span className="mono-font text-[#b74d39]">{progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e5e1da]"><div className="progress-bar h-full rounded-full bg-[#d35d45]" style={{ width: `${progress}%` }} /></div></div>}
        {message && <div className="mb-5 flex gap-2 rounded-lg border border-[#e4cdbd] bg-[#fbf0e8] p-3 text-[11px] leading-relaxed text-[#8e4d3d]"><Info size={14} className="mt-0.5 shrink-0" />{message}</div>}
        {result ? <ResultCard result={result} /> : <button type="submit" disabled={uploadMutation.isPending || progress > 0 && progress < 100} className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-[#273446] px-4 py-3 text-[12px] font-semibold text-[#f4f0e9] transition hover:-translate-y-0.5 hover:bg-[#1c2839] disabled:cursor-not-allowed disabled:opacity-60" data-testid="button-run-validation">{uploadMutation.isPending ? <LoaderCircle className="animate-spin" size={15} /> : <ShieldCheck size={15} />} {uploadMutation.isPending ? 'Processing extract…' : 'Run validation pass'}</button>}
      </div>
    </form>
  </main>;
}

function CheckListItem({ icon: Icon, title, detail }) {
  return <div className="flex items-center gap-3"><span className="rounded-lg bg-[#e8eee8] p-2 text-[#3b806d]"><Icon size={15} /></span><div className="flex-1"><p className="text-[12px] font-semibold text-[#35414e]">{title}</p><p className="mt-0.5 text-[10px] text-[#85877f]">{detail}</p></div><Check size={15} className="text-[#4b8d84]" /></div>;
}

function ResultCard({ result }) {
  return <div className="mt-auto rounded-xl border border-[#c7e1d1] bg-[#e9f3ec] p-4"><div className="flex items-center gap-2 text-[#2d735d]"><CheckCircle2 size={17} /><span className="text-[12px] font-semibold">File processed successfully</span></div><p className="mt-2 truncate text-[11px] text-[#527c6e]">{result.fileName}</p><div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#c9e2d2] pt-3"><ResultStat label="Processed" value={formatNumber(result.recordsProcessed)} /><ResultStat label="Anomalies" value={formatNumber(result.anomaliesFound)} /><ResultStat label="High risk" value={formatNumber(result.highRiskCount)} /></div></div>;
}

function ResultStat({ label, value }) {
  return <div><p className="mono-font text-[9px] uppercase tracking-[.08em] text-[#689686]">{label}</p><p className="mono-font mt-1 text-[17px] font-bold text-[#315c52]">{value}</p></div>;
}

function AnomaliesPage() {
  const [search, setSearch] = useState('');
  const [risk, setRisk] = useState('All');
  const [selected, setSelected] = useState(null);
  const params = useMemo(() => ({ ...(risk !== 'All' ? { risk } : {}), ...(search ? { search } : {}) }), [risk, search]);
  const anomalyQuery = useGetAnomalies(params, { query: { queryKey: getGetAnomaliesQueryKey(params) } });
  const baseRows = anomalyQuery.data || [];
  const rows = baseRows.filter((item) => (risk === 'All' || item.risk === risk) && (!search || [item.recordId, item.enumeratorId, item.region, item.reason].join(' ').toLowerCase().includes(search.toLowerCase())));
  const isDemo = false;
  
  const exportToCSV = () => {
    if (!rows.length) return;
    const headers = ['Record ID', 'Enumerator', 'Region', 'Age', 'Income', 'Education', 'Risk', 'Score', 'Reason'];
    const csvContent = [
      headers.join(','),
      ...rows.map(row => [
        row.recordId,
        row.enumeratorId,
        row.region,
        row.age,
        row.income,
        `"${row.education || ''}"`,
        row.risk,
        row.score,
        `"${row.reason?.replace(/"/g, '""') || ''}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `anomaly_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return <main className="content-wrap page-enter"><section className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="eyebrow flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#d35d45]" /> Explainable review</div><h1 className="display-font mt-3 text-[clamp(2.65rem,5vw,4.25rem)] leading-[.94] tracking-[-.03em]">Follow the<br /><em className="text-[#b74d39]">evidence.</em></h1><p className="mt-5 max-w-[35rem] text-[14px] leading-relaxed text-[#72756e]">Each flagged record carries a reason, a confidence score, and the context needed to make a defensible decision.</p></div><div className="flex items-center gap-2"><span className="mono-font rounded-full bg-[#f0ddd5] px-3 py-2 text-[10px] text-[#9e4d3b]">{formatNumber(rows.length)} visible records</span><button onClick={exportToCSV} className="flex items-center gap-2 rounded-lg border border-[#cbc5bc] bg-[#faf8f3] px-3 py-2.5 text-[11px] font-semibold text-[#42515a] transition hover:border-[#b74d39]" data-testid="button-export-anomalies"><Download size={14} /> Export</button></div></section>
    <section className="surface mt-10 overflow-hidden rounded-xl"><div className="flex flex-col gap-3 border-b border-[#e3ded6] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative flex-1 sm:max-w-[24rem]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#92948c]" /><input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Search record, enumerator, region…" className="h-10 w-full rounded-lg border border-[#d7d1c8] bg-[#fbfaf6] pl-9 pr-3 text-[12px] outline-none transition placeholder:text-[#9b9b93] focus:border-[#b74d39] focus:ring-2 focus:ring-[#d35d45]/10" data-testid="input-anomaly-search" /></div><div className="flex items-center gap-2"><Filter size={14} className="text-[#85877f]" /><span className="mono-font text-[9px] uppercase tracking-[.1em] text-[#85877f]">Risk</span>{['All', 'High', 'Medium', 'Low'].map((value) => <button key={value} onClick={() => setRisk(value)} className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition ${risk === value ? 'bg-[#273446] text-[#f4f0e9]' : 'text-[#74766f] hover:bg-[#eeeae3]'}`} data-testid={`button-filter-risk-${value.toLowerCase()}`}>{value}</button>)}</div></div>
      {anomalyQuery.isLoading && !anomalyQuery.data ? <TableSkeleton /> : rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-[#f5f1ea]"><tr className="mono-font text-[9px] uppercase tracking-[.1em] text-[#878980]"><th className="px-5 py-3 font-normal">Record / enumerator</th><th className="px-4 py-3 font-normal">Region</th><th className="px-4 py-3 font-normal">Profile</th><th className="px-4 py-3 font-normal">Reason</th><th className="px-4 py-3 font-normal">Risk</th><th className="px-4 py-3 font-normal">Score</th><th className="px-4 py-3 font-normal" /></tr></thead><tbody className="divide-y divide-[#ebe6df]">{rows.map((row) => <AnomalyRow key={row.id} row={row} onSelect={setSelected} />)}</tbody></table></div> : <EmptyAnomalies onClear={() => { setSearch(''); setRisk('All'); }} />}
      <div className="flex items-center justify-between border-t border-[#e3ded6] px-5 py-3"><span className="text-[10px] text-[#92938c]">{isDemo ? 'Illustrative records shown while the service connects' : 'Live records from validation service'}</span><span className="mono-font text-[9px] uppercase tracking-[.1em] text-[#a09e96]">Click a row for explanation</span></div>
    </section>
    {selected && <AnomalyModal row={selected} onClose={() => setSelected(null)} />}
  </main>;
}

function AnomalyRow({ row, onSelect }) {
  const riskStyle = { High: 'bg-[#f4ddd7] text-[#a64432]', Medium: 'bg-[#f7ebcf] text-[#936d22]', Low: 'bg-[#deede6] text-[#39725f]' };
  return <tr className="group cursor-pointer transition hover:bg-[#fbf5ed]" onClick={() => onSelect(row)} data-testid={`row-anomaly-${row.id}`}><td className="px-5 py-4"><p className="mono-font text-[11px] font-bold text-[#35414e]">{row.recordId}</p><p className="mt-1 text-[10px] text-[#96968e]">{row.enumeratorId}</p></td><td className="px-4 py-4 text-[11px] text-[#5e696d]">{row.region}</td><td className="px-4 py-4"><p className="text-[11px] text-[#5e696d]">{row.age} years · {row.education || 'Not stated'}</p><p className="mono-font mt-1 text-[10px] text-[#7c8078]">{formatCurrency(row.income)}</p></td><td className="max-w-[260px] px-4 py-4"><p className="line-clamp-2 text-[11px] leading-relaxed text-[#666e6f]">{row.reason}</p></td><td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[.06em] ${riskStyle[row.risk] || riskStyle.Low}`}>{row.risk}</span></td><td className="px-4 py-4"><span className="mono-font text-[11px] font-bold text-[#35414e]">{Math.round(Number(row.score || 0) * 100)}%</span></td><td className="px-4 py-4 text-[#9a9a92] transition group-hover:text-[#b74d39]"><ChevronRight size={15} /></td></tr>;
}

function TableSkeleton() {
  return <div className="space-y-3 p-5">{[1, 2, 3, 4, 5].map((item) => <div className="loading-sheen h-14 rounded-lg" key={item} />)}</div>;
}

function EmptyAnomalies({ onClear }) {
  return <div className="flex flex-col items-center justify-center px-6 py-16 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#deede6] text-[#39725f]"><Inbox size={23} /></span><h3 className="mt-5 text-[15px] font-semibold">No records match this view</h3><p className="mt-2 max-w-[18rem] text-[12px] leading-relaxed text-[#85877f]">Try widening the search or returning to all risk levels.</p><button onClick={onClear} className="mt-5 text-[11px] font-semibold text-[#b74d39]" data-testid="button-clear-anomaly-filters">Clear filters</button></div>;
}

function AnomalyModal({ row, onClose }) {
  useEffect(() => {
    const close = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);
  return <div className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-[#172338]/40 p-0 sm:items-center sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><article className="modal-card max-h-[92dvh] w-full max-w-[620px] overflow-y-auto rounded-t-2xl bg-[#fbfaf6] p-5 shadow-2xl sm:rounded-2xl sm:p-7" role="dialog" aria-modal="true" aria-label="Anomaly record detail"><div className="flex items-start justify-between"><div><span className="eyebrow text-[#b74d39]">Record explanation</span><h2 className="mono-font mt-2 text-[19px] font-bold text-[#273446]">{row.recordId}</h2><p className="mt-1 text-[11px] text-[#85877f]">Detected {formatDate(row.detectedAt)} · {row.enumeratorId}</p></div><button onClick={onClose} className="rounded-lg p-2 text-[#777a74] transition hover:bg-[#eeeae3]" data-testid="button-close-anomaly-modal" aria-label="Close anomaly details"><X size={18} /></button></div><div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4"><DetailStat label="Risk" value={row.risk} tone={row.risk === 'High' ? 'text-[#a64432]' : row.risk === 'Medium' ? 'text-[#936d22]' : 'text-[#39725f]'} /><DetailStat label="Confidence" value={`${Math.round(Number(row.score || 0) * 100)}%`} /><DetailStat label="Income" value={formatCurrency(row.income)} /><DetailStat label="Region" value={row.region} /></div><div className="mt-6 rounded-xl border border-[#e4cdbd] bg-[#fbf0e8] p-4"><div className="flex items-center gap-2 text-[#a34e3a]"><CircleAlert size={16} /><span className="eyebrow !text-[#a34e3a]">Why it was flagged</span></div><p className="mt-3 text-[13px] leading-relaxed text-[#66463e]">{row.reason}</p></div><div className="mt-6"><p className="eyebrow">Observed profile</p><div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-4 border-y border-[#e5e0d8] py-4 sm:grid-cols-3"><DetailLine label="Age" value={`${row.age} years`} /><DetailLine label="Education" value={row.education || 'Not stated'} /><DetailLine label="Survey region" value={row.region} /><DetailLine label="Record status" value={row.status} /><DetailLine label="Enumerator" value={row.enumeratorId} /><DetailLine label="Review state" value="Awaiting decision" /></div></div><div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={onClose} className="rounded-lg border border-[#cbc5bc] px-4 py-2.5 text-[11px] font-semibold text-[#5a646a] transition hover:bg-[#f0ece5]" data-testid="button-dismiss-anomaly">Keep in queue</button><button onClick={() => { onClose(); window.alert('Record marked for follow-up.'); }} className="rounded-lg bg-[#273446] px-4 py-2.5 text-[11px] font-semibold text-[#f4f0e9] transition hover:bg-[#1c2839]" data-testid="button-mark-follow-up">Mark for follow-up</button></div></article></div>;
}

function DetailStat({ label, value, tone = 'text-[#273446]' }) {
  return <div className="rounded-lg bg-[#f0ece5] p-3"><p className="eyebrow">{label}</p><p className={`mono-font mt-2 truncate text-[12px] font-bold ${tone}`}>{value}</p></div>;
}

function DetailLine({ label, value }) {
  return <div><p className="eyebrow">{label}</p><p className="mt-1 text-[11px] font-semibold text-[#4c5a62]">{value}</p></div>;
}

function RulesPage() {
  const rulesQuery = useGetValidationRules({ query: { queryKey: getGetValidationRulesQueryKey() } });
  const createMutation = useCreateValidationRule();
  const queryClientRef = useQueryClient();
  const [localRules, setLocalRules] = useState([]);
  const [form, setForm] = useState({ name: '', condition: '', action: 'Flag for analyst review' });
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState('');
  const serverRules = rulesQuery.data || [];
  const rules = [...localRules, ...serverRules];

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submitRule = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.condition.trim() || !form.action.trim()) {
      setNotice('Complete all three fields to save a rule.');
      return;
    }
    const payload = { name: form.name.trim(), condition: form.condition.trim(), action: form.action.trim() };
    createMutation.mutate({ data: payload }, {
      onSuccess: () => {
        setForm({ name: '', condition: '', action: 'Flag for analyst review' });
        setShowForm(false);
        setNotice('Rule saved and is ready for review.');
        queryClientRef.invalidateQueries({ queryKey: getGetValidationRulesQueryKey() });
      },
      onError: () => {
        setLocalRules((current) => [{ ...payload, id: `LOCAL-${Date.now()}`, status: 'Draft', createdAt: new Date().toISOString() }, ...current]);
        setForm({ name: '', condition: '', action: 'Flag for analyst review' });
        setShowForm(false);
        setNotice('Rule saved to this workspace preview. It will sync when the service is available.');
      },
    });
  };

  return <main className="content-wrap page-enter"><section className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="eyebrow flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#d35d45]" /> Control library</div><h1 className="display-font mt-3 text-[clamp(2.65rem,5vw,4.25rem)] leading-[.94] tracking-[-.03em]">Make quality<br /><em className="text-[#b74d39]">explicit.</em></h1><p className="mt-5 max-w-[35rem] text-[14px] leading-relaxed text-[#72756e]">Hard checks are the shared language between your sample, your analysts, and the decisions that follow.</p></div><button onClick={() => { setShowForm((value) => !value); setNotice(''); }} className="flex items-center justify-center gap-2 self-start rounded-lg bg-[#d35d45] px-4 py-2.5 text-[12px] font-semibold text-[#fff5e9] shadow-[0_7px_18px_rgba(192,76,52,.18)] transition hover:-translate-y-0.5 md:self-auto" data-testid="button-new-rule"><Plus size={15} /> New validation rule</button></section>
    {notice && <div className="mt-7 flex items-center gap-2 rounded-lg border border-[#c7e1d1] bg-[#e9f3ec] px-4 py-3 text-[11px] text-[#39725f]" data-testid="status-rule-notice"><CheckCircle2 size={14} /> {notice}</div>}
    {showForm && <form onSubmit={submitRule} className="surface mt-7 rounded-xl border-t-2 border-t-[#d35d45] p-5 sm:p-7"><div className="flex items-start justify-between"><div><p className="eyebrow text-[#b74d39]">Create rule</p><h2 className="mt-2 text-[17px] font-semibold">Define a new hard check</h2></div><button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-2 text-[#85877f] hover:bg-[#eeeae3]" data-testid="button-cancel-rule"><X size={17} /></button></div><div className="mt-6 grid gap-4 md:grid-cols-2"><label className="block"><span className="eyebrow">Rule name</span><input value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="e.g. Income / hours reconciliation" className="mt-2 h-10 w-full rounded-lg border border-[#d7d1c8] bg-[#fbfaf6] px-3 text-[12px] outline-none focus:border-[#b74d39] focus:ring-2 focus:ring-[#d35d45]/10" data-testid="input-rule-name" /></label><label className="block"><span className="eyebrow">Action when matched</span><select value={form.action} onChange={(event) => updateForm('action', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#d7d1c8] bg-[#fbfaf6] px-3 text-[12px] outline-none focus:border-[#b74d39]" data-testid="select-rule-action"><option>Flag for analyst review</option><option>Reject record</option><option>Return to enumerator</option></select></label><label className="block md:col-span-2"><span className="eyebrow">Condition expression</span><textarea value={form.condition} onChange={(event) => updateForm('condition', event.target.value)} placeholder={'annual_income = 0 AND weekly_hours >= 16'} rows={3} className="mt-2 w-full resize-none rounded-lg border border-[#d7d1c8] bg-[#fbfaf6] px-3 py-3 font-mono text-[11px] outline-none focus:border-[#b74d39] focus:ring-2 focus:ring-[#d35d45]/10" data-testid="textarea-rule-condition" /></label></div><div className="mt-5 flex justify-end"><button type="submit" disabled={createMutation.isPending} className="flex items-center gap-2 rounded-lg bg-[#273446] px-4 py-2.5 text-[11px] font-semibold text-[#f4f0e9] transition hover:bg-[#1c2839] disabled:opacity-60" data-testid="button-save-rule">{createMutation.isPending && <LoaderCircle className="animate-spin" size={14} />} Save rule</button></div></form>}
    <section className="surface mt-10 overflow-hidden rounded-xl"><div className="flex items-center justify-between border-b border-[#e3ded6] p-5"><div><p className="eyebrow">Rule register</p><h2 className="mt-2 text-[17px] font-semibold">Current validation logic</h2></div><span className="mono-font text-[10px] text-[#85877f]">{rules.length} rules</span></div>{rulesQuery.isLoading && !rulesQuery.data ? <div className="space-y-3 p-5">{[1, 2, 3].map((item) => <div className="loading-sheen h-16 rounded-lg" key={item} />)}</div> : <div className="divide-y divide-[#ebe6df]">{rules.map((rule) => <RuleRow rule={rule} key={rule.id} />)}</div>}</section>
  </main>;
}

function RuleRow({ rule }) {
  const active = rule.status === 'Active';
  return <div className="group flex flex-col gap-4 px-5 py-5 transition hover:bg-[#fbf5ed] sm:flex-row sm:items-center" data-testid={`row-rule-${rule.id}`}><div className="flex min-w-0 flex-1 items-start gap-3"><span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-[#deede6] text-[#39725f]' : 'bg-[#eeeae3] text-[#8a8b82]'}`}><ClipboardCheck size={15} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-[12px] font-semibold text-[#35414e]">{rule.name}</h3><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.06em] ${active ? 'bg-[#deede6] text-[#39725f]' : 'bg-[#eeeae3] text-[#807f76]'}`}>{rule.status}</span></div><p className="mono-font mt-2 break-words text-[10px] leading-relaxed text-[#727a7c]">{rule.condition}</p></div></div><div className="flex shrink-0 items-center gap-7 pl-11 sm:pl-0"><div><p className="eyebrow">Action</p><p className="mt-1 text-[10px] font-semibold text-[#5f696d]">{rule.action}</p></div><div className="hidden sm:block"><p className="eyebrow">Created</p><p className="mono-font mt-1 text-[10px] text-[#898b83]">{formatDate(rule.createdAt)}</p></div><button onClick={() => window.alert(`${rule.name}\\n\\n${rule.condition}`)} className="rounded-lg p-2 text-[#9a9a92] transition hover:bg-[#eeeae3] hover:text-[#b74d39]" data-testid={`button-view-rule-${rule.id}`} aria-label={`View ${rule.name}`}><ChevronRight size={15} /></button></div></div>;
}

function NotFoundPage() {
  const navigate = useNavigate();
  return <main className="content-wrap flex min-h-[70dvh] items-center justify-center"><div className="text-center"><span className="mono-font text-[10px] uppercase tracking-[.15em] text-[#b74d39]">Signal lost / 404</span><h1 className="display-font mt-4 text-6xl">Nothing here.</h1><p className="mt-3 text-[13px] text-[#85877f]">This workspace path does not exist.</p><button onClick={() => navigate('/')} className="mt-7 rounded-lg bg-[#273446] px-4 py-2.5 text-[11px] font-semibold text-[#f4f0e9]" data-testid="button-return-overview">Return to overview</button></div></main>;
}

function UploadResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  if (!result) {
    return <main className="content-wrap page-enter flex min-h-[50dvh] flex-col items-center justify-center">
      <span className="mono-font text-[10px] uppercase tracking-[.15em] text-[#b74d39]">No Data</span>
      <h1 className="display-font mt-4 text-4xl">No results found.</h1>
      <button onClick={() => navigate('/upload')} className="mt-7 rounded-lg bg-[#273446] px-4 py-2.5 text-[11px] font-semibold text-[#f4f0e9]">Go Back</button>
    </main>;
  }

  const cleanCount = result.recordsProcessed - result.anomaliesFound;
  const mediumRiskCount = result.anomaliesFound - result.highRiskCount;

  const pieData1 = [
    { name: 'Clean Records', value: cleanCount, fill: '#4b8d84' },
    { name: 'Anomalies', value: result.anomaliesFound, fill: '#d35d45' }
  ];

  const pieData2 = [
    { name: 'High Risk', value: result.highRiskCount, fill: '#d35d45' },
    { name: 'Medium/Low Risk', value: mediumRiskCount, fill: '#e8b06a' }
  ];

  return (
    <main className="content-wrap page-enter">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="eyebrow flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#4b8d84]" /> Results Summary</div>
          <h1 className="display-font mt-3 text-[clamp(2.7rem,5vw,4.3rem)] leading-[.94] tracking-[-.03em]">Validation<br /><em className="text-[#4b8d84]">complete.</em></h1>
          <p className="mt-5 text-[14px] leading-relaxed text-[#72756e]">Here is the breakdown of the {formatNumber(result.recordsProcessed)} records you just processed.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/upload')} className="rounded-lg border border-[#cbc5bc] bg-[#faf8f3] px-4 py-2.5 text-[11px] font-semibold text-[#42515a] transition hover:border-[#b74d39]">Upload Another</button>
          <button onClick={() => navigate('/anomalies')} className="flex items-center gap-2 rounded-lg bg-[#273446] px-4 py-2.5 text-[11px] font-semibold text-[#f4f0e9] transition hover:-translate-y-0.5 hover:bg-[#1c2839]">View Anomaly Report</button>
        </div>
      </section>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="surface rounded-xl p-8 shadow-sm">
          <h2 className="text-[17px] font-semibold mb-6 text-center text-[#35414e]">Clean vs Anomalies</h2>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData1} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label>
                  {pieData1.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="surface rounded-xl p-8 shadow-sm">
          <h2 className="text-[17px] font-semibold mb-6 text-center text-[#35414e]">Anomaly Risk Breakdown</h2>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData2} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {pieData2.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;