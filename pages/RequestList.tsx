
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
    Edit2
} from 'lucide-react';
import { AuthContext, isValidatorRole } from '../App';
import { dbService } from '../services/dbService';
import { BudgetRequest } from '../types';

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
        }
        if (statusFilter) list = list.filter(req => req.status === statusFilter);
        if (deptFilter) list = list.filter(req => req.requester_department === deptFilter);
        if (searchTerm) {
            list = list.filter(req => 
                req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.requester_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return list;
    }, [requests, statusFilter, deptFilter, searchTerm, user]);

    return (
        <div className="space-y-8 page-transition">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">
                        {user?.role === 'pengaju' ? 'Berkas Saya' : 'Monitoring Berkas'}
                    </h1>
                    <p className="text-slate-500 text-sm font-semibold uppercase tracking-widest">
                        {user?.role === 'pengaju' ? 'Daftar pengajuan anggaran pribadi' : 'Manajemen Kartu Kendali Anggaran'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => window.print()} className="px-6 py-4 bg-white border rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-sm transition-all">
                        <Printer size={18} /> Cetak Laporan
                    </button>
                    {!isValidatorRole(user?.role) && (
                        <Link to="/requests/new" className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl">
                            <Database size={18} /> Usulan Baru
                        </Link>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden no-print">
                <div className="p-8 border-b border-slate-100 flex items-center gap-6">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500" size={20} />
                        <input type="text" placeholder="Cari kegiatan..." className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-transparent rounded-[22px] text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th className="px-8 py-6">Kegiatan & Bidang</th>
                                {user?.role !== 'pengaju' && <th className="px-8 py-6">Pengusul</th>}
                                <th className="px-8 py-6 text-right">Volume</th>
                                <th className="px-8 py-6 text-center">Status</th>
                                <th className="px-8 py-6 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={user?.role === 'pengaju' ? 4 : 5} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></td></tr>
                            ) : filteredRequests.length > 0 ? (
                                filteredRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-8 py-7">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-3">
                                                    <p className="font-black text-slate-900 text-sm uppercase leading-snug line-clamp-2 max-w-md">{req.title}</p>
                                                    {req.attachment_url && isValidator && (
                                                        <a 
                                                            href={req.attachment_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1 shadow-sm border border-blue-100"
                                                            title="Buka Berkas Lampiran"
                                                        >
                                                            <Paperclip size={12} />
                                                            <span className="text-[8px] font-black">FILE</span>
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase">
                                                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{req.category}</span>
                                                    <span>• {req.requester_department}</span>
                                                </div>
                                            </div>
                                        </td>
                                        {user?.role !== 'pengaju' && (
                                            <td className="px-8 py-7 text-xs font-black text-slate-700 uppercase">
                                                <div className="flex items-center gap-2">
                                                    <User size={12} className="text-slate-300" />
                                                    {req.requester_name}
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-8 py-7 text-right font-black font-mono text-sm">Rp {req.amount.toLocaleString('id-ID')}</td>
                                        <td className="px-8 py-7 text-center"><StatusBadge status={req.status} /></td>
                                        <td className="px-8 py-7 text-right flex items-center justify-end gap-2">
                                            {/* Admin atau Pemilik Draf bisa menghapus */}
                                            {(isAdmin || (req.status === 'draft' && req.requester_id === user?.id)) && (
                                                <button onClick={() => handleDelete(req.id, req.title)} className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                                            )}
                                            
                                            {req.attachment_url && isValidator && (
                                                <a 
                                                    href={req.attachment_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="p-3 text-blue-500 hover:bg-blue-50 rounded-xl transition-all flex items-center gap-2"
                                                    title="Lihat Berkas Lampiran"
                                                >
                                                    <FileText size={18} />
                                                    <span className="text-[9px] font-black uppercase">BERKAS</span>
                                                </a>
                                            )}

                                            {req.status === 'draft' ? (
                                                <Link 
                                                    to={`/requests/edit/${req.id}`} 
                                                    className="px-5 py-3 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-amber-600 shadow-lg shadow-amber-100 transition-all active:scale-95"
                                                >
                                                    Lanjutkan <Edit2 size={14} />
                                                </Link>
                                            ) : (
                                                <Link 
                                                    to={`/requests/${req.id}`} 
                                                    className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 active:scale-95 transition-all"
                                                >
                                                    Tinjau <ChevronRight size={14} />
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-32 text-center">
                                        <Database size={48} className="mx-auto text-slate-100 mb-4" />
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Tidak ada data berkas.</p>
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
