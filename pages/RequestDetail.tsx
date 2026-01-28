
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
    Building2,
    User,
    Eye,
    ShieldCheck as ShieldIcon,
    ExternalLink,
    FileText,
    UploadCloud,
    CheckCircle2,
    Save,
    FileCheck,
    Briefcase
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
    const [actionLoading, setActionLoading] = useState(false);
    const [validatorNote, setValidatorNote] = useState("");
    
    const [uploading, setUploading] = useState<string | null>(null);
    const [spjFiles, setSpjFiles] = useState({
        sppd: null as File | null,
        report: null as File | null,
        spj: null as File | null
    });

    const fetchRequest = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await dbService.getRequestById(id);
            if (data) setRequest(data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchRequest(); }, [id]);

    const isStructuralSkipped = useMemo(() => {
        if (!request) return false;
        const dept = request.requester_department || '';
        return SKIP_STRUCTURAL_APPROVAL_DEPTS.includes(dept);
    }, [request]);

    const handleAction = async (status: BudgetStatus, isReject: boolean = false) => {
        if (!id) return;
        if (isReject && !validatorNote.trim()) {
            alert("Harap berikan alasan penolakan/revisi.");
            return;
        }
        setActionLoading(true);
        const success = await dbService.updateStatus(id, status, validatorNote.trim() ? { field: 'program_note', value: validatorNote } : undefined);
        if (success) {
            alert("Status berkas berhasil diperbarui.");
            fetchRequest();
            setValidatorNote("");
        }
        setActionLoading(false);
    };

    const isUserValidator = useMemo(() => isValidatorRole(user?.role), [user]);

    const canValidate = useMemo(() => {
        if (!user || !request) return false;
        const role = user.role;
        const status = request.status;
        if (role === 'kepala_bidang' && status === 'pending') return true;
        if (role === 'validator_program' && status === 'reviewed_bidang') return true;
        if (role === 'validator_tu' && status === 'reviewed_program') return true;
        if (role === 'validator_ppk' && status === 'reviewed_tu') return true;
        if (role.startsWith('pic_') && status === 'approved') return true;
        if (role === 'admin') return true;
        return false;
    }, [user, request]);

    const getNextStatus = (): BudgetStatus => {
        if (!request) return 'pending';
        switch(request.status) {
            case 'pending': return 'reviewed_bidang';
            case 'reviewed_bidang': return 'reviewed_program';
            case 'reviewed_program': return 'reviewed_tu';
            case 'reviewed_tu': return 'approved';
            case 'approved': return 'reviewed_pic';
            default: return request.status;
        }
    };

    if (loading && !request) return <div className="flex items-center justify-center py-40"><Loader2 className="animate-spin text-blue-600" size={64} /></div>;
    if (!request) return <div className="text-center py-40">Berkas tidak ditemukan</div>;

    const statusInfo = {
        pending: { label: 'MENUNGGU KABID', color: 'bg-amber-50 text-amber-700' },
        reviewed_bidang: { label: 'MENUNGGU PROGRAM', color: 'bg-blue-50 text-blue-700' },
        reviewed_program: { label: 'MENUNGGU TU', color: 'bg-indigo-50 text-indigo-700' },
        reviewed_tu: { label: 'MENUNGGU PPK', color: 'bg-purple-50 text-purple-700' },
        approved: { label: 'DISETUJUI (SPJ)', color: 'bg-emerald-50 text-emerald-700' },
        reviewed_pic: { label: 'SPJ TERVERIFIKASI', color: 'bg-cyan-50 text-cyan-700' },
        rejected: { label: 'REVISI / DITOLAK', color: 'bg-red-50 text-red-700' }
    }[request.status] || { label: request.status.toUpperCase(), color: 'bg-slate-50 text-slate-700' };

    const detailedSteps = [
        { s: 'pending', l: 'Diajukan', role: 'Pengaju', icon: <User size={14} /> },
        { s: 'reviewed_bidang', l: 'Persetujuan Kabid', role: 'Kepala Bidang', icon: <UserCheck size={14} />, hidden: isStructuralSkipped },
        { s: 'reviewed_program', l: 'Validasi Program', role: 'Validator Program', icon: <GanttChart size={14} /> },
        { s: 'reviewed_tu', l: 'Validasi TU', role: 'Kasubag TU', icon: <FileSearch size={14} /> },
        { s: 'approved', l: 'Pengesahan PPK', role: 'Pejabat PPK', icon: <Stamp size={14} /> },
        { s: 'reviewed_pic', l: 'Verifikasi SPJ', role: 'PIC Verifikator', icon: <ShieldIcon size={14} /> },
        { s: 'realized', l: 'Pembayaran', role: 'Bendahara', icon: <Coins size={14} /> }
    ].filter(step => !step.hidden);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'}).toUpperCase();
    };

    const isStepCompleted = (stepStatus: string) => {
        const statusOrder = ['pending', 'reviewed_bidang', 'reviewed_program', 'reviewed_tu', 'approved', 'reviewed_pic', 'realized'];
        const currentIndex = statusOrder.indexOf(request.status);
        const stepIndex = statusOrder.indexOf(stepStatus);
        return currentIndex >= stepIndex;
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-20 page-transition print:space-y-0 print:pb-0 print:mt-0 print:pt-0 print:bg-white print:text-black print:overflow-visible">
            
            {/* Header / Kop Surat Kompak untuk Print */}
            <div className="print-only mb-4 print:block">
                <div className="flex items-center justify-center border-b-[2px] border-black pb-2 mb-0.5">
                    <div className="flex items-center gap-4 w-full px-2">
                        <Logo className="w-16 h-16 object-contain" />
                        <div className="flex-1 text-center">
                            <h2 className="text-[10pt] font-bold uppercase leading-tight">Kementerian Lingkungan Hidup dan Kehutanan</h2>
                            <h3 className="text-[9pt] font-bold uppercase leading-tight">Badan Pengendalian Lingkungan Hidup</h3>
                            <h3 className="text-[10pt] font-black uppercase leading-tight mt-0.5">Pusat Pengendalian Lingkungan Hidup Sulawesi Maluku</h3>
                            <p className="text-[7pt] mt-0.5 leading-tight">Jln. Perintis Kemerdekaan KM. 17, Makassar. Telp: (0411) 556677</p>
                        </div>
                    </div>
                </div>
                <div className="border-b-[0.5pt] border-black h-0.5"></div>
            </div>

            <div className="print-only text-center mb-4">
                <h2 className="text-[11pt] font-black underline uppercase tracking-tight">KARTU KENDALI PENGAJUAN ANGGARAN</h2>
                <p className="text-[7pt] font-bold mt-0.5">ID DOKUMEN: {request.id.substring(0, 13).toUpperCase()}</p>
            </div>

            <div className="flex items-center justify-between no-print">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white border rounded-2xl shadow-sm hover:bg-slate-50 transition-all"><ArrowLeft size={20} /></button>
                    <div><h1 className="text-2xl font-black uppercase tracking-tight">Rincian Berkas</h1></div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`px-5 py-3 rounded-2xl border font-black text-[10px] uppercase tracking-widest ${statusInfo.color}`}>{statusInfo.label}</div>
                    <button onClick={() => window.print()} className="p-3 bg-white border rounded-2xl shadow-sm hover:bg-slate-50"><Printer size={20} /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 print:block">
                <div className="xl:col-span-3 space-y-8 print:w-full print:space-y-3 print:mt-0">
                    
                    {/* Panel Validasi (No Print) */}
                    {canValidate && (
                        <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl space-y-6 no-print">
                            <div className="flex items-center justify-between border-b border-white/10 pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white"><ShieldIcon size={24} /></div>
                                    <div><h3 className="text-sm font-black text-white uppercase tracking-widest">Otorisasi Validator</h3></div>
                                </div>
                                {request.attachment_url && (
                                    <a href={request.attachment_url} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20">
                                        <ExternalLink size={16} /> BUKA BERKAS PENDUKUNG
                                    </a>
                                )}
                            </div>
                            <textarea className="w-full p-6 bg-white/5 border border-white/10 rounded-[32px] text-white text-xs font-bold outline-none" rows={3} placeholder="Tambahkan catatan jika perlu..." value={validatorNote} onChange={(e) => setValidatorNote(e.target.value)} />
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => handleAction('rejected', true)} className="py-4 bg-red-600/10 text-red-500 rounded-2xl font-black text-[10px] uppercase border border-red-600/20">Tolak / Revisi</button>
                                <button onClick={() => handleAction(getNextStatus())} className="py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Setujui Berkas</button>
                            </div>
                        </div>
                    )}

                    {/* Content Section */}
                    <div className="bg-white p-10 md:p-14 rounded-[56px] border border-slate-200 shadow-sm print:border-none print:p-0 print:rounded-none">
                        <div className="space-y-8 print:space-y-2">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight leading-[1.1] print:text-[10pt] print:mb-1">{request.title}</h2>
                                <div className="w-full h-px bg-slate-100 print:bg-black/40 print:h-[1pt] print:my-1"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-x-12 print:gap-y-1">
                                <div className="space-y-4 print:space-y-0.5">
                                    <div className="flex items-center gap-4 print:gap-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-28 print:text-black print:text-[8pt] print:w-24">Kategori</p>
                                        <p className="text-sm font-black text-slate-800 uppercase print:text-[8pt] print:font-bold">: {request.category}</p>
                                    </div>
                                    <div className="flex items-center gap-4 print:gap-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-28 print:text-black print:text-[8pt] print:w-24">Unit Kerja</p>
                                        <p className="text-sm font-black text-slate-800 uppercase print:text-[8pt] print:font-bold">: {request.requester_department}</p>
                                    </div>
                                    <div className="flex items-center gap-4 print:gap-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-28 print:text-black print:text-[8pt] print:w-24">Lokasi</p>
                                        <p className="text-sm font-black text-slate-800 uppercase print:text-[8pt] print:font-bold">: {request.location}</p>
                                    </div>
                                </div>
                                <div className="space-y-4 print:space-y-0.5">
                                    <div className="flex items-center gap-4 print:gap-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-28 print:text-black print:text-[8pt] print:w-24">Pelaksanaan</p>
                                        <p className="text-sm font-black text-slate-800 uppercase print:text-[8pt] print:font-bold">: {formatDate(request.execution_date)}</p>
                                    </div>
                                    <div className="flex items-center gap-4 print:gap-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-28 print:text-black print:text-[8pt] print:w-24">Durasi</p>
                                        <p className="text-sm font-black text-slate-800 uppercase print:text-[8pt] print:font-bold">: {request.execution_duration}</p>
                                    </div>
                                    <div className="flex items-center gap-4 print:gap-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-28 print:text-black print:text-[8pt] print:w-24">Pengusul</p>
                                        <p className="text-sm font-black text-slate-800 uppercase print:text-[8pt] print:font-bold">: {request.requester_name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden print:border-none print:mt-2 print:rounded-none print:overflow-visible">
                        <div className="p-8 md:p-10 border-b border-slate-100 flex items-center justify-between no-print">
                            <h3 className="text-sm font-black uppercase tracking-widest">Rincian Komponen Anggaran</h3>
                            <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl">
                                <span className="text-lg font-black font-mono">Total: Rp {request.amount.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                        <div className="overflow-x-visible">
                            <table className="w-full text-left border-collapse print:border-[0.5pt] print:border-black">
                                <thead className="bg-slate-50 print:bg-gray-50">
                                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest print:text-black border-b border-slate-100 print:border-black">
                                        <th className="px-6 py-4 print:py-1 print:px-2 border-r print:border-black print:text-[7pt] w-[20%]">Struktur / Akun</th>
                                        <th className="px-6 py-4 print:py-1 print:px-2 border-r print:border-black print:text-[7pt] w-[40%]">Uraian Detail</th>
                                        <th className="px-6 py-4 print:py-1 print:px-2 border-r print:border-black print:text-[7pt] text-center w-[12%]">Vol</th>
                                        <th className="px-6 py-4 print:py-1 print:px-2 border-r print:border-black print:text-[7pt] text-right w-[14%]">Satuan</th>
                                        <th className="px-6 py-4 print:py-1 print:px-2 print:text-[7pt] text-right w-[14%]">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 print:divide-black">
                                    {request.calculation_items?.map((item, idx) => (
                                        <tr key={idx} className="print:border-b-[0.5pt] print:border-black">
                                            <td className="px-6 py-4 print:py-1 print:px-2 border-r print:border-black">
                                                <p className="text-[9px] font-black text-slate-900 print:text-[7pt]">{item.ro_code}.{item.komponen_code}.{item.subkomponen_code}</p>
                                                <p className="text-[8px] font-bold text-blue-600 print:text-black print:text-[6pt]">{item.kode_akun}</p>
                                            </td>
                                            <td className="px-6 py-4 print:py-1 print:px-2 border-r print:border-black">
                                                <p className="text-xs font-bold uppercase print:text-[7pt] leading-tight">{item.title}</p>
                                                {item.detail_barang && <p className="text-[8px] text-slate-400 mt-0.5 italic print:text-black print:text-[6pt]">Ket: {item.detail_barang}</p>}
                                            </td>
                                            <td className="px-6 py-4 text-center print:py-1 print:px-2 border-r print:border-black text-xs font-black print:text-[7pt]">
                                                {item.volkeg} {item.satkeg}
                                            </td>
                                            <td className="px-6 py-4 text-right print:py-1 print:px-2 border-r print:border-black text-xs print:text-[7pt]">
                                                {item.hargaSatuan.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 text-right print:py-1 print:px-2 text-sm font-black font-mono print:text-[7pt]">
                                                {item.jumlah.toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-900 text-white print:bg-white print:text-black">
                                        <td colSpan={4} className="px-6 py-4 text-right text-[10px] font-black uppercase border-r print:border-black print:text-[8pt] print:py-1">TOTAL KESELURUHAN (IDR)</td>
                                        <td className="px-6 py-4 text-right text-lg font-black font-mono print:text-[8pt] print:py-1">
                                            Rp {request.amount.toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-4 print:border-none print:mt-3 print:p-0 print:break-inside-avoid">
                        <h3 className="text-xs font-black uppercase tracking-widest print:text-[8pt] print:underline print:font-bold">Justifikasi Kebutuhan:</h3>
                        <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase whitespace-pre-wrap print:text-black print:text-[7pt] print:leading-tight print:normal-case">
                            {request.description || "TIDAK ADA DESKRIPSI."}
                        </p>
                    </div>

                    {/* Lembar Kendali Validasi (Print Only) */}
                    <div className="print-only mt-6 print:block print:break-inside-avoid">
                        <table className="w-full border-collapse border-[0.5pt] border-black text-center">
                            <thead className="bg-gray-100">
                                <tr className="text-[8pt] font-black uppercase">
                                    <th className="border-[0.5pt] border-black py-1 w-1/3">VALIDASI PROGRAM</th>
                                    <th className="border-[0.5pt] border-black py-1 w-1/3">VALIDASI TATA USAHA</th>
                                    <th className="border-[0.5pt] border-black py-1 w-1/3">PENGESAHAN PPK</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="h-16">
                                    <td className="border-[0.5pt] border-black relative">
                                        {isStepCompleted('reviewed_program') && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-70">
                                                <div className="border-[1.5pt] border-emerald-800 text-emerald-800 px-2 py-0.5 font-black text-[8pt] rotate-[-12deg] uppercase">TERVERIFIKASI</div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="border-[0.5pt] border-black relative">
                                        {isStepCompleted('reviewed_tu') && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-70">
                                                <div className="border-[1.5pt] border-blue-800 text-blue-800 px-2 py-0.5 font-black text-[8pt] rotate-[-12deg] uppercase">TERVERIFIKASI</div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="border-[0.5pt] border-black relative">
                                        {isStepCompleted('approved') && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="border-[2pt] border-red-900 text-red-900 px-3 py-1 font-black text-[9pt] rotate-[-5deg] uppercase">DISETUJUI PPK</div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                <tr className="text-[7pt] font-bold uppercase">
                                    <td className="border-[0.5pt] border-black py-0.5">Tgl: {request.updated_at ? new Date(request.updated_at).toLocaleDateString('id-ID') : '-'}</td>
                                    <td className="border-[0.5pt] border-black py-0.5">Tgl: {request.updated_at ? new Date(request.updated_at).toLocaleDateString('id-ID') : '-'}</td>
                                    <td className="border-[0.5pt] border-black py-0.5">Tgl: {request.updated_at ? new Date(request.updated_at).toLocaleDateString('id-ID') : '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Signature horizontal agar hemat tempat */}
                    <div className="print-only mt-8 print:block print:break-inside-avoid">
                        <div className="grid grid-cols-2 gap-4 text-center text-[8pt]">
                            <div className="flex flex-col justify-between h-24">
                                <div>
                                    <p className="mb-0 font-bold">Mengetahui,</p>
                                    <p className="font-black uppercase leading-tight">Kepala {request.requester_department}</p>
                                </div>
                                <div>
                                    <p className="font-black underline uppercase">( ..................................................... )</p>
                                    <p className="text-[7pt] mt-0.5">NIP. ..................................................</p>
                                </div>
                            </div>
                            <div className="flex flex-col justify-between h-24">
                                <div>
                                    <p className="mb-0 font-bold">Makassar, {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
                                    <p className="font-black uppercase leading-tight">Pengusul / Penanggung Jawab,</p>
                                </div>
                                <div>
                                    <p className="font-black underline uppercase">( {request.requester_name} )</p>
                                    <p className="text-[7pt] mt-0.5">NIP. ..................................................</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info (No Print) */}
                <div className="xl:col-span-1 space-y-8 no-print">
                    {isUserValidator && request.attachment_url && (
                        <div className="bg-white p-8 rounded-[40px] border border-blue-100 shadow-sm space-y-6">
                            <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest text-center">Berkas Lampiran</h4>
                            <a href={request.attachment_url} target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                                <Eye size={14} /> Lihat Berkas
                            </a>
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
