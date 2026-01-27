
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
import { AuthContext, isValidatorRole } from '../App';
import { dbService } from '../services/dbService';
import { BudgetRequest, BudgetStatus } from '../types';
import Logo from '../components/Logo';

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
    
    // State for Realization/SPJ uploads
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

    const isApprovedOrBeyond = useMemo(() => {
        if (!request) return false;
        const advancedStatuses: string[] = ['approved', 'reviewed_pic'];
        return advancedStatuses.includes(request.status) || !!request.realization_date;
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

    const handleSpjUpload = async () => {
        if (!id || !request) return;
        setUploading('saving');
        try {
            let sppdUrl = request.sppd_url;
            let reportUrl = request.report_url;
            let spjUrl = request.spj_url;

            if (spjFiles.sppd) sppdUrl = await dbService.uploadAttachment(spjFiles.sppd) || sppdUrl;
            if (spjFiles.report) reportUrl = await dbService.uploadAttachment(spjFiles.report) || reportUrl;
            if (spjFiles.spj) spjUrl = await dbService.uploadAttachment(spjFiles.spj) || spjUrl;

            const success = await dbService.updateRequest(id, {
                sppd_url: sppdUrl,
                report_url: reportUrl,
                spj_url: spjUrl,
                // Automatically move status to PIC verification after upload if all required files are present
                status: 'approved' 
            });

            if (success) {
                alert("Dokumen pertanggungjawaban berhasil diunggah.");
                fetchRequest();
                setSpjFiles({ sppd: null, report: null, spj: null });
            }
        } catch (err) {
            alert("Gagal mengunggah dokumen.");
        } finally {
            setUploading(null);
        }
    };

    const isUserValidator = useMemo(() => isValidatorRole(user?.role), [user]);
    const isRequester = useMemo(() => user?.id === request?.requester_id, [user, request]);
    const isEquipmentCategory = request?.category === 'Peralatan Kantor';

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
        <div className="max-w-[1400px] mx-auto space-y-8 pb-20 page-transition print:space-y-0 print:pb-0 print:mt-0 print:pt-0">
            <div className="print-only border-b-[1.5pt] border-black pb-3 mb-3 print:mt-0">
                <div className="flex items-center gap-6">
                    <Logo className="w-20 h-20 object-contain" />
                    <div className="flex-1 text-center pr-10">
                        <h2 className="text-[10pt] font-bold uppercase leading-tight">Kementerian Lingkungan Hidup / </h2>
                        <h3 className="text-[10pt] font-bold uppercase leading-tight">Badan Pengendalian Lingkungan Hidup RI </h3>
                        <h3 className="text-[9.5pt] font-black uppercase mt-1 leading-tight">Pusat Pengendalian Lingkungan Hidup Sulawesi Maluku</h3>
                        <p className="text-[6.5pt] mt-0.5 italic">Jln. Perintis Kemerdekaan KM. 17, Makassar. Email: sekretariat@pusdalsuma.go.id</p>
                    </div>
                </div>
            </div>

            <div className="print-only text-center mb-5 print:mb-3">
                <h2 className="text-[11pt] font-black underline uppercase">KARTU KENDALI PENGAJUAN ANGGARAN</h2>
                <p className="text-[7.5pt] font-bold mt-0.5 tracking-tighter">ID: {request.id.toUpperCase()}</p>
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
                    
                    {/* FORM PERTANGGUNGJAWABAN (Hanya untuk Pengaju saat Berkas Approved) */}
                    {isRequester && request.status === 'approved' && (
                        <div className="bg-emerald-900 p-8 rounded-[48px] shadow-2xl space-y-8 no-print border-4 border-emerald-500/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-emerald-500 rounded-[24px] flex items-center justify-center text-white shadow-lg shadow-emerald-900/40">
                                        <Briefcase size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Kelengkapan Dokumen SPJ</h3>
                                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Silakan unggah bukti pelaksanaan kegiatan Anda</p>
                                    </div>
                                </div>
                                <div className="px-5 py-2 bg-emerald-800 text-emerald-200 border border-emerald-700 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                    Status: Menunggu SPJ
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                {/* SPPD (Hanya jika bukan Peralatan Kantor) */}
                                {!isEquipmentCategory && (
                                    <div className={`p-6 rounded-[32px] border-2 border-dashed transition-all ${request.sppd_url ? 'bg-emerald-800/50 border-emerald-500' : 'bg-white/5 border-white/20 hover:border-emerald-500'}`}>
                                        <div className="flex flex-col items-center text-center space-y-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white uppercase">Lampiran SPPD</p>
                                                <p className="text-[8px] font-bold text-emerald-300 uppercase mt-1">Sertifikat / Surat Tugas</p>
                                            </div>
                                            <label className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-[9px] font-black uppercase cursor-pointer transition-all flex items-center justify-center gap-2">
                                                <UploadCloud size={14} /> {spjFiles.sppd ? 'Terpilih' : 'Unggah'}
                                                <input type="file" className="hidden" onChange={(e) => setSpjFiles({...spjFiles, sppd: e.target.files?.[0] || null})} />
                                            </label>
                                            {request.sppd_url && <a href={request.sppd_url} target="_blank" className="text-[8px] text-emerald-400 font-black uppercase underline">Lihat File Saat Ini</a>}
                                        </div>
                                    </div>
                                )}

                                {/* Laporan (Hanya jika bukan Peralatan Kantor) */}
                                {!isEquipmentCategory && (
                                    <div className={`p-6 rounded-[32px] border-2 border-dashed transition-all ${request.report_url ? 'bg-emerald-800/50 border-emerald-500' : 'bg-white/5 border-white/20 hover:border-emerald-500'}`}>
                                        <div className="flex flex-col items-center text-center space-y-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                                                <CheckCircle2 size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white uppercase">Laporan Kegiatan</p>
                                                <p className="text-[8px] font-bold text-emerald-300 uppercase mt-1">Narasi & Dokumentasi</p>
                                            </div>
                                            <label className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-[9px] font-black uppercase cursor-pointer transition-all flex items-center justify-center gap-2">
                                                <UploadCloud size={14} /> {spjFiles.report ? 'Terpilih' : 'Unggah'}
                                                <input type="file" className="hidden" onChange={(e) => setSpjFiles({...spjFiles, report: e.target.files?.[0] || null})} />
                                            </label>
                                            {request.report_url && <a href={request.report_url} target="_blank" className="text-[8px] text-emerald-400 font-black uppercase underline">Lihat File Saat Ini</a>}
                                        </div>
                                    </div>
                                )}

                                {/* Kuitansi / SPJ (Wajib untuk semua) */}
                                <div className={`p-6 rounded-[32px] border-2 border-dashed transition-all ${request.spj_url ? 'bg-emerald-800/50 border-emerald-500' : 'bg-white/5 border-white/20 hover:border-emerald-500'} ${isEquipmentCategory ? 'md:col-span-3' : ''}`}>
                                    <div className="flex flex-col items-center text-center space-y-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                                            <Coins size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase">Kuitansi / Bukti SPJ</p>
                                            <p className="text-[8px] font-bold text-emerald-300 uppercase mt-1">Invoice / Nota / Kuitansi</p>
                                        </div>
                                        <label className={`py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-[9px] font-black uppercase cursor-pointer transition-all flex items-center justify-center gap-2 ${isEquipmentCategory ? 'w-1/2' : 'w-full'}`}>
                                            <UploadCloud size={14} /> {spjFiles.spj ? 'Terpilih' : 'Unggah'}
                                            <input type="file" className="hidden" onChange={(e) => setSpjFiles({...spjFiles, spj: e.target.files?.[0] || null})} />
                                        </label>
                                        {request.spj_url && <a href={request.spj_url} target="_blank" className="text-[8px] text-emerald-400 font-black uppercase underline">Lihat File Saat Ini</a>}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/10 flex justify-end relative z-10">
                                <button 
                                    onClick={handleSpjUpload} 
                                    disabled={uploading === 'saving'}
                                    className="px-10 py-4 bg-white text-emerald-900 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-emerald-50 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {uploading === 'saving' ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                    Simpan & Ajukan Verifikasi SPJ
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Panel Validasi (Hanya Web untuk Validator) */}
                    {canValidate && (
                        <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl space-y-6 no-print">
                            <div className="flex items-center justify-between border-b border-white/10 pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white"><ShieldIcon size={24} /></div>
                                    <div><h3 className="text-sm font-black text-white uppercase tracking-widest">Otorisasi Validator</h3></div>
                                </div>
                                {request.attachment_url && (
                                    <a 
                                        href={request.attachment_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20"
                                    >
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

                    <div className="bg-white p-10 md:p-14 rounded-[56px] border border-slate-200 shadow-sm print:border-none print:p-0 print:rounded-none">
                        <div className="space-y-12 print:space-y-3">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 print:gap-1">
                                <div className="flex-1">
                                    <span className="px-4 py-2 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg border border-blue-100 no-print">{request.category}</span>
                                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight mt-8 leading-[1.1] print:text-[11pt] print:mt-0 print:mb-1">{request.title}</h2>
                                </div>
                            </div>
                            
                            <div className="w-full h-px bg-slate-100 print:bg-black/20 print:my-1"></div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 print:grid-cols-3 print:gap-2">
                                <div className="space-y-2 print:space-y-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest print:text-black print:text-[6.5pt]">Unit Kerja / Bidang</p>
                                    <p className="text-sm font-black text-slate-800 uppercase print:text-[8pt]">{request.requester_department}</p>
                                </div>
                                <div className="space-y-2 print:space-y-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest print:text-black print:text-[6.5pt]">Pelaksanaan & Durasi</p>
                                    <p className="text-sm font-black text-slate-800 uppercase leading-snug print:text-[8pt]">
                                        {request.location}, <span className="mx-1 text-slate-300 print:text-black">/</span> {formatDate(request.execution_date)}
                                        {request.execution_end_date && <span className="block mt-0.5 print:mt-0">S.D {formatDate(request.execution_end_date)}</span>}
                                        {request.execution_duration && (
                                            <span className="block text-[10px] text-blue-600 font-black uppercase mt-1 print:text-black print:text-[6.5pt] print:mt-0">
                                                LAMA KEGIATAN: {request.execution_duration}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="space-y-2 print:space-y-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest print:text-black print:text-[6.5pt]">Pengusul</p>
                                    <p className="text-sm font-black text-slate-800 uppercase print:text-[8pt]">{request.requester_name}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden print:border-none print:mt-1 print:rounded-none">
                        <div className="p-8 md:p-10 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/30 print:bg-transparent print:p-0 print:pb-1 print:border-none">
                            <h3 className="text-sm font-black uppercase tracking-widest print:text-[7.5pt]">Rincian Komponen Anggaran</h3>
                            <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl print:bg-transparent print:text-black print:p-0">
                                <span className="text-lg font-black font-mono print:text-[8.5pt]">Total: Rp {request.amount.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                        <div className="overflow-x-visible print:mt-0.5">
                            <table className="w-full text-left border-collapse print:border-[0.5pt] print:border-black">
                                <thead className="bg-slate-50 print:bg-gray-50">
                                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest print:text-black border-b border-slate-100 print:border-black">
                                        <th className="px-6 py-4 print:py-1 w-[22%]">Struktur / Kode Akun</th>
                                        <th className="px-6 py-4 print:py-1 w-[35%]">Uraian & Spesifikasi</th>
                                        <th className="px-6 py-4 print:py-1 w-[13%] text-center">Volume</th>
                                        <th className="px-6 py-4 print:py-1 w-[15%] text-right">Satuan</th>
                                        <th className="px-6 py-4 print:py-1 w-[15%] text-right">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 print:divide-black">
                                    {request.calculation_items?.map((item, idx) => (
                                        <tr key={idx} className="print:border-b-[0.5pt] print:border-black">
                                            <td className="px-6 py-4 print:py-1 border-r border-slate-100 print:border-black">
                                                <p className="text-[10px] font-black text-slate-900 print:text-[7pt]">{item.ro_code}.{item.komponen_code}.{item.subkomponen_code}</p>
                                                <p className="text-[9px] font-bold text-blue-600 print:text-black print:text-[6.5pt]">{item.kode_akun}</p>
                                            </td>
                                            <td className="px-6 py-4 print:py-1 border-r border-slate-100 print:border-black">
                                                <p className="text-xs font-bold uppercase print:text-[7.5pt] leading-tight">{item.title}</p>
                                                {item.detail_barang && (
                                                    <p className="text-[9px] text-slate-500 font-semibold mt-0.5 print:text-[6pt] print:text-black italic leading-tight">
                                                        Spesifikasi: {item.detail_barang}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center print:py-1 border-r border-slate-100 print:border-black text-xs font-black print:text-[7.5pt]">
                                                {item.volkeg} {item.satkeg}
                                            </td>
                                            <td className="px-6 py-4 text-right print:py-1 border-r border-slate-100 print:border-black text-xs print:text-[7.5pt]">
                                                Rp {item.hargaSatuan.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 text-right print:py-1 text-sm font-black font-mono print:text-[7.5pt]">
                                                Rp {item.jumlah.toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-50/50 print:bg-transparent">
                                        <td colSpan={4} className="px-6 py-5 text-right text-[10px] font-black uppercase border-r border-slate-100 print:border-black print:text-[7.5pt] print:py-1.5">TOTAL KESELURUHAN</td>
                                        <td className="px-6 py-5 text-right text-base font-black font-mono text-blue-600 print:text-black print:text-[8.5pt] print:py-1.5">
                                            Rp {request.amount.toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-4 print:border-none print:mt-3 print:p-0 print:rounded-none">
                        <h3 className="text-xs font-black uppercase tracking-widest print:text-[7.5pt]">Justifikasi Kebutuhan</h3>
                        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 print:bg-transparent print:border-none print:p-0 print:mt-0.5">
                             <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase whitespace-pre-wrap print:text-black print:text-[7.5pt]">{request.description || "TIDAK ADA DESKRIPSI."}</p>
                        </div>
                    </div>

                    <div className="print-only mt-6 border-[0.5pt] border-black p-3 rounded-md">
                        <h3 className="text-[8.5pt] font-black uppercase mb-3 border-b border-black pb-1">Lembar Kendali Validasi & Pengesahan</h3>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="border border-black p-2 rounded flex flex-col items-center justify-center text-center">
                                <p className="text-[6.5pt] font-black uppercase text-gray-500">Validasi Program</p>
                                <div className="h-10 flex items-center justify-center">
                                    {isStepCompleted('reviewed_program') ? (
                                        <div className="text-emerald-700 font-bold text-[7pt] border-2 border-emerald-700 px-2 py-0.5 rotate-[-5deg] uppercase">TERVERIFIKASI</div>
                                    ) : (
                                        <p className="text-[6pt] italic text-gray-300">Belum Diverifikasi</p>
                                    )}
                                </div>
                            </div>
                            <div className="border border-black p-2 rounded flex flex-col items-center justify-center text-center">
                                <p className="text-[6.5pt] font-black uppercase text-gray-500">Validasi Tata Usaha</p>
                                <div className="h-10 flex items-center justify-center">
                                    {isStepCompleted('reviewed_tu') ? (
                                        <div className="text-indigo-700 font-bold text-[7pt] border-2 border-indigo-700 px-2 py-0.5 rotate-[-5deg] uppercase">TERVERIFIKASI</div>
                                    ) : (
                                        <p className="text-[6pt] italic text-gray-300">Belum Diverifikasi</p>
                                    )}
                                </div>
                            </div>
                            <div className="border border-black p-2 rounded flex flex-col items-center justify-center text-center bg-gray-50">
                                <p className="text-[6.5pt] font-black uppercase text-blue-700">Pengesahan PPK</p>
                                <div className="h-10 flex items-center justify-center">
                                    {isStepCompleted('approved') ? (
                                        <div className="text-blue-900 font-black text-[8pt] border-[3px] border-blue-900 px-3 py-1 rotate-[-3deg] uppercase bg-white">DISETUJUI PPK</div>
                                    ) : (
                                        <p className="text-[6pt] italic text-gray-300">Belum Disahkan</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="print-only mt-8 print:mt-6">
                        <div className="grid grid-cols-2 gap-10 text-center text-[8pt]">
                            <div className="space-y-12 print:space-y-10">
                                <div><p className="mb-0.5">Mengetahui,</p><p className="font-bold uppercase leading-tight">Kepala {request.requester_department}</p></div>
                                <p className="font-bold underline uppercase">( ..................................................... )</p>
                            </div>
                            <div className="space-y-12 print:space-y-10">
                                <div><p className="mb-0.5">Makassar, {new Date(request.execution_date).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p><p className="font-bold uppercase leading-tight">Pengusul / Penanggung Jawab,</p></div>
                                <p className="font-bold underline uppercase">( {request.requester_name} )</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-1 space-y-8 no-print">
                    {/* Daftar Dokumen Pertanggungjawaban (Jika sudah diunggah) */}
                    {request.status === 'approved' || request.status === 'reviewed_pic' ? (
                         <div className="bg-white p-8 rounded-[40px] border border-emerald-100 shadow-sm space-y-6">
                            <h4 className="text-[11px] font-black text-emerald-900 uppercase tracking-widest text-center">Berkas Pertanggungjawaban</h4>
                            <div className="space-y-3">
                                {request.spj_url && (
                                    <a href={request.spj_url} target="_blank" className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600"><Coins size={16} /></div>
                                        <span className="text-[9px] font-black uppercase text-emerald-800">Kuitansi / SPJ</span>
                                    </a>
                                )}
                                {request.report_url && (
                                    <a href={request.report_url} target="_blank" className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600"><CheckCircle2 size={16} /></div>
                                        <span className="text-[9px] font-black uppercase text-emerald-800">Laporan Kegiatan</span>
                                    </a>
                                )}
                                {request.sppd_url && (
                                    <a href={request.sppd_url} target="_blank" className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600"><FileText size={16} /></div>
                                        <span className="text-[9px] font-black uppercase text-emerald-800">Lampiran SPPD</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    ) : null}

                    {isUserValidator && request.attachment_url && (
                        <div className="bg-white p-8 rounded-[40px] border border-blue-100 shadow-sm space-y-6">
                            <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest text-center">Berkas Lampiran</h4>
                            <div className="p-5 bg-blue-50/50 rounded-[32px] border border-blue-100 flex flex-col items-center text-center space-y-4">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-50">
                                    <FileText size={24} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-900 uppercase">Lampiran Berkas Dukung</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">KAK / RAB / Bukti Dukung Lainnya</p>
                                </div>
                                <a 
                                    href={request.attachment_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-full py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                >
                                    <Eye size={14} /> Lihat Berkas
                                </a>
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm sticky top-24">
                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest text-center mb-10">Progress Perjalanan</h4>
                        <div className="space-y-0 relative ml-4">
                            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-slate-100"></div>
                            {detailedSteps.map((step, idx) => (
                                <div key={idx} className="relative flex items-start gap-5 pb-8 last:pb-0">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${request.status === step.s || (step.s === 'approved' && isApprovedOrBeyond) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>{step.icon}</div>
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
