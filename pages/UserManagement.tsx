
import React, { useEffect, useState, useContext } from 'react';
import { 
    UserPlus, 
    Users, 
    Trash2, 
    Shield, 
    User, 
    Building2, 
    Loader2, 
    CheckCircle,
    Search,
    Edit3,
    UserCheck,
    Coins,
    ServerCrash,
    Lock,
    Eye,
    EyeOff,
    GanttChart,
    FileSearch,
    Stamp,
    UserCog,
    X,
    ClipboardCheck,
    MapPin,
    Briefcase,
    LayoutGrid,
    ChevronDown,
    ShieldAlert
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { Profile, UserRole } from '../types';
import { AuthContext } from '../App';

const DEPARTMENTS = [
    "PUSDAL LH SUMA",
    "Bagian Tata Usaha",
    "Bidang Wilayah I",
    "Bidang Wilayah II",
    "Bidang Wilayah III",
    "Sub Bagian Program & Anggaran",
    "Sub Bagian Kehumasan",
    "Sub Bagian Kepegawaian",
    "Sub Bagian Keuangan"
];

const UserManagement: React.FC = () => {
    const { user: currentUser } = useContext(AuthContext);
    const isAdmin = currentUser?.role === 'admin';

    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    
    const [formData, setFormData] = useState({ 
        full_name: '', 
        role: 'pengaju' as UserRole, 
        selectedDepts: [DEPARTMENTS[0]], 
        password: '' 
    });
    
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetConfirmation, setResetConfirmation] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const data = await dbService.getAllProfiles();
            setProfiles(data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchProfiles(); }, []);

    const isCurrentRolePic = formData.role.startsWith('pic_');

    useEffect(() => {
        if (!isCurrentRolePic && formData.selectedDepts.length > 1) {
            setFormData(prev => ({
                ...prev,
                selectedDepts: [prev.selectedDepts[0]]
            }));
        }
    }, [formData.role]);

    const startEdit = (profile: Profile) => {
        setEditingProfile(profile);
        const currentDepts = profile.department ? profile.department.split(', ') : [DEPARTMENTS[0]];
        setFormData({ 
            full_name: profile.full_name, 
            role: profile.role, 
            selectedDepts: currentDepts,
            password: profile.password || '' 
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingProfile(null);
        setFormData({ full_name: '', role: 'pengaju', selectedDepts: [DEPARTMENTS[0]], password: '' });
    };

    const toggleDepartment = (dept: string) => {
        setFormData(prev => {
            const isPic = prev.role.startsWith('pic_');
            const isSelected = prev.selectedDepts.includes(dept);

            if (isPic) {
                if (isSelected) {
                    if (prev.selectedDepts.length <= 1) return prev;
                    return { ...prev, selectedDepts: prev.selectedDepts.filter(d => d !== dept) };
                } else {
                    return { ...prev, selectedDepts: [...prev.selectedDepts, dept] };
                }
            } else {
                return { ...prev, selectedDepts: [dept] };
            }
        });
    };

    const handleAddOrUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.full_name || !formData.password || !isAdmin) {
            alert("Nama dan Password wajib diisi.");
            return;
        }
        setSubmitting(true);
        const cleanName = formData.full_name.trim().toLowerCase().replace(/\s+/g, '_');
        const newUserId = `user_${cleanName}`;
        const departmentString = formData.selectedDepts.join(', ');

        try {
            if (editingProfile && editingProfile.id !== newUserId) { 
                await dbService.deleteProfile(editingProfile.id); 
            }
            const updatedProfile: Profile = { 
                id: newUserId, 
                full_name: formData.full_name.trim(), 
                role: formData.role, 
                department: departmentString,
                password: formData.password
            };
            const result = await dbService.syncProfile(updatedProfile);
            if (result) { 
                alert("Data otoritas user berhasil diperbarui.");
                cancelEdit(); 
                await fetchProfiles(); 
            }
        } catch (err: any) { alert(err.message); } finally { setSubmitting(false); }
    };

    const handleResetDatabase = async () => {
        if (resetConfirmation !== 'HAPUS') {
            alert("Harap ketik 'HAPUS' untuk konfirmasi.");
            return;
        }
        setIsResetting(true);
        try {
            const result = await dbService.deleteAllRequests();
            if (result.success) {
                alert("Database pengajuan anggaran berhasil dikosongkan.");
                setShowResetModal(false);
                setResetConfirmation('');
            } else { alert("Gagal meriset database: " + result.error); }
        } catch (err: any) { alert("Terjadi kesalahan sistem."); } finally { setIsResetting(false); }
    };

    const getRoleInfo = (role: string) => {
        switch(role) {
            case 'admin': return { label: 'Admin Utama', icon: <Shield size={14} />, color: 'bg-slate-900 text-white border-slate-800' };
            case 'kpa': return { label: 'Kuasa Pengguna Anggaran (KPA)', icon: <ShieldAlert size={14} />, color: 'bg-indigo-900 text-white border-indigo-700' };
            case 'pic_verifikator': return { label: 'PIC Verifikator SPJ', icon: <ClipboardCheck size={14} />, color: 'bg-emerald-600 text-white border-emerald-700' };
            case 'pic_tu': return { label: 'PIC Tata Usaha', icon: <UserCog size={14} />, color: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
            case 'pic_wilayah_1': return { label: 'PIC Bidang Wilayah I', icon: <UserCog size={14} />, color: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
            case 'pic_wilayah_2': return { label: 'PIC Bidang Wilayah II', icon: <UserCog size={14} />, color: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
            case 'pic_wilayah_3': return { label: 'PIC Bidang Wilayah III', icon: <UserCog size={14} />, color: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
            case 'kepala_bidang': return { label: `Kepala Bidang`, icon: <UserCheck size={14} />, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
            case 'validator_program': return { label: 'Validator Bagian Program & Anggaran', icon: <GanttChart size={14} />, color: 'bg-amber-100 text-amber-700 border-amber-200' };
            case 'validator_tu': return { label: 'Kasubag TU', icon: <FileSearch size={14} />, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
            case 'validator_ppk': return { label: 'Pejabat PPK', icon: <Stamp size={14} />, color: 'bg-purple-100 text-purple-700 border-purple-200' };
            case 'bendahara': return { label: 'Bendahara Pengeluaran', icon: <Coins size={14} />, color: 'bg-emerald-600 text-white border-emerald-700' };
            default: return { label: 'Pengaju (Staf)', icon: <User size={14} />, color: 'bg-blue-100 text-blue-700 border-blue-200' };
        }
    };

    const filteredProfiles = profiles.filter(p => 
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.department && p.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                            <Users size={28} />
                        </div>
                        Manajemen Otoritas
                    </h1>
                    <p className="text-sm font-bold text-slate-500 ml-16">Konfigurasi peran dan aksesibilitas bidang kerja personil.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <div className="xl:col-span-4 space-y-8">
                    <div className={`p-10 rounded-[48px] border-2 transition-all shadow-xl sticky top-24 ${editingProfile ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-100'}`}>
                        <div className="flex items-center gap-4 mb-10">
                            <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shadow-inner ${editingProfile ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {editingProfile ? <Edit3 size={28} /> : <UserPlus size={28} />}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                    {editingProfile ? 'Koreksi Akun' : 'Akun Baru'}
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lengkapi Otoritas User</p>
                            </div>
                        </div>
                        
                        <form onSubmit={handleAddOrUpdateUser} className="space-y-8">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nama Lengkap Personil</label>
                                <div className="relative">
                                    <User className="absolute left-5 top-5 text-slate-300" size={18} />
                                    <input type="text" required className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-3xl outline-none font-black text-sm focus:border-blue-600 transition-all uppercase shadow-sm" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} placeholder="INPUT NAMA LENGKAP" />
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Password Akses</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-5 text-slate-300" size={18} />
                                    <input type={showPassword ? "text" : "password"} required className="w-full pl-14 pr-14 py-5 bg-white border border-slate-200 rounded-3xl outline-none font-black text-sm focus:border-blue-600 transition-all shadow-sm" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-5 text-slate-300 hover:text-slate-600 transition-colors">
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Otoritas & Peran Sistem</label>
                                <div className="relative">
                                    <Shield className="absolute left-5 top-5 text-slate-300 pointer-events-none" size={18} />
                                    <select className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-3xl outline-none font-black text-xs focus:border-blue-600 transition-all shadow-sm appearance-none cursor-pointer uppercase" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}>
                                        <option value="pengaju">Pengaju (Staf)</option>
                                        <optgroup label="PIC Verifikator SPJ">
                                            <option value="pic_tu">PIC Tata Usaha</option>
                                            <option value="pic_wilayah_1">PIC Bidang Wilayah I</option>
                                            <option value="pic_wilayah_2">PIC Bidang Wilayah II</option>
                                            <option value="pic_wilayah_3">PIC Bidang Wilayah III</option>
                                            <option value="pic_verifikator">PIC Verifikator (UMUM)</option>
                                        </optgroup>
                                        <optgroup label="Pejabat Struktural">
                                            <option value="kepala_bidang">Kepala Bidang</option>
                                            <option value="validator_tu">Kasubag TU</option>
                                            <option value="validator_ppk">Pejabat PPK</option>
                                            <option value="kpa">Kuasa Pengguna Anggaran (KPA)</option>
                                        </optgroup>
                                        <optgroup label="Keuangan & Sistem">
                                            <option value="validator_program">Validator Bagian Program & Anggaran</option>
                                            <option value="bendahara">Bendahara Pengeluaran</option>
                                            <option value="admin">Admin Utama</option>
                                        </optgroup>
                                    </select>
                                    <ChevronDown className="absolute right-5 top-5 text-slate-300 pointer-events-none" size={20} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Departemen / Unit Kerja</label>
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg uppercase transition-all duration-300 ${isCurrentRolePic ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                                        {isCurrentRolePic ? 'Multi-select' : 'Single-select'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-2 p-6 bg-slate-50 border border-slate-200 rounded-[32px] max-h-[340px] overflow-y-auto custom-scrollbar shadow-inner">
                                    {DEPARTMENTS.map(dept => (
                                        <button key={dept} type="button" onClick={() => toggleDepartment(dept)} className={`flex items-center gap-4 p-4 rounded-2xl transition-all border-2 text-left ${formData.selectedDepts.includes(dept) ? 'bg-white border-blue-600 shadow-md translate-x-1' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-100 text-slate-400'}`}>
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${formData.selectedDepts.includes(dept) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-100'}`}>
                                                <CheckCircle size={14} />
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-tight leading-tight ${formData.selectedDepts.includes(dept) ? 'text-blue-900' : 'text-slate-400'}`}>
                                                {dept}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                {editingProfile && (
                                    <button type="button" onClick={cancelEdit} className="flex-1 py-5 bg-white border-2 border-slate-100 text-slate-400 hover:bg-slate-50 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95">Batal</button>
                                )}
                                <button type="submit" disabled={submitting || !isAdmin} className={`flex-[2] py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 shadow-2xl ${editingProfile ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-slate-900 text-white shadow-slate-200'}`}>
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />} 
                                    {editingProfile ? 'Simpan Perubahan' : 'Daftarkan Otoritas'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="xl:col-span-8 space-y-8">
                    <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
                        <div className="relative flex-1 w-full group">
                            <Search size={22} className="absolute left-6 top-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input type="text" placeholder="CARI PERSONIL BERDASARKAN NAMA ATAU BIDANG..." className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-transparent rounded-[32px] outline-none text-xs font-black uppercase tracking-wider focus:bg-white focus:border-blue-600 transition-all shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-3 px-6 py-5 bg-blue-50 border border-blue-100 rounded-[32px] text-blue-600">
                            <Users size={20} />
                            <span className="text-[11px] font-black uppercase">{filteredProfiles.length} Terdaftar</span>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-[56px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Personil & Departemen</th>
                                        <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Otoritas Otorisasi</th>
                                        <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan={3} className="py-40 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto opacity-20" size={64} /></td></tr>
                                    ) : filteredProfiles.length > 0 ? (
                                        filteredProfiles.map(p => {
                                            const role = getRoleInfo(p.role);
                                            const depts = p.department ? p.department.split(', ') : [];
                                            const isCurrentUser = p.id === currentUser?.id;
                                            return (
                                                <tr key={p.id} className="hover:bg-slate-50/50 transition-all group">
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-14 h-14 bg-slate-100 border border-slate-200 rounded-3xl flex items-center justify-center font-black text-slate-400 uppercase group-hover:bg-white group-hover:text-blue-600 group-hover:border-blue-100 transition-all text-lg shadow-inner">
                                                                {p.full_name.charAt(0)}
                                                            </div>
                                                            <div className="space-y-2">
                                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                                                    {p.full_name}
                                                                    {isCurrentUser && <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[8px] rounded-md font-black">SAYA</span>}
                                                                </p>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {depts.map((d, i) => (
                                                                        <span key={i} className="text-[8px] font-black bg-white text-slate-500 border border-slate-200 px-2.5 py-1 rounded-xl uppercase shadow-sm flex items-center gap-1.5">
                                                                            <Building2 size={10} className="text-slate-300" /> {d}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <div className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border-2 shadow-sm inline-flex items-center gap-3 transition-all ${role.color}`}>
                                                            {role.icon} {role.label}
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8 text-right">
                                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button onClick={() => startEdit(p)} className="p-4 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-100 rounded-2xl transition-all shadow-sm active:scale-90" title="Koreksi Otoritas"><Edit3 size={18} /></button>
                                                            {!isCurrentUser && (
                                                                <button onClick={async () => { if(confirm(`Cabut otoritas ${p.full_name}?`)) { await dbService.deleteProfile(p.id); fetchProfiles(); } }} className="p-4 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-100 rounded-2xl transition-all shadow-sm active:scale-90" title="Cabut Akses Otoritas"><Trash2 size={18} /></button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="py-60 text-center">
                                                <div className="max-w-xs mx-auto space-y-6 opacity-10">
                                                    <LayoutGrid size={120} strokeWidth={1} className="mx-auto" />
                                                    <p className="text-lg font-black uppercase tracking-[0.4em]">Data Nihil</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
