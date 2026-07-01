import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import AddWebsiteModal from '../components/AddWebsiteModal';
import WebsiteLogsModal from '../components/WebsiteLogsModal';
import api from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Globe, Activity, Clock,
  Plus, Play, Pause, Trash2, FileText, RefreshCw,
  TrendingUp, AlertTriangle, CheckCircle2, XCircle,
  Copy, Check, ExternalLink, Zap, BarChart3, List,
  ChevronRight
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const timeAgo = (date) => {
  if (!date) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const timeUntil = (date) => {
  if (!date) return '—';
  const seconds = Math.floor((new Date(date) - Date.now()) / 1000);
  if (seconds <= 0) return 'Imminent';
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
};

const getUptimeBg = (pct) => {
  if (pct === null || pct === undefined) return 'bg-slate-100 dark:bg-slate-800 text-slate-500';
  if (pct >= 99) return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50';
  if (pct >= 95) return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50';
  return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50';
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatCard = ({ title, value, sub, icon: Icon, colorClass, trend }) => (
  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
        <Icon size={22} />
      </div>
      {trend !== undefined && (
        <span className="text-xs text-slate-400">{trend}</span>
      )}
    </div>
    <div className="text-3xl font-bold mb-1">{value}</div>
    <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</div>
    {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
  </div>
);

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="p-1 text-slate-300 hover:text-slate-500 transition-colors" title="Copy URL">
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  );
};

const StatusBadge = ({ status }) => {
  if (status === 'up') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
    </span>
  );
  if (status === 'down') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-800/50">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Offline
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Pending
    </span>
  );
};

const ResponseTimeBadge = ({ ms }) => {
  if (!ms) return <span className="text-slate-400 font-mono text-sm">—</span>;
  const color = ms < 200 ? 'text-emerald-600 dark:text-emerald-400' : ms < 500 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500';
  return <span className={`font-mono text-sm font-medium ${color}`}>{ms}ms</span>;
};

const CopyBadgeButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-600 font-bold transition-colors">
      {copied ? (
        <>
          <Check size={10} className="text-emerald-500" />
          Copied!
        </>
      ) : (
        <>
          <Copy size={10} />
          Copy
        </>
      )}
    </button>
  );
};

const NextPingCountdown = ({ nextPing }) => {
  const [label, setLabel] = useState(timeUntil(nextPing));
  useEffect(() => {
    const t = setInterval(() => setLabel(timeUntil(nextPing)), 1000);
    return () => clearInterval(t);
  }, [nextPing]);
  return <span className="font-mono text-sm text-slate-500 dark:text-slate-400">{label}</span>;
};

// Custom Chart Tooltip
const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-xl min-w-[200px]">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">
          <span className={`w-2 h-2 rounded-full ${data.status === 'Up' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <p className="font-semibold text-sm truncate">{data.name}</p>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Time:</span>
          <span className="font-medium">{label}</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-1">
          <span className="text-slate-500">Latency:</span>
          <span className="font-mono font-medium">{payload[0].value}ms</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-1">
          <span className="text-slate-500">Status Code:</span>
          <span className={`font-mono font-bold ${data.status === 'Up' ? 'text-emerald-500' : 'text-red-500'}`}>
            {data.code || 'N/A'}
          </span>
        </div>
      </div>
    );
  }
  return null;
};


// ─── Main Dashboard ──────────────────────────────────────────────────────────

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('monitors'); // monitors | analytics | activity
  const [websites, setWebsites] = useState([]);
  const [uptimeMap, setUptimeMap] = useState({});
  const [stats, setStats] = useState({
    totalWebsites: 0,
    onlineWebsites: 0,
    offlineWebsites: 0,
    averageResponseTime: 0,
    totalChecks24h: 0,
    overallUptime24h: null,
    totalIncidents: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedWebsiteLogs, setSelectedWebsiteLogs] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  // Trust & Detail States
  const [expandedId, setExpandedId] = useState(null);
  const [expandedLogs, setExpandedLogs] = useState({});
  const [logsLoading, setLogsLoading] = useState({});
  const [manualPingLoading, setManualPingLoading] = useState({});

  const fetchWebsiteDetails = useCallback(async (id) => {
    setLogsLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await api.get(`/websites/${id}/logs?limit=20`);
      setExpandedLogs(prev => ({ ...prev, [id]: res.data.data }));
    } catch (err) {
      console.error("Error fetching logs for website", err);
    } finally {
      setLogsLoading(prev => ({ ...prev, [id]: false }));
    }
  }, []);

  const handleManualPing = async (id) => {
    setManualPingLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await api.post(`/websites/${id}/ping`);
      
      // Update local website state
      const updatedWeb = res.data.data.website;
      setWebsites(prev => prev.map(w => w._id === id ? { ...w, ...updatedWeb } : w));
      
      // Prepend the new log
      const newLog = res.data.data.latestLog;
      if (newLog) {
        setExpandedLogs(prev => ({
          ...prev,
          [id]: [newLog, ...(prev[id] || [])].slice(0, 20)
        }));
      }
      
      // Refresh dashboard stats
      const statsRes = await api.get('/dashboard');
      setStats(statsRes.data.data);
    } catch (err) {
      console.error("Manual ping failed", err);
      alert(err.response?.data?.message || "Failed to execute manual ping.");
    } finally {
      setManualPingLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const toggleExpandRow = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      fetchWebsiteDetails(id);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const [websitesRes, statsRes] = await Promise.all([
        api.get('/websites'),
        api.get('/dashboard'),
      ]);
      setWebsites(websitesRes.data.data);
      setStats(statsRes.data.data);
    } catch (err) {
      console.error('Dashboard fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUptimes = useCallback(async (sites) => {
    if (!sites.length) return;
    const results = await Promise.allSettled(
      sites.map(w => api.get(`/websites/${w._id}/uptime`))
    );
    const map = {};
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        map[sites[i]._id] = r.value.data.data.uptime;
      }
    });
    setUptimeMap(map);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (websites.length) fetchUptimes(websites);
  }, [websites, fetchUptimes]);

  const toggleStatus = async (id) => {
    try {
      await api.patch(`/websites/${id}/toggle`);
      fetchData();
    } catch (err) {
      console.error('Toggle failed', err);
    }
  };

  const deleteWebsite = async (id) => {
    if (!window.confirm('Delete this monitor? All its logs will be permanently removed.')) return;
    try {
      await api.delete(`/websites/${id}`);
      fetchData();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const filteredWebsites = websites
    .filter(w => filter === 'all' || w.status === filter)
    .filter(w =>
      !search ||
      w.websiteName.toLowerCase().includes(search.toLowerCase()) ||
      w.url.toLowerCase().includes(search.toLowerCase())
    );

  // Prepare chart data from recent activity
  const chartData = [...stats.recentActivity].reverse().map(log => ({
    time: new Date(log.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    ms: log.responseTime || 0,
    name: log.websiteName,
    status: log.success ? 'Up' : 'Down',
    code: log.statusCode
  }));

  const renderTabs = () => (
    <div className="flex gap-1 bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-xl w-full sm:w-auto overflow-x-auto">
      {[
        { id: 'monitors', label: 'Monitors', icon: Globe },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'activity', label: 'Activity Logs', icon: List }
      ].map(t => (
        <button
          key={t.id}
          onClick={() => setActiveTab(t.id)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === t.id
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800'
          }`}
        >
          <t.icon size={16} />
          {t.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Header Area ── */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Enterprise-grade tracking and analytics.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
            {renderTabs()}
            
            <div className="flex gap-2">
              <button
                onClick={fetchData}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                title="Refresh Data"
              >
                <RefreshCw size={18} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <Plus size={18} />
                Add Monitor
              </button>
            </div>
          </div>
        </div>

        {/* ── Offline Alerts Banner ── */}
        {stats.offlineWebsites > 0 && activeTab === 'monitors' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-2xl p-5 shadow-sm flex items-start gap-4">
            <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-full mt-1">
              <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-bold text-red-800 dark:text-red-400 text-lg">
                {stats.offlineWebsites} monitor{stats.offlineWebsites > 1 ? 's are' : ' is'} currently offline
              </h3>
              <p className="text-red-600 dark:text-red-300 mt-1 mb-3 text-sm">
                Check your server deployment status. The monitor will auto-recover once your endpoints return 2xx responses.
              </p>
              <div className="flex flex-wrap gap-2">
                {websites.filter(w => w.status === 'down').map(w => (
                  <span key={w._id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-lg text-xs font-semibold text-red-700 dark:text-red-400">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    {w.websiteName}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: MONITORS ── */}
        {activeTab === 'monitors' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Monitors"
                value={stats.totalWebsites}
                icon={Globe}
                colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              />
              <StatCard
                title="Online Monitors"
                value={stats.onlineWebsites}
                sub={`${stats.totalWebsites - stats.onlineWebsites} currently down`}
                icon={Activity}
                colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              />
              <StatCard
                title="Avg. Latency"
                value={stats.averageResponseTime ? `${stats.averageResponseTime}ms` : '—'}
                sub="Across all tracked sites"
                icon={Zap}
                colorClass="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
              />
              <StatCard
                title="Global Uptime (24h)"
                value={stats.overallUptime24h !== null ? `${stats.overallUptime24h}%` : '—'}
                sub={`${stats.totalIncidents} incidents in 24h`}
                icon={TrendingUp}
                colorClass="bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
              />
            </div>

            {/* Monitors Table Area */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <h2 className="text-lg font-bold">Your Tracking Infrastructure</h2>
                <div className="flex w-full sm:w-auto gap-3">
                  <input
                    type="text"
                    placeholder="Search monitors…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 sm:w-64 px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="up">Online</option>
                    <option value="down">Offline</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50">
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Monitor Details</th>
                      <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Latency</th>
                      <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">30d Uptime</th>
                      <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Next Check</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {loading && filteredWebsites.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-20 text-center">
                          <div className="flex justify-center mb-4">
                            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                          </div>
                          <span className="text-slate-400 font-medium">Loading infrastructure…</span>
                        </td>
                      </tr>
                    ) : filteredWebsites.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-24 text-center">
                          <Globe size={48} className="mx-auto mb-4 text-slate-200 dark:text-slate-700" />
                          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
                            {search || filter !== 'all' ? 'No monitors found' : 'No monitors deployed yet'}
                          </h3>
                          <p className="text-slate-500 mb-6 max-w-md mx-auto">
                            {search || filter !== 'all' 
                              ? 'Try adjusting your search criteria or filter to find what you are looking for.' 
                              : 'Add your first URL to start preventing cold starts and tracking uptime metrics instantly.'}
                          </p>
                          {!search && filter === 'all' && (
                            <button
                              onClick={() => setIsAddModalOpen(true)}
                              className="inline-flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-xl font-semibold transition-all shadow-md"
                            >
                              <Plus size={18} /> Deploy First Monitor
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredWebsites.map(w => (
                        <React.Fragment key={w._id}>
                          <tr 
                            onClick={() => toggleExpandRow(w._id)}
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all cursor-pointer ${!w.isActive ? 'opacity-60 grayscale-[30%]' : ''} ${expandedId === w._id ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}`}
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-slate-100 text-[15px]">
                                <ChevronRight 
                                  size={16} 
                                  className={`text-slate-400 transition-transform duration-200 ${expandedId === w._id ? 'rotate-90 text-blue-500' : ''}`} 
                                />
                                <span className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{w.websiteName}</span>
                                {!w.isActive && <span className="text-[10px] uppercase font-black text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 px-2 py-0.5 rounded">Paused</span>}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 ml-6">
                                <span className="text-sm font-medium text-slate-500 truncate max-w-[200px] sm:max-w-xs">{w.url}</span>
                                <CopyButton text={w.url} />
                                <a 
                                  href={w.url} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  onClick={e => e.stopPropagation()} 
                                  className="text-slate-300 hover:text-blue-500 transition-colors"
                                >
                                  <ExternalLink size={13} />
                                </a>
                              </div>
                              <div className="text-xs font-semibold text-slate-400 mt-1.5 ml-6 flex flex-wrap gap-2">
                                <span>Interval: {w.pingInterval}m</span>
                                <span>• Expected HTTP {w.expectedStatusCode || 200}</span>
                                {w.sslDaysRemaining !== null && w.sslDaysRemaining !== undefined ? (
                                  <span>• SSL: {w.sslDaysRemaining}d</span>
                                ) : (
                                  <span>• SSL: n/a</span>
                                )}
                                <span>• Checked {timeAgo(w.lastPing)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-5"><StatusBadge status={w.status} /></td>
                            <td className="px-4 py-5 hidden md:table-cell">
                              <ResponseTimeBadge ms={w.lastResponseTime} />
                              {w.lastStatusCode && <div className="text-xs font-medium text-slate-400 mt-1">HTTP {w.lastStatusCode}</div>}
                            </td>
                            <td className="px-4 py-5 hidden lg:table-cell">
                              {uptimeMap[w._id] !== undefined ? (
                                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg ${getUptimeBg(uptimeMap[w._id])}`}>
                                  {uptimeMap[w._id] !== null ? `${uptimeMap[w._id]}%` : '—'}
                                </span>
                              ) : (
                                <div className="w-14 h-6 bg-slate-100 dark:bg-slate-700 rounded-md animate-pulse" />
                              )}
                            </td>
                            <td className="px-4 py-5 hidden xl:table-cell">
                              {w.isActive ? <NextPingCountdown nextPing={w.nextPing} /> : <span className="text-slate-400 text-sm font-medium">Paused</span>}
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setSelectedWebsiteLogs(w); }} 
                                  className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all bg-slate-100 dark:bg-slate-800" 
                                  title="Logs"
                                >
                                  <FileText size={16} />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); toggleStatus(w._id); }} 
                                  className={`p-2 rounded-xl transition-all ${w.isActive ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/20'}`} 
                                  title={w.isActive ? 'Pause Monitor' : 'Resume Monitor'}
                                >
                                  {w.isActive ? <Pause size={16} /> : <Play size={16} />}
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); deleteWebsite(w._id); }} 
                                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all bg-slate-100 dark:bg-slate-800" 
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Expanded Detail Panel */}
                          {expandedId === w._id && (
                            <tr className="bg-slate-50/30 dark:bg-slate-800/10">
                              <td colSpan="6" className="px-6 py-6 border-b border-slate-100 dark:border-slate-700/60">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-top-2 duration-200">
                                  
                                  {/* Left Column: Latency Chart & History (8 cols) */}
                                  <div className="lg:col-span-8 space-y-6">
                                    {/* Sparkline / History Blocks */}
                                    <div>
                                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Activity size={14} className="text-blue-500" />
                                        Response History (Last 20 checks)
                                      </h4>
                                      {logsLoading[w._id] ? (
                                        <div className="flex gap-1.5 py-2">
                                          {[...Array(20)].map((_, idx) => (
                                            <div key={idx} className="w-5 h-8 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                                          ))}
                                        </div>
                                      ) : !expandedLogs[w._id] || expandedLogs[w._id].length === 0 ? (
                                        <p className="text-sm text-slate-500 italic font-medium">No ping logs recorded yet.</p>
                                      ) : (
                                        <div className="flex flex-wrap gap-1.5 py-1">
                                          {expandedLogs[w._id].map((log, idx) => {
                                            const isUp = log.success;
                                            const timeStr = new Date(log.checkedAt).toLocaleString();
                                            
                                            return (
                                              <div
                                                key={log._id || idx}
                                                className={`w-5 h-8 rounded-md flex items-end justify-center pb-1 cursor-pointer transition-all hover:scale-110 group relative ${
                                                  isUp 
                                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/20' 
                                                    : 'bg-red-500/10 hover:bg-red-500/30 border border-red-500/20'
                                                }`}
                                              >
                                                {/* Inner bar representing latency height */}
                                                {isUp && (
                                                  <div 
                                                    className="w-1 bg-emerald-500 rounded-full" 
                                                    style={{ 
                                                      height: `${Math.min(Math.max((log.responseTime / 1000) * 100, 15), 85)}%` 
                                                    }} 
                                                  />
                                                )}
                                                {!isUp && (
                                                  <div className="w-1 h-2 bg-red-500 rounded-full animate-pulse" />
                                                )}
                                                
                                                {/* Premium Custom Tooltip */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700 w-48 pointer-events-none">
                                                  <div className="flex items-center gap-1.5 font-bold mb-1">
                                                    <span className={`w-2 h-2 rounded-full ${isUp ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                                                    {isUp ? 'Online' : 'Offline'}
                                                  </div>
                                                  {isUp ? (
                                                    <div className="font-mono text-[10px] space-y-0.5 text-slate-300">
                                                      <div>Latency: <span className="text-emerald-400 font-bold">{log.responseTime}ms</span></div>
                                                      <div>Code: <span className="text-emerald-400">{log.statusCode}</span></div>
                                                    </div>
                                                  ) : (
                                                    <div className="font-mono text-[10px] space-y-0.5 text-slate-300">
                                                      <div className="text-red-400 font-bold break-words">{log.errorMessage || 'Error'}</div>
                                                      <div>Code: <span className="text-red-400">{log.statusCode || 'N/A'}</span></div>
                                                    </div>
                                                  )}
                                                  <div className="text-[9px] text-slate-400 mt-1.5 border-t border-slate-850 pt-1">
                                                    {new Date(log.checkedAt).toLocaleString()}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>

                                    {/* Mini Response Time Area Chart */}
                                    <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-855 p-4 rounded-2xl">
                                      <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Latency Trend (ms)</h5>
                                      <div className="w-full h-36">
                                        {!expandedLogs[w._id] || expandedLogs[w._id].length === 0 ? (
                                          <div className="flex items-center justify-center h-full text-xs text-slate-400">No data points</div>
                                        ) : (
                                          <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart 
                                              data={[...(expandedLogs[w._id] || [])].reverse().map(l => ({
                                                time: new Date(l.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                                latency: l.success ? l.responseTime : 0,
                                                status: l.success ? 'Up' : 'Down'
                                              }))}
                                              margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                                            >
                                              <defs>
                                                <linearGradient id={`colorLat-${w._id}`} x1="0" y1="0" x2="0" y2="1">
                                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                              </defs>
                                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.08} />
                                              <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                              <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                              <Tooltip 
                                                content={({ active, payload }) => {
                                                  if (active && payload && payload.length) {
                                                    return (
                                                      <div className="bg-slate-950 border border-slate-800 p-2 rounded shadow text-[10px] font-mono text-white">
                                                        <div>Latency: <span className="text-blue-400 font-bold">{payload[0].value}ms</span></div>
                                                      </div>
                                                    );
                                                  }
                                                  return null;
                                                }}
                                              />
                                              <Area type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill={`url(#colorLat-${w._id})`} />
                                            </AreaChart>
                                          </ResponsiveContainer>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right Column: Actions & Badges (4 cols) */}
                                  <div className="lg:col-span-4 space-y-6 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 lg:pl-8 pt-6 lg:pt-0">
                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 p-3 rounded-xl">
                                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">30d Uptime</div>
                                        <div className="text-lg font-black text-slate-800 dark:text-slate-200 mt-0.5">
                                          {uptimeMap[w._id] !== undefined ? `${uptimeMap[w._id]}%` : '—'}
                                        </div>
                                      </div>
                                      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 p-3 rounded-xl">
                                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Avg Latency</div>
                                        <div className="text-lg font-black text-slate-800 dark:text-slate-200 mt-0.5">
                                          {expandedLogs[w._id] && expandedLogs[w._id].filter(l => l.success).length > 0
                                            ? `${Math.round(expandedLogs[w._id].filter(l => l.success).reduce((acc, curr) => acc + curr.responseTime, 0) / expandedLogs[w._id].filter(l => l.success).length)}ms`
                                            : '—'}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 p-4 rounded-xl space-y-2">
                                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Policy Checks</div>
                                      <div className="text-sm text-slate-600 dark:text-slate-300">
                                        <span className="font-semibold">Expected status:</span> {w.expectedStatusCode || 200}
                                      </div>
                                      <div className="text-sm text-slate-600 dark:text-slate-300">
                                        <span className="font-semibold">Expected text:</span> {w.expectedText ? w.expectedText : 'Any content'}
                                      </div>
                                      <div className="text-sm text-slate-600 dark:text-slate-300">
                                        <span className="font-semibold">SSL expiry:</span> {w.sslDaysRemaining !== null && w.sslDaysRemaining !== undefined ? `${w.sslDaysRemaining} days` : 'Not available'}
                                      </div>
                                    </div>

                                    {/* Test Ping Button */}
                                    <div>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleManualPing(w._id); }}
                                        disabled={manualPingLoading[w._id] || !w.isActive}
                                        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-98 disabled:opacity-50"
                                      >
                                        {manualPingLoading[w._id] ? (
                                          <>
                                            <RefreshCw size={15} className="animate-spin" />
                                            Pinging Server...
                                          </>
                                        ) : (
                                          <>
                                            <Zap size={15} className="text-yellow-400 fill-yellow-400" />
                                            Test Ping Now
                                          </>
                                        )}
                                      </button>
                                      <p className="text-[10px] text-slate-400 mt-2 text-center font-medium">
                                        {!w.isActive ? "Activate monitor to enable manual pings." : "Pings your endpoint immediately and records the result."}
                                      </p>
                                    </div>

                                    {/* Uptime Badge Section */}
                                    {/* <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                                      <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Public Uptime Badge</h5>
                                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 p-2.5 rounded-xl mb-3">
                                       
                                        <span className="text-[9px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">Public API</span>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                                          <span>Copy Markdown</span>
                                          <CopyBadgeButton 
                                            text={`[![Pinglix Uptime](${window.location.origin}/api/websites/${w._id}/badge)](${w.url})`} 
                                          />
                                        </div>
                                        <div className="bg-slate-900 text-slate-300 p-2.5 rounded-lg text-[10px] font-mono select-all overflow-x-auto whitespace-nowrap scrollbar-none border border-slate-800">
                                          {`[![Pinglix Uptime](${window.location.origin}/api/websites/${w._id}/badge)](${w.url})`}
                                        </div>
                                      </div>
                                    </div> */}






                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: ANALYTICS ── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                    Global Latency Chart
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Real-time response times across all deployed monitors</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 px-4 py-2 rounded-xl">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                    24h Pings: {stats.totalChecks24h}
                  </span>
                </div>
              </div>
              
              {chartData.length > 0 ? (
                <div className="w-full h-[450px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                      <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} minTickGap={30} dy={10} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} dx={-10} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area type="monotone" dataKey="ms" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorLatency)" activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                  <BarChart3 size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="font-semibold text-slate-600 dark:text-slate-400">Not enough data points yet</p>
                  <p className="text-sm text-slate-400 mt-1">Graphs will generate once your monitors execute their first few pings.</p>
                </div>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
               <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
                 <h3 className="font-bold mb-4 flex items-center gap-2"><Globe size={18} className="text-blue-500" /> Infrastructure Health</h3>
                 <div className="space-y-4">
                   <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                     <span className="font-medium text-slate-600 dark:text-slate-300">Total Valid Requests (24h)</span>
                     <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">
                        {stats.totalChecks24h ? Math.round((stats.overallUptime24h / 100) * stats.totalChecks24h) : 0}
                     </span>
                   </div>
                   <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                     <span className="font-medium text-slate-600 dark:text-slate-300">Total Failed Requests (24h)</span>
                     <span className="font-black text-lg text-red-600 dark:text-red-400">
                        {stats.totalChecks24h ? stats.totalChecks24h - Math.round((stats.overallUptime24h / 100) * stats.totalChecks24h) : 0}
                     </span>
                   </div>
                 </div>
               </div>
               <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
                 <h3 className="font-bold mb-4 flex items-center gap-2"><Zap size={18} className="text-blue-400" /> Cold Start Prevention</h3>
                 <p className="text-slate-300 leading-relaxed text-sm mb-4">
                   By tracking your servers through Pinglix, you've forced external hosts (Render, Heroku) to keep your instances warm. 
                 </p>
                 <div className="inline-block bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-lg text-sm font-semibold">
                   Approx. saved cold starts: <span className="text-blue-400">{stats.totalChecks24h}</span>
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* ── TAB: ACTIVITY LOGS ── */}
        {activeTab === 'activity' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <List size={20} className="text-blue-500" />
                    Global Activity Feed
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Live streaming logs from all active monitors</p>
                </div>
              </div>
              
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50 max-h-[70vh] overflow-y-auto">
                {stats.recentActivity.length === 0 ? (
                  <div className="py-24 text-center">
                    <Clock size={40} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Awaiting first logs</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">Logs will stream in automatically once the background scheduler pings your servers.</p>
                  </div>
                ) : (
                  stats.recentActivity.map((log) => (
                    <div key={log._id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-4">
                        <div className={`p-2.5 rounded-xl flex-shrink-0 ${log.success ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {log.success ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">{log.websiteName}</h4>
                          <a href={log.websiteUrl} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-blue-500 font-medium mt-0.5 truncate max-w-xs block">
                            {log.websiteUrl}
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 sm:gap-6 ml-14 sm:ml-0 text-sm">
                        <div className="flex flex-col sm:items-end">
                          <span className="text-slate-500 text-xs uppercase font-semibold tracking-wider">Status Code</span>
                          <span className={`font-black font-mono mt-0.5 ${log.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {log.statusCode || 'ERROR'}
                          </span>
                        </div>
                        <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700" />
                        <div className="flex flex-col sm:items-end">
                          <span className="text-slate-500 text-xs uppercase font-semibold tracking-wider">Latency</span>
                          <span className="font-bold font-mono text-slate-700 dark:text-slate-300 mt-0.5">{log.responseTime ? `${log.responseTime}ms` : '—'}</span>
                        </div>
                        <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700" />
                        <div className="flex flex-col sm:items-end w-24">
                          <span className="text-slate-500 text-xs uppercase font-semibold tracking-wider">Executed</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-400 mt-0.5">{timeAgo(log.checkedAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      <AddWebsiteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchData();
        }}
      />

      <WebsiteLogsModal
        website={selectedWebsiteLogs}
        onClose={() => setSelectedWebsiteLogs(null)}
      />
    </div>
  );
};

export default Dashboard;
