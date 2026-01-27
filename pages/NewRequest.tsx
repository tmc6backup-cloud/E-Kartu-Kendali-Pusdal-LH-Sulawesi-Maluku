
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../App';
import { analyzeBudgetRequest } from '../services/geminiService';
import { dbService } from '../services/dbService';
import { 
    ArrowLeft, 
    Trash2, 
    Calculator,
    AlertCircle,
    Building2,
    Coins,
    X,
    Loader2,
    Sparkles,
    FileCheck,
    UploadCloud,
    Calendar,
    Send,
    DollarSign,
    Equal,
    PackageSearch,
    Save,
    FileText,
    CheckCircle2
} from 'lucide-react';
import { CalculationItem, BudgetStatus, BudgetRequest, BudgetCeiling } from '../types';

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
            const updatedItem = { ...item, [field]: value };
            if (['f1_val', 'f2_val', 'f3_val', 'f4_val'].includes(field)) {
                updatedItem.volkeg = (Number(updatedItem.f1_val) || 1) * 
                                     (Number(updatedItem.f2_val) || 1) * 
                                     (Number(updatedItem.f3_val) || 1) * 
                                     (Number(updatedItem.f4_val) || 1);
            }
            updatedItem.jumlah = (Number(updatedItem.volkeg) || 0) * (Number(updatedItem.hargaSatuan) || 0);
            return updatedItem;
        }));
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
        if (status === 'pending') {
            if (!formData.title || !formData.description) {
                alert("Judul dan Deskripsi wajib diisi untuk pengiriman.");
                return;
            }
        }

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
            alert("Terjadi kesalahan: " + (err.message || "Gagal menyimpan ke database. Pastikan struktur tabel sudah sesuai."));
        } finally { 
            setLoading(false); 
        }
    };

    if (pageLoading) return <div className="py-40 text-center"><Loader2 className="animate-spin mx-auto opacity-30" size={64} /></div>;

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-20 page-transition">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white border rounded-2xl shadow-sm hover:bg-slate-50 transition-all"><ArrowLeft size={20} /></button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{isEditMode ? 'Koreksi Berkas' : 'Usulan Anggaran'}</h1>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">TA {currentYear}</p>
                    </div>
                </div>
                <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl shadow-lg flex items-center gap-3">
                    <Building2 size={16} className="text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{user?.department}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-3">
                    <form onSubmit={(e) => handleSubmit(e, 'pending')} className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm space-y-12">
                        {/* Judul */}
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Judul Kegiatan</label>
                            <input type="text" required className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-[32px] text-xl font-black outline-none focus:bg-white focus:border-blue-600 transition-all shadow-inner uppercase" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Input judul kegiatan..." />
                        </div>

                        {/* Info Pelaksanaan */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-8 bg-slate-50 rounded-[40px] space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Kategori</label>
                                        <select className="w-full p-4 bg-white border rounded-2xl text-xs font-black uppercase" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                                            <option>Konsumsi & Rapat</option>
                                            <option>Perjalanan Dinas</option>
                                            <option>Honorarium</option>
                                            <option>Peralatan Kantor</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Lokasi</label>
                                        <input type="text" required className="w-full p-4 bg-white border rounded-2xl text-xs font-black uppercase" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 bg-blue-50 border border-blue-100 rounded-[40px] space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tgl Mulai</label>
                                        <input type="date" required className="w-full p-4 bg-white border rounded-2xl text-xs font-black" value={formData.executionDate} onChange={(e) => setFormData({...formData, executionDate: e.target.value})} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tgl Selesai</label>
                                        <input type="date" className="w-full p-4 bg-white border rounded-2xl text-xs font-black" value={formData.executionEndDate} onChange={(e) => setFormData({...formData, executionEndDate: e.target.value})} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lama Kegiatan (Cth: 3 Hari)</label>
                                    <input type="text" required className="w-full p-4 bg-white border rounded-2xl text-xs font-black uppercase" value={formData.executionDuration} onChange={(e) => setFormData({...formData, executionDuration: e.target.value})} placeholder="Input durasi..." />
                                </div>
                            </div>
                        </div>

                        {/* Rincian Anggaran */}
                        <div className="space-y-10">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><Coins className="text-blue-600" /> Rincian Anggaran</h3>
                                <button type="button" onClick={() => setItems([...items, { id: Date.now().toString(), title: '', detail_barang: '', kro_code: '', ro_code: '', komponen_code: '', subkomponen_code: '', kode_akun: '521211', f1_val: 1, f1_unit: 'OR', f2_val: 1, f2_unit: 'HR', f3_val: 1, f3_unit: 'KL', f4_val: 1, f4_unit: 'PK', volkeg: 1, satkeg: 'OK', hargaSatuan: 0, jumlah: 0 }])} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">+ Tambah Komponen</button>
                            </div>
                            <div className="space-y-16">
                                {items.map((item) => (
                                    <div key={item.id} className="p-8 rounded-[48px] border-2 bg-white border-slate-100 shadow-xl space-y-10 relative group overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 opacity-40"></div>
                                        <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                                            <div className="flex-1 space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Alokasi Pagu</label>
                                                    <select className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-black uppercase" value={userDeptCeilings.find(c => c.ro_code === item.ro_code && c.komponen_code === item.komponen_code && c.subkomponen_code === item.subkomponen_code)?.id || ''} onChange={(e) => {
                                                        const selected = userDeptCeilings.find(c => c.id === e.target.value);
                                                        if (selected) {
                                                            handleItemChange(item.id, 'ro_code', selected.ro_code);
                                                            handleItemChange(item.id, 'komponen_code', selected.komponen_code);
                                                            handleItemChange(item.id, 'subkomponen_code', selected.subkomponen_code);
                                                        }
                                                    }}>
                                                        <option value="">-- PILIH ALOKASI PAGU --</option>
                                                        {userDeptCeilings.map(c => <option key={c.id} value={c.id}>{c.ro_code}.{c.komponen_code}.{c.subkomponen_code} (Sisa: Rp {getPaguStatus(c.ro_code, c.komponen_code, c.subkomponen_code).sisa.toLocaleString('id-ID')})</option>)}
                                                    </select>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase">Akun</label><input type="text" className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-black" value={item.kode_akun} onChange={(e) => handleItemChange(item.id, 'kode_akun', e.target.value)} /></div>
                                                    <div className="space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase">Uraian Detail</label><input type="text" className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-black uppercase" value={item.title} onChange={(e) => handleItemChange(item.id, 'title', e.target.value)} /></div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                                                        <PackageSearch size={14} className="text-blue-500" /> Spesifikasi / Jenis Barang (Opsional)
                                                    </label>
                                                    <input type="text" className="w-full p-4 bg-blue-50/30 border border-blue-100 rounded-2xl text-xs font-bold uppercase placeholder:text-slate-300 outline-none focus:bg-white focus:border-blue-500 transition-all" value={item.detail_barang || ''} onChange={(e) => handleItemChange(item.id, 'detail_barang', e.target.value)} placeholder="Contoh: Kertas A4 80gr, Laptop Core i7, dll" />
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-600 transition-colors p-2 self-start"><Trash2 size={24} /></button>
                                        </div>

                                        <div className="pt-10 border-t border-slate-50 space-y-8 relative z-10">
                                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-end">
                                                <div className="xl:col-span-8 space-y-4">
                                                    <div className="flex items-center gap-3 ml-1 mb-2">
                                                        <Calculator size={14} className="text-blue-600" />
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kalkulasi Volume (F1 × F2 × F3 × F4)</label>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-900/5 rounded-[32px] border border-slate-100 backdrop-blur-sm">
                                                        {[1,2,3,4].map(num => (
                                                            <React.Fragment key={num}>
                                                                <div className="flex-1 min-w-[110px] flex items-center gap-2 p-3 bg-white rounded-[24px] border border-slate-100 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-100">
                                                                    <input type="number" className="w-full bg-transparent font-black text-sm text-center outline-none" value={item[`f${num}_val` as keyof CalculationItem] as number} onChange={(e) => handleItemChange(item.id, `f${num}_val` as keyof CalculationItem, e.target.value)} /> 
                                                                    <input type="text" className="w-10 bg-slate-50 text-[8px] font-black text-slate-400 text-center uppercase py-1 rounded-lg border-none" value={item[`f${num}_unit` as keyof CalculationItem] as string} onChange={(e) => handleItemChange(item.id, `f${num}_unit` as keyof CalculationItem, e.target.value)} placeholder="SAT" />
                                                                </div>
                                                                {num < 4 && <X size={14} className="text-slate-300 shrink-0" />}
                                                            </React.Fragment>
                                                        ))}
                                                        <div className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-[24px] shadow-xl border border-slate-700 min-w-[140px]">
                                                            <Equal size={14} className="text-emerald-400 shrink-0" />
                                                            <div className="flex flex-col">
                                                                <p className="text-[7px] font-black text-slate-500 uppercase mb-0.5">Total Volume</p>
                                                                <div className="flex items-baseline gap-1">
                                                                    <input type="number" className="w-12 bg-transparent text-sm font-black outline-none border-b border-white/20 text-center focus:border-emerald-400 transition-colors" value={item.volkeg} onChange={(e) => handleItemChange(item.id, 'volkeg', e.target.value)} />
                                                                    <input type="text" className="w-10 bg-transparent text-[9px] font-black uppercase outline-none border-b border-white/20 text-emerald-400 focus:border-white transition-colors" value={item.satkeg} onChange={(e) => handleItemChange(item.id, 'satkeg', e.target.value)} placeholder="UNIT" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="xl:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Harga Satuan</label>
                                                        <div className="relative">
                                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">Rp</div>
                                                            <input type="number" className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-3xl font-black text-sm outline-none focus:border-emerald-500 transition-all shadow-sm" value={item.hargaSatuan} onChange={(e) => handleItemChange(item.id, 'hargaSatuan', e.target.value)} placeholder="0" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Total Item</label>
                                                        <div className="w-full p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl shadow-xl border border-slate-700 text-right hover:scale-[1.02] transition-transform">
                                                            <p className="text-[8px] font-black text-slate-500 uppercase leading-none mb-1">Subtotal Item</p>
                                                            <p className="text-xl font-black font-mono tracking-tight text-emerald-400">Rp {item.jumlah.toLocaleString('id-ID')}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Deskripsi & Lampiran */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t">
                            <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Justifikasi Kebutuhan</label><textarea rows={5} required className="w-full p-6 bg-slate-50 border rounded-[32px] font-bold text-sm" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Sebutkan urgensi pengajuan ini..." /></div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Lampiran Bukti Dukung</label>
                                <div className={`relative h-full min-h-[200px] border-4 border-dashed rounded-[32px] flex flex-col items-center justify-center p-8 text-center bg-slate-50 border-slate-100 hover:border-blue-300 transition-all`}>
                                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" id="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                                    <UploadCloud size={32} className="text-slate-300 mb-4" />
                                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{selectedFile ? selectedFile.name : 'Tarik File KAK/RAB ke Sini'}</p>
                                </div>
                            </div>
                        </div>

                        {/* TOMBOL AKSI BARU */}
                        <div className="flex flex-col sm:flex-row justify-end gap-6 pt-10 border-t border-slate-100">
                            <button 
                                type="button" 
                                onClick={(e) => handleSubmit(e, 'draft')}
                                disabled={loading}
                                className="px-12 py-5 bg-white border-2 border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 rounded-[28px] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <FileText size={22} className="text-slate-400" />} 
                                Simpan ke Draf
                            </button>
                            <button 
                                type="button" 
                                onClick={(e) => handleSubmit(e, 'pending')}
                                disabled={loading}
                                className="px-20 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[28px] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:from-blue-700 hover:to-indigo-800 shadow-2xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={22} className="text-white/80" />} 
                                Kirim Pengajuan Sekarang
                            </button>
                        </div>
                    </form>
                </div>

                <div className="xl:col-span-1">
                    <div className="bg-slate-900 p-10 rounded-[48px] shadow-2xl text-white sticky top-24 space-y-10 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500"></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Total Usulan</p>
                            <p className="text-4xl font-black font-mono">Rp {formData.totalAmount.toLocaleString('id-ID')}</p>
                        </div>
                        <button type="button" onClick={() => aiAnalyzing ? null : analyzeBudgetRequest(formData.title, formData.totalAmount, formData.description).then(setAiResult)} className="w-full py-5 bg-emerald-600 rounded-3xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-emerald-500">
                            <Sparkles size={16} /> Validasi AI
                        </button>
                        {aiResult && <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] italic leading-relaxed">{aiResult}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewRequest;
