
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    AreaChart,
    Area,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { Clock, CheckCircle2, BrainCircuit, TrendingUp, Building2, Wallet, FileText, ListChecks, Loader2, BarChart3, AlertCircle, Info, Sparkles } from 'lucide-react';
import { getBudgetInsights } from '../services/geminiService.ts';
import { dbService } from '../services/dbService.ts';
import { AuthContext } from '../App.tsx';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const { user } = useContext(AuthContext);
    const [insight, setInsight] = useState("");
    const [isInsightLoading, setIsInsightLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [useMockData, setUseMockData] = useState(false);
    const [stats, setStats] = useState<any>({
        totalAmount: 0,
        pendingCount: 0,
        approvedAmount: 0,
        rejectedCount: 0,
        totalCount: 0,
        totalOfficeCeiling: 0,
        categories: [],
        monthlyTrend: [],
        deptBudgets: []
    });

    // Data Simulasi agar Dashboard Terlihat Cantik saat Database Kosong
    const MOCK_STATS = {
        totalAmount: 1250000000,
        pendingCount: 12,
        approvedAmount: 850000000,
        rejectedCount: 2,
        totalCount: 24,
        totalOfficeCeiling: 5000000000,
        monthlyTrend: [
            { name: 'Jan', amount: 400000000 },
            { name: 'Feb', amount: 300000000 },
            { name: 'Mar', amount: 600000000 },
            { name: 'Apr', amount: 200000000 },
            { name: 'Mei', amount: 450000000 },
            { name: 'Jun', amount: 550000000 }
        ],
        deptBudgets: [
            { name: 'Bidang Wilayah I', total: 1000000000, spent: 650000000, queue: { pending: 2, reviewed_bidang: 1, reviewed_program: 0, reviewed_tu: 1 } },
            { name: 'Bidang Wilayah II', total: 1000000000, spent: 400000000, queue: { pending: 1, reviewed_bidang: 0, reviewed_program: 2, reviewed_tu: 0 } },
            { name: 'Bagian Tata Usaha', total: 800000000, spent: 750000000, queue: { pending: 0, reviewed_bidang: 3, reviewed_program: 1, reviewed_tu: 1 } },
            { name: 'Bidang Wilayah III', total: 1000000000, spent: 300000000, queue: { pending: 1, reviewed_bidang: 1, reviewed_program: 0, reviewed_tu: 0 } }
        ]
    };
    
    const isGlobalViewer = useMemo(() => 
        ['admin', 'kpa', 'validator_program', 'validator_ppk', 'bendahara'].includes(user?.role || '') ||
        user?.department?.toUpperCase().includes("PUSDAL LH SUMA"),
    [user]);

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const dbStats = await dbService.getStats(user.role, user.full_name, user.department);
            // Jika data di database benar-benar kosong (Pagu 0 dan Usulan 0), gunakan Mock Data
            if (!dbStats || (dbStats.totalOfficeCeiling === 0 && dbStats.totalCount === 0)) {
                setStats(MOCK_STATS);
                setUseMockData(true);
                setInsight("Dashboard saat ini menampilkan data simulasi karena database Anda masih kosong.");
            } else {
                setStats(dbStats);
                setUseMockData(false);
                if (dbStats.totalAmount > 0) fetchAiInsight(dbStats.totalAmount, dbStats.approvedAmount);
            }
        } catch (err) {
            console.error("Dashboard Fetch Error:", err);
            setStats(MOCK_STATS);
            setUseMockData(true);
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
            setInsight("Gunakan data dashboard untuk memantau performa anggaran.");
        } finally {
            setIsInsightLoading(false);
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xl">
                    <p className="text-[10px] font-black text-slate-900 uppercase mb-2 border-b pb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 text-[11px] font-bold py-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></div>
                            <span className="text-slate-500">{entry.name}:</span>
                            <span className="text-slate-900">Rp {entry.value.toLocaleString('id-ID')}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <Loader2 className="animate-spin text-blue-600 mb-6" size={48} />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sinkronisasi Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 page-transition pb-20">
            {useMockData && (
                <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center justify-between shadow-lg animate-pulse">
                    <div className="flex items-center gap-3">
                        <Sparkles size={18} />
                        <p className="text-[10px] font-black uppercase tracking-widest">Mode Simulasi Aktif: Database Anda masih kosong. Silakan isi Pagu di menu Manajemen Pagu.</p>
                    </div>
                    <Link to="/ceilings" className="bg-white text-blue-600 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase">Atur Pagu</Link>
                </div>
            )}

            <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        Dashboard Anggaran
                        {isGlobalViewer && <div className="p-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-black">GLOBAL</div>}
                    </h1>
                    <p className="text-slate-500 font-semibold text-sm flex items-center gap-2 uppercase tracking-widest">
                        Status Terkini • {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}
                    </p>
                </div>

                <div className="w-full xl:max-w-xl">
                    <div className="bg-white border border-slate-200 p-5 rounded-[32px] shadow-sm flex items-center gap-5 border-l-4 border-l-emerald-500">
                        <div className="shrink-0 w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                            <BrainCircuit size={24} />
                        </div>
                        <div className="flex-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 block mb-1">AI Strategic Insight</span>
                            {isInsightLoading ? (
                                <p className="text-[10px] italic text-slate-400">Menganalisis performa...</p>
                            ) : (
                                <p className="text-xs font-bold leading-relaxed text-slate-700 italic">"{insight}"</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Berkas', value: stats.totalCount, sub: 'Unit Kerja', icon: <FileText />, color: 'text-slate-900', bg: 'bg-slate-100' },
                    { label: 'Pagu Kantor', value: `Rp ${(stats.totalOfficeCeiling/1000000).toFixed(1)}jt`, sub: 'TA ' + new Date().getFullYear(), icon: <Wallet />, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Usulan Berjalan', value: `Rp ${(stats.totalAmount/1000000).toFixed(1)}jt`, sub: 'Proses Komitmen', icon: <Clock />, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Realisasi Final', value: `Rp ${(stats.approvedAmount/1000000).toFixed(1)}jt`, sub: 'Sudah SPJ', icon: <CheckCircle2 />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-5 hover:border-blue-200 transition-all group">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${stat.color} ${stat.bg}`}>{stat.icon}</div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-xl font-black text-slate-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart 1: Trend Pengajuan */}
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6 flex flex-col min-h-[400px]">
                    <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <TrendingUp size={18} className="text-blue-600" /> Trend Pengajuan Bulanan
                    </h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.monthlyTrend}>
                                <defs>
                                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `${val/1000000}jt`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="amount" name="Usulan Anggaran" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Pagu vs Realisasi per Bidang */}
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6 flex flex-col min-h-[400px]">
                    <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <BarChart3 size={18} className="text-emerald-600" /> Komparasi Pagu per Bidang
                    </h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.deptBudgets} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} tickFormatter={(val) => `${val/1000000}jt`} />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold' }} width={120} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="total" name="Alokasi Pagu" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={12} />
                                <Bar dataKey="spent" name="Anggaran Terpakai" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Monitoring Table Section */}
            {isGlobalViewer && (
                <div className="bg-slate-900 rounded-[48px] overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                                <ListChecks size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">Monitoring Antrian Global</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Status Berkas Seluruh Unit Kerja</p>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5">
                                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <th className="px-8 py-5">Unit Kerja / Bidang</th>
                                    <th className="px-4 py-5 text-center">Antrian Kabid</th>
                                    <th className="px-4 py-5 text-center">Validasi Program</th>
                                    <th className="px-4 py-5 text-center">Validasi TU</th>
                                    <th className="px-4 py-5 text-center">Proses PPK</th>
                                    <th className="px-8 py-5 text-right">Serapan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {stats.deptBudgets.map((dept: any, idx: number) => {
                                    const percent = dept.total > 0 ? (dept.spent / dept.total) * 100 : 0;
                                    return (
                                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                                                        <Building2 size={16} />
                                                    </div>
                                                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-tight">{dept.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-6 text-center">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${dept.queue.pending > 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-white/5 text-slate-600'}`}>
                                                    {dept.queue.pending}
                                                </span>
                                            </td>
                                            <td className="px-4 py-6 text-center">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${dept.queue.reviewed_bidang > 0 ? 'bg-blue-500/20 text-blue-500' : 'bg-white/5 text-slate-600'}`}>
                                                    {dept.queue.reviewed_bidang}
                                                </span>
                                            </td>
                                            <td className="px-4 py-6 text-center">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${dept.queue.reviewed_program > 0 ? 'bg-indigo-500/20 text-indigo-500' : 'bg-white/5 text-slate-600'}`}>
                                                    {dept.queue.reviewed_program}
                                                </span>
                                            </td>
                                            <td className="px-4 py-6 text-center">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${dept.queue.reviewed_tu > 0 ? 'bg-purple-500/20 text-purple-500' : 'bg-white/5 text-slate-600'}`}>
                                                    {dept.queue.reviewed_tu}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className="text-[10px] font-black text-emerald-400 font-mono">{percent.toFixed(1)}%</span>
                                                    <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500" style={{ width: `${percent}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
