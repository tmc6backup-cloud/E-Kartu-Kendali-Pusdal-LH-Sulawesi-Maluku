
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { analyzeBudgetRequest } from '../services/geminiService';
import { dbService } from '../services/dbService';
import { 
    ArrowLeft, 
    Trash2, 
    Calculator,
    Building2,
    Coins,
    X,
    Loader2,
    Send
} from 'lucide-react';
import { CalculationItem, BudgetStatus, BudgetCeiling } from '../types';

const NewRequest: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const isEditMode = !!id;
    
    const [ceilings, setCeilings] = useState<BudgetCeiling[]>([]);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<CalculationItem[]>([
        { 
            id: '1', title: '', kro_code: '', ro_code: '', komponen_code: '', subkomponen_code: '',
            kode_akun: '521211', f1_val: 1, f1_unit: 'OR', f2_val: 1, f2_unit: 'HR',
            f3_val: 1, f3_unit: 'KL', f4_val: 1, f4_unit: 'PK', volkeg: 1, 
            satkeg: 'OK', hargaSatuan: 0, jumlah: 0 
        }
    ]);
    
    // Fix: Use correct property names (execution_date, amount) to match BudgetRequest interface
    const [formData, setFormData] = useState({
        title: '', category: 'Konsumsi & Rapat', location: '',
        execution_date: new Date().toISOString().split('T')[0], description: '', amount: 0
    });

    useEffect(() => {
        const load = async () => {
            const data = await dbService.getCeilings(new Date().getFullYear());
            setCeilings(data);
        };
        load();
    }, []);

    // Fix: Automatically update total amount whenever calculation items change
    useEffect(() => {
        const total = items.reduce((sum, item) => sum + item.jumlah, 0);
        setFormData(prev => ({ ...prev, amount: total }));
    }, [items]);

    const handleItemChange = (itemId: string, field: keyof CalculationItem, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id !== itemId) return item;
            const up = { ...item, [field]: value };
            up.volkeg = Number(up.f1_val) * Number(up.f2_val) * Number(up.f3_val) * Number(up.f4_val);
            up.jumlah = up.volkeg * Number(up.hargaSatuan);
            return up;
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                requester_id: user?.id || '',
                requester_name: user?.full_name || '',
                requester_department: user?.department || '',
                ...formData,
                calculation_items: items,
                status: 'pending' as BudgetStatus
            };
            if (isEditMode) await dbService.updateRequest(id!, payload);
            else await dbService.createRequest(payload);
            navigate('/requests');
        } catch (err) { alert(err); } finally { setLoading(false); }
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white border rounded-2xl"><ArrowLeft size={20} /></button>
                    <h1 className="text-2xl font-black uppercase">{isEditMode ? 'Edit Berkas' : 'Usulan Baru'}</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[48px] border shadow-sm space-y-12">
                <input type="text" required className="w-full p-6 bg-slate-50 border rounded-3xl text-xl font-black outline-none" placeholder="JUDUL KEGIATAN" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-xs font-bold uppercase">Deskripsi</label>
                        <textarea className="w-full p-4 bg-slate-50 border rounded-2xl" rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase flex items-center justify-center gap-3">
                    {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />} KIRIM PENGAJUAN
                </button>
            </form>
        </div>
    );
};

export default NewRequest;
