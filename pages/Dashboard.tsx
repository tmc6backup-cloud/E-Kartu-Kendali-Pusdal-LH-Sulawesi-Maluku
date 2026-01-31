
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    Cell,
    PieChart,
    Pie,
    Legend,
    AreaChart,
    Area
} from 'recharts';
import { Clock, CheckCircle2, BrainCircuit, Database, PieChart as PieIcon, ArrowUpRight, AlertTriangle, Building2, FileText, ListChecks, TrendingUp, ShieldCheck, Loader2, RefreshCw, Wallet, Coins, Banknote, CalendarDays } from 'lucide-react';
import { getBudgetInsights } from '../services/geminiService.ts';
import { dbService } from '../services/dbService.ts';
import { AuthContext } from '../App.tsx';

const Dashboard: React.FC = () => {
    const { user } = useContext(AuthContext);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [insight, setInsight] = useState("");
    const [isInsightLoading, setIsInsightLoading] = useState(false);
    const [connectionError, setConnectionError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const [stats, setStats] = useState<any>({
        totalAmount: 0,
        pendingCount: 0,
        approvedAmount: 0,
        totalRealized: 0,
        rejectedCount: 0,
        totalCount: 0,
        totalOfficeCeiling: 0,
        categories: [],
        deptBudgets: [],
        monthlyTrend: []
    });

    const availableYears = useMemo(() => {
        const current = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => current - 2 + i);
    }, []);
    
    const isGlobalViewer = useMemo(() => 
        ['admin', 'kpa', 'validator_program', 'validator_tu', 'validator_ppk', 'bendahara'].includes(user?.role || ''),
    [user]);

    // Verifikasi keberadaan data untuk chart
    const hasTrendData = useMemo(() => 
        stats.monthlyTrend && stats.monthlyTrend.length > 0 && stats.monthlyTrend.some((m: any) => (Number(m.amount) || 0) > 0 || (Number(m.realized) || 0) > 0), 
    [stats.monthlyTrend]);

    const hasCategoryData = useMemo(() => 
        stats.categories && stats.categories.length > 0 && stats.categories.some((c: any) => (Number(c.value) || 0) > 0), 
    [stats.categories]);

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        setConnectionError(false);
        try {
            const dbStats = await dbService.getStats(user.role, user.full_name, user.department, selectedYear);
            setStats(dbStats);
            fetchAiInsight(dbStats.totalAmount, dbStats.totalRealized);
        } catch (err: any) {
            console.error(err);
            setConnectionError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, selectedYear]);

    const fetchAiInsight = async (total: number, realized: number) => {
        setIsInsightLoading(true);
        try {
            const text = await getBudgetInsights(total, realized);
            setInsight(text || "Analisis data selesai.");
        } catch (err) {
            setInsight("Gunakan dashboard untuk pemantauan real-time.");
        } finally {
            setIsInsightLoading(false);
        }
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="animate-spin text-blue-600 mb-6 opacity-30" size={64} />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Menyusun Data Statistik...</p>
        </div>
    );

    if (connectionError) return (
        <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
            <AlertTriangle size={48} className="text-red-500" />
            <h2 className="text-xl font-black text-slate-900 uppercase">Gagal Terhubung</h2>
            <button onClick={fetchData} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2"><RefreshCw size={16} /> Muat Ulang</button>
        </div>
    );

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

    return (
        <div className="space-y-10 page-transition pb-20">
            {/* Header */}
            <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        {isGlobalViewer ? 'Monitoring Kantor' : 'Dashboard'}
                        {isGlobalViewer && <div className="p-1.5 bg-slate-900 text-white rounded-lg"><ShieldCheck size={18} /></div>}
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                        <p className="text-slate-400 font-bold text-[10px] flex items-center gap-2 uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            STATUS ANGGARAN TA {selectedYear}
                        </p>
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                            <CalendarDays size={14} className="text-slate-400" />
                            <select 
                                className="bg-transparent text-[10px] font-black uppercase outline-none border-none text-slate-700 cursor-pointer"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                            >
                                {availableYears.map(y => <option key={y} value={y}>TA {y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="group relative w-full xl:max-w-xl">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-all"></div>
                    <div className="relative bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                        <div className="shrink-0 w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white"><BrainCircuit size={24} /></div>
                        <div>
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">AI Strategic Insight</p>
                            {isInsightLoading ? <p className="text-[10px] font-bold text-slate-300 animate-pulse uppercase italic">Menganalisis...</p> : <p className="text-[11px] font-bold text-slate-700 leading-snug italic">"{insight}"</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Usulan', val: `Rp ${(stats.totalAmount/1000000).toFixed(1)}jt`, icon: <FileText className="text-blue-600" />, bg: 'bg-blue-50' },
                    { label: 'Menunggu Validasi', val: stats.pendingCount, icon: <Clock className="text-amber-600" />, bg: 'bg-amber-50' },
                    { label: 'Total Realisasi', val: `Rp ${(stats.totalRealized/1000000).toFixed(1)}jt`, icon: <Banknote className="text-emerald-600" />, bg: 'bg-emerald-50' },
                    { label: 'Pagu Bidang', val: `Rp ${(stats.totalOfficeCeiling/1000000).toFixed(1)}jt`, icon: <Wallet className="text-indigo-600" />, bg: 'bg-indigo-50' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className={`absolute -right-4 -top-4 w-20 h-20 ${stat.bg} rounded-full opacity-40 group-hover:scale-150 transition-transform duration-700`}></div>
                        <div className="relative">
                            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-4`}>{stat.icon}</div>
                            <h3 className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">{stat.label}</h3>
                            <p className="text-xl font-black text-slate-900 tracking-tight">{stat.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Visualisasi Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Area Chart: Tren */}
                <div className="bg-white p-8 rounded-[48px] border border-slate-200 shadow-sm space-y-6 flex flex-col">
                    <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase mb-4">
                        <TrendingUp size={20} className="text-blue-600" /> Tren Usulan & Realisasi
                    </h3>
                    
                    <div className="w-full h-[350px] bg-slate-50/30 rounded-[32px] overflow-hidden relative border border-slate-50">
                        {!hasTrendData ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                                <Database size={48} className="text-slate-200 mb-4" />
                                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Data TA {selectedYear} Kosong</h4>
                            </div>
                        ) : (
                            <ResponsiveContainer width="99%" height="100%">
                                <AreaChart 
                                    key={`chart-area-${selectedYear}`}
                                    data={stats.monthlyTrend} 
                                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                                >
                                    <defs>
                                        <linearGradient id="colorUsulan" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorRealisasi" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        dy={10}
                                    />
                                    <YAxis 
                                        width={60} 
                                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tickFormatter={(val) => `Rp${(val/1000000).toFixed(0)}jt`} 
                                    />
                                    <Tooltip 
                                        formatter={(val: number) => [`Rp ${val.toLocaleString('id-ID')}`, 'Nominal']}
                                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '16px' }}
                                        labelStyle={{ fontWeight: 'black', textTransform: 'uppercase', marginBottom: '8px', color: '#1e293b' }}
                                    />
                                    <Legend 
                                        verticalAlign="top" 
                                        align="right" 
                                        height={40} 
                                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingBottom: '20px' }} 
                                    />
                                    <Area 
                                        name="Usulan" 
                                        type="monotone" 
                                        dataKey="amount" 
                                        stroke="#3b82f6" 
                                        fill="url(#colorUsulan)" 
                                        strokeWidth={4} 
                                        isAnimationActive={false}
                                    />
                                    <Area 
                                        name="Realisasi" 
                                        type="monotone" 
                                        dataKey="realized" 
                                        stroke="#10b981" 
                                        fill="url(#colorRealisasi)" 
                                        strokeWidth={4} 
                                        isAnimationActive={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Pie Chart: Kategori */}
                <div className="bg-white p-8 rounded-[48px] border border-slate-200 shadow-sm space-y-6 flex flex-col">
                    <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase mb-4">
                        <PieIcon size={20} className="text-indigo-600" /> Komposisi Anggaran
                    </h3>

                    <div className="w-full h-[350px] bg-slate-50/30 rounded-[32px] overflow-hidden relative border border-slate-50">
                        {!hasCategoryData ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                                <PieIcon size={48} className="text-slate-200 mb-4" />
                                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Data Kategori Kosong</h4>
                            </div>
                        ) : (
                            <ResponsiveContainer width="99%" height="100%">
                                <PieChart key={`chart-pie-${selectedYear}`}>
                                    <Pie 
                                        data={stats.categories} 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={70} 
                                        outerRadius={105} 
                                        paddingAngle={6} 
                                        dataKey="value" 
                                        stroke="none"
                                        isAnimationActive={false}
                                    >
                                        {stats.categories.map((e: any, i: number) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(val: number) => [`Rp ${val.toLocaleString('id-ID')}`, 'Total']}
                                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '16px' }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        align="center" 
                                        iconType="circle" 
                                        wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '30px' }} 
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Pagu Bidang */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-lg"><Building2 size={16} /></div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">Status Pagu Bidang ({selectedYear})</h3>
                </div>
                
                {stats.deptBudgets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {stats.deptBudgets.map((dept: any, i: number) => {
                            const realizedVal = Number(dept.realized || 0);
                            const totalVal = Number(dept.total || 0);
                            const percent = totalVal > 0 ? (realizedVal / totalVal) * 100 : 0;
                            return (
                                <div key={i} className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all group">
                                    <div className="flex items-start justify-between mb-8">
                                        <div>
                                            <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-tight mb-1">{dept.name}</h4>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Alokasi TA {selectedYear}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-blue-600 transition-colors"><Coins size={20} /></div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase">Sisa Pagu Riil</p>
                                                <p className="text-xl font-black text-slate-900 font-mono tracking-tighter">Rp {(totalVal - realizedVal).toLocaleString('id-ID')}</p>
                                            </div>
                                            <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black ${percent > 90 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {percent.toFixed(1)}% Terpakai
                                            </div>
                                        </div>

                                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${percent > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.min(percent, 100)}%` }}
                                            ></div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-bold text-slate-400 uppercase">Usulan OK</p>
                                                <p className="text-xs font-black text-slate-600">Rp {(Number(dept.spent || 0)/1000000).toFixed(1)}jt</p>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <p className="text-[8px] font-bold text-emerald-400 uppercase">Realisasi Bayar</p>
                                                <p className="text-xs font-black text-emerald-600">Rp {(realizedVal/1000000).toFixed(1)}jt</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
                        <Building2 size={48} className="mx-auto text-slate-100 mb-4" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Belum ada alokasi pagu bidang terdaftar untuk TA {selectedYear}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
