
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { dbService } from '../services/dbService.ts';
import { BudgetCeiling, BudgetRequest } from '../types.ts';
import { 
    Wallet, 
    Save, 
    Loader2, 
    Building2, 
    Trash2,
    Plus,
    Info,
    CalendarDays,
    Database,
    Edit2,
    AlertCircle,
    ChevronDown,
    Landmark,
    TrendingUp,
    PieChart,
    X,
    CheckCircle
} from 'lucide-react';

const ALL_DEPARTMENTS = [
    "PUSDAL LH SUMA",
    "Bagian Tata Usaha",
    "Bidang Wilayah I",
    "Bidang Wilayah II",
    "Bidang Wilayah III",
    "Sub Bagian Program & Anggaran",
    "Sub Bagian Kehumasan",
    "Sub Bagian Kepegawaian",
    "Sub Bagian Keuangan"
];

const DEFAULT_RO_CODES = ["FBA", "BDH", "EBD", "EBB", "EBA", "BDB"];

const AdminPagu: React.FC = () => {
    const [ceilings, setCeilings] = useState<BudgetCeiling[]>([]);
    const [requests, setRequests] = useState<BudgetRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [tableMissing, setTableMissing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [isCustomRo, setIsCustomRo] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const formRef = useRef<HTMLDivElement>(null);
    
    const currentYear = new Date().getFullYear();
    const availableYears = Array.from({ length: 6 }, (_, i) => currentYear + i);

    const [newEntry, setNewEntry] = useState({
        dept: ALL_DEPARTMENTS[0],
        ro: DEFAULT_RO_CODES[0],
        komponen: '',
        subkomponen: '',
        amount: 0
    });

    const fetchData = async () => {
        setLoading(true);
        setTableMissing(false);
        try {
            const [cData, rData] = await Promise.all([
                dbService.getCeilings(year),
                dbService.getAllRequests()
            ]);
            setCeilings(cData);
            setRequests(rData);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [year]);

    const officeTotal = useMemo(() => {
        return ceilings.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    }, [ceilings]);

    const departmentsToShow = useMemo(() => {
        const fromData = Array.from(new Set(ceilings.map(c => c.department)));
        const combined = Array.from(new Set([...ALL_DEPARTMENTS, ...fromData]));
        return combined.filter(d => ceilings.some(c => c.department === d));
    }, [ceilings]);

    const handleSave = async () => {
        if (!newEntry.dept || !newEntry.ro || newEntry.amount <= 0) {
            alert("Harap lengkapi Departemen, RO, dan Nominal Pagu.");
            return;
        }

        setSaving(true);
        try {
            const success = await dbService.updateCeiling(
                newEntry.dept, 
                newEntry.ro, 
                newEntry.amount, 
                year, 
                newEntry.komponen || '', 
                newEntry.subkomponen || '',
                editingId || undefined
            );

            if (success) {
                await fetchData();
                handleResetForm();
            } else {
                alert("Gagal menyimpan data ke database. Silakan coba lagi.");
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan sistem saat menyimpan.");
        } finally {
            setSaving(false);
        }
    };

    const handleResetForm = () => {
        setNewEntry({
            dept: ALL_DEPARTMENTS[0],
            ro: DEFAULT_RO_CODES[0],
            komponen: '',
            subkomponen: '',
            amount: 0
        });
        setEditingId(null);
        setIsCustomRo(false);
    };

    const handleEditClick = (c: BudgetCeiling) => {
        setEditingId(c.id);
        setNewEntry({
            dept: c.department,
            ro: c.ro_code,
            komponen: c.komponen_code || '',
            subkomponen: c.subkomponen_code || '',
            amount: Number(c.amount)
        });
        
        if (!DEFAULT_RO_CODES.includes(c.ro_code)) {
            setIsCustomRo(true);
        } else {
            setIsCustomRo(false);
        }
        
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus alokasi pagu ini?")) return;
        setDeletingId(id);
        const success = await dbService.deleteCeiling(id);
        if (success) {
            setCeilings(prev => prev.filter(c => c.id !== id));
        }
        setDeletingId(null);
    };

    const getUtilization = (dept: string, ro: string, komp: string, subk: string) => {
        return requests
            .filter(r => r.requester_department === dept && (['approved', 'reviewed_pic', 'realized'].includes(r.status)))
            .reduce((acc, curr) => {
                const matchItems = (curr.calculation_items || []).filter(item => 
                    item.ro_code === ro && 
                    item.komponen_code === komp && 
                    item.subkomponen_code === subk
                );
                return acc + matchItems.reduce((sum, i) => sum + i.jumlah, 0);
            }, 0);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="animate-spin text-blue-600 mb-6 opacity-30" size={64} />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Sinkronisasi Pagu...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 page-transition">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <Wallet className="text-blue-600" /> Manajemen Pagu
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Alokasi anggaran per Unit Kerja / Bidang Pusdal LH Suma.</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                    <CalendarDays size={18} className="text-slate-400 ml-3" />
                    <select 
                        className="bg-slate-50 px-6 py-2 rounded-xl text-sm font-black outline-none border-none text-slate-700"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                    >
                        {availableYears.map(y => (
                            <option key={y} value={y}>TA {y}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/10 rounded-2xl">
                                <Landmark className="text-emerald-400" size={32} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Executive Summary</p>
                                <h2 className="text-2xl font-black uppercase tracking-tight">Total Pagu Satu Kantor</h2>
                            </div>
                        </div>
                        <p className="text-xs font-bold text-slate-400 max-w-md uppercase leading-relaxed tracking-wider">
                            Akumulasi seluruh alokasi anggaran operasional dan kegiatan dari tiap-tiap bidang kerja untuk Tahun Anggaran {year}.
                        </p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md rounded-[32px] p-8 border border-white/10 min-w-[320px] text-center md:text-right">
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">Anggaran Terdaftar TA {year}</p>
                        <p className="text-4xl font-black font-mono tracking-tighter">
                            Rp {officeTotal.toLocaleString('id-ID')}
                        </p>
                    </div>
                </div>
            </div>

            <div ref={formRef} className={`rounded-[40px] border-2 p-10 shadow-sm space-y-8 scroll-mt-24 transition-all duration-500 ${editingId ? 'bg-blue-50 border-blue-300 ring-4 ring-blue-500/10' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors ${editingId ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
                            {editingId ? <Edit2 size={20} /> : <Plus size={24} />}
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">
                                {editingId ? 'Koreksi Alokasi Pagu' : 'Input / Update Alokasi'}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                                {editingId ? 'Memperbarui data pagu yang sudah ada' : `Input data pagu untuk tahun anggaran ${year}`}
                            </p>
                        </div>
                    </div>
                    {editingId && (
                        <button onClick={handleResetForm} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-500 hover:text-red-500 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm">
                            <X size={14} /> Batal Edit
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Pilih Bidang</label>
                        <select 
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase shadow-sm outline-none focus:border-blue-500"
                            value={newEntry.dept}
                            onChange={(e) => setNewEntry({...newEntry, dept: e.target.value})}
                        >
                            {ALL_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Kode RO</label>
                            <button onClick={() => setIsCustomRo(!isCustomRo)} className="text-[8px] font-black text-blue-600 uppercase underline">
                                {isCustomRo ? 'Pilih Daftar' : 'Input Manual'}
                            </button>
                        </div>
                        {isCustomRo ? (
                            <input 
                                type="text" placeholder="E.BA.994"
                                className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:border-blue-600 shadow-sm"
                                value={newEntry.ro}
                                onChange={(e) => setNewEntry({...newEntry, ro: e.target.value.toUpperCase()})}
                            />
                        ) : (
                            <select 
                                className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase shadow-sm outline-none focus:border-blue-500"
                                value={newEntry.ro}
                                onChange={(e) => setNewEntry({...newEntry, ro: e.target.value})}
                            >
                                {DEFAULT_RO_CODES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Komponen</label>
                        <input 
                            type="text" placeholder="051"
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:border-blue-600 shadow-sm"
                            value={newEntry.komponen}
                            onChange={(e) => setNewEntry({...newEntry, komponen: e.target.value.toUpperCase()})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Subkomp</label>
                        <input 
                            type="text" placeholder="A"
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:border-blue-600 shadow-sm"
                            value={newEntry.subkomponen}
                            onChange={(e) => setNewEntry({...newEntry, subkomponen: e.target.value.toUpperCase()})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Nominal (Rp)</label>
                        <input 
                            type="number"
                            className="w-full p-4 bg-slate-900 text-white border border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm"
                            value={newEntry.amount}
                            onChange={(e) => setNewEntry({...newEntry, amount: Number(e.target.value)})}
                        />
                    </div>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className={`w-full py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 ${editingId ? 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700' : 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800'}`}
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : (editingId ? <CheckCircle size={20} /> : <Save size={20} />)}
                    {editingId ? 'Simpan Perubahan Pagu' : 'Simpan & Daftarkan Pagu Baru'}
                </button>
            </div>

            <div className="space-y-16">
                {departmentsToShow.length > 0 ? departmentsToShow.map((deptName, idx) => {
                    const deptCeilings = ceilings.filter(c => c.department === deptName);
                    const totalDeptPagu = deptCeilings.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

                    return (
                        <div key={idx} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3 px-6 py-3 bg-slate-900 w-fit rounded-2xl shadow-lg border border-slate-800">
                                    <Building2 size={16} className="text-emerald-400" />
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{deptName}</h2>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="px-5 py-2.5 bg-white border-2 border-slate-100 rounded-xl shadow-sm flex items-center gap-3">
                                        <TrendingUp size={14} className="text-emerald-500" />
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total {deptName}</p>
                                            <p className="text-xs font-black text-slate-900 font-mono">Rp {totalDeptPagu.toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                    <div className="px-5 py-2.5 bg-blue-50 border-2 border-blue-100 rounded-xl shadow-sm flex items-center gap-3">
                                        <PieChart size={14} className="text-blue-500" />
                                        <div>
                                            <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Jumlah RO</p>
                                            <p className="text-xs font-black text-blue-900 font-mono">{deptCeilings.length} Kode</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <th className="px-8 py-5">Struktur (RO.K.SK)</th>
                                            <th className="px-8 py-5 text-right">Alokasi Pagu</th>
                                            <th className="px-8 py-5 text-right">Realisasi</th>
                                            <th className="px-8 py-5 text-center">Sisa Saldo</th>
                                            <th className="px-8 py-5 text-right">Opsi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {deptCeilings.map(c => {
                                            const spent = getUtilization(c.department, c.ro_code, c.komponen_code || '', c.subkomponen_code || '');
                                            const sisa = Number(c.amount) - spent;
                                            const percent = Number(c.amount) > 0 ? (spent / Number(c.amount)) * 100 : 0;
                                            const isDeleting = deletingId === c.id;
                                            const isBeingEdited = editingId === c.id;

                                            return (
                                                <tr key={c.id} className={`hover:bg-slate-50/50 transition-all group ${isDeleting ? 'opacity-50 grayscale' : ''} ${isBeingEdited ? 'bg-blue-50/50' : ''}`}>
                                                    <td className="px-8 py-6">
                                                        <span className={`p-2 rounded-lg font-black text-[10px] uppercase tracking-tighter transition-colors ${isBeingEdited ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                                                            {c.ro_code}.{c.komponen_code}.{c.subkomponen_code}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right font-bold text-slate-900 font-mono text-sm">
                                                        Rp {Number(c.amount).toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-8 py-6 text-right font-bold text-slate-400 font-mono text-xs">
                                                        Rp {spent.toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <span className={`text-[11px] font-black font-mono ${sisa < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                                Rp {sisa.toLocaleString('id-ID')}
                                                            </span>
                                                            <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full ${percent > 90 ? 'bg-red-500' : 'bg-emerald-500'} transition-all duration-700`}
                                                                    style={{ width: `${Math.min(percent, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button 
                                                                onClick={() => handleEditClick(c)} 
                                                                className={`p-2.5 rounded-xl transition-all shadow-sm ${isBeingEdited ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-100'}`} 
                                                                title="Ubah Data"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(c.id)} 
                                                                disabled={isDeleting}
                                                                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-100 bg-white rounded-xl transition-all shadow-sm" 
                                                                title="Hapus Data"
                                                            >
                                                                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="bg-slate-50/30">
                                            <td className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Akumulasi {deptName}</td>
                                            <td className="px-8 py-6 text-right font-black text-slate-900 font-mono text-base border-t border-slate-200">
                                                Rp {totalDeptPagu.toLocaleString('id-ID')}
                                            </td>
                                            <td colSpan={3}></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
                        <Database size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Belum ada data pagu terdaftar untuk TA {year}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPagu;
