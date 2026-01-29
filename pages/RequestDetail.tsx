
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Printer,
    Loader2,
    Stamp,
    GanttChart,
    FileSearch,
    Coins,
    UserCheck,
    User,
    Eye,
    ShieldCheck as ShieldIcon,
    AlertTriangle,
    CheckCircle,
    XCircle,
    MessageSquareQuote,
    Check,
    MessageCircle,
    Edit3,
    RotateCcw
} from 'lucide-react';
import { AuthContext, isValidatorRole } from '../App.tsx';
import { dbService } from '../services/dbService.ts';
import { BudgetRequest, BudgetStatus } from '../types.ts';
import Logo from '../components/Logo.tsx';

const SKIP_STRUCTURAL_APPROVAL_DEPTS = [
    "PUSDAL LH SUMA",
    "Bagian Tata Usaha",
    "Sub Bagian Program & Anggaran",
    "Sub Bagian Kehumasan",
    "Sub Bagian Kepegawaian",
    "Sub Bagian Keuangan"
];

const RequestDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    
    const [request, setRequest] = useState<BudgetRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [validatorNote, setValidatorNote] = useState("");
    const [accessDenied, setAccessDenied] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchRequest = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await dbService.getRequestById(id);
            if (data) {
                if (user?.role === 'kepala_bidang' || user?.role?.startsWith('pic_wilayah_')) {
                    const myDepts = user.department?.split(', ').map(d => d.trim().toLowerCase()) || [];
                    if (!myDepts.includes(data.requester_department?.toLowerCase() || '')) {
                        setAccessDenied(true);
                        setLoading(false);
                        return;
                    }
                }
                setRequest(data);
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchRequest(); }, [id]);

    const isStructuralSkipped = useMemo(() => {
        if (!request) return false;
        const dept = request.requester_department || '';
        return SKIP_STRUCTURAL_APPROVAL_DEPTS.includes(dept);
    }, [request]);

    const handleAction = async (status: BudgetStatus, isReject: boolean = false) => {
        if (!id || !user) return;
        if (isReject && !validatorNote.trim()) {
            alert("Harap berikan alasan penolakan/revisi agar pengaju dapat memperbaikinya.");
            return;
        }

        setActionLoading(true);
        try {
            let noteField = 'pic_note';
            if (user.role === 'validator_program') noteField = 'program_note';
            else if (user.role === 'validator_tu') noteField = 'tu_note';
            else if (user.role === 'validator_ppk') noteField = 'ppk_note';

            const success = await dbService.updateStatus(
                id, 
                status, 
                validatorNote.trim() ? { field: noteField, value: validatorNote } : undefined
            );
            
            if (success) {
                alert(isReject ? "Berkas telah dikembalikan untuk revisi." : "Verifikasi berhasil.");
                setValidatorNote("");
                fetchRequest();
            }
        } catch (err) {
            alert("Terjadi kesalahan saat memproses data.");
        } finally {
            setActionLoading(false);
        }
    };

    const actionConfig = useMemo(() => {
        if (!user || !request) return null;
        
        const role = user.role;
        const status = request.status;
        const myDepts = user.department?.split(', ').map(d => d.trim().toLowerCase()) || [];
        const isMyDept = myDepts.includes(request.requester_department?.toLowerCase() || '');

        if (role === 'kepala_bidang' && status === 'pending' && isMyDept) {
            return { title: 'Verifikasi Struktural', subtitle: 'Kepala Bidang / Unit Kerja', targetStatus: 'reviewed_bidang' as BudgetStatus, icon: <UserCheck size={24} />, color: 'emerald' };
        }
        if (role === 'validator_program' && status === 'reviewed_bidang') {
            return { title: 'Validasi Anggaran', subtitle: 'Bagian Program & Anggaran', targetStatus: 'reviewed_program' as BudgetStatus, icon: <GanttChart size={24} />, color: 'blue' };
        }
        if (role === 'validator_tu' && status === 'reviewed_program') {
            return { title: 'Validasi Tata Usaha', subtitle: 'Kasubag Tata Usaha', targetStatus: 'reviewed_tu' as BudgetStatus, icon: <FileSearch size={24} />, color: 'indigo' };
        }
        if (role === 'validator_ppk' && status === 'reviewed_tu') {
            return { title: 'Pengesahan Dokumen', subtitle: 'Pejabat Pembuat Komitmen (PPK)', targetStatus: 'approved' as BudgetStatus, icon: <Stamp size={24} />, color: 'purple' };
        }
        const isPic = role === 'pic_verifikator' || role === 'pic_tu' || role?.startsWith('pic_wilayah_');
        if (isPic && status === 'approved' && (role === 'pic_verifikator' || role === 'pic_tu' || isMyDept)) {
            return { title: 'Verifikasi SPJ', subtitle: 'PIC Verifikator Kelengkapan Berkas', targetStatus: 'reviewed_pic' as BudgetStatus, icon: <ShieldIcon size={24} />, color: 'cyan' };
        }
        if (role === 'bendahara' && status === 'reviewed_pic') {
            return { title: 'Penyelesaian Pembayaran', subtitle: 'Bendahara Pengeluaran', targetStatus: 'approved' as BudgetStatus, icon: <Coins size={24} />, color: 'emerald', buttonLabel: 'Konfirmasi Pembayaran Selesai' };
        }
        return null;
    }, [user, request]);

    const detailedSteps = useMemo(() => [
        { s: 'pending', l: 'Validasi Struktural', role: 'Kepala Bidang', icon: <UserCheck size={14} /> },
        { s: 'reviewed_bidang', l: 'Validasi Program', role: 'Bagian Program', icon: <GanttChart size={14} /> },
        { s: 'reviewed_program', l: 'Validasi TU', role: 'Kasubag TU', icon: <FileSearch size={14} /> },
        { s: 'reviewed_tu', l: 'Persetujuan PPK', role: 'Pejabat PPK', icon: <Stamp size={14} /> },
        { s: 'approved', l: 'Verifikasi SPJ', role: 'PIC Verifikator', icon: <ShieldIcon size={14} /> },
        { s: 'reviewed_pic', l: 'Proses Bayar', role: 'Bendahara', icon: <Coins size={14} /> },
        { s: 'realized', l: 'Selesai', role: 'Sistem', icon: <CheckCircle size={14} /> }
    ], []);

    if (loading && !request) return <div className="flex items-center justify-center py-40"><Loader2 className="animate-spin text-blue-600" size={64} /></div>;
    
    if (accessDenied) {
        return (
            <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-inner"><AlertTriangle size={40} /></div>
                <div className="space-y-2">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Akses Dibatasi</h2>
                    <p className="text-sm font-medium text-slate-500 max-w-md">Otoritas tidak sesuai untuk memproses berkas ini.</p>
                </div>
                <button onClick={() => navigate('/requests')} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3"><ArrowLeft size={16} /> Kembali</button>
            </div>
        );
    }

    if (!request) return <div className="text-center py-40 font-bold uppercase text-slate-400">Berkas tidak ditemukan.</div>;

    const isStepCompleted = (stepStatus: string) => {
        const statusOrder = ['pending', 'reviewed_bidang', 'reviewed_program', 'reviewed_tu', 'approved', 'reviewed_pic', 'realized'];
        return statusOrder.indexOf(request.status) >= statusOrder.indexOf(stepStatus);
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-20 page-transition print:space-y-0 print:pb-0 print:m-0 print:bg-white print:text-black">
            
            {/* Kop Surat Resmi KLH - Ukuran Logo Diperkecil (w-24) */}
            <div className="print-only mb-6 border-b-[2pt] border-black pb-3 break-inside-avoid">
                <div className="flex items-center">
                    <Logo className="w-24 h-24 object-contain mr-6" />
                    <div className="flex-1 text-center pr-10">
                        <h2 className="text-[12pt] font-bold uppercase leading-tight">Kementerian Lingkungan Hidup /</h2>
                        <h3 className="text-[12pt] font-bold uppercase leading-tight mt-0.5">Badan Pengendalian Lingkungan Hidup RI</h3>
                        <h3 className="text-[13pt] font-black uppercase leading-tight mt-0.5">Pusat Pengendalian Pembangunan Kehutanan dan Lingkungan Hidup Sulawesi Maluku</h3>
                        <p className="text-[8pt] mt-2 leading-tight italic font-medium">Jln. Perintis Kemerdekaan KM. 17, Makassar. Email: sekretariat@pusdalsuma.go.id</p>
                    </div>
                </div>
            </div>

            <div className="print-only text-center mb-6 break-inside-avoid">
                <h2 className="text-[12pt] font-black underline uppercase tracking-tight">KARTU KENDALI PENGAJUAN ANGGARAN</h2>
                <p className="text-[9pt] font-bold mt-1 uppercase">NO. KENDALI: {request.id.substring(0, 8).toUpperCase()} / PUSDAL-SUMA / {new Date().getFullYear()}</p>
            </div>

            <div className="flex items-center justify-between no-print">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white border rounded-2xl shadow-sm hover:bg-slate-50 transition-all"><ArrowLeft size={20} /></button>
                    <div><h1 className="text-2xl font-black uppercase tracking-tight">Rincian Berkas</h1></div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => window.print()} className="px-6 py-3 bg-slate-900 text-white border rounded-2xl shadow-sm hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-3"><Printer size={18} /> Cetak Kendali</button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 print:block">
                <div className="xl:col-span-3 space-y-8 print:w-full print:space-y-4 print:mt-0">
                    
                    {/* PANEL AKSI UNTUK VERIFIKATOR (NO PRINT) */}
                    {actionConfig && (
                        <div className={`no-print bg-white p-8 md:p-10 rounded-[48px] border-4 border-${actionConfig.color}-100 shadow-2xl space-y-8 animate-in slide-in-from-top-4 duration-500`}>
                            <div className={`flex items-center gap-4 border-b border-${actionConfig.color}-50 pb-6`}>
                                <div className={`w-12 h-12 bg-${actionConfig.color}-600 text-white rounded-2xl flex items-center justify-center shadow-lg`}>{actionConfig.icon}</div>
                                <div><h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{actionConfig.title}</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{actionConfig.subtitle}</p></div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><MessageSquareQuote size={14} className="text-blue-500" /> Masukkan Catatan / Disposisi</label>
                                <textarea className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-bold uppercase focus:bg-white focus:border-blue-500 outline-none transition-all shadow-inner" rows={3} placeholder="Sebutkan arahan atau alasan revisi..." value={validatorNote} onChange={(e) => setValidatorNote(e.target.value)} />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={() => handleAction('rejected', true)} disabled={actionLoading} className="flex-1 py-5 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all"><XCircle size={18} /> Kembalikan / Revisi</button>
                                <button onClick={() => handleAction(actionConfig.targetStatus)} disabled={actionLoading} className={`flex-[2] py-5 bg-${actionConfig.color}-600 text-white hover:bg-${actionConfig.color}-700 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-xl transition-all`}>
                                    {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />} {actionConfig.buttonLabel || 'Setujui & Teruskan'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-10 rounded-[56px] border border-slate-200 shadow-sm print:p-0 print:border-none print:shadow-none break-inside-avoid">
                        <div className="space-y-6 print:space-y-3">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight print:text-[11pt] print:font-black leading-snug">{request.title}</h2>
                            <div className="w-full h-px bg-slate-100 print:bg-black print:h-[1.2pt]"></div>
                            <div className="grid grid-cols-2 gap-x-12 print:gap-x-10">
                                <div className="space-y-2 print:space-y-1.5">
                                    <div className="flex items-baseline gap-2 text-[6.5pt] uppercase print:text-[8pt]"><span className="w-24 font-bold text-slate-400 print:text-black">Kategori</span><span className="font-black">: {request.category}</span></div>
                                    <div className="flex items-baseline gap-2 text-[6.5pt] uppercase print:text-[8pt]"><span className="w-24 font-bold text-slate-400 print:text-black">Unit Kerja</span><span className="font-black">: {request.requester_department}</span></div>
                                    <div className="flex items-baseline gap-2 text-[6.5pt] uppercase print:text-[8pt]"><span className="w-24 font-bold text-slate-400 print:text-black">Lokasi</span><span className="font-black">: {request.location}</span></div>
                                </div>
                                <div className="space-y-2 print:space-y-1.5">
                                    <div className="flex items-baseline gap-2 text-[6.5pt] uppercase print:text-[8pt]"><span className="w-24 font-bold text-slate-400 print:text-black">Tanggal</span><span className="font-black">: {new Date(request.execution_date).toLocaleDateString('id-ID')}</span></div>
                                    <div className="flex items-baseline gap-2 text-[6.5pt] uppercase print:text-[8pt]"><span className="w-24 font-bold text-slate-400 print:text-black">Durasi</span><span className="font-black">: {request.execution_duration}</span></div>
                                    <div className="flex items-baseline gap-2 text-[6.5pt] uppercase print:text-[8pt]"><span className="w-24 font-bold text-slate-400 print:text-black">Pengaju</span><span className="font-black">: {request.requester_name}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden print:rounded-none print:border-black print:border-[1pt] print:shadow-none break-inside-avoid">
                        <table className="w-full text-left border-collapse border-black" style={{ borderCollapse: 'collapse' }}>
                            <thead className="bg-slate-50 print:bg-gray-100">
                                <tr className="text-[9px] font-black text-slate-400 uppercase print:text-black">
                                    <th className="px-6 py-4 border-r border-black print:text-[8.5pt] print:py-2.5 print:px-4 print:w-[20%]">Struktur / Akun</th>
                                    <th className="px-6 py-4 border-r border-black print:text-[8.5pt] print:py-2.5 print:px-4 print:w-[40%]">Uraian & Perincian</th>
                                    <th className="px-6 py-4 border-r border-black print:text-[8.5pt] print:py-2.5 print:px-4 text-center print:w-[10%]">Vol</th>
                                    <th className="px-6 py-4 border-r border-black print:text-[8.5pt] print:py-2.5 print:px-4 text-right print:w-[15%]">Harga</th>
                                    <th className="px-6 py-4 border-black print:text-[8.5pt] print:py-2.5 print:px-4 text-right print:w-[15%]">Jumlah (IDR)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {request.calculation_items?.map((item, idx) => (
                                    <tr key={idx} className="print:border-b-[1pt] print:border-black">
                                        <td className="px-6 py-4 border-r border-black print:py-2 print:px-3"><p className="text-[8px] font-black print:text-[7.5pt]">{item.ro_code}.{item.komponen_code}.{item.subkomponen_code}</p><p className="text-[7px] font-bold text-blue-600 print:text-black print:text-[7pt]">{item.kode_akun}</p></td>
                                        <td className="px-6 py-4 border-r border-black print:py-2 print:px-4">
                                            <p className="text-xs font-bold uppercase print:text-[8.5pt] leading-tight">{item.title}</p>
                                            {item.detail_barang && <p className="text-[8px] text-slate-400 italic print:text-black print:text-[7pt]">Spesifikasi: {item.detail_barang}</p>}
                                            <p className="print-only text-[7pt] mt-1 italic">({item.f1_val} {item.f1_unit} {item.f2_val > 1 ? `x ${item.f2_val} ${item.f2_unit}` : ''} {item.f3_val > 1 ? `x ${item.f3_val} ${item.f3_unit}` : ''} {item.f4_val > 1 ? `x ${item.f4_val} ${item.f4_unit}` : ''})</p>
                                        </td>
                                        <td className="px-6 py-4 text-center border-r border-black print:py-2 print:px-3">
                                            <span className="text-xs font-black print:text-[8.5pt]">{item.volkeg} {item.satkeg}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right border-r border-black print:py-2 print:px-3 text-xs print:text-[8.5pt]">{item.hargaSatuan.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 text-right text-sm font-black font-mono print:text-[8.5pt] print:py-2 print:px-3">{item.jumlah.toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-950 text-white print:bg-gray-100 print:text-black print:border-t-[1.5pt] print:border-black">
                                    <td colSpan={4} className="px-6 py-4 text-right text-[10px] font-black uppercase border-r border-black print:text-[9.5pt] print:py-4 print:px-5">TOTAL KESELURUHAN</td>
                                    <td className="px-6 py-4 text-right text-lg font-black font-mono print:text-[10pt] print:py-4 print:px-5">
                                        <span className="print:text-[8pt] mr-2">Rp</span>
                                        {request.amount.toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm print:p-4 print:border-black print:border-[1pt] print:shadow-none print:mt-4 break-inside-avoid" style={{ borderRadius: '24px' }}>
                        <p className="text-xs font-black uppercase tracking-widest print:text-[8.5pt] underline mb-1.5">Justifikasi Kebutuhan:</p>
                        <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase print:text-black print:text-[8pt] text-justify">{request.description || "TIDAK ADA DESKRIPSI."}</p>
                    </div>

                    {/* Lembar Pengesahan Printout */}
                    <div className="print-only mt-6 break-inside-avoid">
                        <table className="w-full border-collapse border-[1pt] border-black text-center" style={{ borderCollapse: 'collapse' }}>
                            <thead className="bg-gray-100"><tr className="text-[8.5pt] font-black uppercase"><th className="border-black py-2 w-1/3 border-[1pt]">VALIDASI PROGRAM</th><th className="border-black py-2 w-1/3 border-[1pt]">VALIDASI TU</th><th className="border-black py-2 w-1/3 border-[1pt]">PENGESAHAN PPK</th></tr></thead>
                            <tbody><tr className="h-20"><td className="border-black relative border-[1pt]">{isStepCompleted('reviewed_program') && <div className="absolute inset-0 flex items-center justify-center opacity-70"><div className="border-[1.5pt] border-emerald-900 text-emerald-900 px-2 py-0.5 font-black text-[7.5pt] rotate-[-8deg] uppercase">TERVERIFIKASI</div></div>}</td><td className="border-black relative border-[1pt]">{isStepCompleted('reviewed_tu') && <div className="absolute inset-0 flex items-center justify-center opacity-70"><div className="border-[1.5pt] border-blue-900 text-blue-900 px-2 py-0.5 font-black text-[7.5pt] rotate-[-8deg] uppercase">TERVERIFIKASI</div></div>}</td><td className="border-black relative border-[1pt]">{isStepCompleted('approved') && <div className="absolute inset-0 flex items-center justify-center"><div className="border-[2pt] border-red-900 text-red-900 px-2 py-1 font-black text-[9pt] rotate-[-5deg] uppercase">DISETUJUI PPK</div></div>}</td></tr><tr className="text-[7.5pt] font-bold uppercase"><td className="border-black py-2 border-[1pt]">Tgl: {request.updated_at ? new Date(request.updated_at).toLocaleDateString('id-ID') : '... / ... / ...'}</td><td className="border-black py-2 border-[1pt]">Tgl: {request.updated_at ? new Date(request.updated_at).toLocaleDateString('id-ID') : '... / ... / ...'}</td><td className="border-black py-2 border-[1pt]">Tgl: {request.updated_at ? new Date(request.updated_at).toLocaleDateString('id-ID') : '... / ... / ...'}</td></tr></tbody>
                        </table>
                    </div>

                    <div className="print-only mt-10 break-inside-avoid">
                        <div className="grid grid-cols-2 gap-12 text-center text-[9.5pt]"><div className="space-y-16"><div><p className="font-bold">Mengetahui,</p><p className="font-black uppercase leading-tight">Kepala {request.requester_department}</p></div><div><p className="font-black underline uppercase leading-none">( ..................................................... )</p><p className="text-[8pt] mt-1">NIP. ..................................................</p></div></div><div className="space-y-16"><div><p className="font-bold">Makassar, {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</p><p className="font-black uppercase leading-tight">Pengusul / Penanggung Jawab,</p></div><div><p className="font-black underline uppercase leading-none">( {request.requester_name} )</p><p className="text-[8pt] mt-1">NIP. ..................................................</p></div></div></div>
                    </div>
                </div>

                <div className="xl:col-span-1 space-y-8 no-print">
                    {request.attachment_url && (
                        <div className="bg-white p-8 rounded-[40px] border border-blue-100 shadow-sm space-y-6 text-center">
                            <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Berkas Lampiran</h4>
                            <a href={request.attachment_url} target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"><Eye size={14} /> Lihat Berkas</a>
                        </div>
                    )}
                    <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm sticky top-24">
                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest text-center mb-10">Status Terkini</h4>
                        <div className="space-y-0 relative ml-4">
                            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-slate-100"></div>
                            {detailedSteps.map((step, idx) => (
                                <div key={idx} className="relative flex items-start gap-5 pb-8 last:pb-0">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isStepCompleted(step.s) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>{step.icon}</div>
                                    <div className="flex-1 -mt-1"><p className="text-[10px] font-black uppercase text-slate-900">{step.l}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{step.role}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestDetail;
