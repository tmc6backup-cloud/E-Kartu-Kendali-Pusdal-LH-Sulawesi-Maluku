
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
    ShieldCheck as ShieldIcon
} from 'lucide-react';
import { AuthContext, isValidatorRole } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { BudgetRequest, BudgetStatus } from '../types';
import Logo from '../components/Logo';

const RequestDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    
    const [request, setRequest] = useState<BudgetRequest | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchRequest = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await dbService.getRequestById(id);
            if (data) setRequest(data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchRequest(); }, [id]);

    if (loading && !request) return <div className="flex items-center justify-center py-40"><Loader2 className="animate-spin text-blue-600" size={64} /></div>;
    if (!request) return <div className="text-center py-40">Berkas tidak ditemukan</div>;

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-20 page-transition print:space-y-0 print:pb-0 print:m-0 print:bg-white print:text-black">
            <div className="flex items-center justify-between no-print">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white border rounded-2xl shadow-sm hover:bg-slate-50 transition-all"><ArrowLeft size={20} /></button>
                    <div><h1 className="text-2xl font-black uppercase tracking-tight">Rincian Berkas</h1></div>
                </div>
                <button onClick={() => window.print()} className="p-3 bg-white border rounded-2xl shadow-sm hover:bg-slate-50"><Printer size={20} /></button>
            </div>

            <div className="bg-white p-10 rounded-[56px] border border-slate-200 shadow-sm print:border-none print:p-0 print:rounded-none">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight print:text-[14pt] mb-6">{request.title}</h2>
                <div className="grid grid-cols-2 gap-x-12">
                    <div className="space-y-2 text-xs font-bold uppercase">
                        <p><span className="text-slate-400">Penyelenggara:</span> {request.requester_department}</p>
                        <p><span className="text-slate-400">Nilai:</span> Rp {request.amount.toLocaleString('id-ID')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestDetail;
