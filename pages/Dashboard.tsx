
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { 
    Building2, 
    Wallet, 
    Coins,
    Briefcase,
    Zap,
    Info,
    ArrowUpRight,
    Loader2,
    ShieldCheck,
    LayoutGrid,
    TrendingUp
} from 'lucide-react';
import { dbService } from '../services/dbService.ts';
import { AuthContext } from '../App.tsx';

// Komponen Reusable untuk Kartu Bidang (Sesuai Referensi Gambar)
const DeptBudgetCard: React.FC<{ deptData: any, isGlobalContext?: boolean }> = ({ deptData, isGlobalContext }) => {
    const RO_CARDS = [
        { code: 'EBA', label: 'DANA EBA', icon: <Building2 size={16} />, color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-500' },
        { code: 'EBB', label: 'DANA EBB', icon: <Coins size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' },
        { code: 'BDB', label: 'DANA BDB', icon: <Briefcase size={16} />, color: 'text-orange-500', bg: 'bg-orange-50', bar: 'bg-orange-500' },
        { code: 'EBD', label: 'DANA EBD', icon: <Wallet size={16} />, color: 'text-indigo-600', bg: 'bg-indigo-50', bar: 'bg-indigo-600' },
    ];

    const totalSerapan = deptData.total > 0 ? (deptData.spent / deptData.total) * 100 : 0;

    return (
        <div className="bg-white border border-slate-100 rounded-[48px] p-8 md:p-12 shadow-sm space-y-12 transition-all hover:shadow-md">
            {/* Header Bidang */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shadow-inner">
                        <Building2 size={28} />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                            {deptData.name}
                        </h2>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">STATUS DANA & REALISASI</p>
                    </div>
                </div>
                
                <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest">{totalSerapan.toFixed(1)}% SERAPAN</span>
                </div>
            </div>

            {/* Grid Kartu Dana RO */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {RO_CARDS.map((card) => {
                    const key = card.code.toLowerCase();
                    const data = deptData[key] || { total: 0, spent: 0, remaining: 0 };
                    const percent = data.total > 0 ? (data.spent / data.total) * 100 : 0;

                    return (
                        <div key={card.code} className="bg-white border border-slate-100 rounded-[28px] p-6 space-y-6 group hover:border-blue-200 transition-all">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 ${card.bg} ${card.color} rounded-xl flex items-center justify-center`}>
                                    {card.icon}
                                </div>
                                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{card.label}</h3>
                            </div>

                            <div className="space-y-0.5">
                                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Pagu Alokasi</p>
                                <p className="text-base font-black text-slate-900 font-mono">Rp {data.total.toLocaleString('id-ID')}</p>
                            </div>

                            <div className="bg-slate-50/50 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[8px] font-black text-orange-400 uppercase">Terpakai</span>
                                    <span className="text-[10px] font-black text-orange-500 font-mono">Rp {data.spent.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[8px] font-black text-blue-500 uppercase">Sisa</span>
                                    <span className="text-[10px] font-black text-emerald-600 font-mono">Rp {data.remaining.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full ${card.bar} transition-all duration-1000`} 
                                    style={{ width: `${Math.min(percent, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Saldo */}
            <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">TOTAL SISA SALDO BIDANG:</p>
                    <p className="text-3xl font-black text-slate-900 font-mono tracking-tighter">
                        Rp {(deptData.remaining || 0).toLocaleString('id-ID')}
                    </p>
                </div>

                <div className="w-full md:w-64 space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-[8px] font-black text-slate-300 uppercase">Status Kritis (90%+)</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase">{totalSerapan.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full ${totalSerapan > 90 ? 'bg-red-500' : 'bg-slate-300'} transition-all`} 
                            style={{ width: `${Math.min(totalSerapan, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { user } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

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

    // Otoritas Global: Admin, KPA, Validator (Pimpinan/Pusat)
    const isGlobalUser = useMemo(() => {
        if (!user) return false;
        const globalRoles = ['admin', 'kpa', 'validator_program', 'validator_ppk', 'bendahara'];
        return globalRoles.includes(user.role);
    }, [user]);

    // Otoritas Terbatas (Multi-Bidang): PIC
    const isPicUser = useMemo(() => {
        return user?.role?.startsWith('pic_');
    }, [user]);

    if (isLoading || !stats) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Memuat Dashboard Kantor...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-12 page-transition">
            
            {/* Header Dashboard Status */}
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-white border border-slate-100 rounded-2xl text-blue-600 shadow-sm">
                    <LayoutGrid size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Status Alokasi Anggaran & Realisasi Kantor</h1>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Monitoring Pagu Seluruh Bidang Kerja Pusdal LH Suma</p>
                </div>
            </div>

            {/* Tampilan Kondisional */}
            <div className="space-y-10">
                {isGlobalUser ? (
                    // ADMIN / KPA / VALIDATOR: Lihat per bidang (SEMUA)
                    <div className="space-y-12">
                        {/* Agregat Global Kantor */}
                        <div className="bg-slate-900 rounded-[40px] p-8 md:p-12 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                                    <ShieldCheck size={32} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black uppercase tracking-tight">KONSOLIDASI PAGU KANTOR</h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Serapan: {((stats.globalROs.spent / stats.globalROs.total) * 100).toFixed(1)}%</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Sisa Saldo Kantor</p>
                                <p className="text-4xl font-black font-mono text-emerald-400">Rp {stats.globalROs.remaining.toLocaleString('id-ID')}</p>
                            </div>
                        </div>

                        {/* List Seluruh Bidang */}
                        {stats.deptBudgets.map((dept: any, idx: number) => (
                            <DeptBudgetCard key={idx} deptData={dept} isGlobalContext />
                        ))}
                    </div>
                ) : isPicUser ? (
                    // PIC: Lihat hanya bidang-bidang yang ditugaskan (Bisa lebih dari satu)
                    <div className="space-y-12">
                        <div className="px-10 py-6 bg-blue-50 border border-blue-100 rounded-[32px] flex items-center justify-between">
                            <div className="flex items-center gap-4 text-blue-900">
                                <ShieldCheck size={24} />
                                <p className="text-xs font-black uppercase tracking-widest">Wilayah Kerja PIC Terdaftar</p>
                            </div>
                            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">{user?.department}</span>
                        </div>
                        {(() => {
                            const assignedDepts = user?.department?.split(', ').map(d => d.trim().toLowerCase()) || [];
                            const myDeptsData = stats.deptBudgets?.filter((d: any) => assignedDepts.includes(d.name.toLowerCase()));
                            
                            return myDeptsData && myDeptsData.length > 0 ? (
                                myDeptsData.map((dept: any, idx: number) => (
                                    <DeptBudgetCard key={idx} deptData={dept} />
                                ))
                            ) : (
                                <div className="bg-white p-20 rounded-[48px] text-center border border-dashed">
                                    <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
                                    <p className="text-[10px] font-black text-slate-300 uppercase">Tidak ada bidang yang ditugaskan untuk otoritas PIC Anda.</p>
                                </div>
                            );
                        })()}
                    </div>
                ) : (
                    // KEPALA BIDANG / STAF: Hanya lihat satu bidang sendiri
                    <div className="space-y-6">
                        {(() => {
                            const userDept = user?.department?.split(', ')[0] || '';
                            const myDept = stats.deptBudgets?.find((d: any) => d.name.toLowerCase() === userDept.toLowerCase()) || stats.deptBudgets?.[0];
                            return myDept ? <DeptBudgetCard deptData={myDept} /> : (
                                <div className="bg-white p-20 rounded-[48px] text-center border border-dashed">
                                    <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
                                    <p className="text-[10px] font-black text-slate-300 uppercase">Data bidang tidak ditemukan.</p>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* QUICK ACTIONS (Tetap Sama) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
                <div className="bg-white border border-slate-100 rounded-[32px] p-8 flex items-center justify-between group cursor-pointer hover:border-slate-300 transition-all">
                    <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Daftar Berkas</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Monitoring status pengajuan</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                        <ArrowUpRight size={20} />
                    </div>
                </div>

                <div className="bg-blue-600 rounded-[32px] p-8 text-white flex items-center justify-between group cursor-pointer hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest mb-1">Buat Usulan</h4>
                        <p className="text-[10px] text-blue-100 font-bold uppercase">Ajukan anggaran baru</p>
                    </div>
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all">
                        <Zap size={20} />
                    </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-[32px] p-8 flex items-center justify-between group cursor-pointer hover:border-slate-300 transition-all">
                    <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Bantuan Sistem</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Panduan E-Kartu Kendali</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                        <Info size={20} />
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
