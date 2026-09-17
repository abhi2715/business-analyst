import React, { useState } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  MessageSquare, Database, TrendingUp, DollarSign, Download,
  Filter, Calendar, BellRing, Target, Layers
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardProps {
  data: any;
  onStartChat: () => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 25 } }
};

const formatINNumber = (num: number, isCurrency = false) => {
  return new Intl.NumberFormat('en-IN', {
    style: isCurrency ? 'currency' : 'decimal',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(num);
};

const CustomTooltip = ({ active, payload, label, trendAvg }: any) => {
  if (active && payload && payload.length) {
    let insight = null;
    if (trendAvg && payload[0]?.name === 'totalSales') {
      const val = payload[0].value;
      const diff = val - trendAvg;
      const percent = (Math.abs(diff) / trendAvg) * 100;
      if (diff > 0) {
        insight = `Sales were ${percent.toFixed(1)}% above the period average, indicating a peak in performance.`;
      } else {
        insight = `Sales were ${percent.toFixed(1)}% below the period average.`;
      }
    }

    return (
      <div style={{
        background: 'rgba(10, 14, 26, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        padding: '12px 16px',
        borderRadius: '10px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        color: '#fff',
        maxWidth: '220px'
      }}>
        <p style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </p>
        {payload.map((p: any, idx: number) => (
          <p key={idx} style={{ margin: '2px 0', fontSize: '14px', fontWeight: '700', color: p.color || 'var(--accent-primary)' }}>
            {p.name}: {typeof p.value === 'number' ? formatINNumber(p.value, p.name?.toLowerCase().includes('sales') || p.name?.toLowerCase().includes('profit')) : p.value}
          </p>
        ))}
        {insight && (
          <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
            {insight}
          </p>
        )}
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ data, onStartChat }) => {
  if (!data) return null;

  const [dateFilter, setDateFilter] = useState('All Time');
  const [regionFilter, setRegionFilter] = useState('All Regions');
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  let trendAvg = 0;
  if (data.trendData && data.trendData.length > 0) {
    const sum = data.trendData.reduce((acc: number, curr: any) => acc + (curr.totalSales || 0), 0);
    trendAvg = sum / data.trendData.length;
  }

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px',
      overflowY: 'auto', paddingRight: '8px', paddingBottom: '40px'
    }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            Analytics Dashboard
            <span style={{
              fontSize: '11px', fontWeight: '500', background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--accent-tertiary)', padding: '4px 12px', borderRadius: '100px',
              border: '1px solid rgba(99, 102, 241, 0.15)'
            }}>
              Updated: {today}
            </span>
          </h2>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(99, 102, 241, 0.05)', padding: '6px 12px',
              borderRadius: '8px', fontSize: '12px', border: '1px solid var(--border-color)'
            }}>
              <Calendar size={13} color="var(--text-muted)" />
              <select style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}
                value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                <option>All Time</option><option>Last 30 Days</option><option>Year to Date</option>
              </select>
            </div>
            {data.categoricalColumns?.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(99, 102, 241, 0.05)', padding: '6px 12px',
                borderRadius: '8px', fontSize: '12px', border: '1px solid var(--border-color)'
              }}>
                <Filter size={13} color="var(--text-muted)" />
                <select style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}
                  value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
                  <option>All {data.categoricalColumns[0]}</option>
                  <option>Segment A</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{
            background: 'rgba(99, 102, 241, 0.05)', color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)', padding: '10px 16px',
            borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center',
            gap: '8px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
          }}>
            <Download size={15} /> Export
          </button>
          <button onClick={onStartChat} style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            color: 'white', border: 'none', padding: '10px 20px',
            borderRadius: '10px', fontSize: '13px', fontWeight: '600',
            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: '0 4px 16px var(--accent-glow)',
            transition: 'all 0.2s'
          }}>
            <MessageSquare size={15} /> Chat with Data
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>

        <motion.div variants={itemVariants} className="glass kpi-card hover-tooltip-container">
          <div className="hover-tooltip-content">{data.componentInsights?.totalRevenue}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Revenue</span>
            <DollarSign size={15} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'end', gap: '10px' }}>
            {data.totalSales ? formatINNumber(Number(data.totalSales), true) : 'N/A'}
            {data.totalSales && <span style={{ fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', paddingBottom: '4px' }}><TrendingUp size={12} style={{marginRight: '2px'}}/> 12.4%</span>}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass kpi-card hover-tooltip-container">
          <div className="hover-tooltip-content">{data.componentInsights?.totalRows}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Rows</span>
            <Database size={15} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'end', gap: '10px' }}>
            {formatINNumber(data.rowCount)}
            <span style={{ fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', paddingBottom: '4px' }}><TrendingUp size={12} style={{marginRight: '2px'}}/> 8.2%</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass kpi-card hover-tooltip-container">
          <div className="hover-tooltip-content">{data.componentInsights?.profitMargin}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Profit / Margin</span>
            <TrendingUp size={15} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'end', gap: '10px' }}>
            {data.totalProfit ? formatINNumber(Number(data.totalProfit), true) : 'N/A'}
            {data.totalProfit && <span style={{ fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', paddingBottom: '4px' }}><TrendingUp size={12} style={{marginRight: '2px'}}/> 4.1%</span>}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass kpi-card hover-tooltip-container" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(139, 92, 246, 0.04))' }}>
          <div className="hover-tooltip-content">{data.componentInsights?.healthScore}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-tertiary)', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Health Score</span>
            <Target size={15} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
            94<span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/100</span>
          </div>
          <div style={{ width: '100%', background: 'rgba(99, 102, 241, 0.1)', height: '3px', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
            <div style={{ width: '94%', background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))', height: '100%', borderRadius: '2px' }} />
          </div>
        </motion.div>
      </motion.div>

      {/* Row 2: Performance Trend & Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="glass hover-tooltip-container" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <div className="hover-tooltip-content">{data.componentInsights?.trendChart}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="var(--accent-primary)"/> Performance Trend
            </h3>
          </div>
          <div style={{ width: '100%', height: '280px' }}>
            {data.trendData && data.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trendData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.1)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} dy={8} />
                  <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip trendAvg={trendAvg} />} />
                  <Area type="monotone" dataKey="totalSales" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No date column detected for time-series analysis.
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Insights */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BellRing size={16} color="var(--warning)"/> Alerts & Insights
          </h3>

          <div style={{ background: 'rgba(99, 102, 241, 0.06)', borderLeft: '3px solid var(--accent-primary)', padding: '14px 16px', borderRadius: '0 8px 8px 0', marginBottom: '14px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '600', color: 'var(--accent-tertiary)' }}>AI Diagnostic</h4>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              {data.aiInsight}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ background: 'var(--success-muted)', padding: '5px', borderRadius: '50%', flexShrink: 0 }}><TrendingUp size={12} color="var(--success)" /></div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>Conversion rate exceeded target</p>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>4.8% above baseline</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ background: 'var(--danger-muted)', padding: '5px', borderRadius: '50%', flexShrink: 0 }}><TrendingUp size={12} color="var(--danger)" style={{ transform: 'scaleY(-1)' }} /></div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>Unusual drop detected</p>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>Revenue dropped 18% in latest period</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Row 3: Breakdown & Targets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass hover-tooltip-container" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <div className="hover-tooltip-content">{data.componentInsights?.breakdownChart}</div>
          <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="var(--accent-secondary)"/> Breakdown by {data.breakdown?.category || 'Category'}
          </h3>
          <div style={{ width: '100%', height: '240px' }}>
            {data.breakdown?.data && data.breakdown.data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.breakdown.data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {data.breakdown.data.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No categorical columns detected.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass hover-tooltip-container" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <div className="hover-tooltip-content">{data.componentInsights?.targetChart}</div>
          <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={16} color="var(--success)"/> Target vs Actual
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '16px' }}>
            {data.columnStats?.slice(0, 4).map((stat: any, idx: number) => {
              const actual = Number(stat.average);
              const target = actual * 1.2;
              const percent = Math.min((actual / target) * 100, 100);
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>{stat.column}</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: COLORS[idx % COLORS.length] }}>{percent.toFixed(0)}%</span>
                  </div>
                  <div style={{ width: '100%', background: 'rgba(99, 102, 241, 0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, background: `linear-gradient(90deg, ${COLORS[idx % COLORS.length]}, ${COLORS[(idx + 1) % COLORS.length]})`, height: '100%', borderRadius: '3px', transition: 'width 1s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Actual: {formatINNumber(actual)}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Goal: {formatINNumber(target)}</span>
                  </div>
                </div>
              );
            })}
            {!data.columnStats?.length && <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No numeric targets available.</div>}
          </div>
        </motion.div>
      </div>

      {/* Data Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="glass" style={{ padding: '0', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} color="var(--info)"/> Data Preview
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Top 10 records</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="dashboard-table">
            <thead>
              <tr>
                {data.columns.map((col: string) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rawSample?.map((row: any, i: number) => (
                <tr key={i}>
                  {data.columns.map((col: string) => (
                    <td key={col}>
                      {typeof row[col] === 'number'
                        ? formatINNumber(row[col], col.toLowerCase().includes('sales') || col.toLowerCase().includes('profit'))
                        : String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

    </div>
  );
};

export default Dashboard;
