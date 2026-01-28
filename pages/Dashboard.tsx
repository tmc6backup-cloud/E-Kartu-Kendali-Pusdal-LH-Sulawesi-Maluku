
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
    Area,
    BarChart,
    Bar
} from 'recharts';
import { Clock, CheckCircle2, BrainCircuit, Database, PieChart as PieIcon, ArrowUpRight, AlertTriangle, Building2, LayoutPanelLeft, Wallet, FileText, Landmark, Coins, Briefcase, ListChecks, TrendingUp, Map, Layout, ShieldCheck, Loader2, RefreshCw } from 'lucide-react';
import { getBudgetInsights } from '../services/geminiService';
import { dbService } from '../services/dbService';
import { AuthContext } from '../App';

const Dashboard: React.FC = () => {
    const { user } = useContext(AuthContext);
    const [insight, setInsight] = useState("");
    const [isInsightLoading, setIsInsightLoading] = useState(false);
    const [connectionError, setConnectionError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<any>({
        totalAmount: 0,
        pendingCount: 0,
        approvedAmount: 0,
        rejectedCount: 0,
        totalCount: 0,
        totalOfficeCeiling: 0,
        categories: [],
        departments: [],
        monthlyTrend: [],
        deptBudgets: []
    });
    
    const isGlobalViewer = useMemo(() => 
        ['admin', 'kpa', 'validator_program', 'validator_ppk', 'bendahara'].includes(user?.role || '') ||
        user?.department?.toUpperCase().includes("PUSDAL LH SUMA"),
    [user]);

    const isExecutive = useMemo(() => 
        ['admin', 'kpa'].includes(user?.role || ''),
    [user]);

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        setConnectionError(false);
        
        // Timeout 15 detik untuk menghindari loading selamanya
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("TIMEOUT")), 15000)
        );

        try {
            const dbStatsPromise = dbService.getStats(user.role, user.full_name, user.department);
            const dbStats = await Promise.race([dbStatsPromise, timeoutPromise]) as any;
            
            if (!dbStats) {
                setConnectionError(true);
            } else {
                setStats(dbStats);
                // Jalankan AI secara background
                fetchAiInsight(dbStats.totalAmount, dbStats.approvedAmount);
            }
        } catch (err: any) {
            console.error("Dashboard Fetch Error:", err);
            setConnectionError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchAiInsight = async (total: number, approved: number) => {
        setIsInsightLoading(true);
        try {
            const text = await getBudgetInsights(total, approved);
            setInsight(text || "Dashboard telah diperbarui dengan data terkini.");
        } catch (err) {
            setInsight("Gunakan data dashboard untuk memantau performa anggaran.");
        } finally {
            setIsInsightLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <Loader2 className="animate-spin text-blue-600 mb-6 opacity-40" size={64} />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Menyusun Statistik Kantor...</p>
                <p className="text-slate-300 text-[8px] mt-4 uppercase font-bold">Mohon tunggu sebentar (Max 15 detik)</p>
            </div>
        );
    }

    if (connectionError) {
        return (
            <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-inner">
                    <AlertTriangle size={40} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Gagal Memuat Statistik</h2>
                    <p className="text-sm font-medium text-slate-500 max-w-md">Terjadi kendala saat mengambil data dari database atau koneksi internet terputus.</p>
                </div>
                <button 
                    onClick={fetchData}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-slate-800 transition-all"
                >
                    <RefreshCw size={16} /> Coba Muat Ulang
                </button>
            </div>
        );
    }

    const statCards = [
        { label: 'Total Berkas Pengajuan', value: `${stats.totalCount}`, sub: isGlobalViewer ? 'Seluruh Kantor' : 'Unit Kerja Anda', icon: <FileText size={22} />, text: 'text-slate-900', bg: 'bg-slate-100' },
        { label: 'Volume Pengajuan', value: `Rp ${(stats.totalAmount/1000000).toFixed(1)}jt`, sub: 'Usulan Komitmen', icon: <Database size={22} />, text: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Menunggu Validasi', value: `${stats.pendingCount}`, sub: 'Berkas Antrian', icon: <Clock size={22} />, text: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Telah Disetujui', value: `Rp ${(stats.approvedAmount/1000000).toFixed(1)}jt`, sub: 'Persetujuan Final', icon: <CheckCircle2 size={16} />, text: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-2xl">
                    <p className="text-[10px] font-black text-slate-900 uppercase mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 text-[11px] font-bold py-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-slate-500">{entry.name}:</span>
                            <span className="text-slate-900">Rp {entry.value.toLocaleString('id-ID')}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 page-transition">
            <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        Dashboard Anggaran {isGlobalViewer ? '(Seluruh Kantor)' : ''}
                        {isExecutive && <div className="p-1.5 bg-indigo-900 text-white rounded-lg"><ShieldCheck size={18} /></div>}
                    </h1>
                    <p className="text-slate-500 font-semibold text-sm flex items-center gap-2 uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Status Real-Time • {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}
                    </p>
                </div>

                <div className="group relative w-full xl:max-w-xl">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-[28px] blur opacity-25"></div>
                    <div className="relative bg-white border border-slate-100 p-5 rounded-[26px] shadow-sm flex items-center gap-5">
                        <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <BrainCircuit size={30} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">AI Strategic Insight</span>
                            </div>
                            {isInsightLoading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 size={12} className="animate-spin text-slate-400" />
                                    <p className="text-[10px] font-bold text-slate-300 uppercase italic">Gemini sedang menganalisis...</p>
                                </div>
                            ) : (
                                <p className="text-xs font-semibold leading-relaxed text-slate-700 italic">"{insight || 'Menunggu data analisis...'}"</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => (
                    <div key={idx} className="bg-white p-7 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
                        <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full -mr-10 -mt-10 opacity-40 group-hover:scale-150 transition-transform duration-500`}></div>
                        <div className="relative flex flex-col justify-between h-full">
                            <div className="flex items-center justify-between mb-5">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.text} ${stat.bg} border border-slate-100`}>
                                    {stat.icon}
                                </div>
                                <ArrowUpRight size={18} className="text-slate-300" />
                            </div>
                            <div>
                                <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">{stat.label}</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-extrabold text-slate-900">{stat.value}</span>
                                    <span className="text-[10px] font-semibold text-slate-400">{stat.sub}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-[48px] border border-slate-200 shadow-sm space-y-8">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <TrendingUp size={24} className="text-blue-600" /> Trend Pengajuan Kantor
                    </h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.monthlyTrend}>
                                <defs>
                                    <linearGradient id="colorProposed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `Rp${(val/1000000)}jt`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="amount" name="Usulan" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProposed)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[48px] border border-slate-200 shadow-sm space-y-8">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <PieIcon size={24} className="text-indigo-600" /> Porsi Kategori
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats.categories} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                    {stats.categories.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {isGlobalViewer && (
                <div className="bg-slate-950 p-8 rounded-[48px] shadow-2xl space-y-8">
                    <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-4 uppercase">
                        <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                            <ListChecks size={24} />
                        </div>
                        Monitoring Antrian Global Kantor
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-y-2">
                            <thead>
                                <tr className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    <th className="px-6 py-4">Unit Kerja / Bidang</th>
                                    <th className="px-4 py-4 text-center">Kabid</th>
                                    <th className="px-4 py-4 text-center">Program</th>
                                    <th className="px-4 py-4 text-center">TU</th>
                                    <th className="px-4 py-4 text-center">PPK</th>
                                    <th className="px-4 py-4 text-center text-emerald-400">Lunas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(stats.deptBudgets || []).map((dept: any, idx: number) => (
                                    <tr key={idx} className="bg-white/5 hover:bg-white/10 transition-colors">
                                        <td className="px-6 py-5 rounded-l-[24px]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                                                    <Building2 size={16} />
                                                </div>
                                                <span className="text-[11px] font-black text-white uppercase tracking-tight">{dept.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-5 text-center"><span className="px-3 py-1 rounded-lg text-[10px] font-black bg-white/5 text-slate-500">{dept.queue.pending}</span></td>
                                        <td className="px-4 py-5 text-center"><span className="px-3 py-1 rounded-lg text-[10px] font-black bg-white/5 text-slate-500">{dept.queue.reviewed_bidang}</span></td>
                                        <td className="px-4 py-5 text-center"><span className="px-3 py-1 rounded-lg text-[10px] font-black bg-white/5 text-slate-500">{dept.queue.reviewed_program}</span></td>
                                        <td className="px-4 py-5 text-center"><span className="px-3 py-1 rounded-lg text-[10px] font-black bg-white/5 text-slate-500">{dept.queue.reviewed_tu}</span></td>
                                        <td className="px-4 py-5 text-center rounded-r-[24px]"><span className="px-3 py-1 rounded-lg text-[10px] font-black bg-emerald-500/20 text-emerald-400">{dept.queue.realized}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
