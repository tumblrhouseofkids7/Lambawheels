import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Trophy,
  AlertTriangle,
  Flame,
  Building2,
  TrendingUp,
  RefreshCw,
  Search,
  X,
  ChevronRight,
  Loader2,
  Copy,
  Check,
  LayoutGrid,
  TableProperties
} from 'lucide-react';
import { insightService } from '../services/api';
import toast from 'react-hot-toast';

/* ── Simple Circular Ring Gauge Card (Matches Reference Image) ── */
const RingGaugeCard = ({ title, percent = 0, subtitle, strokeColor = '#7c3aed', trackColor = '#f3f4f6' }) => {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, Number(percent) || 0));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
      <p className="text-sm font-bold text-gray-800 text-center">{title}</p>

      <div className="my-3 flex items-center justify-center gap-4">
        {/* Circular SVG Ring */}
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke={trackColor}
              strokeWidth="7"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
        </div>

        {/* Percentage Readout */}
        <div className="z-10">
          <span className="text-2xl font-extrabold text-gray-900">{clamped}%</span>
          {subtitle && <p className="text-[11px] text-gray-400 font-medium mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

/* ── Simple Donut Chart Card (Matches Bottom-Left of Reference Image) ── */
const SimpleDonutCard = ({ items = [], totalVolume = 0 }) => {
  const colors = ['#9333ea', '#4f46e5', '#c026d3', '#06b6d4'];
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  // Ensure percentages sum cleanly for visual ring
  const totalVal = items.reduce((s, i) => s + (i.value || 0), 0) || 1;
  let cumulativePercent = 0;

  const formatIndianCompact = (num) => {
    const n = Number(num) || 0;
    if (n >= 10000000) return `${(n / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
    if (n >= 100000) return `${(n / 100000).toFixed(2).replace(/\.00$/, '')} L`;
    return n.toLocaleString('en-IN');
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-gray-900">Production Share by Line</h3>
        <p className="text-xs text-gray-400 mt-0.5">Breakdown of output across factory die & molding lines</p>
      </div>

      <div className="my-6 flex flex-col sm:flex-row items-center justify-around gap-6">
        {/* Donut SVG */}
        <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="22" />
            {items.map((item, idx) => {
              const frac = (item.value || 0) / totalVal;
              const dash = frac * circumference;
              const offset = -cumulativePercent * circumference;
              cumulativePercent += frac;
              return (
                <circle
                  key={item.label}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={colors[idx % colors.length]}
                  strokeWidth="22"
                  strokeDasharray={`${dash} ${circumference}`}
                  strokeDashoffset={offset}
                  className="transition-all duration-700"
                />
              );
            })}
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-2"
            title={`${Number(totalVolume || 0).toLocaleString('en-IN')} pcs`}
          >
            <span className="text-[11px] font-semibold text-gray-400">Total Output</span>
            <span className="text-lg font-extrabold text-gray-900">{formatIndianCompact(totalVolume)}</span>
          </div>
        </div>

        {/* Simple Legend List */}
        <div className="space-y-3 w-full max-w-[260px]">
          {items.map((item, idx) => (
            <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3.5 h-3.5 rounded-md shrink-0"
                  style={{ backgroundColor: colors[idx % colors.length] }}
                />
                <span className="text-gray-700 font-medium text-xs truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-gray-500 font-semibold text-xs">
                  {Number(item.value || 0).toLocaleString('en-IN')}
                </span>
                <span className="font-extrabold text-gray-900 text-xs min-w-[38px] text-right">
                  ({item.percent}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Simple Parts Produced Stacked Bar Chart + Target Line (Matches Bottom-Right of Reference Image) ── */
const PartsProducedChart = ({ trend = [] }) => {
  const maxVal = useMemo(() => {
    if (!trend.length) return 100;
    const highest = Math.max(
      ...trend.map(d => Math.max((d.goodParts || 0) + (d.rejectParts || 0), d.targetParts || 0))
    );
    return highest > 0 ? highest * 1.12 : 100;
  }, [trend]);

  const avgTarget = useMemo(() => {
    const withTarget = trend.filter(d => d.targetParts > 0);
    if (!withTarget.length) return 0;
    return Math.round(withTarget.reduce((s, d) => s + d.targetParts, 0) / withTarget.length);
  }, [trend]);

  const targetLineBottomPercent = avgTarget > 0 ? Math.min(92, Math.round((avgTarget / maxVal) * 100)) : 0;

  const formatAxis = (val) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return Math.round(val);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-gray-900">Parts Produced</h3>
        <p className="text-xs text-gray-400 mt-0.5">Daily good output vs defects compared against target</p>
      </div>

      {trend.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-400">No daily production records for this period.</div>
      ) : (
        <div className="mt-5">
          {/* Chart Plot Area */}
          <div className="flex items-end gap-3 h-44 relative pt-4 pb-6 px-2 border-b border-gray-100">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between h-full text-[10px] text-gray-400 font-semibold pr-2 select-none">
              <span>{formatAxis(maxVal)}</span>
              <span>{formatAxis(maxVal * 0.66)}</span>
              <span>{formatAxis(maxVal * 0.33)}</span>
              <span>0</span>
            </div>

            {/* Bars Container */}
            <div className="flex-1 h-full flex items-end justify-around gap-2 relative">
              {/* Dashed Target Line */}
              {avgTarget > 0 && (
                <div
                  className="absolute left-0 right-0 border-t-2 border-dashed border-purple-600 z-20 pointer-events-none flex justify-end"
                  style={{ bottom: `${targetLineBottomPercent}%` }}
                >
                  <span className="bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded -mt-2.5 shadow-sm">
                    Target: {formatAxis(avgTarget)}
                  </span>
                </div>
              )}

              {trend.map((day) => {
                const goodH = Math.max(4, Math.round(((day.goodParts || 0) / maxVal) * 100));
                const rejH = day.rejectParts > 0 ? Math.max(3, Math.round((day.rejectParts / maxVal) * 100)) : 0;

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Hover Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-gray-900 text-white text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap z-30 pointer-events-none shadow-md">
                      Good: {day.goodParts.toLocaleString('en-IN')} | Reject: {day.rejectParts.toLocaleString('en-IN')}
                    </div>

                    {/* Stacked Bar */}
                    <div className="w-full max-w-[28px] flex flex-col justify-end h-full rounded-t-md overflow-hidden">
                      {rejH > 0 && (
                        <div
                          style={{ height: `${rejH}%` }}
                          className="w-full bg-orange-400 transition-all duration-500"
                        />
                      )}
                      <div
                        style={{ height: `${goodH}%` }}
                        className="w-full bg-teal-500 transition-all duration-500"
                      />
                    </div>

                    {/* Date Label */}
                    <span className="text-[10px] text-gray-500 font-semibold mt-2 -rotate-30 origin-top-left whitespace-nowrap">
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 mt-4 text-xs font-semibold text-gray-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span>Good Parts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
              <span>Defects</span>
            </div>
            {avgTarget > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-4 border-t-2 border-dashed border-purple-600" />
                <span>Target</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ExecutiveInsights = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('summary'); // 'summary' | 'tables'
  const [activeTab, setActiveTab] = useState('topPerformers');
  const [timeframe, setTimeframe] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      const res = await insightService.getExecutiveInsights({ timeframe });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load executive insights:', err);
      toast.error('Failed to load executive insights');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [timeframe]);

  const summary = data?.summary || {};
  const gauges = data?.visualMetrics?.gauges || {};
  const dailyTrend = data?.visualMetrics?.dailyProductionTrend || [];
  const lineBreakdown = data?.visualMetrics?.lineBreakdown || [];

  const topPerformer = data?.topPerformers?.[0];
  const worstStreak = data?.continuousDownperformers?.[0];
  const topVendorHike = data?.vendorPriceHikes?.[0];
  const topClient = data?.regularClients?.[0];

  const handleCopyBriefing = () => {
    if (!data) return;
    const tfLabel = { all: 'All Time', month: 'Last 30 Days', week: 'Last 7 Days', today: 'Today' }[timeframe];

    let text = `🏭 *LAMBA WHEELS — EXECUTIVE SNAPSHOT (${tfLabel})*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📊 *Factory KPIs:* Target: ${gauges.targetAchievementRate ?? 100}% | Attendance: ${gauges.attendanceRate ?? 100}% | Good Parts: ${gauges.goodQualityRate ?? 100}% | Rejects: ${gauges.rejectRate ?? 0}%\n`;
    if (topPerformer) {
      text += `🌟 *Top Producer:* ${topPerformer.name} (${topPerformer.totalNet.toLocaleString('en-IN')} pcs, ₹${Math.round(topPerformer.totalBonus).toLocaleString('en-IN')} bonus)\n`;
    }
    if (worstStreak) {
      text += `🚨 *Chronic Shortfall:* ${worstStreak.name} (${worstStreak.streak} shifts below target — Foreman: ${worstStreak.foremanName})\n`;
    }
    if (topVendorHike) {
      text += `💸 *Vendor Price Alert:* ${topVendorHike.vendor} (+₹${topVendorHike.priceDiff}/unit on ${topVendorHike.particulars})\n`;
    }
    if (topClient) {
      text += `🏢 *Top Client:* ${topClient.clientName} (${topClient.totalOrders} orders, ₹${topClient.totalRevenue.toLocaleString('en-IN')})\n`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('WhatsApp briefing copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Filtered lists for table search
  const filteredTopPerformers = useMemo(() => {
    if (!data?.topPerformers) return [];
    if (!searchQuery) return data.topPerformers;
    const q = searchQuery.toLowerCase();
    return data.topPerformers.filter(w =>
      w.name?.toLowerCase().includes(q) ||
      w.labourType?.toLowerCase().includes(q) ||
      w.foremanName?.toLowerCase().includes(q)
    );
  }, [data?.topPerformers, searchQuery]);

  const filteredTargetDeficits = useMemo(() => {
    if (!data?.targetDeficits) return [];
    if (!searchQuery) return data.targetDeficits;
    const q = searchQuery.toLowerCase();
    return data.targetDeficits.filter(w =>
      w.name?.toLowerCase().includes(q) ||
      w.labourType?.toLowerCase().includes(q) ||
      w.foremanName?.toLowerCase().includes(q)
    );
  }, [data?.targetDeficits, searchQuery]);

  const filteredContinuousDownperformers = useMemo(() => {
    if (!data?.continuousDownperformers) return [];
    if (!searchQuery) return data.continuousDownperformers;
    const q = searchQuery.toLowerCase();
    return data.continuousDownperformers.filter(w =>
      w.name?.toLowerCase().includes(q) ||
      w.labourType?.toLowerCase().includes(q) ||
      w.foremanName?.toLowerCase().includes(q)
    );
  }, [data?.continuousDownperformers, searchQuery]);

  const filteredRegularClients = useMemo(() => {
    if (!data?.regularClients) return [];
    if (!searchQuery) return data.regularClients;
    const q = searchQuery.toLowerCase();
    return data.regularClients.filter(c =>
      c.clientName?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.frequencyStatus?.toLowerCase().includes(q)
    );
  }, [data?.regularClients, searchQuery]);

  const filteredVendorPriceHikes = useMemo(() => {
    if (!data?.vendorPriceHikes) return [];
    if (!searchQuery) return data.vendorPriceHikes;
    const q = searchQuery.toLowerCase();
    return data.vendorPriceHikes.filter(v =>
      v.vendor?.toLowerCase().includes(q) ||
      v.particulars?.toLowerCase().includes(q)
    );
  }, [data?.vendorPriceHikes, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Executive Insights
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Visual factory pulse, top performers, chronic shortfalls, repeat buyers, and vendor price alerts.
          </p>
        </div>

        {/* View Toggle, Timeframe & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Toggle: Summary vs Full Tables */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center border border-gray-200">
            <button
              onClick={() => setViewMode('summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'summary'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Visual Summary
            </button>
            <button
              onClick={() => setViewMode('tables')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'tables'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              Full Tables
            </button>
          </div>

          {/* Timeframe selector */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center">
            {[
              { id: 'all', label: 'All' },
              { id: 'month', label: '30 Days' },
              { id: 'week', label: '7 Days' },
              { id: 'today', label: 'Today' }
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  timeframe === tf.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Copy WhatsApp Briefing */}
          <button
            onClick={handleCopyBriefing}
            className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            title="Copy snapshot for WhatsApp"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Briefing'}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={fetchInsights}
            disabled={isLoading}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MODE 1: VISUAL SUMMARY (DEFAULT)                              */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {viewMode === 'summary' && (
        <div className="space-y-6">
          {/* ─── 1. FOUR SIMPLE RING GAUGES (FROM REFERENCE IMAGE) ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <RingGaugeCard
              title="Target Achieved"
              percent={gauges.targetAchievementRate ?? 100}
              subtitle="vs target goal"
              strokeColor="#f97316"
            />
            <RingGaugeCard
              title="Attendance"
              percent={gauges.attendanceRate ?? 100}
              subtitle={`${gauges.presentShiftsCount || 0} shifts present`}
              strokeColor="#c026d3"
            />
            <RingGaugeCard
              title="Good Count"
              percent={gauges.goodQualityRate ?? 100}
              subtitle={`${(gauges.totalGoodParts || 0).toLocaleString('en-IN')} good pcs`}
              strokeColor="#14b8a6"
            />
            <RingGaugeCard
              title="Reject Count"
              percent={gauges.rejectRate ?? 0}
              subtitle={`${(gauges.totalRejectParts || 0).toLocaleString('en-IN')} scrap pcs`}
              strokeColor="#ef4444"
            />
          </div>

          {/* ─── 2. DONUT BREAKDOWN & PARTS PRODUCED BAR CHART ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SimpleDonutCard
              items={lineBreakdown}
              totalVolume={summary.totalProductionVolume || 0}
            />
            <PartsProducedChart trend={dailyTrend} />
          </div>

          {/* ─── 3. FOUR ACTIONABLE INSIGHT CARDS ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* BOX 1: 🌟 WHO TO REWARD (Top Producers) */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 text-sm">Who Makes the Highest</h2>
                      <p className="text-xs text-gray-400">Top producers by net output & bonus</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setViewMode('tables'); setActiveTab('topPerformers'); }}
                    className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="mt-4 space-y-2.5">
                  {isLoading ? (
                    <p className="text-xs text-gray-400 py-6 text-center">Loading performers...</p>
                  ) : (data?.topPerformers || []).slice(0, 4).map((w, index) => (
                    <div
                      key={w.labourId}
                      className="p-3 rounded-xl bg-gray-50/70 hover:bg-gray-50 border border-gray-100 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          index === 0 ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300' :
                          index === 1 ? 'bg-slate-200 text-slate-700' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{w.name}</p>
                          <p className="text-xs text-gray-400">
                            {w.labourType} • Foreman: {w.foremanName}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-extrabold text-gray-900 text-sm">
                          {w.totalNet.toLocaleString('en-IN')} <span className="text-xs font-normal text-gray-400">pcs</span>
                        </p>
                        <p className="text-xs font-bold text-emerald-600">
                          +₹{Math.round(w.totalBonus).toLocaleString('en-IN')} bonus
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BOX 2: 🚨 WHO NEEDS ATTENTION (Chronic Target Deficits) */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 text-sm">Continuously Downperforming</h2>
                      <p className="text-xs text-gray-400">Workers missing target multiple shifts in a row</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setViewMode('tables'); setActiveTab('continuousDownperformers'); }}
                    className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="mt-4 space-y-2.5">
                  {isLoading ? (
                    <p className="text-xs text-gray-400 py-6 text-center">Checking streaks...</p>
                  ) : (data?.continuousDownperformers || []).length === 0 ? (
                    <div className="py-8 text-center text-emerald-600 font-semibold text-xs">
                      🎉 Excellent! No workers currently on a chronic failure streak.
                    </div>
                  ) : (data?.continuousDownperformers || []).slice(0, 4).map((w) => (
                    <div
                      key={w.labourId}
                      className="p-3 rounded-xl bg-rose-50/40 hover:bg-rose-50/70 border border-rose-100 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 text-sm">{w.name}</p>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                            {w.streak} Shifts in a Row
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Foreman: {w.foremanName} • Reason: <span className="italic">{w.latestReason || 'Not logged'}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedHistoryItem({ type: 'worker', data: w })}
                        className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs rounded-lg transition-colors shrink-0"
                      >
                        Audit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BOX 3: 💸 RAW MATERIAL VENDOR OVERCHARGING RADAR */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 text-sm">Vendors Overcharging</h2>
                      <p className="text-xs text-gray-400">Price increases detected vs previous bill</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setViewMode('tables'); setActiveTab('vendorPriceHikes'); }}
                    className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="mt-4 space-y-2.5">
                  {isLoading ? (
                    <p className="text-xs text-gray-400 py-6 text-center">Auditing invoices...</p>
                  ) : (data?.vendorPriceHikes || []).length === 0 ? (
                    <div className="py-8 text-center text-emerald-600 font-semibold text-xs">
                      ✅ All raw material prices are stable. No vendor price hikes detected.
                    </div>
                  ) : (data?.vendorPriceHikes || []).slice(0, 4).map((v, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-purple-50/40 hover:bg-purple-50/70 border border-purple-100 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 text-sm">{v.vendor}</p>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                            +₹{v.priceDiff}/unit
                          </span>
                        </div>
                        <p className="text-xs text-purple-900 font-medium mt-0.5">
                          {v.particulars} (₹{v.previousUnitCost} ➔ ₹{v.currentUnitCost})
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-purple-900 text-xs">
                          +₹{Math.round(v.extraCostBleed).toLocaleString('en-IN')}
                        </p>
                        <button
                          onClick={() => setSelectedHistoryItem({ type: 'price', data: v })}
                          className="text-[11px] text-purple-600 hover:underline font-semibold"
                        >
                          History
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BOX 4: 🏢 REPEAT CLIENTS (Demand & Loyalty) */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 text-sm">Regularly Buying Clients</h2>
                      <p className="text-xs text-gray-400">Repeat party orders and billed revenue</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setViewMode('tables'); setActiveTab('regularClients'); }}
                    className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="mt-4 space-y-2.5">
                  {isLoading ? (
                    <p className="text-xs text-gray-400 py-6 text-center">Loading clients...</p>
                  ) : (data?.regularClients || []).length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-xs">No client order history found.</div>
                  ) : (data?.regularClients || []).slice(0, 4).map((c) => (
                    <div
                      key={c.clientName}
                      className="p-3 rounded-xl bg-blue-50/40 hover:bg-blue-50/70 border border-blue-100 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="font-bold text-gray-900 text-sm truncate max-w-[200px]">{c.clientName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {c.city || 'Punjab'} • {c.totalOrders} total orders
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-emerald-600 text-sm">
                          ₹{c.totalRevenue.toLocaleString('en-IN')}
                        </p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">
                          {c.frequencyStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MODE 2: DETAILED AUDIT TABLES                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {viewMode === 'tables' && (
        <div className="space-y-4">
          {/* Underline Tabs */}
          <div className="flex gap-6 border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'topPerformers', label: 'Highest Producers', icon: Trophy, count: data?.topPerformers?.length },
              { id: 'targetDeficits', label: 'Missing Targets', icon: AlertTriangle, count: data?.targetDeficits?.length },
              { id: 'continuousDownperformers', label: 'Chronic Downperformers', icon: Flame, count: data?.continuousDownperformers?.length },
              { id: 'regularClients', label: 'Repeat Clients', icon: Building2, count: data?.regularClients?.length },
              { id: 'vendorPriceHikes', label: 'Vendor Price Hikes', icon: TrendingUp, count: data?.vendorPriceHikes?.length },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 px-1 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                    isActive
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Search Toolbar */}
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search in this view..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 font-medium"
                />
              </div>

              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Showing full audit records
              </div>
            </div>

            {/* TAB 1: HIGHEST PRODUCERS TABLE */}
            {activeTab === 'topPerformers' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                      <th className="p-4 w-14 text-center">Rank</th>
                      <th className="p-4">Worker</th>
                      <th className="p-4">Foreman</th>
                      <th className="p-4 text-right">Net Output</th>
                      <th className="p-4 text-center">Target Fulfillment</th>
                      <th className="p-4 text-right">Daily Avg</th>
                      <th className="p-4 text-right">Bonus Accrued</th>
                      <th className="p-4 text-center">Quality (Scrap %)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTopPerformers.map((w) => (
                      <tr key={w.labourId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 text-center font-bold text-gray-700">{w.rank}</td>
                        <td className="p-4">
                          <div className="font-bold text-gray-900">{w.name}</div>
                          <span className="text-xs text-gray-400">{w.labourType} ({w.presentDays} shifts)</span>
                        </td>
                        <td className="p-4 text-gray-700">{w.foremanName}</td>
                        <td className="p-4 text-right font-extrabold text-gray-900">{w.totalNet.toLocaleString('en-IN')} pcs</td>
                        <td className="p-4 text-center font-bold text-emerald-600">{w.achievementRate}%</td>
                        <td className="p-4 text-right text-gray-700">{w.avgPerDay.toLocaleString('en-IN')} / day</td>
                        <td className="p-4 text-right font-bold text-emerald-600">₹{Math.round(w.totalBonus).toLocaleString('en-IN')}</td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {w.defectRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: TARGET DEFICITS TABLE */}
            {activeTab === 'targetDeficits' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                      <th className="p-4">Worker</th>
                      <th className="p-4">Foreman</th>
                      <th className="p-4 text-right">Target vs Actual</th>
                      <th className="p-4 text-right">Shortfall</th>
                      <th className="p-4 text-center">Achievement %</th>
                      <th className="p-4 text-center">Shifts Below Target</th>
                      <th className="p-4">Reported Reasons</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTargetDeficits.map((w) => (
                      <tr key={w.labourId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-bold text-gray-900">{w.name}</td>
                        <td className="p-4 text-gray-700">{w.foremanName}</td>
                        <td className="p-4 text-right text-gray-700">{w.totalNet.toLocaleString('en-IN')} / {w.totalTarget.toLocaleString('en-IN')} pcs</td>
                        <td className="p-4 text-right font-bold text-rose-600">-{w.shortfall.toLocaleString('en-IN')} pcs</td>
                        <td className="p-4 text-center font-bold text-orange-600">{w.achievementRate}%</td>
                        <td className="p-4 text-center font-semibold text-gray-800">{w.daysBelowTarget} shifts ({w.missedRate}%)</td>
                        <td className="p-4 text-xs text-gray-600 max-w-xs truncate">{w.topReasons?.join(', ') || 'None'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: CONTINUOUS DOWNPERFORMERS TABLE */}
            {activeTab === 'continuousDownperformers' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                      <th className="p-4">Worker</th>
                      <th className="p-4">Foreman</th>
                      <th className="p-4 text-center">Streak Below Target</th>
                      <th className="p-4 text-center">Severity</th>
                      <th className="p-4">Latest Logged Reason</th>
                      <th className="p-4 text-center">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredContinuousDownperformers.map((w) => (
                      <tr key={w.labourId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-bold text-gray-900">{w.name}</td>
                        <td className="p-4 text-gray-700">{w.foremanName}</td>
                        <td className="p-4 text-center font-black text-rose-700">{w.streak} Shifts in a Row</td>
                        <td className="p-4 text-center uppercase font-bold text-xs text-rose-600">{w.severity}</td>
                        <td className="p-4 text-gray-600 text-xs">{w.latestReason}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setSelectedHistoryItem({ type: 'worker', data: w })}
                            className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-lg text-xs"
                          >
                            View Shifts
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 4: REPEAT CLIENTS TABLE */}
            {activeTab === 'regularClients' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                      <th className="p-4">Client Name</th>
                      <th className="p-4">Location</th>
                      <th className="p-4 text-center">Orders</th>
                      <th className="p-4 text-right">Units</th>
                      <th className="p-4 text-right">Revenue</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRegularClients.map((c) => (
                      <tr key={c.clientName} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-bold text-gray-900">{c.clientName}</td>
                        <td className="p-4 text-gray-700">{c.city || 'Punjab'}</td>
                        <td className="p-4 text-center font-bold text-gray-800">{c.totalOrders}</td>
                        <td className="p-4 text-right text-gray-800">{c.totalQuantity.toLocaleString('en-IN')} pcs</td>
                        <td className="p-4 text-right font-bold text-emerald-600">₹{c.totalRevenue.toLocaleString('en-IN')}</td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                            {c.frequencyStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 5: VENDOR PRICE HIKES TABLE */}
            {activeTab === 'vendorPriceHikes' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                      <th className="p-4">Vendor & Material</th>
                      <th className="p-4">Previous Price</th>
                      <th className="p-4">Latest Price</th>
                      <th className="p-4 text-center">Hike</th>
                      <th className="p-4 text-right">Extra Cost Bleed</th>
                      <th className="p-4 text-center">History</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredVendorPriceHikes.map((v, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-gray-900">{v.vendor}</div>
                          <div className="text-xs text-purple-700 font-medium">{v.particulars}</div>
                        </td>
                        <td className="p-4 text-gray-600">₹{v.previousUnitCost} / unit</td>
                        <td className="p-4 font-bold text-gray-900">₹{v.currentUnitCost} / unit</td>
                        <td className="p-4 text-center font-bold text-rose-600">+₹{v.priceDiff} (+{v.percentIncrease}%)</td>
                        <td className="p-4 text-right font-bold text-purple-800">+₹{Math.round(v.extraCostBleed).toLocaleString('en-IN')}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setSelectedHistoryItem({ type: 'price', data: v })}
                            className="px-3 py-1 bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded-lg text-xs font-semibold"
                          >
                            History
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: SHIFT FAILURE OR VENDOR PRICE HISTORY ─── */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-gray-900 text-base">
                  {selectedHistoryItem.type === 'price' ? 'Vendor Price Audit History' : 'Consecutive Shift Failures'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedHistoryItem.type === 'price'
                    ? `${selectedHistoryItem.data.vendor} • ${selectedHistoryItem.data.particulars}`
                    : `${selectedHistoryItem.data.name} • ${selectedHistoryItem.data.streak} Shifts Below Target`}
                </p>
              </div>
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              {selectedHistoryItem.type === 'price' ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase">
                          <th className="pb-2">Date</th>
                          <th className="pb-2">Bill #</th>
                          <th className="pb-2 text-right">Unit Rate</th>
                          <th className="pb-2 text-right">Weight</th>
                          <th className="pb-2 text-right">Total Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedHistoryItem.data.history?.map((h, i) => (
                          <tr key={i} className="hover:bg-gray-50/50">
                            <td className="py-2.5 font-medium">{new Date(h.date).toLocaleDateString('en-GB')}</td>
                            <td className="py-2.5 font-mono text-gray-600">{h.billNo}</td>
                            <td className="py-2.5 text-right font-bold text-gray-900">₹{h.unitCost}</td>
                            <td className="py-2.5 text-right text-gray-600">{h.weight}</td>
                            <td className="py-2.5 text-right font-semibold text-emerald-600">₹{Math.round(h.totalCost).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase">
                          <th className="pb-2">Date</th>
                          <th className="pb-2 text-right">Actual</th>
                          <th className="pb-2 text-right">Target</th>
                          <th className="pb-2 text-center">Fulfillment</th>
                          <th className="pb-2">Reason Logged</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedHistoryItem.data.missedShifts?.map((s, i) => (
                          <tr key={i} className="hover:bg-gray-50/50">
                            <td className="py-2.5 font-medium">{new Date(s.date).toLocaleDateString('en-GB')}</td>
                            <td className="py-2.5 text-right font-bold text-gray-900">{s.net}</td>
                            <td className="py-2.5 text-right text-gray-500">{s.target}</td>
                            <td className="py-2.5 text-center font-bold text-rose-600">{s.achievementRate}%</td>
                            <td className="py-2.5 text-gray-600 italic">{s.reason || 'No reason logged'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveInsights;
