
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

    // Add missing deleteAllRequests method to handle database reset functionality in UserManagement.tsx
    deleteAllRequests: async () => {
        // Supabase requires a filter for deletes, neq('id', '0') effectively targets all rows.
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
        const currentYear = new Date().getFullYear();
        
        try {
            const [requestsRes, ceilingsRes] = await Promise.all([
                supabase.from('budget_requests').select('amount, status, category, created_at, realization_amount, realization_date, requester_department, calculation_items'),
                supabase.from('budget_ceilings').select('department, amount, year, ro_code').eq('year', currentYear)
            ]);

            const data = requestsRes.data || [];
            const ceilingData = ceilingsRes.data || [];
            
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            const monthlyTrend = months.map(m => ({ name: m, amount: 0, realized: 0 }));

            const categoryMap: Record<string, number> = {};
            const departmentMap: Record<string, any> = {};
            
            // Inisialisasi Agregasi Global RO
            const globalROs = {
                eba: { total: 0, spent: 0 },
                ebb: { total: 0, spent: 0 },
                bdb: { total: 0, spent: 0 },
                ebd: { total: 0, spent: 0 },
                total: 0,
                spent: 0
            };

            // Inisialisasi Pagu
            ceilingData.forEach(c => {
                const cDeptClean = c.department.trim();
                if (!departmentMap[cDeptClean]) {
                    departmentMap[cDeptClean] = { 
                        proposed: 0, realized: 0, ceiling: 0, 
                        eba_ceiling: 0, eba_proposed: 0, ebb_ceiling: 0, ebb_proposed: 0,
                        bdb_ceiling: 0, bdb_proposed: 0, ebd_ceiling: 0, ebd_proposed: 0,
                        queue: { pending: 0, reviewed_bidang: 0, reviewed_program: 0, reviewed_tu: 0, approved: 0, reviewed_pic: 0, realized: 0 }
                    };
                }
                const amt = Number(c.amount) || 0;
                departmentMap[cDeptClean].ceiling += amt;
                globalROs.total += amt;

                const ro = (c.ro_code || '').toUpperCase();
                if (ro.startsWith('EBA')) { departmentMap[cDeptClean].eba_ceiling += amt; globalROs.eba.total += amt; }
                if (ro.startsWith('EBB')) { departmentMap[cDeptClean].ebb_ceiling += amt; globalROs.ebb.total += amt; }
                if (ro.startsWith('BDB')) { departmentMap[cDeptClean].bdb_ceiling += amt; globalROs.bdb.total += amt; }
                if (ro.startsWith('EBD')) { departmentMap[cDeptClean].ebd_ceiling += amt; globalROs.ebd.total += amt; }
            });

            // Agregasi Pengajuan
            const summary = data.reduce((acc: any, curr: any) => {
                const amt = Number(curr.amount) || 0;
                const currDeptStr = (curr.requester_department || 'LAINNYA').trim();
                const matchedDeptKey = Object.keys(departmentMap).find(dk => dk.toLowerCase() === currDeptStr.toLowerCase());

                acc.totalAmount += amt;
                acc.totalCount += 1;
                
                if (['approved', 'reviewed_pic'].includes(curr.status)) acc.approvedAmount += amt;
                if (curr.category) categoryMap[curr.category] = (categoryMap[curr.category] || 0) + amt;

                if (curr.created_at) {
                    const mIdx = new Date(curr.created_at).getMonth();
                    if (monthlyTrend[mIdx]) monthlyTrend[mIdx].amount += amt;
                }

                if (matchedDeptKey) {
                    const status = curr.status;
                    if (curr.realization_date) departmentMap[matchedDeptKey].queue['realized']++;
                    else if (status in departmentMap[matchedDeptKey].queue) departmentMap[matchedDeptKey].queue[status]++;

                    if (status !== 'rejected') {
                        departmentMap[matchedDeptKey].proposed += amt;
                        globalROs.spent += amt;
                        (curr.calculation_items || []).forEach((item: any) => {
                            const iAmt = Number(item.jumlah) || 0;
                            const ro = (item.ro_code || '').toUpperCase();
                            if (ro.startsWith('EBA')) { departmentMap[matchedDeptKey].eba_proposed += iAmt; globalROs.eba.spent += iAmt; }
                            if (ro.startsWith('EBB')) { departmentMap[matchedDeptKey].ebb_proposed += iAmt; globalROs.ebb.spent += iAmt; }
                            if (ro.startsWith('BDB')) { departmentMap[matchedDeptKey].bdb_proposed += iAmt; globalROs.bdb.spent += iAmt; }
                            if (ro.startsWith('EBD')) { departmentMap[matchedDeptKey].ebd_proposed += iAmt; globalROs.ebd.spent += iAmt; }
                        });
                    }
                }
                return acc;
            }, { totalAmount: 0, pendingCount: 0, approvedAmount: 0, rejectedCount: 0, totalCount: 0 });

            return {
                ...summary,
                globalROs: {
                    total: globalROs.total,
                    spent: globalROs.spent,
                    remaining: Math.max(0, globalROs.total - globalROs.spent),
                    eba: { ...globalROs.eba, remaining: Math.max(0, globalROs.eba.total - globalROs.eba.spent) },
                    ebb: { ...globalROs.ebb, remaining: Math.max(0, globalROs.ebb.total - globalROs.ebb.spent) },
                    bdb: { ...globalROs.bdb, remaining: Math.max(0, globalROs.bdb.total - globalROs.bdb.spent) },
                    ebd: { ...globalROs.ebd, remaining: Math.max(0, globalROs.ebd.total - globalROs.ebd.spent) },
                },
                monthlyTrend,
                deptBudgets: Object.entries(departmentMap).map(([name, d]) => ({
                    name,
                    total: d.ceiling,
                    spent: d.proposed,
                    remaining: Math.max(0, d.ceiling - d.proposed),
                    eba: { total: d.eba_ceiling, spent: d.eba_proposed, remaining: Math.max(0, d.eba_ceiling - d.eba_proposed) },
                    ebb: { total: d.ebb_ceiling, spent: d.ebb_proposed, remaining: Math.max(0, d.ebb_ceiling - d.ebb_proposed) },
                    bdb: { total: d.bdb_ceiling, spent: d.bdb_proposed, remaining: Math.max(0, d.bdb_ceiling - d.bdb_proposed) },
                    ebd: { total: d.ebd_ceiling, spent: d.ebd_proposed, remaining: Math.max(0, d.ebd_ceiling - d.ebd_proposed) }
                }))
            };
        } catch (err) {
            console.error("[Stats Error]", err);
            return { totalAmount: 0, pendingCount: 0, approvedAmount: 0, rejectedCount: 0, totalCount: 0, globalROs: {}, deptBudgets: [] };
        }
    }
};
