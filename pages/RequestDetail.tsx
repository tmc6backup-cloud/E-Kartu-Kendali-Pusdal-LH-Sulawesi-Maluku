
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
    ExternalLink
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
        const success = await dbService.updateStatus(id, status, validatorNote.trim() ? { field: 'program_note', value: validatorNote } : undefined);
        if (success) {
            alert("Status berkas berhasil diperbarui.");
            fetchRequest();
            setValidatorNote("");
        }
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

    const isStepCompleted = (stepStatus: string) => {
        const statusOrder = ['pending', 'reviewed_bidang', 'reviewed_program', 'reviewed_tu', 'approved', 'reviewed_pic', 'realized'];
        const currentIndex = statusOrder.indexOf(request.status);
        const stepIndex = statusOrder.indexOf(stepStatus);
        return currentIndex >= stepIndex;
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-20 page-transition print:space-y-0 print:pb-0 print:m-0 print:bg-white print:text-black">
            
            {/* KOP SURAT PRINT - Ultra Kompak */}
            <div className="print-only mb-1 print:block">
                <div className="flex items-center border-b-[1.5pt] border-black pb-1">
                    <Logo className="w-12 h-12 object-contain mr-3" />
                    <div className="flex-1 text-center">
                        <h2 className="text-[8.5pt] font-bold uppercase leading-none">Kementerian Lingkungan Hidup dan Kehutanan</h2>
                        <h3 className="text-[7.5pt] font-bold uppercase leading-none mt-1">Badan Pengendalian Lingkungan Hidup</h3>
                        <h3 className="text-[8.5pt] font-black uppercase leading-none mt-1">Pusat Pengendalian Lingkungan Hidup Sulawesi Maluku</h3>
                        <p className="text-[5.5pt] mt-1 leading-none italic">Jln. Perintis Kemerdekaan KM. 17, Makassar. Telp: (0411) 556677</p>
                    </div>
                </div>
                <div className="border-b-[0.5pt] border-black h-[1pt] mt-[0.5pt]"></div>
            </div>

            <div className="print-only text-center mb-2">
                <h2 className="text-[9.5pt] font-black underline uppercase tracking-tight">KARTU KENDALI PENGAJUAN ANGGARAN</h2>
                <p className="text-[5.5pt] font-bold mt-0.5 uppercase">ID: {request.id.substring(0, 8).toUpperCase()} / {new Date().getFullYear()}</p>
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
                <div className="xl:col-span-3 space-y-8 print:w-full print:space-y-1.5 print:mt-0">
                    
                    {/* Metadata Section - Kompak */}
                    <div className="bg-white p-10 rounded-[56px] border border-slate-200 shadow-sm print:border-none print:p-0 print:rounded-none">
                        <div className="space-y-6 print:space-y-0.5">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight print:text-[8.5pt] print:mb-0.5 print:leading-tight">{request.title}</h2>
                            <div className="w-full h-px bg-slate-100 print:bg-black print:h-[0.5pt]"></div>

                            <div className="grid grid-cols-2 gap-x-12 print:gap-x-4 print:gap-y-0">
                                <div className="space-y-2 print:space-y-0">
                                    <div className="flex items-baseline gap-2 text-[6.5pt] uppercase">
                                        <span className="w-16 font-bold text-slate-400 print:text-black">Kategori</span>
                                        <span className="font-black print:font-bold">: {request.category}</span>
                                    </div>
                                    <div className="flex items-baseline gap-2 text-[6.5pt] uppercase">
                                        <span className="w-16 font-bold text-slate-400 print:text-black">Unit Kerja</span>
                                        <span className="font-black print:font-bold">: {request.requester_department}</span>
                                    </div>
                                    <div className="flex items-baseline gap-2 text-[6.5pt] uppercase">
                                        <span className="w-16 font-bold text-slate-400 print:text-black">Lokasi</span>
                                        <span className="font-black print:font-bold">: {request.location}</span>
                                    </div>
                                </div>
                                <div className="space-y-2 print:space-y-0">
                                    <div className="flex items-baseline gap-2 text-[6.5pt] uppercase">
                                        <span className="w-16 font-bold text-slate-400 print:text-black">Tanggal</span>
                                        <span className="font-black print:font-bold">: {new Date(request.execution_date).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</span>
                                    </div>
                                    <div className="flex items-baseline gap-2 text-[6.5pt] uppercase">
                                        <span className="w-16 font-bold text-slate-400 print:text-black">Durasi</span>
                                        <span className="font-black print:font-bold">: {request.execution_duration}</span>
                                    </div>
                                    <div className="flex items-baseline gap-2 text-[6.5pt] uppercase">
                                        <span className="w-16 font-bold text-slate-400 print:text-black">Pengaju</span>
                                        <span className="font-black print:font-bold">: {request.requester_name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Section - Tanpa Whitespace saat Print */}
                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm print:border-none print:mt-1 print:rounded-none">
                        <table className="w-full text-left border-collapse print:border-[0.5pt] print:border-black">
                            <thead className="bg-slate-50 print:bg-gray-100">
                                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest print:text-black border-b border-slate-100 print:border-black">
                                    <th className="px-6 py-4 print:py-0.5 print:px-2 border-r print:border-black print:text-[6.5pt]">Struktur / Akun</th>
                                    <th className="px-6 py-4 print:py-0.5 print:px-2 border-r print:border-black print:text-[6.5pt] w-[45%]">Uraian Detail</th>
                                    <th className="px-6 py-4 print:py-0.5 print:px-2 border-r print:border-black print:text-[6.5pt] text-center">Vol</th>
                                    <th className="px-6 py-4 print:py-0.5 print:px-2 border-r print:border-black print:text-[6.5pt] text-right">Satuan</th>
                                    <th className="px-6 py-4 print:py-0.5 print:px-2 print:text-[6.5pt] text-right">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 print:divide-black">
                                {request.calculation_items?.map((item, idx) => (
                                    <tr key={idx} className="print:border-b-[0.5pt] print:border-black">
                                        <td className="px-6 py-4 print:py-0.5 print:px-2 border-r print:border-black">
                                            <p className="text-[8px] font-black text-slate-900 print:text-[6pt]">{item.ro_code}.{item.komponen_code}.{item.subkomponen_code}</p>
                                            <p className="text-[7px] font-bold text-blue-600 print:text-black print:text-[5.5pt]">{item.kode_akun}</p>
                                        </td>
                                        <td className="px-6 py-4 print:py-0.5 print:px-2 border-r print:border-black">
                                            <p className="text-xs font-bold uppercase print:text-[6pt] leading-tight">{item.title}</p>
                                            {item.detail_barang && <p className="text-[8px] text-slate-400 print:text-black print:text-[5.5pt] italic">Ket: {item.detail_barang}</p>}
                                        </td>
                                        <td className="px-6 py-4 text-center print:py-0.5 print:px-2 border-r print:border-black text-xs font-black print:text-[6pt]">
                                            {item.volkeg}
                                        </td>
                                        <td className="px-6 py-4 text-right print:py-0.5 print:px-2 border-r print:border-black text-xs print:text-[6pt]">
                                            {item.hargaSatuan.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-right print:py-0.5 print:px-2 text-sm font-black font-mono print:text-[6pt]">
                                            {item.jumlah.toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-950 text-white print:bg-white print:text-black">
                                    <td colSpan={4} className="px-6 py-4 text-right text-[10px] font-black uppercase border-r print:border-black print:text-[7pt] print:py-0.5">TOTAL KESELURUHAN (IDR)</td>
                                    <td className="px-6 py-4 text-right text-lg font-black font-mono print:text-[7pt] print:py-0.5">
                                        Rp {request.amount.toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm print:border-none print:mt-1 print:p-0">
                        <p className="text-xs font-black uppercase tracking-widest print:text-[6.5pt] print:underline">Justifikasi:</p>
                        <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase print:text-black print:text-[6pt] print:leading-tight">
                            {request.description || "TIDAK ADA DESKRIPSI."}
                        </p>
                    </div>

                    {/* LEMBAR KENDALI - Sangat Kompak */}
                    <div className="print-only mt-2 print:block">
                        <table className="w-full border-collapse border-[0.5pt] border-black text-center">
                            <thead className="bg-gray-100">
                                <tr className="text-[7pt] font-black uppercase">
                                    <th className="border-[0.5pt] border-black py-0.5 w-1/3">VALIDASI PROGRAM</th>
                                    <th className="border-[0.5pt] border-black py-0.5 w-1/3">VALIDASI TU</th>
                                    <th className="border-[0.5pt] border-black py-0.5 w-1/3">PENGESAHAN PPK</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="h-12">
                                    <td className="border-[0.5pt] border-black relative">
                                        {isStepCompleted('reviewed_program') && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-60">
                                                <div className="border-[1.2pt] border-emerald-900 text-emerald-900 px-1 py-0.2 font-black text-[6pt] rotate-[-8deg] uppercase">TERVERIFIKASI</div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="border-[0.5pt] border-black relative">
                                        {isStepCompleted('reviewed_tu') && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-60">
                                                <div className="border-[1.2pt] border-blue-900 text-blue-900 px-1 py-0.2 font-black text-[6pt] rotate-[-8deg] uppercase">TERVERIFIKASI</div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="border-[0.5pt] border-black relative">
                                        {isStepCompleted('approved') && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="border-[1.5pt] border-red-900 text-red-900 px-2 py-0.5 font-black text-[7pt] rotate-[-5deg] uppercase">DISETUJUI PPK</div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                <tr className="text-[6pt] font-bold uppercase">
                                    <td className="border-[0.5pt] border-black py-0.2">Tgl: {request.updated_at ? new Date(request.updated_at).toLocaleDateString('id-ID') : '-'}</td>
                                    <td className="border-[0.5pt] border-black py-0.2">Tgl: {request.updated_at ? new Date(request.updated_at).toLocaleDateString('id-ID') : '-'}</td>
                                    <td className="border-[0.5pt] border-black py-0.2">Tgl: {request.updated_at ? new Date(request.updated_at).toLocaleDateString('id-ID') : '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* SIGNATURE AREA - Horizontal dan Rapat */}
                    <div className="print-only mt-4 print:block">
                        <div className="grid grid-cols-2 gap-12 text-center text-[7pt]">
                            <div className="space-y-10">
                                <div>
                                    <p className="font-bold">Mengetahui,</p>
                                    <p className="font-black uppercase leading-tight">Kepala {request.requester_department}</p>
                                </div>
                                <div>
                                    <p className="font-black underline uppercase">( ..................................................... )</p>
                                    <p className="text-[6pt] mt-0.5">NIP. ..................................................</p>
                                </div>
                            </div>
                            <div className="space-y-10">
                                <div>
                                    <p className="font-bold">Makassar, {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</p>
                                    <p className="font-black uppercase leading-tight">Pengusul / Penanggung Jawab,</p>
                                </div>
                                <div>
                                    <p className="font-black underline uppercase">( {request.requester_name} )</p>
                                    <p className="text-[6pt] mt-0.5">NIP. ..................................................</p>
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
