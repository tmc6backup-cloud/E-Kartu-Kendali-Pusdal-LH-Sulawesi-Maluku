import React from 'react';
import { Users, Building2, ChevronRight, PlusCircle } from 'lucide-react';
import OfficialKanban from '../components/OfficialKanban.tsx';
import DepartmentCard from '../components/DepartmentCard.tsx';

const MasterData: React.FC = () => {
    return (
        <div className="page-transition space-y-10">
            <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Master Data</h1>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-2">
                    Kelola data referensi sistem.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Card Daftar Pejabat */}
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center">
                                <Users size={24} />
                            </div>
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Daftar Pejabat</h2>
                        </div>
                        <button className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-slate-800 transition-all active:scale-95">
                            <PlusCircle size={16} />
                            Tambah
                        </button>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 mb-6">
                        Kelola daftar pejabat yang terlibat dalam proses validasi dan persetujuan anggaran.
                    </p>
                    <OfficialKanban />
                </div>

                <DepartmentCard />
            </div>
        </div>
    );
};

export default MasterData;
