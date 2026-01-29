
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
        <div className="max-w-[1400px] mx-auto space-y-8 pb-20 page-transition print:space-y-0 print:pb-0">
            <div className="print-only mb-1">
                <div className="flex items-center border-b-[1.5pt] border-black pb-1">
                    <Logo className="w-12 h-12 object-contain mr-3" />
                    <div className="flex-1 text-center">
                        <h2 className="text-[8.5pt] font-black uppercase">Pusat Pengendalian Lingkungan Hidup Sulawesi Maluku</h2>
                    </div>
                </div>
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
                <div className="xl:col-span-3 space-y-8 print:w-full print:space-y-1.5">
                    <div className="bg-white p-10 rounded-[56px] border border-slate-200 shadow-sm print:p-0 print:border-none">
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight print:text-[10pt]">{request.title}</h2>
                        <div className="grid grid-cols-2 gap-x-12 mt-6 print:text-[7pt] print:mt-2">
                            <div><p className="font-bold">Unit Kerja: {request.requester_department}</p></div>
                            <div><p className="font-bold">Tanggal: {new Date(request.execution_date).toLocaleDateString('id-ID')}</p></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm print:border-none">
                        <table className="w-full text-left print:text-[7pt]">
                            <thead className="bg-slate-50">
                                <tr className="text-[9px] font-black uppercase tracking-widest border-b">
                                    <th className="px-6 py-4">Uraian</th>
                                    <th className="px-6 py-4 text-center">Vol</th>
                                    <th className="px-6 py-4 text-right">Harga</th>
                                    <th className="px-6 py-4 text-right">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody>
                                {request.calculation_items?.map((item, idx) => (
                                    <tr key={idx} className="border-b">
                                        <td className="px-6 py-4 font-bold">{item.title}</td>
                                        <td className="px-6 py-4 text-center">{item.volkeg}</td>
                                        <td className="px-6 py-4 text-right">{item.hargaSatuan.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 text-right font-black font-mono">{item.jumlah.toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-900 text-white">
                                    <td colSpan={3} className="px-6 py-4 text-right text-[10px] font-black">TOTAL (IDR)</td>
                                    <td className="px-6 py-4 text-right text-lg font-black font-mono">Rp {request.amount.toLocaleString('id-ID')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestDetail;
