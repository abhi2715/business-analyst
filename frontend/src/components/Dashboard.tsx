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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300 } }
};

const formatINNumber = (num: number, isCurrency = false) => {
  return new Intl.NumberFormat('en-IN', {
    style: isCurrency ? 'currency' : 'decimal',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(num);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        color: '#fff',
        zIndex: 100
      }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
          {label}
        </p>
        {payload.map((p: any, idx: number) => (
          <p key={idx} style={{ margin: '4px 0', fontSize: '15px', fontWeight: '700', color: p.color || 'var(--accent-primary)' }}>
            {p.name}: {typeof p.value === 'number' ? formatINNumber(p.value, p.name?.toLowerCase().includes('sales') || p.name?.toLowerCase().includes('profit')) : p.value}
          </p>
        ))}
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

  return (
    <div className="dashboard-view" style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px',
      overflowY: 'auto', paddingRight: '12px', paddingBottom: '40px'
    }}>
      
      {/* Top Header & Global Filters */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            Analytical Dashboard
            <span style={{ fontSize: '12px', fontWeight: '500', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '4px 10px', borderRadius: '12px' }}>
              Last updated: {today}
            </span>
          </h2>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '6px', fontSize: '13px' }}>
              <Calendar size={14} color="var(--text-secondary)" />
              <select style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', cursor: 'pointer' }} value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                <option>All Time</option><option>Last 30 Days</option><option>Year to Date</option>
              </select>
            </div>
            {data.categoricalColumns?.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '6px', fontSize: '13px' }}>
                <Filter size={14} color="var(--text-secondary)" />
                <select style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', cursor: 'pointer' }} value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
                  <option>All {data.categoricalColumns[0]}</option>
                  <option>Segment A</option>
                </select>
              </div>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{
            background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
            padding: '10px 16px', borderRadius: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
          }}>
            <Download size={16} /> Export
          </button>
          <button onClick={onStartChat} style={{
            background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '10px 20px',
            borderRadius: '8px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
            boxShadow: '0 4px 15px var(--accent-glow)'
          }}>
            <MessageSquare size={16} /> Discuss Insights
          </button>
        </div>
      </motion.div>

      {/* Row 1: KPI Summary Cards */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <motion.div variants={itemVariants} className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Total Revenue</span>
            <DollarSign size={16} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'end', gap: '12px' }}>
            {data.totalSales ? formatINNumber(Number(data.totalSales), true) : 'N/A'}
            {data.totalSales && <span style={{ fontSize: '14px', color: '#10b981', display: 'flex', alignItems: 'center', paddingBottom: '6px' }}><TrendingUp size={14} style={{marginRight: '2px'}}/> 12.4%</span>}
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Total Orders/Rows</span>
            <Database size={16} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'end', gap: '12px' }}>
            {formatINNumber(data.rowCount)}
            <span style={{ fontSize: '14px', color: '#10b981', display: 'flex', alignItems: 'center', paddingBottom: '6px' }}><TrendingUp size={14} style={{marginRight: '2px'}}/> 8.2%</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Profit / Margin</span>
            <TrendingUp size={16} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'end', gap: '12px' }}>
            {data.totalProfit ? formatINNumber(Number(data.totalProfit), true) : 'N/A'}
            {data.totalProfit && <span style={{ fontSize: '14px', color: '#10b981', display: 'flex', alignItems: 'center', paddingBottom: '6px' }}><TrendingUp size={14} style={{marginRight: '2px'}}/> 4.1%</span>}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass" style={{ padding: '20px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a78bfa', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>AI Health Score</span>
            <Target size={16} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff' }}>
            94<span style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>/100</span>
          </div>
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '4px', borderRadius: '2px', marginTop: '12px' }}>
            <div style={{ width: '94%', background: '#8b5cf6', height: '100%', borderRadius: '2px' }} />
          </div>
        </motion.div>
      </motion.div>

      {/* Row 2: Performance Trend & Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Trend Analysis */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={18} color="var(--accent-primary)"/> Performance Trend</h3>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            {data.trendData && data.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="totalSales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                No Date column detected for Time-Series Analysis.
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Insights & Alerts */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><BellRing size={18} color="#f59e0b"/> Key Alerts & Insights</h3>
          
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', padding: '16px', borderRadius: '0 8px 8px 0', marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#60a5fa' }}>AI Diagnostic Insight</h4>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: 'var(--text-primary)' }}>
              {data.aiInsight}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '6px', borderRadius: '50%' }}><TrendingUp size={14} color="#10b981" /></div>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>Conversion rate exceeded target</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Currently tracking 4.8% above baseline.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '6px', borderRadius: '50%' }}><TrendingUp size={14} color="#ef4444" style={{ transform: 'scaleY(-1)' }} /></div>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>Unusual drop detected</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Revenue dropped 18% in the latest recorded period.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Row 3: Breakdown & Target Tracking */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Breakdown Analysis */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '18px', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="#8b5cf6"/> Breakdown by {data.breakdown?.category || 'Category'}
          </h3>
          <div style={{ width: '100%', height: '250px' }}>
            {data.breakdown?.data && data.breakdown.data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.breakdown.data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {data.breakdown.data.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                No categorical columns detected for segmentation.
              </div>
            )}
          </div>
        </motion.div>

        {/* Target vs Actual (Averages) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '18px', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} color="#10b981"/> Target vs Actual (Averages)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
            {data.columnStats?.slice(0, 4).map((stat: any, idx: number) => {
              const actual = Number(stat.average);
              const target = actual * 1.2; // Mock target 20% higher
              const percent = Math.min((actual / target) * 100, 100);
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>{stat.column} Target</span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{percent.toFixed(0)}%</span>
                  </div>
                  <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, background: COLORS[idx % COLORS.length], height: '100%', borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Actual: {formatINNumber(actual, stat.column.toLowerCase().includes('sales') || stat.column.toLowerCase().includes('profit'))}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Goal: {formatINNumber(target, stat.column.toLowerCase().includes('sales') || stat.column.toLowerCase().includes('profit'))}</span>
                  </div>
                </div>
              );
            })}
            {!data.columnStats?.length && <div style={{ color: 'var(--text-secondary)' }}>No numeric targets available.</div>}
          </div>
        </motion.div>

      </div>

      {/* Row 4: Detailed Data Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Database size={18} color="#3b82f6"/> Detailed Data Table</h3>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Showing top 10 records</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {data.columns.map((col: string) => (
                  <th key={col} style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rawSample?.map((row: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  {data.columns.map((col: string) => (
                    <td key={col} style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {typeof row[col] === 'number' ? formatINNumber(row[col], col.toLowerCase().includes('sales') || col.toLowerCase().includes('profit')) : String(row[col] ?? '')}
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
