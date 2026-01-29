
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
import { Clock, CheckCircle2, BrainCircuit, Database, PieChart as PieIcon, ArrowUpRight, AlertTriangle, Building2, FileText, ListChecks, TrendingUp, ShieldCheck, Loader2, RefreshCw, Wallet, Coins } from 'lucide-react';
import { getBudgetInsights } from '../services/geminiService.ts';
import { dbService } from '../services/dbService.ts';
import { AuthContext } from '../App.tsx';

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
        deptBudgets: [],
        monthlyTrend: []
    });
    
    const isGlobalViewer = useMemo(() => 
        ['admin', 'kpa', 'validator_program', 'validator_tu', 'validator_ppk', 'bendahara'].includes(user?.role || ''),
    [user]);

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        setConnectionError(false);
        try {
            const dbStats = await dbService.getStats(user.role, user.full_name, user.department);
            setStats(dbStats);
            fetchAiInsight(dbStats.totalAmount, dbStats.approvedAmount);
        } catch (err: any) {
            console.error(err);
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
            setInsight(text || "Analisis data selesai.");
        } catch (err) {
            setInsight("Gunakan dashboard untuk pemantauan real-time.");
        } finally {
            setIsInsightLoading(false);
        }
    };

    if (isLoading) return <div className="flex flex-col items-center justify-center py-40"><Loader2 className="animate-spin text-blue-600 mb-6 opacity-30" size={64} /><p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Menyusun Data Statistik...</p></div>;

    if (connectionError) return (
        <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
            <AlertTriangle size={48} className="text-red-500" />
            <h2 className="text-xl font-black text-slate-900 uppercase">Gagal Terhubung</h2>
            <button onClick={fetchData} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2"><RefreshCw size={16} /> Muat Ulang</button>
        </div>
    );

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

    return (
        <div className="space-y-10 page-transition">
            <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        {isGlobalViewer ? 'Monitoring Kantor' : 'Dashboard Bidang'}
                        {isGlobalViewer && <div className="p-1.5 bg-slate-900 text-white rounded-lg"><ShieldCheck size={18} /></div>}
                    </h1>
                    <p className="text-slate-400 font-bold text-[10px] flex items-center gap-2 uppercase tracking-widest mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        DATA TERKINI TA {new Date().getFullYear()}
                    </p>
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

            {/* Statistik Ringkas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Usulan', val: `Rp ${(stats.totalAmount/1000000).toFixed(1)}jt`, icon: <FileText className="text-blue-600" />, bg: 'bg-blue-50' },
                    { label: 'Menunggu Validasi', val: stats.pendingCount, icon: <Clock className="text-amber-600" />, bg: 'bg-amber-50' },
                    { label: 'Telah Disetujui', val: `Rp ${(stats.approvedAmount/1000000).toFixed(1)}jt`, icon: <CheckCircle2 className="text-emerald-600" />, bg: 'bg-emerald-50' },
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

            {/* Visualisasi Anggaran Bidang */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[48px] border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <TrendingUp size={20} className="text-blue-600" /> Trend Pengajuan {isGlobalViewer ? 'Kantor' : 'Bidang'}
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.monthlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="amount" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[48px] border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <PieIcon size={20} className="text-indigo-600" /> Komposisi Kategori
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats.categories} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                                    {stats.categories.map((e: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Kartu Detail Pagu Bidang */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-lg"><Building2 size={16} /></div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">Status Anggaran per Bidang</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {stats.deptBudgets.map((dept: any, i: number) => {
                        const percent = dept.total > 0 ? (dept.spent / dept.total) * 100 : 0;
                        return (
                            <div key={i} className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all">
                                <div className="flex items-start justify-between mb-8">
                                    <div>
                                        <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-tight mb-1">{dept.name}</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Alokasi TA {new Date().getFullYear()}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-blue-600 transition-colors"><Coins size={20} /></div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-slate-400 uppercase">Pagu Tersisa</p>
                                            <p className="text-xl font-black text-slate-900 font-mono tracking-tighter">Rp {dept.remaining.toLocaleString('id-ID')}</p>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black ${percent > 90 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {percent.toFixed(1)}% Terpakai
                                        </div>
                                    </div>

                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${percent > 90 ? 'bg-red-500' : 'bg-blue-600'}`}
                                            style={{ width: `${Math.min(percent, 100)}%` }}
                                        ></div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">Total Pagu</p>
                                            <p className="text-xs font-black text-slate-600">Rp {(dept.total/1000000).toFixed(1)}jt</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">Realisasi</p>
                                            <p className="text-xs font-black text-slate-600">Rp {(dept.spent/1000000).toFixed(1)}jt</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
