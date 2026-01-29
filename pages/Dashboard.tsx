
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { 
    Building2, 
    Wallet, 
    Coins,
    Briefcase,
    Zap,
    Map,
    Info,
    ArrowUpRight,
    Loader2
} from 'lucide-react';
import { dbService } from '../services/dbService.ts';
import { AuthContext } from '../App.tsx';

const Dashboard: React.FC = () => {
    const { user } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<any>({
        totalAmount: 0,
        approvedAmount: 0,
        totalOfficeCeiling: 0,
        deptBudgets: []
    });

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const dbStats = await dbService.getStats(user.role, user.full_name, user.department);
            setStats(dbStats);
        } catch (err) {
            console.error("Dashboard error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    // Metadata untuk kartu persis seperti gambar
    const RO_CARDS = [
        { code: 'EBA', label: 'DANA EBA', icon: <Building2 size={16} />, color: 'text-blue-600', bg: 'bg-blue-50' },
        { code: 'EBB', label: 'DANA EBB', icon: <Coins size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { code: 'BDB', label: 'DANA BDB', icon: <Briefcase size={16} />, color: 'text-orange-500', bg: 'bg-orange-50' },
        { code: 'EBD', label: 'DANA EBD', icon: <Wallet size={16} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ];

    // Ambil data departemen pertama user (atau departemen yang sedang aktif)
    const activeDeptData = useMemo(() => {
        if (!stats.deptBudgets || stats.deptBudgets.length === 0) return null;
        // Cari data yang sesuai dengan department user
        const userDept = user?.department?.split(', ')[0] || '';
        return stats.deptBudgets.find((d: any) => d.name === userDept) || stats.deptBudgets[0];
    }, [stats, user]);

    const totalSerapan = useMemo(() => {
        if (!activeDeptData || activeDeptData.total === 0) return 0;
        return (activeDeptData.spent / activeDeptData.total) * 100;
    }, [activeDeptData]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Sinkronisasi Data...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-10 page-transition">
            
            {/* KONTEN UTAMA - SESUAI REFERENSI GAMBAR */}
            <div className="bg-white border border-slate-100 rounded-[48px] p-10 md:p-14 shadow-sm space-y-16">
                
                {/* Header Bidang */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-slate-400 shadow-inner">
                            <Building2 size={32} />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                                {activeDeptData?.name || user?.department || 'UNIT KERJA'}
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">STATUS DANA & REALISASI</p>
                        </div>
                    </div>
                    
                    <div className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-widest">{totalSerapan.toFixed(1)}% SERAPAN</span>
                    </div>
                </div>

                {/* Grid Kartu Dana RO */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                    {RO_CARDS.map((card) => {
                        const key = card.code.toLowerCase();
                        const data = activeDeptData?.[key] || { total: 0, spent: 0, remaining: 0 };
                        const percent = data.total > 0 ? (data.spent / data.total) * 100 : 0;

                        return (
                            <div key={card.code} className="bg-white border border-slate-100 rounded-[32px] p-8 space-y-8 hover:shadow-xl hover:shadow-slate-100 transition-all group border-b-4 border-b-transparent hover:border-b-blue-500">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                                        {card.icon}
                                    </div>
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{card.label}</h3>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Pagu Alokasi</p>
                                    <p className="text-lg font-black text-slate-900 font-mono">Rp {data.total.toLocaleString('id-ID')}</p>
                                </div>

                                <div className="bg-slate-50/50 rounded-2xl p-5 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-orange-400 uppercase tracking-tighter">Terpakai</span>
                                        <span className="text-[11px] font-black text-orange-500 font-mono">Rp {data.spent.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">Sisa</span>
                                        <span className="text-[11px] font-black text-emerald-600 font-mono">Rp {data.remaining.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full bg-blue-500 transition-all duration-1000`} 
                                            style={{ width: `${Math.min(percent, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Saldo Bidang */}
                <div className="pt-10 border-t border-slate-50 flex flex-col md:flex-row justify-between items-end gap-10">
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">TOTAL SISA SALDO BIDANG:</p>
                        <p className="text-4xl font-black text-slate-900 font-mono tracking-tighter">
                            Rp {(activeDeptData?.remaining || 0).toLocaleString('id-ID')}
                        </p>
                    </div>

                    <div className="w-full md:w-80 space-y-3">
                        <div className="flex justify-between items-end">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Status Kritis (90%+)</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase">{totalSerapan.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${totalSerapan > 90 ? 'bg-red-500' : 'bg-slate-300'} transition-all duration-1000`} 
                                style={{ width: `${Math.min(totalSerapan, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 rounded-[32px] p-8 text-white flex items-center justify-between group cursor-pointer hover:bg-slate-800 transition-all">
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest mb-1">Riwayat Pengajuan</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Lihat status berkas anda</p>
                    </div>
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:translate-x-1 transition-transform">
                        <ArrowUpRight size={20} />
                    </div>
                </div>

                <div className="bg-blue-600 rounded-[32px] p-8 text-white flex items-center justify-between group cursor-pointer hover:bg-blue-700 transition-all">
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest mb-1">Buat Usulan Baru</h4>
                        <p className="text-[10px] text-blue-200 font-bold uppercase">Ajukan anggaran kegiatan</p>
                    </div>
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:translate-x-1 transition-transform">
                        <Zap size={20} />
                    </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-[32px] p-8 flex items-center justify-between group cursor-pointer hover:border-blue-200 transition-all">
                    <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Bantuan Sistem</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Panduan E-Kartu Kendali</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:translate-x-1 transition-transform">
                        <Info size={20} />
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
