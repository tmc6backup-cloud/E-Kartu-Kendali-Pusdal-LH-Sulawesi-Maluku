
import React, { useContext, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, 
    PlusCircle, 
    LogOut,
    ClipboardCheck,
    Users,
    GanttChart,
    FileSearch,
    Stamp,
    LayoutList,
    Building2,
    Coins,
    FileText,
    Wallet,
    Briefcase,
    ShieldCheck
} from 'lucide-react';
import { AuthContext, isValidatorRole } from '../App';
import Logo from './Logo';

const Sidebar: React.FC = () => {
    const location = useLocation();
    const { user, logout } = useContext(AuthContext);
    const isValidator = isValidatorRole(user?.role);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    
    const userDepts = useMemo(() => {
        if (!user?.department) return [];
        return user.department.split(', ').map(d => d.trim());
    }, [user]);

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
    ];

    if (isValidator) {
        if (user?.role?.startsWith('pic_')) {
            userDepts.forEach(dept => {
                menuItems.push({
                    icon: <FileText size={20} />,
                    label: `Verifikasi SPJ ${dept}`,
                    path: `/requests?status=approved&dept=${encodeURIComponent(dept)}`
                });
            });
        } else if (user?.role === 'kepala_bidang') {
            userDepts.forEach(dept => {
                menuItems.push({
                    icon: <LayoutList size={20} />,
                    label: `Antrian ${dept}`,
                    path: `/requests?status=pending&dept=${encodeURIComponent(dept)}`
                });
            });
        } else {
            let qLabel = 'Antrian Validasi';
            let qStatus = 'pending';
            let qIcon = <ClipboardCheck size={20} />;

            if (user?.role === 'validator_program') {
                qLabel = 'Antrian Program';
                qStatus = 'reviewed_bidang';
                qIcon = <GanttChart size={20} />;
            } else if (user?.role === 'validator_tu') {
                qLabel = 'Antrian Kasubag TU';
                qStatus = 'reviewed_program';
                qIcon = <FileSearch size={20} />;
            } else if (user?.role === 'validator_ppk') {
                qLabel = 'Antrian PPK';
                qStatus = 'reviewed_tu';
                qIcon = <Stamp size={20} />;
            } else if (user?.role === 'bendahara') {
                qLabel = 'Siap Bayar';
                qStatus = 'reviewed_pic'; 
                qIcon = <Coins size={20} />;
            } else if (user?.role === 'admin' || user?.role === 'kpa') {
                qLabel = 'Monitoring Kantor';
                qStatus = ''; 
                qIcon = <LayoutList size={20} />;
            }

            menuItems.push({ icon: qIcon, label: qLabel, path: qStatus ? `/requests?status=${qStatus}` : `/requests` });
        }
    }

    if (user?.role !== 'admin' && user?.role !== 'kpa') {
        menuItems.push({ 
            icon: <LayoutList size={20} />, 
            label: isValidator ? 'Seluruh Berkas' : 'Berkas Saya', 
            path: '/requests' 
        });
    }

    if (!isValidator) {
        menuItems.push({ icon: <PlusCircle size={20} />, label: 'Buat Baru', path: '/requests/new' });
    }

    if (user?.role === 'admin') {
        menuItems.push({ icon: <Wallet size={20} />, label: 'Manajemen Pagu', path: '/ceilings' });
        menuItems.push({ icon: <Users size={20} />, label: 'Manajemen User', path: '/users' });
    }

    const isActive = (path: string) => {
        const currentPath = location.pathname + location.search;
        if (path.includes('?')) return currentPath === path;
        return location.pathname === path && location.search === '';
    };

    const getRoleLabel = () => {
        if (user?.role === 'admin') return 'ADMIN UTAMA';
        if (user?.role === 'kpa') return 'KUASA PENGGUNA ANGGARAN (KPA)';
        if (user?.role === 'pic_verifikator') return 'PIC VERIFIKATOR SPJ';
        if (user?.role === 'pic_tu') return 'PIC TATA USAHA';
        if (user?.role?.startsWith('pic_wilayah_')) {
            const num = user.role.split('_').pop();
            return `PIC BIDANG WILAYAH ${num}`;
        }
        if (user?.role === 'kepala_bidang') return 'KEPALA BIDANG';
        if (user?.role === 'validator_program') return 'VALIDATOR BAGIAN PROGRAM & ANGGARAN';
        if (user?.role === 'validator_tu') return 'KASUBAG TATA USAHA';
        if (user?.role === 'validator_ppk') return 'PEJABAT PPK';
        if (user?.role === 'bendahara') return 'BENDAHARA';
        return 'PERSONIL';
    };

    const getRoleBadge = () => {
        if (user?.role === 'admin') return 'bg-slate-900 text-white border-slate-800 shadow-slate-900/10';
        if (user?.role === 'kpa') return 'bg-indigo-900 text-white border-indigo-700 shadow-indigo-900/20';
        if (user?.role?.startsWith('pic_')) return 'bg-blue-50 text-blue-700 border-blue-200 shadow-blue-50';
        if (user?.role === 'kepala_bidang') return 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-50';
        if (user?.role === 'validator_program') return 'bg-amber-50 text-amber-700 border-amber-200 shadow-amber-50';
        if (user?.role === 'validator_tu') return 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-indigo-50';
        if (user?.role === 'validator_ppk') return 'bg-purple-50 text-purple-700 border-purple-200 shadow-purple-50';
        if (user?.role === 'bendahara') return 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-900/20';
        return 'bg-blue-50 text-blue-700 border-blue-200 shadow-blue-50';
    };

    return (
        <>
            <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 no-print">
                <div className="p-8 border-b border-slate-100">
                    <Link to="/" className="flex flex-col items-center gap-4 text-slate-800 group">
                        <Logo className="w-14 h-14" />
                        <div className="text-center">
                            <span className="tracking-tighter font-black text-xs block leading-none">E-KARTU KENDALI</span>
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 block">Pusdal LH Suma</span>
                        </div>
                    </Link>
                    <div className="mt-6 space-y-2">
                        <span className={`text-[8px] px-3 py-2.5 rounded-xl font-black uppercase tracking-widest border block text-center shadow-sm ${getRoleBadge()}`}>
                                {getRoleLabel()}
                        </span>
                        {userDepts.length > 0 && (
                            <div className="flex flex-col gap-1.5 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500">
                                {userDepts.map((dept, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-1">
                                        <Building2 size={12} className="text-blue-500 shrink-0" />
                                        <span className="text-[7px] font-bold uppercase leading-tight tracking-wider text-slate-600">{dept}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                
                <nav className="flex-1 p-5 space-y-1.5 overflow-y-auto">
                    {menuItems.map((item, idx) => (
                        <Link
                            key={`${item.path}-${idx}`}
                            to={item.path}
                            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-[20px] transition-all duration-300 border-2 ${
                                isActive(item.path) 
                                ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xl shadow-slate-200' 
                                : 'text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-900 font-bold'
                            }`}
                        >
                            <div className={`${isActive(item.path) ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {item.icon}
                            </div>
                            <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-6 border-t border-slate-100">
                    <button 
                        onClick={() => setShowLogoutConfirm(true)} 
                        className="w-full flex items-center justify-center gap-3 py-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-300 font-black text-[10px] uppercase tracking-[0.2em] border border-transparent hover:border-red-100"
                    >
                        <LogOut size={18} /> Keluar Sistem
                    </button>
                </div>
            </aside>

            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
                                <LogOut size={24} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1.5">Konfirmasi Keluar</h3>
                            <p className="text-[11px] font-bold text-slate-500 mb-6 uppercase tracking-wide">Yakin ingin mengakhiri sesi?</p>
                            <div className="grid grid-cols-2 gap-3 w-full">
                                <button onClick={() => setShowLogoutConfirm(false)} className="py-3.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Batal</button>
                                <button onClick={logout} className="py-3.5 bg-red-600 text-white hover:bg-red-700 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-100 transition-all active:scale-95">Keluar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;
