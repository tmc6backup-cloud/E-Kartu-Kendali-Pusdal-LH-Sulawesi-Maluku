
import { supabase } from '../lib/supabase.ts';
import { BudgetRequest, BudgetStatus, Profile, BudgetCeiling } from '../types.ts';

export const dbService = {
    // --- Profil User ---
    getProfile: async (id: string): Promise<Profile | null> => {
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
            if (error) return null;
            return data as Profile;
        } catch (err) { return null; }
    },

    syncProfile: async (profile: Profile): Promise<Profile | null> => {
        const { data, error } = await supabase.from('profiles').upsert([profile]).select().single();
        if (error) throw error;
        return data as Profile;
    },

    getAllProfiles: async (): Promise<Profile[]> => {
        const { data, error } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });
        if (error) return [];
        return data as Profile[];
    },

    deleteProfile: async (id: string) => {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        return { success: !error, error: error?.message };
    },

    // --- Pagu Anggaran (Ceilings) ---
    getCeilings: async (year: number = new Date().getFullYear()): Promise<BudgetCeiling[]> => {
        try {
            const { data, error } = await supabase.from('budget_ceilings').select('*').eq('year', year);
            if (error) throw error;
            return data as BudgetCeiling[];
        } catch (err: any) {
            console.error("Fetch Ceilings Error:", err.message);
            return [];
        }
    },

    updateCeiling: async (department: string, ro_code: string, amount: number, year: number, komponen_code: string = '', subkomponen_code: string = ''): Promise<boolean> => {
        const { error } = await supabase.from('budget_ceilings').upsert({
            department: department,
            ro_code: ro_code,
            komponen_code: komponen_code || '',
            subkomponen_code: subkomponen_code || '',
            amount: amount,
            year: year,
            updated_at: new Date().toISOString()
        }, { 
            onConflict: 'department,ro_code,komponen_code,subkomponen_code,year' 
        });
        return !error;
    },

    deleteCeiling: async (id: string) => {
        const { error } = await supabase.from('budget_ceilings').delete().eq('id', id);
        return !error;
    },

    // --- Pengajuan Anggaran ---
    getAllRequests: async (): Promise<BudgetRequest[]> => {
        try {
            const { data, error } = await supabase.from('budget_requests').select('*, profiles(department, full_name)').order('created_at', { ascending: false });
            if (error) throw error;
            return data as BudgetRequest[];
        } catch (err) {
            console.error("Fetch Requests Error:", err);
            return [];
        }
    },

    getRequestById: async (id: string): Promise<BudgetRequest | null> => {
        const { data, error } = await supabase.from('budget_requests').select('*, profiles(*)').eq('id', id).single();
        return error ? null : data as BudgetRequest;
    },

    createRequest: async (request: Omit<BudgetRequest, 'id' | 'created_at' | 'updated_at'>) => {
        const { data, error } = await supabase.from('budget_requests').insert([request]).select().single();
        if (error) throw error;
        return data as BudgetRequest;
    },

    updateRequest: async (id: string, request: Partial<BudgetRequest>) => {
        const { error } = await supabase.from('budget_requests').update({ ...request, updated_at: new Date().toISOString() }).eq('id', id);
        return !error;
    },

    deleteRequest: async (id: string) => {
        const { error } = await supabase.from('budget_requests').delete().eq('id', id);
        return !error;
    },

    deleteAllRequests: async () => {
        const { error } = await supabase.from('budget_requests').delete().neq('id', '0');
        return { success: !error, error: error?.message };
    },

    uploadAttachment: async (file: File): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const { data: uploadData, error: uploadError } = await supabase.storage.from('attachments').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('attachments').getPublicUrl(fileName);
            return data.publicUrl;
        } catch (err) {
            console.error("Storage Error:", err);
            return null;
        }
    },

    updateStatus: async (id: string, status: BudgetStatus, note?: { field: string, value: string }) => {
        const updatePayload: any = { status, updated_at: new Date().toISOString() };
        if (note) updatePayload[note.field] = note.value;
        const { error } = await supabase.from('budget_requests').update(updatePayload).eq('id', id);
        return !error;
    },

    getStats: async (role: string, userName: string, department?: string) => {
        // Tentukan apakah user memiliki hak akses global (Admin/Pimpinan)
        const isGlobal = ['admin', 'kpa', 'validator_program', 'validator_tu', 'validator_ppk', 'bendahara'].includes(role);
        const currentYear = new Date().getFullYear();
        const userDepts = department ? department.split(', ').map(d => d.trim().toLowerCase()) : [];
        
        try {
            const [requestsRes, ceilingsRes] = await Promise.all([
                supabase.from('budget_requests').select('amount, status, category, created_at, realization_amount, realization_date, requester_department, calculation_items'),
                supabase.from('budget_ceilings').select('department, amount, year, ro_code').eq('year', currentYear)
            ]);

            const data = requestsRes.data || [];
            const ceilingData = ceilingsRes.data || [];
            
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            const monthlyTrend = months.map(m => ({ name: m, amount: 0 }));

            const categoryMap: Record<string, number> = {};
            const departmentMap: Record<string, any> = {};
            let totalOfficeCeiling = 0;

            // 1. Proses Pagu (Budget Ceilings)
            ceilingData.forEach(c => {
                const deptName = c.department.trim();
                const deptNameLower = deptName.toLowerCase();
                
                // Filter akses: Jika bukan global, hanya masukkan departemen user
                if (isGlobal || userDepts.includes(deptNameLower)) {
                    if (!departmentMap[deptName]) {
                        departmentMap[deptName] = { 
                            proposed: 0, 
                            ceiling: 0, 
                            queue: { pending: 0, reviewed_bidang: 0, reviewed_program: 0, reviewed_tu: 0, approved: 0, reviewed_pic: 0, realized: 0 }
                        };
                    }
                    const amt = Number(c.amount) || 0;
                    departmentMap[deptName].ceiling += amt;
                    totalOfficeCeiling += amt;
                }
            });

            // 2. Proses Pengajuan (Requests)
            const summary = data.reduce((acc: any, curr: any) => {
                const amt = Number(curr.amount) || 0;
                const currDept = (curr.requester_department || 'LAINNYA').trim();
                const currDeptLower = currDept.toLowerCase();

                // Hanya proses jika user memiliki akses ke bidang ini
                if (isGlobal || userDepts.includes(currDeptLower)) {
                    acc.totalAmount += amt;
                    acc.totalCount += 1;
                    
                    if (!['approved', 'rejected', 'reviewed_pic'].includes(curr.status)) acc.pendingCount += 1;
                    if (['approved', 'reviewed_pic'].includes(curr.status)) acc.approvedAmount += amt;
                    if (curr.status === 'rejected') acc.rejectedCount += 1;
                    
                    if (curr.category) categoryMap[curr.category] = (categoryMap[curr.category] || 0) + amt;

                    if (curr.created_at) {
                        const mIdx = new Date(curr.created_at).getMonth();
                        if (monthlyTrend[mIdx]) monthlyTrend[mIdx].amount += amt;
                    }

                    // Update detail per departemen
                    const deptKey = Object.keys(departmentMap).find(k => k.toLowerCase() === currDeptLower);
                    if (deptKey) {
                        const status = curr.status;
                        if (status in departmentMap[deptKey].queue) departmentMap[deptKey].queue[status]++;
                        if (status !== 'rejected') departmentMap[deptKey].proposed += amt;
                    }
                }
                return acc;
            }, { totalAmount: 0, pendingCount: 0, approvedAmount: 0, rejectedCount: 0, totalCount: 0 });

            return {
                ...summary,
                totalOfficeCeiling,
                monthlyTrend,
                categories: Object.entries(categoryMap).map(([name, value]) => ({ name, value })),
                deptBudgets: Object.entries(departmentMap).map(([name, d]) => ({
                    name,
                    total: d.ceiling,
                    spent: d.proposed,
                    remaining: Math.max(0, d.ceiling - d.proposed),
                    queue: d.queue
                })).sort((a, b) => b.total - a.total)
            };
        } catch (err) {
            console.error("[Stats Error]", err);
            return {
                totalAmount: 0, pendingCount: 0, approvedAmount: 0, rejectedCount: 0, totalCount: 0,
                totalOfficeCeiling: 0, monthlyTrend: [], categories: [], deptBudgets: []
            };
        }
    }
};
