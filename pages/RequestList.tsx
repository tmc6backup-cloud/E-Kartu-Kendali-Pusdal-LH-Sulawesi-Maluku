
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
    Search, 
    Loader2, 
    Database, 
    Printer,
    ChevronRight,
    Trash2,
    User,
    Paperclip,
    FileText,
    Edit2,
    Filter
} from 'lucide-react';
// Fix: Import AuthContext and isValidatorRole from the correct context directory instead of App.tsx
import { AuthContext, isValidatorRole } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { BudgetRequest } from '../types';
import Logo from '../components/Logo';

const StatusBadge = ({ status }: { status: string }) => {
    const config = {
        draft: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Draf' },
        pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Antrian Kabid' },
        reviewed_bidang: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Antrian Program' },
        reviewed_program: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Antrian TU' },
        reviewed_tu: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Antrian PPK' },
        approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Disetujui (SPJ)' },
        reviewed_pic: { bg: 'bg-cyan-50', text: 'text-cyan-700', label: 'Verifikasi PIC OK' },
        rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Ditolak/Revisi' }
    };
    const s = config[status as keyof typeof config] || { bg: 'bg-slate-100', text: 'text-slate-600', label: status.toUpperCase() };
    return <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border ${s.bg} ${s.text} border-current/20`}>{s.label}</span>;
};

const RequestList: React.FC = () => {
    const { user } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const statusFilter = searchParams.get('status');
    const deptFilter = searchParams.get('dept');
    const isAdmin = user?.role === 'admin';
    const isValidator = useMemo(() => isValidatorRole(user?.role), [user]);

    const [requests, setRequests] = useState<BudgetRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const loadData = async () => {
        setLoading(true);
        const data = await dbService.getAllRequests();
        setRequests(data);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Hapus berkas "${title}" secara permanen?`)) return;
        const success = await dbService.deleteRequest(id);
        if (success) {
            alert("Berkas berhasil dihapus.");
            loadData();
        }
    };

    const filteredRequests = useMemo(() => {
        let list = [...requests];

        if (user?.role === 'pengaju') {
            list = list.filter(req => req.requester_id === user.id);
        } else if (user?.role === 'kepala_bidang') {
            const myDepts = user.department ? user.department.split(', ').map(d => d.trim().toLowerCase()) : [];
            list = list.filter(req => {
                const reqDept = (req.requester_department || '').trim().toLowerCase();
                return myDepts.includes(reqDept);
            });
        }

        if (statusFilter) list = list.filter(req => req.status === statusFilter);
        if (deptFilter) list = list.filter(req => req.requester_department?.toLowerCase() === deptFilter.toLowerCase());
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(req => 
                req.title.toLowerCase().includes(term) ||
                req.requester_name.toLowerCase().includes(term) ||
                (req.requester_department && req.requester_department.toLowerCase().includes(term))
            );
        }
        return list;
    }, [requests, statusFilter, deptFilter, searchTerm, user]);

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 page-transition print:space-y-4">
            <div className="print-only mb-6">
                <div className="flex items-center gap-6 border-b-[3px] border-black pb-3">
                    <Logo className="w-20 h-20 object-contain" />
                    <div className="flex-1 text-center">
                        <h2 className="text-[12pt] font-black uppercase leading-tight">Laporan Rekapitulasi Berkas Kendali Anggaran</h2>
                        <h3 className="text-[10pt] font-bold uppercase mt-1">Pusdal LH Sulawesi Maluku - TA {new Date().getFullYear()}</h3>
                        <p className="text-[7pt] mt-1 italic">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                        {user?.role === 'pengaju' ? 'Berkas Saya' : 'Monitoring Kantor'}
                    </h1>
                </div>
                <div className="flex items-center gap-3 no-print">
                    <button onClick={() => window.print()} className="px-6 py-4 bg-white border rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-sm hover:bg-slate-50 transition-all">
                        <Printer size={18} /> Cetak Laporan
                    </button>
                    {!isValidatorRole(user?.role) && (
                        <Link to="/requests/new" className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-slate-800 transition-all">
                            <Database size={18} /> Usulan Baru
                        </Link>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden print:border-none">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-6 no-print">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-4.5 text-slate-400 group-focus-within:text-blue-500" size={20} />
                        <input type="text" placeholder="Cari berdasarkan judul, nama pengusul, atau bidang..." className="w-full pl-16 pr-6 py-4 bg-slate-50 border-transparent rounded-[24px] text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all uppercase shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left print:border-[1pt] print:border-black">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 print:bg-gray-100 print:text-black print:border-black">
                                <th className="px-10 py-6 print:py-3 print:px-4">Kegiatan & Bidang</th>
                                {user?.role !== 'pengaju' && <th className="px-10 py-6 print:py-3 print:px-4">Pengusul</th>}
                                <th className="px-10 py-6 text-right print:py-3 print:px-4">Nilai</th>
                                <th className="px-10 py-6 text-center print:py-3 print:px-4">Status</th>
                                <th className="px-10 py-6 text-right no-print">Opsi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 print:divide-black">
                            {loading ? (
                                <tr><td colSpan={user?.role === 'pengaju' ? 4 : 5} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500 opacity-30" size={40} /></td></tr>
                            ) : filteredRequests.length > 0 ? (
                                filteredRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50/50 transition-all group print:border-b-[0.5pt] print:border-black">
                                        <td className="px-10 py-7 print:py-3 print:px-4">
                                            <div className="space-y-2">
                                                <p className="font-black text-slate-900 text-sm uppercase leading-tight line-clamp-2 max-w-lg print:text-[9pt]">{req.title}</p>
                                                <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest print:text-black print:text-[7pt]">
                                                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{req.category}</span>
                                                    <span>• {req.requester_department}</span>
                                                </div>
                                            </div>
                                        </td>
                                        {user?.role !== 'pengaju' && (
                                            <td className="px-10 py-7 text-xs font-black text-slate-700 uppercase print:text-[8pt] print:py-3 print:px-4">
                                                {req.requester_name}
                                            </td>
                                        )}
                                        <td className="px-10 py-7 text-right font-black font-mono text-sm print:text-[8pt] print:py-3 print:px-4">Rp {req.amount.toLocaleString('id-ID')}</td>
                                        <td className="px-10 py-7 text-center print:py-3 print:px-4"><StatusBadge status={req.status} /></td>
                                        <td className="px-10 py-7 text-right no-print">
                                            <div className="flex items-center justify-end gap-2">
                                                {req.status === 'draft' ? (
                                                    <Link to={`/requests/edit/${req.id}`} className="px-5 py-3 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2">Edit <Edit2 size={14} /></Link>
                                                ) : (
                                                    <Link to={`/requests/${req.id}`} className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2">Tinjau <ChevronRight size={14} /></Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={user?.role === 'pengaju' ? 4 : 5} className="py-40 text-center">
                                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">Data Nihil</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RequestList;
