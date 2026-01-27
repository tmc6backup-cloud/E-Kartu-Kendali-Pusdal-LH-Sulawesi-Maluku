
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { BudgetCeiling, BudgetRequest } from '../types';
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
    PieChart
} from 'lucide-react';

// Daftar departemen yang disinkronkan dengan UserManagement
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

// Default RO Codes yang sering digunakan
const DEFAULT_RO_CODES = ["FBA", "BDH", "EBD", "EBB", "EBA", "BDB"];

const AdminPagu: React.FC = () => {
    const [ceilings, setCeilings] = useState<BudgetCeiling[]>([]);
    const [requests, setRequests] = useState<BudgetRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [tableMissing, setTableMissing] = useState(false);
    const [saving, setSaving] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [isCustomRo, setIsCustomRo] = useState(false);
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
            if (err.message === "DATABASE_TABLE_MISSING") {
                setTableMissing(true);
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [year]);

    // Total Pagu Kantor (Seluruh Bidang)
    const officeTotal = useMemo(() => {
        return ceilings.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    }, [ceilings]);

    // Mendapatkan daftar departemen unik yang ada di data ceilings (dari DB) 
    const departmentsToShow = useMemo(() => {
        const fromData = Array.from(new Set(ceilings.map(c => c.department)));
        return Array.from(new Set([...ALL_DEPARTMENTS, ...fromData]));
    }, [ceilings]);

    const handleSave = async (dept: string, ro: string, komp: string, subk: string, amount: number) => {
        if (!dept || !ro || amount <= 0) {
            alert("Harap lengkapi Departemen, RO, dan Nominal Pagu.");
            return;
        }
        const key = `${dept}-${ro}-${komp}-${subk}`;
        setSaving(key);
        
        try {
            const success = await dbService.updateCeiling(
                dept, 
                ro, 
                amount, 
                year, 
                komp || '', 
                subk || ''
            );

            if (success) {
                await fetchData();
                // Reset form setelah simpan
                setNewEntry({ ...newEntry, komponen: '', subkomponen: '', amount: 0 });
                setIsCustomRo(false);
            } else {
                alert("Gagal menyimpan data ke database.");
            }
        } catch (err) {
            alert("Terjadi kesalahan saat menyimpan.");
        } finally {
            setSaving(null);
        }
    };

    const handleEditClick = (c: BudgetCeiling) => {
        setNewEntry({
            dept: c.department,
            ro: c.ro_code,
            komponen: c.komponen_code,
            subkomponen: c.subkomponen_code,
            amount: c.amount
        });
        if (!DEFAULT_RO_CODES.includes(c.ro_code)) {
            setIsCustomRo(true);
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
            .filter(r => r.requester_department === dept && (r.status === 'approved' || r.status === 'reviewed_pic'))
            .reduce((acc, curr) => {
                const matchItems = (curr.calculation_items || []).filter(item => 
                    item.ro_code === ro && 
                    item.komponen_code === komp && 
                    item.subkomponen_code === subk
                );
                return acc + matchItems.reduce((sum, i) => sum + i.jumlah, 0);
            }, 0);
    };

    if (tableMissing) return (
        <div className="flex flex-col items-center justify-center py-40 max-w-2xl mx-auto text-center space-y-8 animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center shadow-xl shadow-red-100">
                <Database size={48} />
            </div>
            <div className="space-y-4">
                <h1 className="text-3xl font-black text-slate-900 uppercase">Database Belum Siap</h1>
                <p className="text-slate-500 font-medium">Pastikan tabel 'budget_ceilings' sudah dibuat di Supabase.</p>
            </div>
            <button onClick={fetchData} className="px-10 py-5 bg-slate-900 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl">Refresh Koneksi</button>
        </div>
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="animate-spin text-blue-600 mb-6 opacity-30" size={64} />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Sinkronisasi Pagu...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 page-transition">
            {/* Header Section */}
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

            {/* Rekapitulasi Global Satu Kantor */}
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

            {/* Input Form */}
            <div ref={formRef} className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm space-y-8 scroll-mt-24">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                        <Plus size={24} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Input / Update Alokasi</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Input data pagu untuk tahun anggaran {year}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Pilih Bidang</label>
                        <select 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase"
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
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:border-blue-600"
                                value={newEntry.ro}
                                onChange={(e) => setNewEntry({...newEntry, ro: e.target.value.toUpperCase()})}
                            />
                        ) : (
                            <select 
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase"
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
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:border-blue-600"
                            value={newEntry.komponen}
                            onChange={(e) => setNewEntry({...newEntry, komponen: e.target.value.toUpperCase()})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Subkomp</label>
                        <input 
                            type="text" placeholder="A"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:border-blue-600"
                            value={newEntry.subkomponen}
                            onChange={(e) => setNewEntry({...newEntry, subkomponen: e.target.value.toUpperCase()})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Nominal (Rp)</label>
                        <input 
                            type="number"
                            className="w-full p-4 bg-slate-900 text-white border border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10"
                            value={newEntry.amount}
                            onChange={(e) => setNewEntry({...newEntry, amount: Number(e.target.value)})}
                        />
                    </div>
                </div>
                <button 
                    onClick={() => handleSave(newEntry.dept, newEntry.ro, newEntry.komponen, newEntry.subkomponen, newEntry.amount)}
                    disabled={!!saving}
                    className="w-full py-5 bg-blue-600 text-white hover:bg-blue-700 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    Simpan & Daftarkan Pagu
                </button>
            </div>

            {/* List Pagu per Bidang */}
            <div className="space-y-16">
                {departmentsToShow.map((deptName, idx) => {
                    const deptCeilings = ceilings.filter(c => c.department === deptName);
                    if (deptCeilings.length === 0) return null;

                    // Hitung Total Pagu per Bidang ini
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
                                            const spent = getUtilization(c.department, c.ro_code, c.komponen_code, c.subkomponen_code);
                                            const sisa = c.amount - spent;
                                            const percent = c.amount > 0 ? (spent / c.amount) * 100 : 0;
                                            const isDeleting = deletingId === c.id;

                                            return (
                                                <tr key={c.id} className={`hover:bg-slate-50/50 transition-all group ${isDeleting ? 'opacity-50' : ''}`}>
                                                    <td className="px-8 py-6">
                                                        <span className="p-2 bg-slate-100 rounded-lg text-slate-900 font-black text-[10px] uppercase tracking-tighter">
                                                            {c.ro_code}.{c.komponen_code}.{c.subkomponen_code}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right font-bold text-slate-900 font-mono text-sm">
                                                        Rp {c.amount.toLocaleString('id-ID')}
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
                                                                    className={`h-full ${percent > 90 ? 'bg-red-500' : 'bg-emerald-500'} transition-all`}
                                                                    style={{ width: `${Math.min(percent, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button onClick={() => handleEditClick(c)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                                                            <button onClick={() => handleDelete(c.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {/* Footer Baris Total per Bidang */}
                                        <tr className="bg-slate-50/50">
                                            <td className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total {deptName}</td>
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
                })}

                {ceilings.length === 0 && (
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
