
import React, { useEffect, useState, useContext, useMemo, useRef } from 'react';
import { 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Cell,
    PieChart,
    Pie,
    Legend,
    AreaChart,
    Area
} from 'recharts';
import { Clock, BrainCircuit, Database, PieChart as PieIcon, Building2, FileText, TrendingUp, ShieldCheck, Loader2, Wallet, Coins, Banknote, CalendarDays, ArrowUpRight, Target } from 'lucide-react';
import { getBudgetInsights } from '../services/geminiService.ts';
import { dbService } from '../services/dbService.ts';
import { AuthContext } from '../App.tsx';

/**
 * Komponen Indikator Penyerapan Dana (Hero Gauge)
 * Dibuat lebih besar dan elegan untuk menonjolkan angka utama kantor.
 */
const HeroPenyerapan = ({ value, label, sublabel }: { value: number, label: string, sublabel: string }) => {
    const radius = 85;
    const dashArray = radius * Math.PI * 2;
    const dashOffset = dashArray - (dashArray * value) / 100;

    return (
        <div className="bg-white p-10 rounded-[56px] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-blue-100/50 transition-all duration-700"></div>
            
            <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
                <svg width="192" height="192" className="transform -rotate-90">
                    <circle cx="96" cy="96" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="18" />
                    <circle
                        cx="96" cy="96" r={radius} fill="transparent"
                        stroke="#2563eb" strokeWidth="18"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">{value.toFixed(1)}%</span>
                    <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest mt-1">Realisasi</span>
                </div>
            </div>

            <div className="flex-1 space-y-4 relative z-10 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                    <Target size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Main Indicator</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">{label}</h2>
                <p className="text-sm font-bold text-slate-500 max-w-md">{sublabel}</p>
                <div className="flex items-center justify-center md:justify-start gap-6 pt-4">
                    <div className="text-center md:text-left">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-xs font-black text-emerald-600 uppercase flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Optimal
                        </p>
                    </div>
                    <div className="w-px h-8 bg-slate-100"></div>
                    <div className="text-center md:text-left">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Update</p>
                        <p className="text-xs font-black text-slate-900 uppercase">Real-time DB</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { user } = useContext(AuthContext);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [insight, setInsight] = useState("");
    const [isInsightLoading, setIsInsightLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const areaContainerRef = useRef<HTMLDivElement>(null);
    const pieContainerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ areaW: 0, areaH: 0, pieW: 0, pieH: 0 });

    const [stats, setStats] = useState<any>({
        totalAmount: 0, pendingCount: 0, approvedAmount: 0, totalRealized: 0,
        rejectedCount: 0, totalCount: 0, totalOfficeCeiling: 0,
        categories: [], deptBudgets: [], monthlyTrend: []
    });

    const isGlobalViewer = useMemo(() => 
        ['admin', 'kpa', 'validator_program', 'validator_tu', 'validator_ppk', 'bendahara'].includes(user?.role || ''),
    [user]);

    useEffect(() => {
        if (isLoading) return;
        const observe = (entries: ResizeObserverEntry[]) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setDimensions({
                        areaW: areaContainerRef.current?.offsetWidth || 0,
                        areaH: areaContainerRef.current?.offsetHeight || 0,
                        pieW: pieContainerRef.current?.offsetWidth || 0,
                        pieH: pieContainerRef.current?.offsetHeight || 0,
                    });
                }
            }
        };
        const robserver = new ResizeObserver(observe);
        if (areaContainerRef.current) robserver.observe(areaContainerRef.current);
        if (pieContainerRef.current) robserver.observe(pieContainerRef.current);
        return () => robserver.disconnect();
    }, [isLoading]);

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const dbStats = await dbService.getStats(user.role, user.full_name, user.department, selectedYear);
            const safeTrend = (dbStats.monthlyTrend || []).map((m: any) => ({
                name: m.name, amount: Number(m.amount) || 0, realized: Number(m.realized) || 0
            }));
            setStats({ ...dbStats, monthlyTrend: safeTrend });
            fetchAiInsight(dbStats.totalAmount, dbStats.totalRealized);
        } catch (err) {
            console.error(err);
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
            setInsight("Data telah disinkronkan dengan database.");
        } finally {
            setIsInsightLoading(false);
        }
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="animate-spin text-blue-600 mb-6 opacity-30" size={64} />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sinkronisasi PUSDAL SUMA...</p>
        </div>
    );

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];
    const realizationPercent = stats.totalOfficeCeiling > 0 ? (stats.totalRealized / stats.totalOfficeCeiling) * 100 : 0;

    return (
        <div className="space-y-10 page-transition pb-20">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row gap-8 items-start xl:items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4 uppercase leading-none">
                        {isGlobalViewer ? 'KONTROL ANGGARAN' : 'DASHBOARD SAYA'}
                        {isGlobalViewer && <ShieldCheck className="text-blue-600" size={32} />}
                    </h1>
                    <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                             <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Sistem Aktif</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                            <CalendarDays size={14} className="text-slate-400" />
                            <select 
                                className="bg-transparent text-[10px] font-black uppercase outline-none border-none text-slate-700 cursor-pointer"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                            >
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>TA {y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="group relative w-full xl:max-w-xl">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-all duration-1000"></div>
                    <div className="relative bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm flex items-center gap-5">
                        <div className="shrink-0 w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-emerald-400 shadow-xl"><BrainCircuit size={28} /></div>
                        <div>
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">AI Strategic Intelligence</p>
                            {isInsightLoading ? <div className="h-4 w-40 bg-slate-100 animate-pulse rounded"></div> : <p className="text-[11px] font-bold text-slate-700 leading-snug italic">"{insight}"</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* HERO SECTION: Hanya Indikator Penyerapan Dana */}
            <div className="grid grid-cols-1 gap-10">
                <HeroPenyerapan 
                    value={realizationPercent} 
                    label="Realisasi Penyerapan Dana" 
                    sublabel="Persentase akumulasi dana yang telah dibayarkan (Realisasi SPJ) dibandingkan dengan Pagu Anggaran Kantor secara keseluruhan."
                />
            </div>

            {/* Stats Grid - Slidable on Mobile */}
            <div className="flex md:grid overflow-x-auto md:overflow-visible pb-6 md:pb-0 md:grid-cols-2 lg:grid-cols-4 gap-6 no-scrollbar snap-x">
                {[
                    { label: 'Total Usulan', val: `Rp ${(stats.totalAmount/1000000).toFixed(1)}jt`, icon: <FileText size={20} />, color: 'blue' },
                    { label: 'Menunggu', val: stats.pendingCount, icon: <Clock size={20} />, color: 'amber' },
                    { label: 'Realisasi Bayar', val: `Rp ${(stats.totalRealized/1000000).toFixed(1)}jt`, icon: <Banknote size={20} />, color: 'emerald' },
                    { label: 'Sisa Pagu', val: `Rp ${((stats.totalOfficeCeiling - stats.totalRealized)/1000000).toFixed(1)}jt`, icon: <Wallet size={20} />, color: 'indigo' }
                ].map((stat, i) => (
                    <div key={i} className="min-w-[280px] md:min-w-0 flex-shrink-0 bg-white p-7 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group hover:translate-y-[-4px] transition-all snap-center">
                         <div className={`absolute -right-4 -top-4 w-20 h-20 bg-${stat.color}-50 rounded-full opacity-40 group-hover:scale-150 transition-transform duration-700`}></div>
                         <div className="relative z-10">
                            <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>{stat.icon}</div>
                            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</h3>
                            <p className="text-2xl font-black text-slate-900 tracking-tighter">{stat.val}</p>
                         </div>
                    </div>
                ))}
            </div>

            {/* Recharts Sections - Dengan ResizeObserver Fix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white p-10 rounded-[56px] border border-slate-200 shadow-sm flex flex-col h-[520px]">
                    <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase mb-10">
                        <TrendingUp size={20} className="text-blue-600" /> Tren Keuangan Bulanan
                    </h3>
                    
                    <div className="flex-1 w-full h-full relative" ref={areaContainerRef}>
                        {dimensions.areaW > 0 && dimensions.areaH > 0 ? (
                            <AreaChart width={dimensions.areaW} height={dimensions.areaH} data={stats.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorUsulan" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${(val/1000000).toFixed(0)}jt`} />
                                <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }} />
                                <Area name="Usulan" type="monotone" dataKey="amount" stroke="#3b82f6" fill="url(#colorUsulan)" strokeWidth={4} isAnimationActive={false} />
                                <Area name="Realisasi" type="monotone" dataKey="realized" stroke="#10b981" fill="url(#colorReal)" strokeWidth={4} isAnimationActive={false} />
                            </AreaChart>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 rounded-[40px]">
                                <Loader2 className="animate-spin text-slate-200" size={32} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[56px] border border-slate-200 shadow-sm flex flex-col h-[520px]">
                    <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase mb-10">
                        <PieIcon size={20} className="text-indigo-600" /> Komposisi Jenis Belanja
                    </h3>

                    <div className="flex-1 w-full h-full relative" ref={pieContainerRef}>
                        {dimensions.pieW > 0 && dimensions.pieH > 0 && stats.categories.length > 0 ? (
                            <PieChart width={dimensions.pieW} height={dimensions.pieH}>
                                <Pie 
                                    data={stats.categories} 
                                    cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} 
                                    dataKey="value" stroke="none" isAnimationActive={false}
                                >
                                    {stats.categories.map((_: any, i: number) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={40} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
                            </PieChart>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200">
                                <Database size={48} className="text-slate-200 mb-4" />
                                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Kategori Belanja Nihil</h4>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Bidang Section */}
            <div className="space-y-8">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg"><Building2 size={24} /></div>
                    <h3 className="text-sm font-black uppercase tracking-[0.25em] text-slate-800">Anggaran Bidang Kerja</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {stats.deptBudgets.length > 0 ? stats.deptBudgets.map((dept: any, i: number) => {
                        const totalVal = Number(dept.total) || 0;
                        const realizedVal = Number(dept.realized) || 0;
                        const percent = totalVal > 0 ? (realizedVal / totalVal) * 100 : 0;
                        return (
                            <div key={i} className="bg-white rounded-[48px] border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
                                <div className="flex items-start justify-between mb-8">
                                    <div className="max-w-[70%]">
                                        <h4 className="text-base font-black text-slate-900 uppercase tracking-tight mb-1 leading-tight">{dept.name}</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">TA {selectedYear}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:text-blue-600 transition-all"><Coins size={20} /></div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sisa Dana</p>
                                            <p className="text-2xl font-black text-slate-900 font-mono tracking-tighter">Rp {(totalVal - realizedVal).toLocaleString('id-ID')}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${percent > 90 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {percent.toFixed(1)}%
                                        </span>
                                    </div>

                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${percent > 90 ? 'bg-red-500' : 'bg-blue-600'}`}
                                            style={{ width: `${Math.min(percent, 100)}%` }}
                                        ></div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                        <div>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">Pagu Total</p>
                                            <p className="text-xs font-black text-slate-700">Rp {(totalVal/1000000).toFixed(1)}jt</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-bold text-emerald-400 uppercase">Terbayar</p>
                                            <p className="text-xs font-black text-emerald-600">Rp {(realizedVal/1000000).toFixed(1)}jt</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="col-span-full py-20 text-center bg-white rounded-[56px] border border-dashed border-slate-200">
                             <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Data Bidang Belum Tersedia</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
