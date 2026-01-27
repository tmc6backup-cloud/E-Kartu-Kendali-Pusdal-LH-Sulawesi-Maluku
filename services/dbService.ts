
import { supabase } from '../lib/supabase';
import { BudgetRequest, BudgetStatus, Profile, BudgetCeiling } from '../types';

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
        const { data, error } = await supabase.from('budget_ceilings').select('*').eq('year', year);
        if (error) {
            console.error("Fetch Ceilings Error:", error.message);
            if (error.message.includes('relation "budget_ceilings" does not exist')) {
                throw new Error("DATABASE_TABLE_MISSING");
            }
            return [];
        }
        return data as BudgetCeiling[];
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
        
        if (error) {
            console.error("Supabase Pagu Update Error:", error.message);
        }
        
        return !error;
    },

    deleteCeiling: async (id: string) => {
        const { error } = await supabase.from('budget_ceilings').delete().eq('id', id);
        return !error;
    },

    // --- Pengajuan Anggaran ---
    getAllRequests: async (): Promise<BudgetRequest[]> => {
        const { data, error } = await supabase.from('budget_requests').select('*, profiles(department, full_name)').order('created_at', { ascending: false });
        if (error) return [];
        return data as BudgetRequest[];
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

    uploadAttachment: async (file: File): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('attachments')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error("Storage Upload Error:", uploadError.message);
                throw uploadError;
            }

            const { data } = supabase.storage.from('attachments').getPublicUrl(fileName);
            return data.publicUrl;
        } catch (err) {
            console.error("Failed to upload file:", err);
            return null;
        }
    },

    updateStatus: async (id: string, status: BudgetStatus, note?: { field: string, value: string }) => {
        const updatePayload: any = { status, updated_at: new Date().toISOString() };
        if (note) updatePayload[note.field] = note.value;
        const { error } = await supabase.from('budget_requests').update(updatePayload).eq('id', id);
        return !error;
    },

    deleteAllRequests: async () => {
        const { error } = await supabase.from('budget_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        return { success: !error, error: error?.message };
    },

    getStats: async (role: string, userName: string, department?: string) => {
        // Menambahkan 'kpa' ke isGlobal agar bisa melihat seluruh data kantor
        const isGlobal = ['admin', 'kpa', 'validator_program', 'validator_ppk', 'bendahara'].includes(role);
        const currentYear = new Date().getFullYear();
        
        // Departemen PUSDAL LH SUMA selalu mendapatkan akses global
        const isPusdalGlobal = department?.toUpperCase().includes("PUSDAL LH SUMA");
        const effectiveGlobal = isGlobal || isPusdalGlobal;

        const userDepts = department ? department.split(', ').map(d => d.trim().toLowerCase()) : [];
        
        const [requestsRes, ceilingsRes] = await Promise.all([
            supabase.from('budget_requests').select('amount, status, category, created_at, realization_amount, realization_date, realization_duration, realization_note, requester_department, calculation_items'),
            supabase.from('budget_ceilings').select('department, amount, year, ro_code').eq('year', currentYear)
        ]);

        const data = requestsRes.data || [];
        const ceilingData = ceilingsRes.data || [];
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const monthlyTrend = months.map(m => ({ name: m, amount: 0, realized: 0 }));

        const categoryMap: Record<string, number> = {};
        const departmentMap: Record<string, { 
            proposed: number, 
            realized: number, 
            ceiling: number,
            fba_ceiling: number, fba_proposed: number,
            bdh_ceiling: number, bdh_proposed: number,
            eba_ceiling: number, eba_proposed: number,
            ebb_ceiling: number, ebb_proposed: number,
            bdb_ceiling: number, bdb_proposed: number,
            ebd_ceiling: number, ebd_proposed: number,
            queue: Record<string, number>
        }> = {};
        
        let totalOfficeCeiling = 0;

        // 1. Inisialisasi Pagu per Bidang & RO Code
        ceilingData.forEach(c => {
            const cDeptClean = c.department.trim();
            const cDeptLower = cDeptClean.toLowerCase();
            const isAuthorized = effectiveGlobal || userDepts.includes(cDeptLower);
            
            if (isAuthorized) {
                if (!departmentMap[cDeptClean]) {
                    departmentMap[cDeptClean] = { 
                        proposed: 0, realized: 0, ceiling: 0, 
                        fba_ceiling: 0, fba_proposed: 0, bdh_ceiling: 0, bdh_proposed: 0,
                        eba_ceiling: 0, eba_proposed: 0, ebb_ceiling: 0, ebb_proposed: 0,
                        bdb_ceiling: 0, bdb_proposed: 0, ebd_ceiling: 0, ebd_proposed: 0,
                        queue: { pending: 0, reviewed_bidang: 0, reviewed_program: 0, reviewed_tu: 0, approved: 0, reviewed_pic: 0, realized: 0 }
                    };
                }
                const amt = Number(c.amount) || 0;
                departmentMap[cDeptClean].ceiling += amt;
                totalOfficeCeiling += amt;

                if (c.ro_code.startsWith('FBA')) departmentMap[cDeptClean].fba_ceiling += amt;
                if (c.ro_code.startsWith('BDH')) departmentMap[cDeptClean].bdh_ceiling += amt;
                if (c.ro_code.startsWith('EBA')) departmentMap[cDeptClean].eba_ceiling += amt;
                if (c.ro_code.startsWith('EBB')) departmentMap[cDeptClean].ebb_ceiling += amt;
                if (c.ro_code.startsWith('BDB')) departmentMap[cDeptClean].bdb_ceiling += amt;
                if (c.ro_code.startsWith('EBD')) departmentMap[cDeptClean].ebd_ceiling += amt;
            }
        });

        // 2. Agregasi data pengajuan
        const stats = data.reduce((acc: any, curr: any) => {
            const amt = Number(curr.amount) || 0;
            const realAmt = Number(curr.realization_amount) || 0;
            const currDeptStr = (curr.requester_department || 'LAINNYA').trim();
            const currDeptLower = currDeptStr.toLowerCase();
            
            const matchedDeptKey = Object.keys(departmentMap).find(deptKey => 
                currDeptLower.includes(deptKey.toLowerCase()) || deptKey.toLowerCase().includes(currDeptLower)
            );

            const isAuthorized = effectiveGlobal || userDepts.some(ud => currDeptLower.includes(ud));
            
            if (isAuthorized) {
                acc.totalAmount += amt;
                acc.totalCount += 1;
                if (curr.status !== 'approved' && curr.status !== 'rejected' && curr.status !== 'reviewed_pic') acc.pendingCount += 1;
                if (curr.status === 'approved' || curr.status === 'reviewed_pic' || curr.realization_date) acc.approvedAmount += amt;
                if (curr.status === 'rejected') acc.rejectedCount += 1;
                
                if (curr.category) categoryMap[curr.category] = (categoryMap[curr.category] || 0) + amt;

                if (curr.created_at) {
                    const monthIdx = new Date(curr.created_at).getMonth();
                    if (monthlyTrend[monthIdx]) monthlyTrend[monthIdx].amount += amt;
                }
                if (curr.realization_date) {
                    const monthIdx = new Date(curr.realization_date).getMonth();
                    if (monthlyTrend[monthIdx]) monthlyTrend[monthIdx].realized += amt; // Menggunakan amt asumsi realisasi lunas
                }
            }

            if (matchedDeptKey) {
                const status = curr.status;
                if (curr.realization_date) {
                    departmentMap[matchedDeptKey].queue['realized']++;
                } else if (status in departmentMap[matchedDeptKey].queue) {
                    departmentMap[matchedDeptKey].queue[status]++;
                }

                if (status !== 'rejected') {
                    departmentMap[matchedDeptKey].proposed += amt;
                    
                    const items = curr.calculation_items || [];
                    items.forEach((item: any) => {
                        const itemAmt = Number(item.jumlah) || 0;
                        const ro = (item.ro_code || '').toUpperCase();
                        if (ro.startsWith('FBA')) departmentMap[matchedDeptKey].fba_proposed += itemAmt;
                        if (ro.startsWith('BDH')) departmentMap[matchedDeptKey].bdh_proposed += itemAmt;
                        if (ro.startsWith('EBA')) departmentMap[matchedDeptKey].eba_proposed += itemAmt;
                        if (ro.startsWith('EBB')) departmentMap[matchedDeptKey].ebb_proposed += itemAmt;
                        if (ro.startsWith('BDB')) departmentMap[matchedDeptKey].bdb_proposed += itemAmt;
                        if (ro.startsWith('EBD')) departmentMap[matchedDeptKey].ebd_proposed += itemAmt;
                    });
                }
                departmentMap[matchedDeptKey].realized += realAmt;
            }

            return acc;
        }, { totalAmount: 0, pendingCount: 0, approvedAmount: 0, rejectedCount: 0, totalCount: 0 });

        stats.totalOfficeCeiling = totalOfficeCeiling;
        stats.categories = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
        
        stats.deptBudgets = Object.entries(departmentMap).map(([name, d]) => ({ 
            name, 
            is_tu: name.toLowerCase().includes('tata usaha'),
            total: d.ceiling, 
            spent: d.proposed,
            remaining: Math.max(0, d.ceiling - d.proposed),
            queue: d.queue,
            fba: { total: d.fba_ceiling, spent: d.fba_proposed, remaining: Math.max(0, d.fba_ceiling - d.fba_proposed) },
            bdh: { total: d.bdh_ceiling, spent: d.bdh_proposed, remaining: Math.max(0, d.bdh_ceiling - d.bdh_proposed) },
            eba: { total: d.eba_ceiling, spent: d.eba_proposed, remaining: Math.max(0, d.eba_ceiling - d.eba_proposed) },
            ebb: { total: d.ebb_ceiling, spent: d.ebb_proposed, remaining: Math.max(0, d.ebb_ceiling - d.ebb_proposed) },
            bdb: { total: d.bdb_ceiling, spent: d.bdb_proposed, remaining: Math.max(0, d.bdb_ceiling - d.bdb_proposed) },
            ebd: { total: d.ebd_ceiling, spent: d.ebd_proposed, remaining: Math.max(0, d.ebd_ceiling - d.ebd_proposed) }
        })).sort((a, b) => b.total - a.total);

        stats.departments = Object.entries(departmentMap).map(([name, d]) => ({ 
            name, proposed: d.proposed, realized: d.realized, value: d.proposed
        }));
        
        stats.monthlyTrend = monthlyTrend;
        return stats;
    }
};
