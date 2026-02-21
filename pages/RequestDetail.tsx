
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
    Edit2,
    RotateCcw,
    ExternalLink,
    SearchCode,
    Users,
    Copy,
    Share2,
    UploadCloud,
    FileCheck,
    FileText,
    Receipt,
    Send,
    MessageSquareText,
    Banknote,
    RefreshCw
} from 'lucide-react';
import { AuthContext, isValidatorRole } from '../App.tsx';
import { dbService } from '../services/dbService.ts';
import { BudgetRequest, BudgetStatus, Profile } from '../types.ts';
import Logo from '../components/Logo.tsx';
import { supabase } from '../lib/supabase.ts';

const SKIP_STRUCTURAL_APPROVAL_DEPTS = [
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

const RECEIPT_ONLY_CATEGORIES = [
    "Pemeliharaan",
    "Peralatan Kantor",
    "Sewa",
    "Lain-lain"
];

const RequestDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    
    const [request, setRequest] = useState<BudgetRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [validatorNote, setValidatorNote] = useState("");
    const [realizationAmount, setRealizationAmount] = useState<number>(0);
    const [accessDenied, setAccessDenied] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [validators, setValidators] = useState<Profile[]>([]);
    const [copied, setCopied] = useState(false);
    const [sequenceNumber, setSequenceNumber] = useState<number>(1);
    const [allPersonnel, setAllPersonnel] = useState<Profile[]>([]);

    // States for SPJ Documents
    const [spjLoading, setSpjLoading] = useState(false);
    const [files, setFiles] = useState<{sppd?: File, report?: File, receipt?: File}>({});

    const isReceiptOnly = useMemo(() => {
        if (!request) return false;
        return RECEIPT_ONLY_CATEGORIES.includes(request.category);
    }, [request]);

    // Helper untuk Romawi Bulan
    const getRomanMonth = (month: number) => {
        const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
        return roman[month] || "I";
    };

    // Helper Singkatan Departemen
    const getDeptCode = (dept: string) => {
        const map: Record<string, string> = {
            "PUSDAL LH SUMA": "PUSDAL",
            "Bagian Tata Usaha": "TU",
            "Bidang Wilayah I": "WIL-I",
            "Bidang Wilayah II": "WIL-II",
            "Bidang Wilayah III": "WIL-III",
            "Sub Bagian Program & Anggaran": "PROG-ANG",
            "Sub Bagian Kehumasan": "HUMAS",
            "Sub Bagian Kepegawaian": "KEPEG",
            "Sub Bagian Keuangan": "KEU"
        };
        return map[dept] || "BPLH";
    };

    const fetchRequest = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [data, profiles] = await Promise.all([
                dbService.getRequestById(id),
                dbService.getAllProfiles()
            ]);
            
            setAllPersonnel(profiles);

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
                setRealizationAmount(data.realization_amount || data.amount || 0);

                // Hitung nomor urut berdasarkan posisi berkas dalam database untuk bulan & departemen yang sama
                const date = new Date(data.created_at);
                const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
                
                const { count } = await supabase
                    .from('budget_requests')
                    .select('*', { count: 'exact', head: true })
                    .eq('requester_department', data.requester_department)
                    .gte('created_at', startOfMonth)
                    .lte('created_at', data.created_at);
                
                setSequenceNumber(count || 1);
                
                let targetRole = '';
                if (data.status === 'pending') targetRole = 'kepala_bidang';
                else if (data.status === 'reviewed_bidang') targetRole = 'validator_program';
                else if (data.status === 'reviewed_program') targetRole = 'validator_tu';
                else if (data.status === 'reviewed_tu') targetRole = 'validator_ppk';
                else if (data.status === 'approved') targetRole = 'pic_verifikator';
                else if (data.status === 'reviewed_pic') targetRole = 'bendahara';

                if (targetRole) {
                    const profiles = await dbService.getProfilesByRole(targetRole);
                    if (targetRole === 'kepala_bidang' || targetRole.startsWith('pic_wilayah_')) {
                        const filtered = profiles.filter(p => 
                            p.department?.toLowerCase().includes(data.requester_department?.toLowerCase() || '')
                        );
                        setValidators(filtered);
                    } else {
                        setValidators(profiles);
                    }
                }
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
        if (!id || !user || !request) return;
        
        if (isReject && !validatorNote.trim()) {
            alert("Harap berikan alasan penolakan/revisi agar pengaju dapat memperbaikinya.");
            return;
        }

        setActionLoading(true);
        try {
            let noteField: keyof BudgetRequest = 'pic_note';
            const role = user.role;

            if (role === 'validator_program') noteField = 'program_note';
            else if (role === 'kepala_bidang') noteField = 'structural_note';
            else if (role === 'validator_tu') noteField = 'tu_note';
            else if (role === 'validator_ppk') noteField = 'ppk_note';
            else noteField = 'pic_note';

            const extraData: Partial<BudgetRequest> = {};
            if (status === 'realized') {
                extraData.realization_amount = realizationAmount;
                extraData.realization_date = new Date().toISOString();
            }

            const success = await dbService.updateStatus(
                id, 
                status, 
                validatorNote.trim() ? { field: noteField, value: validatorNote } : undefined,
                extraData
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

    const handleSpjUpload = async () => {
        if (!id || !request) return;
        
        if (isReceiptOnly) {
            if (!files.receipt && !request.spj_url) return alert("Pilih file Kuitansi");
        } else {
            if (!files.sppd && !request.sppd_url) return alert("Pilih file SPPD");
            if (!files.report && !request.report_url) return alert("Pilih file Laporan");
            if (!files.receipt && !request.spj_url) return alert("Pilih file Kuitansi");
        }

        setSpjLoading(true);
        try {
            const updates: any = {};
            if (files.sppd) updates.sppd_url = await dbService.uploadAttachment(files.sppd);
            if (files.report) updates.report_url = await dbService.uploadAttachment(files.report);
            if (files.receipt) updates.spj_url = await dbService.uploadAttachment(files.receipt);

            const success = await dbService.updateRequest(id, updates);
            if (success) {
                alert("Dokumen Berhasil diunggah. Silakan hubungi PIC Verifikator.");
                fetchRequest();
                setFiles({});
            }
        } catch (err) {
            alert("Gagal mengunggah dokumen.");
        } finally {
            setSpjLoading(false);
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
            return { title: 'Penyelesaian Pembayaran', subtitle: 'Bendahara Pengeluaran', targetStatus: 'realized' as BudgetStatus, icon: <Coins size={24} />, color: 'emerald', buttonLabel: 'Konfirmasi Pembayaran Selesai' };
        }
        return null;
    }, [user, request]);

    const handleWhatsAppContact = (target: Profile, type: 'validator' | 'requester') => {
        if (!target.whatsapp_number) {
            alert(`Nomor WhatsApp ${type === 'validator' ? 'petugas' : 'pengaju'} tidak tersedia.`);
            return;
        }
        const phoneNumber = target.whatsapp_number.replace(/\D/g, '');
        let message = '';
        if (type === 'validator') {
            message = `Halo Bapak/Ibu ${target.full_name}, saya ${user?.full_name} baru saja mengunggah dokumen penyelesaian untuk berkas: "${request?.title}". Mohon bantuannya untuk meninjau berkas tersebut. Terima kasih.`;
        } else {
            message = `Halo ${target.full_name}, saya ${user?.full_name} dari Pusdal LH Suma sedang meninjau kelengkapan berkas Anda: "${request?.title}". Mohon segera melengkapi...`;
        }
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const copyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Formating Kendali Number: [Urut]/[Dept]/[Bulan-Romawi]/[Tahun]
    const kendaliNo = useMemo(() => {
        if (!request) return "...";
        const date = new Date(request.created_at);
        const urut = sequenceNumber.toString().padStart(3, '0');
        const dept = getDeptCode(request.requester_department || '');
        const romawi = getRomanMonth(date.getMonth());
        const tahun = date.getFullYear();
        return `${urut}/${dept}/${romawi}/${tahun}`;
    }, [request, sequenceNumber]);

    if (loading && !request) return <div className="flex items-center justify-center py-40 flex-col gap-4"><Loader2 className="animate-spin text-blue-600" size={64} /><p className="text-[10px] font-black uppercase text-slate-400">Menyinkronkan Berkas...</p></div>;
    
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

    const statusInfo = {
        draft: { label: 'DRAF', color: 'bg-slate-100 text-slate-600' },
        pending: { label: 'ANTRIAN KABID', color: 'bg-amber-50 text-amber-700' },
        reviewed_bidang: { label: 'ANTRIAN PROGRAM', color: 'bg-blue-50 text-blue-700' },
        reviewed_program: { label: 'ANTRIAN PROGRAM OK', color: 'bg-indigo-50 text-indigo-700' },
        reviewed_tu: { label: 'ANTRIAN PPK', color: 'bg-purple-50 text-purple-700' },
        approved: { label: 'DISETUJUI (SIAP SPJ)', color: 'bg-emerald-50 text-emerald-700' },
        reviewed_pic: { label: 'SPJ TERVERIFIKASI', color: 'bg-cyan-50 text-cyan-700' },
        rejected: { label: 'REVISI / DITOLAK', color: 'bg-red-50 text-red-700' },
        realized: { label: 'REALISASI SELESAI', color: 'bg-emerald-600 text-white' }
    }[request.status] || { label: request.status.toUpperCase(), color: 'bg-slate-50 text-slate-700' };

    const getPersonnelByRole = (role: string, dept?: string) => {
        return allPersonnel.filter(p => {
            if (p.role !== role) return false;
            if (dept && (role === 'kepala_bidang' || role.startsWith('pic_wilayah_'))) {
                return p.department?.toLowerCase().includes(dept.toLowerCase());
            }
            return true;
        });
    };

    const detailedSteps = [
        { s: 'pending', l: 'Diajukan', role: 'Pengaju', icon: <User size={14} />, names: request.requester_name },
        { s: 'reviewed_bidang', l: 'Persetujuan Kabid', role: 'Kepala Bidang', icon: <UserCheck size={14} />, hidden: isStructuralSkipped, names: getPersonnelByRole('kepala_bidang', request.requester_department).map(p => p.full_name).join(', ') },
        { s: 'reviewed_program', l: 'Validasi Program', role: 'Validator Program', icon: <GanttChart size={14} />, names: getPersonnelByRole('validator_program').map(p => p.full_name).join(', ') },
        { s: 'reviewed_tu', l: 'Validasi TU', role: 'Kasubag TU', icon: <FileSearch size={14} />, names: getPersonnelByRole('validator_tu').map(p => p.full_name).join(', ') },
        { s: 'approved', l: 'Pengesahan PPK', role: 'Pejabat PPK', icon: <Stamp size={14} />, names: getPersonnelByRole('validator_ppk').map(p => p.full_name).join(', ') },
        { s: 'reviewed_pic', l: 'Verifikasi SPJ', role: 'PIC Verifikator', icon: <ShieldIcon size={14} />, names: getPersonnelByRole('pic_verifikator').map(p => p.full_name).join(', ') },
        { s: 'realized', l: 'Pembayaran', role: 'Bendahara', icon: <Coins size={14} />, names: getPersonnelByRole('bendahara').map(p => p.full_name).join(', ') }
    ].filter(step => !step.hidden);

    const isStepCompleted = (stepStatus: string) => {
        const statusOrder = ['pending', 'reviewed_bidang', 'reviewed_program', 'reviewed_tu', 'approved', 'reviewed_pic', 'realized'];
        return statusOrder.indexOf(request.status) >= statusOrder.indexOf(stepStatus);
    };

    const hasAnyNotes = request.structural_note || request.program_note || request.tu_note || request.ppk_note || request.pic_note;

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-20 page-transition print:space-y-0 print:pb-0 print:m-0 print:bg-white print:text-black print:overflow-visible">
            
            <div className="print-only mb-6 border-b-[3pt] border-black pb-4 break-inside-avoid">
                <div className="flex items-center pl-12 pr-6">
                    <Logo className="w-28 h-28 object-contain mr-8" />
                    <div className="flex-1 text-center pr-12">
                        <h2 className="text-[13.5pt] font-bold uppercase leading-tight">Kementerian Lingkungan Hidup /</h2>
                        <h3 className="text-[13.5pt] font-bold uppercase leading-tight mt-1">Badan Pengendalian Lingkungan Hidup RI</h3>
                        <h3 className="text-[14.5pt] font-black uppercase leading-tight mt-1">Pusat Pengendalian Lingkungan Hidup Sulawesi Maluku</h3>
                        <p className="text-[8.5pt] mt-3 leading-tight italic font-medium">Jln. Perintis Kemerdekaan KM. 17, Makassar. Email: sekretariat@pusdalsuma.go.id</p>
                    </div>
                </div>
            </div>

            <div className="print-only text-center mb-6 break-inside-avoid">
                <h2 className="text-[12pt] font-black underline uppercase tracking-tight">KARTU KENDALI PENGAJUAN ANGGARAN</h2>
                <p className="text-[9pt] font-black mt-1 uppercase">NOMOR KENDALI: {kendaliNo}</p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white border rounded-2xl shadow-sm hover:bg-slate-50 transition-all"><ArrowLeft size={20} /></button>
                    <div><h1 className="text-2xl font-black uppercase tracking-tight">Rincian Berkas</h1></div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={copyLink}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${copied ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm'}`}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? 'Tersalin' : 'Salin Link'}
                    </button>

                    {user?.role === 'admin' && (
                        <Link 
                            to={`/requests/edit/${request.id}`}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 shadow-sm"
                        >
                            <Edit2 size={18} /> Edit Berkas
                        </Link>
                    )}

                    {isValidatorRole(user?.role) && request.profiles && (
                        <button 
                            onClick={() => handleWhatsAppContact(request.profiles!, 'requester')}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-95`}
                        >
                            <MessageCircle size={18} /> Chat Pengaju
                        </button>
                    )}
                    <div className={`px-5 py-3 rounded-2xl border font-black text-[10px] uppercase tracking-widest ${statusInfo.color}`}>{statusInfo.label}</div>
                    <button onClick={() => window.print()} className="p-3 bg-white border rounded-2xl shadow-sm hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm"><Printer size={20} /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 print:block">
                <div className="xl:col-span-3 space-y-8 print:w-full print:space-y-4 print:mt-0">
                    
                    {/* RIWAYAT CATATAN & ARAHAN */}
                    {hasAnyNotes && (
                        <div className={`no-print bg-white p-8 md:p-10 rounded-[48px] border-4 shadow-2xl space-y-6 animate-in slide-in-from-top-4 duration-500 ${request.status === 'rejected' ? 'border-red-100' : 'border-slate-100'}`}>
                            <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${request.status === 'rejected' ? 'bg-red-600 text-white shadow-red-100' : 'bg-slate-900 text-white shadow-slate-100 shadow-lg'}`}>
                                    <MessageSquareText size={20} />
                                </div>
                                <div>
                                    <h3 className={`text-sm font-black uppercase tracking-tight ${request.status === 'rejected' ? 'text-red-600' : 'text-slate-900'}`}>Riwayat Catatan & Arahan</h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Disposisi resmi dari tiap tahapan verifikasi</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                                {request.structural_note && (
                                    <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-[32px] space-y-2">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                                            <UserCheck size={12} /> Verifikasi Struktural (Kabid)
                                        </div>
                                        <p className="text-xs font-bold text-slate-700 uppercase leading-relaxed italic">"{request.structural_note}"</p>
                                    </div>
                                )}
                                {request.program_note && (
                                    <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-[32px] space-y-2">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-amber-700 uppercase tracking-widest">
                                            <GanttChart size={12} /> Validasi Program & Anggaran
                                        </div>
                                        <p className="text-xs font-bold text-slate-700 uppercase leading-relaxed italic">"{request.program_note}"</p>
                                    </div>
                                )}
                                {request.tu_note && (
                                    <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-[32px] space-y-2">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-indigo-700 uppercase tracking-widest">
                                            <FileSearch size={12} /> Validasi Administrasi (TU)
                                        </div>
                                        <p className="text-xs font-bold text-slate-700 uppercase leading-relaxed italic">"{request.tu_note}"</p>
                                    </div>
                                )}
                                {request.ppk_note && (
                                    <div className="p-6 bg-purple-50/50 border border-purple-100 rounded-[32px] space-y-2">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-purple-700 uppercase tracking-widest">
                                            <Stamp size={12} /> Pengesahan Pejabat PPK
                                        </div>
                                        <p className="text-xs font-bold text-slate-700 uppercase leading-relaxed italic">"{request.ppk_note}"</p>
                                    </div>
                                )}
                                {request.pic_note && (
                                    <div className="p-6 bg-cyan-50/50 border border-cyan-100 rounded-[32px] space-y-2">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-cyan-700 uppercase tracking-widest">
                                            <ShieldIcon size={12} /> Verifikasi Kelengkapan SPJ (PIC)
                                        </div>
                                        <p className="text-xs font-bold text-slate-700 uppercase leading-relaxed italic">"{request.pic_note}"</p>
                                    </div>
                                )}
                            </div>

                            {/* TOMBOL PERBAIKI KHUSUS PENGAJU SAAT REJECTED */}
                            {request.status === 'rejected' && request.requester_id === user?.id && (
                                <div className="pt-4 animate-bounce">
                                    <Link 
                                        to={`/requests/edit/${request.id}`}
                                        className="w-full py-5 bg-red-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl hover:bg-red-700 transition-all active:scale-95"
                                    >
                                        <RefreshCw size={20} /> Perbaiki & Ajukan Ulang Sekarang
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PANEL VERIFIKASI (Input untuk Verifikator) */}
                    {actionConfig && (
                        <div className={`no-print bg-white p-8 md:p-10 rounded-[48px] border-4 border-${actionConfig.color}-100 shadow-2xl space-y-8 animate-in slide-in-from-top-4 duration-500`}>
                            <div className={`flex items-center gap-4 border-b border-${actionConfig.color}-50 pb-6`}>
                                <div className={`w-12 h-12 bg-${actionConfig.color}-600 text-white rounded-2xl flex items-center justify-center shadow-lg`}>{actionConfig.icon}</div>
                                <div><h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{actionConfig.title}</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{actionConfig.subtitle}</p></div>
                            </div>

                            {/* Input Khusus Bendahara: Nominal Realisasi */}
                            {user?.role === 'bendahara' && request.status === 'reviewed_pic' && (
                                <div className="space-y-4 p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                                    <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1 flex items-center gap-2"><Banknote size={14} /> Nominal Realisasi Pembayaran (IDR)</label>
                                    <div className="relative group">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-black text-emerald-300 group-focus-within:text-emerald-600 transition-colors">Rp</span>
                                        <input 
                                            type="number" 
                                            className="w-full pl-16 pr-6 py-5 bg-white border-2 border-emerald-100 rounded-2xl text-xl font-black outline-none focus:border-emerald-600 transition-all shadow-lg shadow-emerald-100/50" 
                                            value={realizationAmount} 
                                            onChange={(e) => setRealizationAmount(Number(e.target.value))} 
                                            placeholder="0"
                                        />
                                    </div>
                                    <p className="text-[9px] font-bold text-emerald-600 uppercase italic">* Masukkan nominal yang benar-benar dibayarkan sesuai bukti bayar.</p>
                                </div>
                            )}

                            {/* Show SPJ Documents for PIC Verifikator */}
                            {user?.role?.startsWith('pic_') && request.status === 'approved' && (
                                <div className={`grid grid-cols-1 ${isReceiptOnly ? 'md:grid-cols-1 max-w-sm mx-auto' : 'md:grid-cols-3'} gap-4`}>
                                    {!isReceiptOnly && (
                                        <>
                                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-3 text-center">
                                                <FileCheck className="text-blue-500" />
                                                <p className="text-[9px] font-black uppercase">File SPPD</p>
                                                {request.sppd_url ? (
                                                    <a href={request.sppd_url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase flex items-center gap-2"><Eye size={12} /> Buka</a>
                                                ) : (
                                                    <span className="text-[8px] font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-xl uppercase">BELUM ADA</span>
                                                )}
                                            </div>
                                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-3 text-center">
                                                <FileText className="text-emerald-500" />
                                                <p className="text-[9px] font-black uppercase">Laporan Perjadin</p>
                                                {request.report_url ? (
                                                    <a href={request.report_url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase flex items-center gap-2"><Eye size={12} /> Buka</a>
                                                ) : (
                                                    <span className="text-[8px] font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-xl uppercase">BELUM ADA</span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-3 text-center">
                                        <Receipt className="text-amber-500" />
                                        <p className="text-[9px] font-black uppercase">Kuitansi / SPJ</p>
                                        {request.spj_url ? (
                                            <a href={request.spj_url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase flex items-center gap-2"><Eye size={12} /> Buka</a>
                                        ) : (
                                            <span className="text-[8px] font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-xl uppercase">BELUM ADA</span>
                                        )}
                                    </div>
                                </div>
                            )}

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

                    {/* DOKUMEN PENYELESAIAN (Input untuk Pengaju) */}
                    {request.requester_id === user?.id && request.status === 'approved' && (
                        <div className="no-print bg-emerald-900 p-8 md:p-10 rounded-[48px] shadow-2xl text-white space-y-10 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                            <div className="relative flex items-center gap-4">
                                <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><UploadCloud size={28} /></div>
                                    <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight">Penyelesaian Administrasi (SPJ)</h3>
                                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                                        {isReceiptOnly ? 'Silakan unggah kuitansi pembayaran untuk verifikasi' : 'Silakan lengkapi dokumen setelah kegiatan selesai'}
                                    </p>
                                </div>
                            </div>

                            <div className={`grid grid-cols-1 ${isReceiptOnly ? 'md:grid-cols-1 max-w-sm mx-auto' : 'md:grid-cols-3'} gap-6`}>
                                {!isReceiptOnly && (
                                    <>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-emerald-200">Lampiran SPPD</label>
                                            <div className="relative group">
                                                <input 
                                                    type="file" 
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                                    onChange={(e) => setFiles(prev => ({...prev, sppd: e.target.files?.[0]}))} 
                                                />
                                                <div className={`p-6 bg-white/10 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-3 transition-all ${files.sppd ? 'border-emerald-400 bg-emerald-400/20' : 'border-white/20 hover:border-white/40'}`}>
                                                    {files.sppd ? <CheckCircle size={24} className="text-emerald-400" /> : <FileCheck />}
                                                    <p className="text-[9px] font-black uppercase text-center truncate w-full">
                                                        {files.sppd?.name || (request.sppd_url ? 'Update SPPD' : 'Pilih Berkas')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-emerald-200">Laporan Perjadin</label>
                                            <div className="relative group">
                                                <input 
                                                    type="file" 
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                                    onChange={(e) => setFiles(prev => ({...prev, report: e.target.files?.[0]}))} 
                                                />
                                                <div className={`p-6 bg-white/10 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-3 transition-all ${files.report ? 'border-emerald-400 bg-emerald-400/20' : 'border-white/20 hover:border-white/40'}`}>
                                                    {files.report ? <CheckCircle size={24} className="text-emerald-400" /> : <FileText />}
                                                    <p className="text-[9px] font-black uppercase text-center truncate w-full">
                                                        {files.report?.name || (request.report_url ? 'Update Laporan' : 'Pilih Berkas')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-emerald-200">Kuitansi / Bukti Bayar</label>
                                    <div className="relative group">
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                            onChange={(e) => setFiles(prev => ({...prev, receipt: e.target.files?.[0]}))} 
                                        />
                                        <div className={`p-6 bg-white/10 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-3 transition-all ${files.receipt ? 'border-emerald-400 bg-emerald-400/20' : 'border-white/20 hover:border-white/40'}`}>
                                            {files.receipt ? <CheckCircle size={24} className="text-emerald-400" /> : <Receipt />}
                                            <p className="text-[9px] font-black uppercase text-center truncate w-full">
                                                {files.receipt?.name || (request.spj_url ? 'Update Kuitansi' : 'Pilih Berkas')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleSpjUpload} 
                                disabled={spjLoading}
                                className="w-full py-5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl transition-all"
                            >
                                {spjLoading ? <Loader2 className="animate-spin" /> : <Send className="rotate-45" size={20} />} 
                                Kirim Dokumen Penyelesaian
                            </button>
                        </div>
                    )}

                    <div className="bg-white p-10 rounded-[56px] border border-slate-200 shadow-sm print:p-0 print:border-none print:shadow-none break-inside-avoid print:overflow-visible">
                        <div className="space-y-6 print:space-y-2">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight print:text-[11pt] print:font-black leading-snug print:whitespace-normal print:overflow-visible break-words">{request.title}</h2>
                            <div className="w-full h-px bg-slate-100 print:bg-black print:h-[1.2pt]"></div>
                            <div className="grid grid-cols-2 gap-x-12 print:gap-x-8">
                                <div className="space-y-2 print:space-y-1">
                                    <div className="flex items-baseline gap-2 text-[6.5pt] uppercase print:text-[8pt]"><span className="w-24 font-bold text-slate-400 print:text-black">Kategori</span><span className="font-black">: {request.category}</span></div>
                                    <div className="flex items-baseline gap-2 text-[6.5pt] uppercase print:text-[8pt]"><span className="w-24 font-bold text-slate-400 print:text-black">Unit Kerja</span><span className="font-black">: {request.requester_department}</span></div>
                                    <div className="flex items-baseline gap-2 text-[6.5pt] uppercase print:text-[8pt]"><span className="w-24 font-bold text-slate-400 print:text-black">Lokasi</span><span className="font-black">: {request.location}</span></div>
                                    <div className="flex items-baseline gap-2 text-[6.5pt] uppercase print:text-[8pt]"><span className="w-24 font-bold text-slate-400 print:text-black">Personil</span><span className="font-black">: {request.assigned_personnel || '-'}</span></div>
                                </div>
                                <div className="space-y-2 print:space-y-1">
                                    <div className="flex items-baseline gap-2 text-[6.5pt] uppercase print:text-[8pt]"><span className="w-24 font-bold text-slate-400 print:text-black">Tanggal</span><span className="font-black">: {new Date(request.execution_date).toLocaleDateString('id-ID')}</span></div>
                                    <div className="flex items-baseline gap-2 text-[6.5pt] uppercase print:text-[8pt]"><span className="w-24 font-bold text-slate-400 print:text-black">Durasi</span><span className="font-black">: {request.execution_duration}</span></div>
                                    <div className="flex items-baseline gap-2 text-[6.5pt] uppercase print:text-[8pt]"><span className="w-24 font-bold text-slate-400 print:text-black">Pengaju</span><span className="font-black">: {request.requester_name}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-x-auto print:rounded-none print:border-black print:border-[1pt] print:shadow-none break-inside-avoid print:overflow-visible">
                        <table className="w-full min-w-[900px] text-left border-collapse print:table-fixed print:min-w-0 print:overflow-visible">
                            <thead className="bg-slate-50 print:bg-gray-200 border-b border-slate-100 print:border-black print:overflow-visible">
                                <tr className="text-[9px] font-black text-slate-400 uppercase print:text-black print:overflow-visible">
                                    <th className="px-6 py-4 border-r print:border-black print:border-[0.5pt] print:text-[8pt] print:py-2 print:px-3 print:w-[15%] print:align-top print:whitespace-normal">Struktur / Akun</th>
                                    <th className="px-6 py-4 border-r print:border-black print:border-[0.5pt] print:text-[8pt] print:py-2 print:px-3 print:w-[42%] print:align-top print:whitespace-normal">Uraian & Perincian</th>
                                    <th className="px-6 py-4 border-r print:border-black print:border-[0.5pt] print:text-[8pt] print:py-2 print:px-3 text-center print:w-[10%] print:align-top print:whitespace-normal">Vol</th>
                                    <th className="px-6 py-4 border-r print:border-black print:border-[0.5pt] print:text-[8pt] print:py-2 print:px-3 text-right print:w-[15%] print:align-top print:whitespace-normal">Harga</th>
                                    <th className="px-6 py-4 print:text-[8pt] print:border-black print:border-[0.5pt] print:py-2 print:px-3 text-right print:w-[18%] print:align-top print:whitespace-normal">Jumlah (IDR)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 print:divide-y-0 print:overflow-visible">
                                {request.calculation_items?.map((item, idx) => (
                                    <tr key={`item-${idx}`} className="print:border-black break-inside-avoid print:overflow-visible">
                                        <td className="px-6 py-4 border-r print:border-black print:border-[0.5pt] print:py-1.5 print:px-2 print:align-top print:whitespace-normal print:overflow-visible">
                                            <p className="text-[8px] font-black print:text-[7pt] break-words leading-tight print:overflow-visible print:whitespace-normal">{item.ro_code}.{item.komponen_code}.{item.subkomponen_code}</p>
                                            <p className="text-[7px] font-bold text-blue-600 print:text-black print:text-[6.5pt] break-words leading-tight print:overflow-visible print:whitespace-normal">{item.kode_akun}</p>
                                        </td>
                                        <td className="px-6 py-4 border-r print:border-black print:border-[0.5pt] print:py-1.5 print:px-3 print:align-top print:whitespace-normal print:overflow-visible">
                                            {item.header && (
                                                <p className="text-[9px] font-black uppercase text-slate-900 print:text-[8pt] border-b border-slate-100 print:border-black/10 pb-1 mb-1 break-words leading-tight print:overflow-visible print:whitespace-normal">
                                                    {item.header}
                                                </p>
                                            )}
                                            {item.sub_header && (
                                                <p className="text-[8px] font-bold uppercase text-slate-500 print:text-[7pt] italic mb-1 break-words leading-tight print:overflow-visible print:whitespace-normal">
                                                    {item.sub_header}
                                                </p>
                                            )}
                                            
                                            <p className="text-xs font-bold uppercase print:text-[8pt] leading-tight break-words print:overflow-visible print:whitespace-normal">{item.title}</p>
                                            {item.detail_barang && <p className="text-[8px] text-slate-400 italic print:text-black print:text-[6.5pt] break-words mt-0.5 leading-tight print:overflow-visible print:whitespace-normal">Rincian: {item.detail_barang}</p>}
                                            <p className="text-[9px] md:text-[8px] text-slate-500 font-bold italic mt-2 leading-tight print:text-[6.5pt] print:text-black uppercase break-words print:overflow-visible print:whitespace-normal">
                                                ({item.f1_val} {item.f1_unit} 
                                                {item.f2_unit ? ` x ${item.f2_val} ${item.f2_unit}` : ''} 
                                                {item.f3_unit ? ` x ${item.f3_val} ${item.f3_unit}` : ''} 
                                                {item.f4_unit ? ` x ${item.f4_val} ${item.f4_unit}` : ''})
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center border-r print:border-black print:border-[0.5pt] print:py-1.5 print:px-2 print:align-top print:whitespace-normal print:overflow-visible">
                                            <span className="text-xs font-black print:text-[7.5pt] leading-tight print:overflow-visible print:whitespace-normal">{item.volkeg} {item.satkeg}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right border-r print:border-black print:border-[0.5pt] print:py-1.5 print:px-2 text-xs print:text-[7.5pt] print:align-top print:whitespace-normal print:overflow-visible">
                                            <span className="leading-tight print:overflow-visible print:whitespace-normal">{item.hargaSatuan.toLocaleString('id-ID')}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-black font-mono print:text-[8pt] print:border-black print:border-[0.5pt] print:py-1.5 print:px-2 print:align-top print:whitespace-normal print:overflow-visible">
                                            <span className="leading-tight print:overflow-visible print:whitespace-normal">{item.jumlah.toLocaleString('id-ID')}</span>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-950 text-white print:bg-gray-100 print:text-black print:border-t-[1.2pt] print:border-black break-inside-avoid print:overflow-visible">
                                    <td colSpan={4} className="px-6 py-4 text-right text-[10px] font-black uppercase border-r print:border-black print:border-[0.5pt] print:text-[9pt] print:py-3 print:px-4 print:overflow-visible">TOTAL KESELURUHAN</td>
                                    <td className="px-6 py-4 text-right text-lg font-black font-mono print:text-[10pt] print:border-black print:border-[0.5pt] print:py-3 print:px-4 print:overflow-visible">Rp {request.amount.toLocaleString('id-ID')}</td>
                                </tr>
                                {request.status === 'realized' && (
                                    <tr className="bg-emerald-600 text-white print:bg-gray-50 print:text-black print:border-t-[1pt] print:border-black break-inside-avoid print:overflow-visible">
                                        <td colSpan={4} className="px-6 py-4 text-right text-[10px] font-black uppercase border-r print:border-black print:border-[0.5pt] print:text-[9pt] print:py-3 print:px-4 flex items-center justify-end gap-2 print:overflow-visible"><Banknote size={16} /> TOTAL REALISASI DIBAYARKAN</td>
                                        <td className="px-6 py-4 text-right text-lg font-black font-mono print:text-[10pt] print:border-black print:border-[0.5pt] print:py-3 print:px-4 print:overflow-visible">Rp {request.realization_amount?.toLocaleString('id-ID')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm print:p-4 print:border-black print:border-[1pt] print:shadow-none print:mt-4 break-inside-avoid print:overflow-visible">
                        <p className="text-xs font-black uppercase tracking-widest print:text-[8.5pt] underline mb-1">Justifikasi Kebutuhan:</p>
                        <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase print:text-black print:text-[8pt] text-justify break-words print:whitespace-normal print:overflow-visible">{request.description || "TIDAK ADA DESKRIPSI."}</p>
                    </div>

                    <div className="print-only mt-6 break-inside-avoid print:overflow-visible">
                        <table className="w-full border-collapse border-[1pt] border-black text-center table-fixed print:overflow-visible">
                            <thead className="bg-gray-100"><tr className="text-[8.5pt] font-black uppercase"><th className="border-black py-2 w-1/3 border-[1pt]">VALIDASI PROGRAM</th><th className="border-black py-2 w-1/3 border-[1pt]">VALIDASI TU</th><th className="border-black py-2 w-1/3 border-[1pt]">PENGESAHAN PPK</th></tr></thead>
                            <tbody>
                                <tr className="h-20">
                                    <td className="border-black relative border-[1pt]">
                                        {isStepCompleted('reviewed_program') && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-70">
                                                <div className="border-[2pt] border-emerald-900 text-emerald-900 px-2 py-1 font-black text-[8pt] rotate-[-8deg] uppercase mb-1">TERVERIFIKASI</div>
                                                <p className="text-[7pt] font-black text-slate-900 uppercase">{getPersonnelByRole('validator_program').map(p => p.full_name).join(', ')}</p>
                                            </div>
                                        )}
                                    </td>
                                    <td className="border-black relative border-[1pt]">
                                        {isStepCompleted('reviewed_tu') && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-70">
                                                <div className="border-[2pt] border-blue-900 text-blue-900 px-2 py-1 font-black text-[8pt] rotate-[-8deg] uppercase mb-1">TERVERIFIKASI</div>
                                                <p className="text-[7pt] font-black text-slate-900 uppercase">{getPersonnelByRole('validator_tu').map(p => p.full_name).join(', ')}</p>
                                            </div>
                                        )}
                                    </td>
                                    <td className="border-black relative border-[1pt]">
                                        {isStepCompleted('approved') && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <div className="border-[2.5pt] border-red-900 text-red-900 px-3 py-1.5 font-black text-[9.5pt] rotate-[-5deg] uppercase mb-1">DISETUJUI PPK</div>
                                                <p className="text-[7pt] font-black text-slate-900 uppercase">{getPersonnelByRole('validator_ppk').map(p => p.full_name).join(', ')}</p>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                <tr className="text-[7.5pt] font-bold uppercase">
                                    <td className="border-black py-2 border-[1pt]">Tgl: {request.updated_at ? new Date(request.updated_at).toLocaleDateString('id-ID') : '... / ... / ...'}</td>
                                    <td className="border-black py-2 border-[1pt]">Tgl: {request.updated_at ? new Date(request.updated_at).toLocaleDateString('id-ID') : '... / ... / ...'}</td>
                                    <td className="border-black py-2 border-[1pt]">Tgl: {request.updated_at ? new Date(request.updated_at).toLocaleDateString('id-ID') : '... / ... / ...'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="print-only mt-4 break-inside-avoid print:overflow-visible">
                        <div className="border border-black p-3 flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-4">
                                <p className="text-[8.5pt] font-black uppercase">Verifikasi Kelengkapan SPJ (PIC):</p>
                                <p className="text-[8.5pt] font-bold uppercase italic">
                                    {isStepCompleted('reviewed_pic') ? 'TERVERIFIKASI' : 'BELUM TERVERIFIKASI'}
                                </p>
                            </div>
                            <p className="text-[8.5pt] font-black uppercase">
                                PIC: {getPersonnelByRole('pic_verifikator').map(p => p.full_name).join(', ') || '-'}
                            </p>
                        </div>
                    </div>

                    <div className="print-only mt-10 break-inside-avoid print:overflow-visible">
                        <div className="grid grid-cols-2 gap-12 text-center text-[9pt]">
                            <div className="space-y-16">
                                <div>
                                    <p className="font-bold">Mengetahui,</p>
                                    <p className="font-black uppercase leading-tight">Kepala {request.requester_department}</p>
                                </div>
                                <div>
                                    <p className="font-black underline uppercase">
                                        ( {getPersonnelByRole('kepala_bidang', request.requester_department).map(p => p.full_name).join(' / ') || '.....................................................'} )
                                    </p>
                                    <p className="text-[8pt] mt-1">NIP. ..................................................</p>
                                </div>
                            </div>
                            <div className="space-y-16">
                                <div>
                                    <p className="font-bold">Makassar, {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</p>
                                    <p className="font-black uppercase leading-tight">Pengusul / Penanggung Jawab,</p>
                                </div>
                                <div>
                                    <p className="font-black underline uppercase">( {request.requester_name} )</p>
                                    <p className="text-[8pt] mt-1">NIP. ..................................................</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-1 space-y-8 no-print">
                    {request.requester_id === user?.id && request.status !== 'realized' && request.status !== 'rejected' && (
                        <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl text-white space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                <Users size={20} className="text-emerald-400" />
                                <h4 className="text-[11px] font-black uppercase tracking-widest">Hubungi Petugas</h4>
                            </div>
                            
                            {validators.length > 0 ? (
                                <div className="space-y-4">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">
                                        {request.status === 'approved' ? 'Hubungi PIC Verifikator setelah berkas penyelesaian diunggah:' : 'Pilih petugas yang berwenang memproses berkas Anda saat ini:'}
                                    </p>
                                    <div className="space-y-3">
                                        {validators.map((v) => (
                                            <button 
                                                key={v.id}
                                                onClick={() => handleWhatsAppContact(v, 'validator')}
                                                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all text-left group"
                                            >
                                                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                    <MessageCircle size={18} />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-[10px] font-black truncate uppercase">{v.full_name}</p>
                                                    <p className="text-[8px] font-bold text-slate-500 truncate uppercase">{v.role.replace(/_/g, ' ')}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                    <SearchCode size={32} className="mx-auto mb-3 text-slate-600" />
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Petugas berwenang belum mendaftarkan nomor kontak.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {request.attachment_url && (
                        <div className="bg-white p-8 rounded-[40px] border border-blue-100 shadow-sm space-y-6 text-center">
                            <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Berkas Usulan Awal</h4>
                            <a href={request.attachment_url} target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"><Eye size={14} /> Lihat Berkas</a>
                        </div>
                    )}

                    <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm sticky top-24">
                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest text-center mb-10">Status Terkini</h4>
                        <div className="space-y-0 relative ml-4">
                            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-slate-100"></div>
                            {detailedSteps.map((step) => (
                                <div key={step.s} className="relative flex items-start gap-5 pb-8 last:pb-0">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isStepCompleted(step.s) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>{step.icon}</div>
                                    <div className="flex-1 -mt-1">
                                        <p className="text-[10px] font-black uppercase text-slate-900">{step.l}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">{step.role}</p>
                                        {step.names && <p className="text-[8px] font-black text-blue-600 uppercase mt-1 italic">{step.names}</p>}
                                    </div>
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
