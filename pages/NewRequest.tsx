
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../App.tsx';
import { analyzeBudgetRequest } from '../services/geminiService.ts';
import { dbService } from '../services/dbService.ts';
import { 
    ArrowLeft, 
    Trash2, 
    Calculator,
    Building2,
    Coins,
    X,
    Loader2,
    Sparkles,
    UploadCloud,
    Send,
    Equal,
    PackageSearch,
    FileText,
    Info,
    Hash,
    Tag,
    ChevronRight,
    PlusCircle,
    Save,
    Settings2,
    Zap,
    Keyboard,
    Target,
    ListChecks
} from 'lucide-react';
import { CalculationItem, BudgetStatus, BudgetRequest, BudgetCeiling } from '../types.ts';

const SKIP_STRUCTURAL_APPROVAL_DEPTS = [
    "PUSDAL LH SUMA",
    "Bagian Tata Usaha",
    "Sub Bagian Program & Anggaran",
    "Sub Bagian Kehumasan",
    "Sub Bagian Kepegawaian",
    "Sub Bagian Keuangan"
];

const NewRequest: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const isEditMode = !!id;
    const currentYear = new Date().getFullYear();
    
    const [ceilings, setCeilings] = useState<BudgetCeiling[]>([]);
    const [allRequests, setAllRequests] = useState<BudgetRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [aiAnalyzing, setAiAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Track which items are in manual mode for Volkeg
    const [manualVolkeg, setManualVolkeg] = useState<Record<string, boolean>>({});

    const [items, setItems] = useState<CalculationItem[]>([
        { 
            id: '1', title: '', detail_barang: '', kro_code: '', ro_code: '', komponen_code: '', subkomponen_code: '',
            kode_akun: '521211', f1_val: 1, f1_unit: 'OR', f2_val: 1, f2_unit: 'HR',
            f3_val: 1, f3_unit: 'KL', f4_val: 1, f4_unit: 'PK', volkeg: 1, 
            satkeg: 'OK', hargaSatuan: 0, jumlah: 0 
        }
    ]);
    
    const [formData, setFormData] = useState({
        title: '', category: 'Konsumsi & Rapat', location: '',
        executionDate: '', executionEndDate: '', executionDuration: '', description: '', totalAmount: 0
    });

    const userDeptCeilings = useMemo(() => {
        if (!user?.department) return [];
        const userDepts = user.department.split(', ').map(d => d.trim().toLowerCase());
        return ceilings.filter(c => userDepts.includes(c.department.trim().toLowerCase()));
    }, [ceilings, user]);

    useEffect(() => {
        const loadInitial = async () => {
            try {
                const [cData, rData] = await Promise.all([
                    dbService.getCeilings(currentYear),
                    dbService.getAllRequests()
                ]);
                setCeilings(cData);
                setAllRequests(rData.filter(r => r.id !== id && r.status !== 'rejected' && r.status !== 'draft'));
            } catch (err) { console.error(err); } finally { setPageLoading(false); }
        };
        loadInitial();

        if (isEditMode) {
            const fetchExisting = async () => {
                const data = await dbService.getRequestById(id!);
                if (data) {
                    setFormData({
                        title: data.title, category: data.category, location: data.location,
                        executionDate: data.execution_date || '',
                        executionEndDate: data.execution_end_date || '',
                        executionDuration: data.execution_duration || '',
                        description: data.description, totalAmount: data.amount
                    });
                    if (data.calculation_items) setItems(data.calculation_items);
                    if (data.ai_analysis) setAiResult(data.ai_analysis);
                }
            };
            fetchExisting();
        }
    }, [id, isEditMode, currentYear]);

    useEffect(() => {
        const total = items.reduce((acc, curr) => acc + (curr.jumlah || 0), 0);
        setFormData(prev => ({ ...prev, totalAmount: total }));
    }, [items]);

    const handleItemChange = (itemId: string, field: keyof CalculationItem, value: any) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.id !== itemId) return item;
            
            const isManual = manualVolkeg[itemId];
            const updatedItem = { ...item, [field]: value };
            
            if (!isManual && ['f1_val', 'f2_val', 'f3_val', 'f4_val'].includes(field)) {
                updatedItem.volkeg = (Number(updatedItem.f1_val) || 1) * 
                                     (Number(updatedItem.f2_val) || 1) * 
                                     (Number(updatedItem.f3_val) || 1) * 
                                     (Number(updatedItem.f4_val) || 1);
            }
            
            updatedItem.jumlah = (Number(updatedItem.volkeg) || 0) * (Number(updatedItem.hargaSatuan) || 0);
            return updatedItem;
        }));
    };

    const toggleManualMode = (itemId: string) => {
        setManualVolkeg(prev => ({ ...prev, [itemId]: !prev[itemId] }));
        if (manualVolkeg[itemId]) {
            setItems(prevItems => prevItems.map(item => {
                if (item.id !== itemId) return item;
                const newVolkeg = (Number(item.f1_val) || 1) * (Number(item.f2_val) || 1) * (Number(item.f3_val) || 1) * (Number(item.f4_val) || 1);
                return { ...item, volkeg: newVolkeg, jumlah: newVolkeg * item.hargaSatuan };
            }));
        }
    };

    const getPaguStatus = (ro: string, komp: string, subk: string) => {
        const ceiling = ceilings.find(c => 
            c.ro_code === ro &&
            c.komponen_code === komp && 
            c.subkomponen_code === subk &&
            (user?.department || '').includes(c.department)
        );
        const initialAmount = ceiling?.amount || 0;
        const spent = allRequests.reduce((acc, req) => {
            const matchItems = (req.calculation_items || []).filter(i => 
                i.ro_code === ro && i.komponen_code === komp && i.subkomponen_code === subk
            );
            return acc + matchItems.reduce((sum, i) => sum + i.jumlah, 0);
        }, 0);
        return { paguAwal: initialAmount, terpakai: spent, sisa: initialAmount - spent };
    };

    const handleSubmit = async (e: React.FormEvent, status: BudgetStatus = 'pending') => {
        e.preventDefault();
        setLoading(true);
        try {
            let attachment_url = '';
            if (selectedFile) {
                const url = await dbService.uploadAttachment(selectedFile);
                if (url) attachment_url = url;
            }
            
            let initialStatus: BudgetStatus = status;
            if (status === 'pending' && SKIP_STRUCTURAL_APPROVAL_DEPTS.includes(user?.department || '')) {
                initialStatus = 'reviewed_bidang'; 
            }

            const payload = {
                requester_id: user?.id || '',
                requester_name: user?.full_name || '',
                requester_department: user?.department || '',
                title: formData.title,
                category: formData.category,
                location: formData.location,
                execution_date: formData.executionDate,
                execution_end_date: formData.executionEndDate || null,
                execution_duration: formData.executionDuration,
                amount: formData.totalAmount,
                description: formData.description,
                calculation_items: items,
                status: initialStatus,
                ai_analysis: aiResult,
                attachment_url: attachment_url || undefined
            };

            if (isEditMode) await dbService.updateRequest(id!, payload);
            else await dbService.createRequest(payload);
            
            navigate('/requests');
        } catch (err: any) { 
            console.error(err);
            alert("Terjadi kesalahan.");
        } finally { setLoading(false); }
    };

    if (pageLoading) return <div className="py-40 text-center"><Loader2 className="animate-spin mx-auto opacity-30" size={64} /></div>;

    return (
        <div className="max-w-[1400px] mx-auto space-y-10 pb-20 page-transition">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white border rounded-2xl shadow-sm hover:bg-slate-50 transition-all"><ArrowLeft size={20} /></button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Usulan Anggaran</h1>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2">TA {currentYear} • {user?.department}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
                <div className="xl:col-span-3 space-y-10">
                    {/* Header Data */}
                    <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm space-y-10">
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg"><FileText size={20} /></div>
                            <h3 className="text-sm font-black uppercase tracking-widest">Detail Utama Kegiatan</h3>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nama Kegiatan</label>
                                <input 
                                    type="text" 
                                    className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl text-lg font-black outline-none focus:bg-white focus:border-blue-600 transition-all uppercase placeholder:text-slate-200 shadow-inner" 
                                    value={formData.title} 
                                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                                    placeholder="INPUT NAMA KEGIATAN LENGKAP..." 
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Biaya</label>
                                    <div className="relative">
                                        <Tag className="absolute left-5 top-5 text-slate-300" size={18} />
                                        <select className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:bg-white focus:border-blue-600 transition-all appearance-none shadow-sm cursor-pointer" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                                            <option>Konsumsi & Rapat</option>
                                            <option>Perjalanan Dinas</option>
                                            <option>Honorarium</option>
                                            <option>Peralatan Kantor</option>
                                            <option>Pemeliharaan</option>
                                            <option>Sewa</option>
                                            <option>Lain-lain</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tempat Pelaksanaan</label>
                                    <input type="text" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase shadow-sm" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="CTH: MAKASSAR" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estimasi Durasi</label>
                                    <input type="text" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase shadow-sm" value={formData.executionDuration} onChange={(e) => setFormData({...formData, executionDuration: e.target.value})} placeholder="CTH: 3 HARI" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Mulai</label>
                                    <input type="date" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold" value={formData.executionDate} onChange={(e) => setFormData({...formData, executionDate: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Selesai</label>
                                    <input type="date" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold" value={formData.executionEndDate} onChange={(e) => setFormData({...formData, executionEndDate: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rincian Komponen Biaya */}
                    <div className="space-y-8">
                        <div className="flex justify-between items-center px-4">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <Coins className="text-amber-500" /> Daftar Rincian Biaya
                            </h3>
                            <button 
                                type="button" 
                                onClick={() => {
                                    const newId = Date.now().toString();
                                    setItems([...items, { id: newId, title: '', detail_barang: '', kro_code: '', ro_code: '', komponen_code: '', subkomponen_code: '', kode_akun: '521211', f1_val: 1, f1_unit: 'OR', f2_val: 1, f2_unit: 'HR', f3_val: 1, f3_unit: 'KL', f4_val: 1, f4_unit: 'PK', volkeg: 1, satkeg: 'OK', hargaSatuan: 0, jumlah: 0 }]);
                                }} 
                                className="px-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center gap-3"
                            >
                                <PlusCircle size={18} className="text-emerald-400" /> Tambah Item
                            </button>
                        </div>

                        {items.map((item, idx) => {
                            const paguInfo = getPaguStatus(item.ro_code, item.komponen_code, item.subkomponen_code);
                            const isOver = item.jumlah > paguInfo.sisa && item.ro_code !== '';
                            const isManual = manualVolkeg[item.id] || false;
                            
                            return (
                                <div key={item.id} className={`bg-white rounded-[40px] border-2 transition-all shadow-sm overflow-hidden ${isOver ? 'border-red-500 ring-4 ring-red-50' : 'border-slate-100'}`}>
                                    {/* Sub-Header Pagu */}
                                    <div className="bg-slate-50 p-6 flex flex-wrap items-center gap-6 border-b border-slate-100">
                                        <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-[10px]">{idx + 1}</div>
                                        <div className="flex-1 min-w-[300px]">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1">Alokasi Pagu Anggaran</p>
                                            <select 
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black uppercase outline-none focus:border-blue-500 transition-all"
                                                value={userDeptCeilings.find(c => c.ro_code === item.ro_code && c.komponen_code === item.komponen_code && c.subkomponen_code === item.subkomponen_code)?.id || ''}
                                                onChange={(e) => {
                                                    const sel = userDeptCeilings.find(c => c.id === e.target.value);
                                                    if (sel) {
                                                        handleItemChange(item.id, 'ro_code', sel.ro_code);
                                                        handleItemChange(item.id, 'komponen_code', sel.komponen_code);
                                                        handleItemChange(item.id, 'subkomponen_code', sel.subkomponen_code);
                                                    }
                                                }}
                                            >
                                                <option value="">-- PILIH KODE PAGU BIDANG --</option>
                                                {userDeptCeilings.map(c => <option key={c.id} value={c.id}>{c.ro_code}.{c.komponen_code}.{c.subkomponen_code}</option>)}
                                            </select>
                                            {item.ro_code && (
                                                <p className={`text-[9px] font-black mt-2 flex items-center gap-2 ${paguInfo.sisa < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    <Info size={12} /> Sisa Pagu: Rp {paguInfo.sisa.toLocaleString('id-ID')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="w-32">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1">Kode Akun</p>
                                            <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black text-center" value={item.kode_akun} onChange={(e) => handleItemChange(item.id, 'kode_akun', e.target.value)} />
                                        </div>
                                        <button type="button" onClick={() => setItems(items.filter(i => i.id !== item.id))} className="p-3 text-slate-300 hover:text-red-600 transition-all"><Trash2 size={24} /></button>
                                    </div>

                                    {/* Area Kalkulasi & Uraian */}
                                    <div className="p-8 md:p-10 space-y-10">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 border-b border-slate-50 pb-10">
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Uraian Biaya/Barang</label>
                                                    <input type="text" className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:bg-white focus:border-blue-600 transition-all shadow-inner" value={item.title} onChange={(e) => handleItemChange(item.id, 'title', e.target.value)} placeholder="CTH: KONSUMSI NASI KOTAK PESERTA" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><PackageSearch size={14} /> Spesifikasi Teknis</label>
                                                    <input type="text" className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold uppercase placeholder:text-slate-300 outline-none shadow-inner" value={item.detail_barang || ''} onChange={(e) => handleItemChange(item.id, 'detail_barang', e.target.value)} placeholder="CTH: 3 JENIS KUE, AIR MINERAL 330ML" />
                                                </div>
                                            </div>

                                            <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 relative">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <Calculator size={16} className="text-blue-600" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">1. Faktor Volume</span>
                                                    </div>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => toggleManualMode(item.id)}
                                                        className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${isManual ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}
                                                    >
                                                        {isManual ? <Keyboard size={12} /> : <Zap size={12} />}
                                                        {isManual ? 'Input Manual Aktif' : 'Gunakan Rumus'}
                                                    </button>
                                                </div>
                                                
                                                {/* Visualisasi Faktor Terpisah */}
                                                <div className="flex flex-wrap items-center gap-3">
                                                    {[1,2,3,4].map(n => (
                                                        <React.Fragment key={n}>
                                                            <div className={`flex-1 min-w-[120px] bg-white p-3 rounded-2xl shadow-sm border border-slate-100 space-y-2 transition-all ${isManual ? 'opacity-30' : ''}`}>
                                                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest text-center">Faktor {n}</p>
                                                                <div className="flex items-center">
                                                                    <input 
                                                                        type="number" 
                                                                        disabled={isManual}
                                                                        className="w-full text-center text-xs font-black outline-none bg-transparent" 
                                                                        value={item[`f${n}_val` as keyof CalculationItem] as number} 
                                                                        onChange={(e) => handleItemChange(item.id, `f${n}_val` as keyof CalculationItem, e.target.value)} 
                                                                    />
                                                                    <input 
                                                                        type="text" 
                                                                        disabled={isManual}
                                                                        className="w-10 text-[7px] font-black text-blue-500 text-center outline-none uppercase bg-blue-50 rounded px-1 py-0.5" 
                                                                        value={item[`f${n}_unit` as keyof CalculationItem] as string} 
                                                                        onChange={(e) => handleItemChange(item.id, `f${n}_unit` as keyof CalculationItem, e.target.value)} 
                                                                    />
                                                                </div>
                                                            </div>
                                                            {n < 4 && <div className={`text-slate-200 font-black text-xs ${isManual ? 'opacity-0' : ''}`}>×</div>}
                                                        </React.Fragment>
                                                    ))}
                                                </div>

                                                {/* LIVE FORMULA PREVIEW */}
                                                {!isManual && (
                                                    <div className="mt-4 p-3 bg-blue-600/10 border border-blue-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                                                        <ListChecks size={16} className="text-blue-600" />
                                                        <p className="text-[9px] font-black text-blue-900 uppercase tracking-wider">
                                                            Review Perhitungan: {item.f1_val} {item.f1_unit} 
                                                            {item.f2_val > 1 && ` x ${item.f2_val} ${item.f2_unit}`}
                                                            {item.f3_val > 1 && ` x ${item.f3_val} ${item.f3_unit}`}
                                                            {item.f4_val > 1 && ` x ${item.f4_val} ${item.f4_unit}`}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Row 2: Volkeg, Harga Satuan, Subtotal */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end px-2">
                                            <div className="md:col-span-3 space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                    <Target size={14} className="text-emerald-500" /> Total Volkeg
                                                </label>
                                                <div className="flex bg-slate-900 text-white rounded-3xl overflow-hidden shadow-xl ring-4 ring-slate-100">
                                                    <input 
                                                        type="number" 
                                                        readOnly={!isManual}
                                                        className={`w-full py-6 text-center text-lg font-black outline-none bg-transparent ${isManual ? 'cursor-text text-amber-400' : 'cursor-default opacity-90'}`}
                                                        value={item.volkeg} 
                                                        onChange={(e) => handleItemChange(item.id, 'volkeg', e.target.value)} 
                                                    />
                                                    <input 
                                                        type="text" 
                                                        className="w-20 py-6 bg-slate-800 text-[11px] font-black text-emerald-400 text-center uppercase outline-none border-l border-white/5" 
                                                        value={item.satkeg} 
                                                        onChange={(e) => handleItemChange(item.id, 'satkeg', e.target.value)} 
                                                        placeholder="SAT"
                                                    />
                                                </div>
                                            </div>

                                            <div className="md:col-span-4 space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                    <Coins size={14} className="text-amber-500" /> Harga Satuan (Rp)
                                                </label>
                                                <div className="relative group">
                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-black text-slate-300 group-focus-within:text-blue-500 transition-colors">Rp</span>
                                                    <input 
                                                        type="number" 
                                                        className="w-full pl-16 pr-6 py-6 bg-white border-2 border-slate-100 rounded-3xl text-xl font-black outline-none focus:border-blue-600 transition-all shadow-lg shadow-slate-100/50" 
                                                        value={item.hargaSatuan} 
                                                        onChange={(e) => handleItemChange(item.id, 'hargaSatuan', e.target.value)} 
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>

                                            <div className="md:col-span-5 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[40px] text-right border border-white/5 shadow-2xl relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full -mr-12 -mt-12"></div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 relative z-10">Subtotal Item Terkalkulasi</p>
                                                <p className="text-3xl font-black font-mono text-emerald-400 tracking-tighter relative z-10">
                                                    <span className="text-xs text-emerald-600 mr-2">IDR</span>
                                                    {item.jumlah.toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Catatan & File */}
                    <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><FileText size={16} /> Justifikasi Kebutuhan</h3>
                            <textarea rows={6} className="w-full p-8 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-xs uppercase focus:bg-white focus:border-blue-600 transition-all outline-none shadow-inner" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Sebutkan urgensi pengajuan ini secara detail..." />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><UploadCloud size={16} /> Dokumen Pendukung</h3>
                            <div className="relative h-full min-h-[160px] border-4 border-dashed border-slate-100 rounded-3xl bg-slate-50 flex flex-col items-center justify-center p-8 text-center hover:bg-white hover:border-blue-300 transition-all cursor-pointer group">
                                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" id="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                                <UploadCloud size={40} className="text-slate-200 group-hover:text-blue-600 transition-colors mb-4" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedFile ? selectedFile.name : 'Pilih File KAK / RAB (PDF/JPG)'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-6 pt-6">
                        <button type="button" onClick={(e) => handleSubmit(e, 'draft')} disabled={loading} className="px-10 py-5 bg-white border-2 border-slate-200 text-slate-500 hover:bg-slate-50 rounded-3xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all"><Save size={18} /> Simpan Draf</button>
                        <button type="button" onClick={(e) => handleSubmit(e, 'pending')} disabled={loading} className="px-16 py-5 bg-slate-900 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-slate-800 shadow-2xl transition-all active:scale-95 disabled:opacity-50">
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />} 
                            Kirim Pengajuan
                        </button>
                    </div>
                </div>

                <div className="xl:col-span-1">
                    <div className="bg-slate-900 p-10 rounded-[48px] shadow-2xl text-white sticky top-24 space-y-10 border border-white/5 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-emerald-500"></div>
                        <div className="space-y-6">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Kumulatif</p>
                                <p className="text-3xl font-black font-mono tracking-tighter text-white">Rp {formData.totalAmount.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="h-px bg-white/10"></div>
                            <div className="space-y-4">
                                <div className="flex justify-between text-[9px] font-black uppercase text-slate-400"><span>Jumlah Item</span><span className="text-white">{items.length} Baris</span></div>
                                <div className="flex justify-between text-[9px] font-black uppercase text-slate-400"><span>Estimasi</span><span className="text-amber-400">PENDING</span></div>
                            </div>
                        </div>
                        <button type="button" onClick={() => aiAnalyzing ? null : analyzeBudgetRequest(formData.title, formData.totalAmount, formData.description).then(setAiResult)} className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3"><Sparkles size={16} className="text-emerald-400" /> Analisis Validitas AI</button>
                        {aiResult && <div className="p-5 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl"><p className="text-[9px] font-bold text-emerald-400 leading-relaxed italic">"{aiResult}"</p></div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewRequest;
