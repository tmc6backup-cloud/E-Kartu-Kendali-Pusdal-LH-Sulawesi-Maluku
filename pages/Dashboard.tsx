
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { 
    Building2, 
    Wallet, 
    Coins,
    Briefcase,
    ArrowUpRight,
    Loader2
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { AuthContext } from '../context/AuthContext';

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

    const RO_CARDS = [
        { code: 'EBA', label: 'DANA EBA', icon: <Building2 size={16} />, color: 'text-blue-600', bg: 'bg-blue-50' },
        { code: 'EBB', label: 'DANA EBB', icon: <Coins size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { code: 'BDB', label: 'DANA BDB', icon: <Briefcase size={16} />, color: 'text-orange-500', bg: 'bg-orange-50' },
        { code: 'EBD', label: 'DANA EBD', icon: <Wallet size={16} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ];

    const activeDeptData = useMemo(() => {
        if (!stats?.deptBudgets || stats.deptBudgets.length === 0) return null;
        const userDept = user?.department?.split(', ')[0] || '';
        return stats.deptBudgets.find((d: any) => d.name === userDept) || stats.deptBudgets[0];
    }, [stats, user]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Memuat Data...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-10">
            <div className="bg-white border border-slate-100 rounded-[48px] p-10 md:p-14 shadow-sm space-y-16">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-slate-400">
                            <Building2 size={32} />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                                {activeDeptData?.name || user?.department || 'UNIT KERJA'}
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">STATUS DANA & REALISASI</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                    {RO_CARDS.map((card) => {
                        const key = card.code.toLowerCase();
                        const data = activeDeptData?.[key] || { total: 0, spent: 0, remaining: 0 };
                        return (
                            <div key={card.code} className="bg-white border border-slate-100 rounded-[32px] p-8 space-y-8 hover:shadow-xl transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                                        {card.icon}
                                    </div>
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{card.label}</h3>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-300 uppercase">Pagu</p>
                                    <p className="text-lg font-black text-slate-900 font-mono">Rp {data.total.toLocaleString('id-ID')}</p>
                                </div>
                                <div className="bg-slate-50/50 rounded-2xl p-5 space-y-3">
                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                        <span className="text-orange-400">TERPAKAI</span>
                                        <span className="text-orange-600">Rp {data.spent.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                        <span className="text-blue-500">SISA</span>
                                        <span className="text-emerald-600">Rp {data.remaining.toLocaleString('id-ID')}</span>
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
