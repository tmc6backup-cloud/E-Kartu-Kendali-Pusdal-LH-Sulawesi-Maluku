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
        try {
            const { data, error } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });
            if (error) return [];
            return data as Profile[];
        } catch (err) { return []; }
    },

    getProfilesByRole: async (role: string): Promise<Profile[]> => {
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('role', role);
            if (error) return [];
            return data as Profile[];
        } catch (err) { return []; }
    },

    deleteProfile: async (id: string) => {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        return { success: !error, error: error?.message };
    },

    // --- Web Push VAPID ---
    savePushSubscription: async (userId: string, subscription: PushSubscription) => {
        const subJson = subscription.toJSON();
        if (!subJson.endpoint || !subJson.keys) return false;

        const payload = {
            user_id: userId,
            endpoint: subJson.endpoint,
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth
        };

        const { error } = await supabase
            .from('push_subscriptions')
            .upsert(payload, { onConflict: 'endpoint' });
        
        return !error;
    },

    // --- Pagu Anggaran (Ceilings) ---
    getCeilings: async (year: number = new Date().getFullYear()): Promise<BudgetCeiling[]> => {
        try {
            const { data, error } = await supabase
                .from('budget_ceilings')
                .select('*')
                .eq('year', year)
                .order('department', { ascending: true });
            if (error) throw error;
            return data as BudgetCeiling[];
        } catch (err: any) {
            console.error("Fetch Ceilings Error:", err.message);
            return [];
        }
    },

    updateCeiling: async (department: string, ro_code: string, amount: number, year: number, komponen_code: string = '', subkomponen_code: string = '', id?: string): Promise<boolean> => {
        const payload: any = {
            department: department,
            ro_code: ro_code,
            komponen_code: komponen_code || '',
            subkomponen_code: subkomponen_code || '',
            amount: Number(amount),
            year: Number(year),
            updated_at: new Date().toISOString()
        };

        try {
            if (id) {
                const { error } = await supabase
                    .from('budget_ceilings')
                    .update(payload)
                    .eq('id', id);
                if (error) throw error;
                return true;
            } else {
                const { error } = await supabase
                    .from('budget_ceilings')
                    .upsert(payload, { 
                        onConflict: 'department,ro_code,komponen_code,subkomponen_code,year' 
                    });
                if (error) throw error;
                return true;
            }
        } catch (err) {
            console.error("Update Ceiling Error:", err);
            return false;
        }
    },

    deleteCeiling: async (id: string) => {
        const { error } = await supabase.from('budget_ceilings').delete().eq('id', id);
        return !error;
    },

    // --- Pengajuan Anggaran ---
    getAllRequests: async (): Promise<BudgetRequest[]> => {
        try {
            const { data, error } = await supabase
                .from('budget_requests')
                .select('*, profiles(*)')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data as BudgetRequest[];
        } catch (err) {
            console.error("Fetch Requests Error:", err);
            return [];
        }
    },

    getRequestById: async (id: string): Promise<BudgetRequest | null> => {
        try {
            const { data, error } = await supabase
                .from('budget_requests')
                .select('*, profiles(*)')
                .eq('id', id)
                .single();
            
            if (error) return null;
            return data as BudgetRequest;
        } catch (err) {
            return null;
        }
    },

    createRequest: async (request: Omit<BudgetRequest, 'id' | 'created_at' | 'updated_at'>) => {
        const { data, error } = await supabase.from('budget_requests').insert([request]).select().single();
        if (error) {
            console.error("Supabase Create Request Error:", error.message, error.details, error.hint);
            throw error;
        }
        return data as BudgetRequest;
    },

    updateRequest: async (id: string, request: Partial<BudgetRequest>) => {
        const { error } = await supabase.from('budget_requests').update({ ...request, updated_at: new Date().toISOString() }).eq('id', id);
        if (error) {
            console.error("Supabase Update Request Error:", error.message);
        }
        return !error;
    },

    deleteRequest: async (id: string) => {
        const { error } = await supabase.from('budget_requests').delete().eq('id', id);
        return !error;
    },

    updateStatus: async (id: string, status: BudgetStatus, note?: { field: string, value: string }, extraData?: Partial<BudgetRequest>) => {
        const updatePayload: any = { status, updated_at: new Date().toISOString(), ...extraData };
        if (note) updatePayload[note.field] = note.value;
        const { error } = await supabase.from('budget_requests').update(updatePayload).eq('id', id);
        return !error;
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

    getStats: async (role: string, userName: string, department?: string, startDate?: string, endDate?: string) => {
        const isGlobal = ['admin', 'kpa', 'validator_program', 'validator_tu', 'validator_ppk', 'bendahara'].includes(role);
        const userDepts = department ? department.split(', ').map(d => d.trim().toLowerCase()) : [];
        
        // Default range if not provided: Current Year
        const sDate = startDate || `${new Date().getFullYear()}-01-01`;
        const eDate = endDate || `${new Date().getFullYear()}-12-31`;
        const selectedYear = new Date(sDate).getFullYear();

        try {
            const [requestsRes, ceilingsRes] = await Promise.all([
                supabase.from('budget_requests').select('amount, status, category, created_at, realization_amount, realization_date, requester_department'),
                supabase.from('budget_ceilings').select('department, amount, year, ro_code').eq('year', selectedYear)
            ]);

            const data = requestsRes.data || [];
            const ceilingData = ceilingsRes.data || [];
            
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            const monthlyTrend = months.map(m => ({ name: m, amount: 0, realized: 0 }));

            const categoryMap: Record<string, number> = {};
            const departmentMap: Record<string, any> = {};
            let totalOfficeCeiling = 0;

            ceilingData.forEach(c => {
                const deptName = (c.department || 'LAINNYA').trim();
                const deptNameLower = deptName.toLowerCase();
                
                if (isGlobal || userDepts.includes(deptNameLower)) {
                    if (!departmentMap[deptName]) {
                        departmentMap[deptName] = { 
                            proposed: 0, 
                            realizedTotal: 0,
                            ceiling: 0, 
                            queue: { pending: 0, reviewed_bidang: 0, reviewed_program: 0, reviewed_tu: 0, approved: 0, reviewed_pic: 0, realized: 0 }
                        };
                    }
                    const amt = parseFloat(c.amount as any) || 0;
                    departmentMap[deptName].ceiling += amt;
                    totalOfficeCeiling += amt;
                }
            });

            const summary = data.reduce((acc: any, curr: any) => {
                const amt = parseFloat(curr.amount as any) || 0;
                const realizedAmt = parseFloat(curr.realization_amount as any) || 0;
                const currDept = (curr.requester_department || 'LAINNYA').trim();
                const currDeptLower = currDept.toLowerCase();

                const date = curr.created_at ? new Date(curr.created_at) : null;
                if (!date) return acc;

                const checkStart = new Date(sDate);
                const checkEnd = new Date(eDate);
                checkEnd.setHours(23, 59, 59, 999);
                
                const isInRange = date >= checkStart && date <= checkEnd;

                if ((isGlobal || userDepts.includes(currDeptLower)) && isInRange) {
                    acc.totalAmount += amt;
                    acc.totalCount += 1;
                    
                    if (!['approved', 'rejected', 'reviewed_pic', 'realized'].includes(curr.status)) acc.pendingCount += 1;
                    if (['approved', 'reviewed_pic', 'realized'].includes(curr.status)) acc.approvedAmount += amt;
                    if (curr.status === 'realized') acc.totalRealized += realizedAmt;
                    if (curr.status === 'rejected') acc.rejectedCount += 1;
                    
                    if (curr.category) {
                        const val = curr.status === 'realized' ? realizedAmt : amt;
                        categoryMap[curr.category] = (categoryMap[curr.category] || 0) + val;
                    }

                    const mIdx = date.getMonth();
                    if (mIdx >= 0 && mIdx < 12) {
                        monthlyTrend[mIdx].amount += amt;
                        if (curr.status === 'realized') {
                            monthlyTrend[mIdx].realized += realizedAmt;
                        }
                    }

                    const deptKey = Object.keys(departmentMap).find(k => k.toLowerCase() === currDeptLower);
                    if (deptKey) {
                        const status = curr.status;
                        if (status in departmentMap[deptKey].queue) departmentMap[deptKey].queue[status]++;
                        if (status !== 'rejected' && status !== 'draft') {
                            departmentMap[deptKey].proposed += amt;
                            if (status === 'realized') {
                                departmentMap[deptKey].realizedTotal += realizedAmt;
                            }
                        }
                    }
                }
                return acc;
            }, { totalAmount: 0, pendingCount: 0, approvedAmount: 0, rejectedCount: 0, totalCount: 0, totalRealized: 0 });

            const categories = Object.entries(categoryMap)
                .map(([name, value]) => ({ name, value }))
                .filter(c => c.value > 0);

            const result = {
                ...summary,
                totalOfficeCeiling,
                monthlyTrend,
                categories,
                deptBudgets: Object.entries(departmentMap).map(([name, d]) => ({
                    name,
                    total: d.ceiling,
                    spent: d.proposed,
                    realized: d.realizedTotal,
                    remaining: Math.max(0, d.ceiling - d.proposed),
                    queue: d.queue
                })).sort((a, b) => b.total - a.total)
            };
            
            return result;
        } catch (err) {
            console.error("[Stats Error]", err);
            return {
                totalAmount: 0, pendingCount: 0, approvedAmount: 0, rejectedCount: 0, totalCount: 0, totalRealized: 0,
                totalOfficeCeiling: 0, monthlyTrend: [], categories: [], deptBudgets: []
            };
        }
    }
};