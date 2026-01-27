
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
import { Clock, CheckCircle2, BrainCircuit, Database, PieChart as PieIcon, ArrowUpRight, AlertTriangle, Building2, LayoutPanelLeft, Wallet, FileText, Landmark, Coins, Briefcase, ListChecks, TrendingUp, Map, Layout, ShieldCheck } from 'lucide-react';
import { getBudgetInsights } from '../services/geminiService';
import { dbService } from '../services/dbService';
import { AuthContext } from '../App';

const Dashboard: React.FC = () => {
    const { user } = useContext(AuthContext);
    const [insight, setInsight] = useState("Menganalisis data anggaran...");
    const [connectionError, setConnectionError] = useState(false);
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
    
    // Global Viewer: Validator & Admin & Main Office (Pusdal)
    const isGlobalViewer = useMemo(() => 
        ['admin', 'kpa', 'validator_program', 'validator_ppk', 'bendahara'].includes(user?.role || '') ||
        user?.department?.toUpperCase().includes("PUSDAL LH SUMA"),
    [user]);

    // Executive: Only KPA and Admin (Special breakdown charts)
    const isExecutive = useMemo(() => 
        ['admin', 'kpa'].includes(user?.role || ''),
    [user]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                setConnectionError(false);
                const dbStats = await dbService.getStats(user.role, user.full_name, user.department);
                
                if (dbStats.deptBudgets.length === 0 && dbStats.totalCount === 0) {
                    setConnectionError(true);
                }
                
                setStats(dbStats);
                const text = await getBudgetInsights(dbStats.totalAmount, dbStats.approvedAmount);
                setInsight(text || "Dashboard telah diperbarui dengan data terkini.");
            } catch (err) {
                console.error("Dashboard Fetch Error:", err);
                setConnectionError(true);
            }
        };
        fetchData();
    }, [user]);

    // Data Filtering for Regional and Administrative Charts
    const regionalData = useMemo(() => {
        return stats.deptBudgets
            .filter((d: any) => d.name.toLowerCase().includes('wilayah'))
            .map((d: any) => ({
                name: d.name.replace('Bidang ', ''),
                pagu: d.total,
                realisasi: d.spent,
                persen: d.total > 0 ? ((d.spent / d.total) * 100).toFixed(1) : 0
            }));
    }, [stats.deptBudgets]);

    const adminData = useMemo(() => {
        return stats.deptBudgets
            .filter((d: any) => d.name.toLowerCase().includes('tata usaha') || d.name.toLowerCase().includes('bagian'))
            .map((d: any) => ({
                name: d.name.replace('Bagian ', '').replace('Sub Bagian ', ''),
                pagu: d.total,
                realisasi: d.spent,
                persen: d.total > 0 ? ((d.spent / d.total) * 100).toFixed(1) : 0
            }));
    }, [stats.deptBudgets]);

    const statCards = [
        { 
            label: 'Total Berkas Pengajuan', 
            value: `${stats.totalCount}`, 
            sub: isGlobalViewer ? 'Seluruh Kantor' : 'Unit Kerja Anda', 
            icon: <FileText size={22} />, 
            text: 'text-slate-900', 
            bg: 'bg-slate-100' 
        },
        { 
            label: 'Volume Pengajuan', 
            value: `Rp ${(stats.totalAmount/1000000).toFixed(1)}jt`, 
            sub: 'Usulan Komitmen', 
            icon: <Database size={22} />, 
            text: 'text-blue-600', 
            bg: 'bg-blue-50' 
        },
        { 
            label: 'Menunggu Validasi', 
            value: `${stats.pendingCount}`, 
            sub: 'Berkas Antrian', 
            icon: <Clock size={22} />, 
            text: 'text-amber-600', 
            bg: 'bg-amber-50' 
        },
        { 
            label: 'Telah Disetujui', 
            value: `Rp ${(stats.approvedAmount/1000000).toFixed(1)}jt`, 
            sub: 'Persetujuan Final', 
            icon: <CheckCircle2 size={16} />, 
            text: 'text-emerald-600', 
            bg: 'bg-emerald-50' 
        },
    ];

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

    const BudgetSubCard = ({ title, data, icon: Icon, colorClass, bgColorClass }: any) => (
        <div className={`p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-${colorClass}-200 transition-colors`}>
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 ${bgColorClass} ${colorClass === 'blue' ? 'text-blue-600' : colorClass === 'emerald' ? 'text-emerald-600' : 'text-amber-600'} rounded-lg flex items-center justify-center`}>
                    <Icon size={18} />
                </div>
                <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{title}</h5>
            </div>
            <div className="space-y-3">
                <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Pagu Alokasi</p>
                    <p className="text-xs font-black text-slate-900 font-mono">Rp {data.total.toLocaleString('id-ID')}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-[8px] font-black text-amber-500 uppercase">Terpakai</p>
                        <p className="text-[10px] font-black text-amber-600 font-mono">Rp {data.spent.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-[8px] font-black text-blue-500 uppercase">Sisa</p>
                        <p className={`text-[11px] font-black ${colorClass === 'blue' ? 'text-blue-700' : 'text-emerald-700'} font-mono`}>Rp {data.remaining.toLocaleString('id-ID')}</p>
                    </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${colorClass === 'blue' ? 'bg-blue-600' : 'bg-emerald-600'} transition-all duration-1000`}
                        style={{ width: `${data.total > 0 ? (100 - (data.remaining / data.total * 100)) : 0}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );

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
                    {payload[0]?.payload?.persen && (
                        <div className="mt-2 pt-2 border-t border-slate-50">
                            <p className="text-[10px] font-black text-emerald-600 uppercase">Serapan: {payload[0].payload.persen}%</p>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 page-transition">
            {connectionError && (
                <div className="p-5 bg-red-50 border-2 border-red-100 rounded-[32px] flex items-center gap-5 animate-in slide-in-from-top-4">
                    <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-red-100">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-red-800 uppercase tracking-tight">Data Terbatas</h4>
                        <p className="text-xs font-semibold text-red-600/80">Tidak ditemukan alokasi pagu atau pengajuan untuk unit kerja Anda.</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        Dashboard Anggaran {isGlobalViewer ? '(Seluruh Kantor)' : ''}
                        {isExecutive && <div className="p-1.5 bg-indigo-900 text-white rounded-lg"><ShieldCheck size={18} /></div>}
                    </h1>
                    <p className="text-slate-500 font-semibold text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Status Anggaran Pusdal LH SUMA • {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}
                    </p>
                </div>

                <div className="group relative w-full xl:max-w-xl">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-[28px] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-white border border-slate-100 p-5 rounded-[26px] shadow-sm flex items-center gap-5">
                        <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                            <BrainCircuit size={30} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">AI Strategic Insight</span>
                            </div>
                            <p className="text-xs font-semibold leading-relaxed text-slate-700 italic">"{insight}"</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => (
                    <div key={idx} className="bg-white p-7 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
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

            {/* ANALYTIC CHARTS ROW 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Trend Bulanan (Area Chart) */}
                <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-[48px] border border-slate-200 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <TrendingUp size={24} className="text-blue-600" />
                                Trend Pengajuan vs Realisasi Kantor
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pergerakan Volume Anggaran Per Bulan</p>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.monthlyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorProposed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorRealized" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(val) => `Rp${(val/1000000)}jt`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="amount" name="Usulan" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProposed)" />
                                <Area type="monotone" dataKey="realized" name="Realisasi" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRealized)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Distribusi Kategori (Pie Chart) */}
                <div className="bg-white p-8 md:p-10 rounded-[48px] border border-slate-200 shadow-sm space-y-8">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <PieIcon size={24} className="text-indigo-600" />
                            Porsi Anggaran
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Komposisi Penggunaan Kantor</p>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.categories}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
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

            {/* ANALYTIC CHARTS ROW 2 (EXECUTIVE ONLY: KPA & ADMIN) */}
            {isExecutive && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-700">
                    {/* Realisasi Bidang Wilayah */}
                    <div className="bg-white p-8 md:p-10 rounded-[48px] border-2 border-indigo-50 shadow-xl space-y-8 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ShieldCheck size={80} className="text-indigo-900" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <Map size={24} className="text-emerald-600" />
                                Realisasi Bidang Wilayah
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Performa Serapan Wilayah I, II, & III (Executive Only)</p>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={regionalData} layout="vertical" margin={{ left: 20, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 10, fontWeight: 900, fill: '#1e293b' }} 
                                        width={100}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="pagu" name="Pagu Alokasi" fill="#e2e8f0" radius={[0, 10, 10, 0]} barSize={12} />
                                    <Bar dataKey="realisasi" name="Realisasi" fill="#10b981" radius={[0, 10, 10, 0]} barSize={12} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Realisasi Bagian Tata Usaha */}
                    <div className="bg-white p-8 md:p-10 rounded-[48px] border-2 border-indigo-50 shadow-xl space-y-8 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ShieldCheck size={80} className="text-indigo-900" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <Layout size={24} className="text-indigo-600" />
                                Serapan Tata Usaha & Bagian
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manajemen & Sub Bagian Tata Usaha (Executive Only)</p>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={adminData} layout="vertical" margin={{ left: 20, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 9, fontWeight: 800, fill: '#1e293b' }} 
                                        width={120}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="pagu" name="Pagu Alokasi" fill="#e2e8f0" radius={[0, 10, 10, 0]} barSize={10} />
                                    <Bar dataKey="realisasi" name="Realisasi" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={10} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* MONITORING ANTRIAN GLOBAL UNTUK KPA/ADMIN & VALIDATOR */}
            {isGlobalViewer && (
                <div className="bg-slate-950 p-8 md:p-10 rounded-[48px] shadow-2xl space-y-8 animate-in slide-in-from-bottom-6 duration-700">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                                    <ListChecks size={24} />
                                </div>
                                Monitoring Antrian Keseluruhan Kantor
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-14">Distribusi Berkas Di Seluruh Unit Kerja TA {new Date().getFullYear()}</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-y-2">
                            <thead>
                                <tr className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    <th className="px-6 py-4">Unit Kerja / Bidang</th>
                                    <th className="px-4 py-4 text-center">Antrian Kabid</th>
                                    <th className="px-4 py-4 text-center">Unit Program</th>
                                    <th className="px-4 py-4 text-center">Kasubag TU</th>
                                    <th className="px-4 py-4 text-center">Pejabat PPK</th>
                                    <th className="px-4 py-4 text-center">Proses SPJ</th>
                                    <th className="px-4 py-4 text-center text-emerald-400">Lunas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.deptBudgets.map((dept: any, idx: number) => (
                                    <tr key={idx} className="bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                        <td className="px-6 py-5 rounded-l-[24px]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                                                    <Building2 size={16} />
                                                </div>
                                                <span className="text-[11px] font-black text-white uppercase tracking-tight">{dept.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${dept.queue.pending > 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-white/5 text-slate-600'}`}>{dept.queue.pending}</span>
                                        </td>
                                        <td className="px-4 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${dept.queue.reviewed_bidang > 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-600'}`}>{dept.queue.reviewed_bidang}</span>
                                        </td>
                                        <td className="px-4 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${dept.queue.reviewed_program > 0 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-600'}`}>{dept.queue.reviewed_program}</span>
                                        </td>
                                        <td className="px-4 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${dept.queue.reviewed_tu > 0 ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-slate-600'}`}>{dept.queue.reviewed_tu}</span>
                                        </td>
                                        <td className="px-4 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${dept.queue.approved > 0 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-600'}`}>{dept.queue.approved}</span>
                                        </td>
                                        <td className="px-4 py-5 text-center rounded-r-[24px]">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${dept.queue.realized > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-600'}`}>{dept.queue.realized}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <LayoutPanelLeft size={24} className="text-blue-600" />
                            Status Alokasi Anggaran & Realisasi Kantor
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 ml-9">
                            Monitoring Pagu Seluruh Bidang Kerja PUSDAL LH SUMA
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-12">
                    {stats.deptBudgets.map((dept: any, idx: number) => {
                        const totalAbsorption = dept.total > 0 ? ((dept.spent / dept.total) * 100).toFixed(1) : 0;
                        
                        return (
                            <div key={idx} className="bg-slate-50/50 p-8 rounded-[40px] border border-slate-100 hover:bg-white hover:border-blue-100 hover:shadow-2xl transition-all duration-500 group">
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-white rounded-[24px] border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-500 shadow-sm">
                                            <Building2 size={32} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{dept.name}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status Dana & Realisasi</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border ${Number(totalAbsorption) > 90 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                            {totalAbsorption}% Serapan
                                        </div>
                                    </div>
                                </div>

                                {dept.is_tu ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                        <BudgetSubCard title="Dana EBA" data={dept.eba} icon={Landmark} colorClass="blue" bgColorClass="bg-blue-50" />
                                        <BudgetSubCard title="Dana EBB" data={dept.ebb} icon={Coins} colorClass="emerald" bgColorClass="bg-emerald-50" />
                                        <BudgetSubCard title="Dana BDB" data={dept.bdb} icon={Briefcase} colorClass="amber" bgColorClass="bg-amber-50" />
                                        <BudgetSubCard title="Dana EBD" data={dept.ebd} icon={Wallet} colorClass="blue" bgColorClass="bg-blue-50" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                        <BudgetSubCard title="Dana FBA" data={dept.fba} icon={Landmark} colorClass="blue" bgColorClass="bg-blue-50" />
                                        <BudgetSubCard title="Dana BDH" data={dept.bdh} icon={Coins} colorClass="emerald" bgColorClass="bg-emerald-50" />
                                    </div>
                                )}

                                <div className="pt-6 border-t border-slate-200/60 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Sisa Saldo Bidang:</p>
                                        <p className="text-lg font-black text-slate-900 font-mono">Rp {dept.remaining.toLocaleString('id-ID')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-bold text-slate-300 uppercase mb-1">Status Kritis (90%+)</p>
                                        <div className="w-32 h-2 bg-slate-200/50 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${Number(totalAbsorption) > 90 ? 'bg-red-500' : 'bg-slate-900'}`}
                                                style={{ width: `${Math.min(Number(totalAbsorption), 100)}%` }}
                                            ></div>
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
