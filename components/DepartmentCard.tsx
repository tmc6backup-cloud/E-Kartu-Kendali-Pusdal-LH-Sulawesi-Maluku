import React from 'react';
import { Building2, PlusCircle, ChevronRight } from 'lucide-react';

const departments = [
    { id: 1, name: 'Bagian Tata Usaha' },
    { id: 2, name: 'Bidang Wilayah I' },
    { id: 3, name: 'Bidang Wilayah II' },
    { id: 4, name: 'Bidang Wilayah III' },
];

const DepartmentCard: React.FC = () => {
    return (
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                        <Building2 size={24} />
                    </div>
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Daftar Bidang/Sub-bidang</h2>
                </div>
                <button className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-slate-800 transition-all active:scale-95">
                    <PlusCircle size={16} />
                    Tambah
                </button>
            </div>
            <p className="text-[11px] font-bold text-slate-400 mb-6">
                Kelola daftar bidang dan sub-bidang yang digunakan dalam alokasi anggaran.
            </p>
            
            <div className="space-y-2 mt-6">
                {departments.map(dept => (
                    <div key={dept.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-slate-200">
                                <Building2 size={16} className="text-green-600" />
                            </div>
                            <span className="text-xs font-bold text-slate-800">{dept.name}</span>
                        </div>
                        <button className="p-2 text-slate-400 hover:text-slate-800">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DepartmentCard;
