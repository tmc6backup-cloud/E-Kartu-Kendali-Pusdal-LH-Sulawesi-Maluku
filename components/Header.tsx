
import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext, isValidatorRole } from '../App.tsx';
import { 
    Bell, 
    Search, 
    LogOut, 
    X, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    MessageSquare, 
    ArrowRight, 
    Loader2, 
    Sparkles, 
    Megaphone,
    Menu,
    DownloadCloud
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService.ts';
import Logo from './Logo.tsx';

interface HeaderProps {
    onMenuClick: () => void;
}

interface RealNotification {
    id: string;
    type: 'pending' | 'approved' | 'rejected' | 'info';
    title: string;
    desc: string;
    time: string;
    icon: React.ReactNode;
    requestId?: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { user, logout, deferredPrompt, installApp } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<RealNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastData, setToastData] = useState<{title: string, count: number} | null>(null);
    const [lastQueueCount, setLastQueueCount] = useState<number>(0);
    const notificationRef = useRef<HTMLDivElement>(null);

    const fetchRealNotifications = async (isInitial = false) => {
        if (!user) return;
        if (isInitial) setLoading(true);
        
        try {
            const allRequests = await dbService.getAllRequests();
            const now = new Date();
            const newNotifications: RealNotification[] = [];

            if (isValidatorRole(user.role)) {
                let targetStatus = '';
                let queueName = '';
                
                if (user.role === 'kepala_bidang') { targetStatus = 'pending'; queueName = 'Struktural'; }
                else if (user.role === 'validator_program') { targetStatus = 'reviewed_bidang'; queueName = 'Program & Anggaran'; }
                else if (user.role === 'validator_tu') { targetStatus = 'reviewed_program'; queueName = 'TU'; }
                else if (user.role === 'validator_ppk') { targetStatus = 'reviewed_tu'; queueName = 'PPK'; }
                else if (user.role?.startsWith('pic_')) { targetStatus = 'approved'; queueName = 'Verifikasi SPJ'; }
                else if (user.role === 'bendahara') { targetStatus = 'reviewed_pic'; queueName = 'Pembayaran'; }
                else if (user.role === 'admin') { targetStatus = 'pending'; queueName = 'Sistem'; }

                let myQueue = allRequests.filter(r => r.status === targetStatus);
                
                if (user.role === 'kepala_bidang' || user.role?.startsWith('pic_wilayah_')) {
                    const myDepts = user.department?.split(', ').map(d => d.trim().toLowerCase()) || [];
                    myQueue = myQueue.filter(r => myDepts.includes(r.requester_department?.toLowerCase() || ''));
                }

                const currentCount = myQueue.length;

                if (!isInitial && currentCount > lastQueueCount) {
                    setToastData({ title: queueName, count: currentCount });
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 8000);
                }
                
                setLastQueueCount(currentCount);

                if (currentCount > 0) {
                    newNotifications.push({
                        id: 'queue_alert',
                        type: 'pending',
                        title: `Antrian ${queueName}`,
                        desc: `Ada ${currentCount} berkas menunggu tindakan Anda saat ini.`,
                        time: 'Real-time',
                        icon: <Clock className="text-amber-500" />,
                        requestId: undefined
                    });
                }
            } else {
                const myRequests = allRequests.filter(r => r.requester_id === user.id);
                
                myRequests.forEach(r => {
                    const updatedAt = new Date(r.updated_at);
                    const diffHours = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);

                    if (diffHours < 24) {
                        if (r.status === 'approved') {
                            newNotifications.push({
                                id: `app_${r.id}`,
                                type: 'approved',
                                title: 'Usulan Disetujui',
                                desc: `Persetujuan PPK selesai. Silakan lengkapi SPJ untuk: ${r.title.substring(0, 20)}...`,
                                icon: <CheckCircle2 className="text-emerald-500" />,
                                requestId: r.id,
                                time: 'Baru saja'
                            });
                        } else if (r.status === 'rejected') {
                            newNotifications.push({
                                id: `rej_${r.id}`,
                                type: 'rejected',
                                title: 'Perlu Revisi',
                                desc: `Berkas dikembalikan: ${r.title.substring(0, 20)}...`,
                                icon: <AlertCircle className="text-red-500" />,
                                requestId: r.id,
                                time: 'Baru saja'
                            });
                        }
                    }
                });
            }

            setNotifications(newNotifications);
            setHasUnread(newNotifications.length > 0);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            if (isInitial) setLoading(false);
        }
    };

    const getRoleLabel = () => {
        let prefix = "";
        const dept = user?.department || "PERSONIL SUMA";
        if (user?.role === 'admin') return 'ADMIN UTAMA - PUSDAL LH SUMA';
        
        switch (user?.role) {
            case 'kepala_bidang': prefix = "KEPALA BIDANG"; break;
            case 'validator_program': prefix = "VALIDATOR PROGRAM"; break;
            case 'validator_tu': prefix = "KASUBAG TATA USAHA"; break;
            case 'validator_ppk': prefix = "PEJABAT PPK"; break;
            case 'bendahara': prefix = "BENDAHARA"; break;
            case 'pic_tu': prefix = "PIC TU"; break;
            case 'pic_verifikator': prefix = "PIC VERIFIKATOR"; break;
            default:
                if (user?.role?.startsWith('pic_wilayah_')) {
                    const num = user.role.split('_').pop();
                    prefix = `PIC WILAYAH ${num}`;
                } else {
                    prefix = "PERSONIL";
                }
        }
        return `${prefix} – ${dept.toUpperCase()}`;
    };

    useEffect(() => {
        fetchRealNotifications(true);
        const interval = setInterval(() => fetchRealNotifications(false), 30000);
        
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            clearInterval(interval);
        };
    }, [user, lastQueueCount]);

    const toggleNotifications = () => {
        setIsNotificationsOpen(!isNotificationsOpen);
        if (!isNotificationsOpen) {
            setHasUnread(false);
            fetchRealNotifications(false);
        }
    };

    const handleNotifClick = (requestId?: string) => {
        setIsNotificationsOpen(false);
        if (requestId) {
            navigate(`/requests/${requestId}`);
        } else {
            navigate('/requests');
        }
    };

    return (
        <>
            {showToast && toastData && (
                <div className="fixed top-20 right-8 z-[100] animate-in slide-in-from-right-8 duration-500">
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 p-6 rounded-[32px] shadow-2xl shadow-blue-500/20 flex items-center gap-6 min-w-[320px]">
                        <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                            <Megaphone size={28} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Update Antrian</p>
                            <h4 className="text-white text-sm font-black uppercase tracking-tight">Berkas Baru Masuk!</h4>
                            <p className="text-slate-400 text-[11px] font-bold">Ada pengajuan baru di antrian {toastData.title}.</p>
                        </div>
                        <button onClick={() => setShowToast(false)} className="text-white/40 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 no-print">
                <div className="flex items-center gap-4 flex-1">
                    <button 
                        onClick={onMenuClick}
                        className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="lg:hidden flex items-center gap-2">
                        <Logo className="w-8 h-8 object-contain" />
                        <span className="font-bold text-[10px] tracking-tighter text-slate-800 uppercase">E-Kendali</span>
                    </div>

                    <div className="relative max-w-md w-full hidden sm:block">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                            <Search size={18} />
                        </span>
                        <input 
                            type="text" 
                            placeholder="Cari berkas pengajuan..." 
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 rounded-xl text-sm transition-all outline-none font-medium"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-6">
                    {/* PWA Install Button */}
                    {deferredPrompt && (
                        <button 
                            onClick={installApp}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all animate-pulse"
                            title="Instal Aplikasi ke HP"
                        >
                            <DownloadCloud size={16} />
                            <span className="hidden sm:inline">Instal App</span>
                        </button>
                    )}

                    <div className="relative" ref={notificationRef}>
                        <button 
                            onClick={toggleNotifications}
                            className={`relative p-2.5 rounded-xl transition-all duration-300 ${isNotificationsOpen ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                            <Bell size={20} />
                            {hasUnread && (
                                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                            )}
                        </button>

                        {isNotificationsOpen && (
                            <div className="fixed inset-x-4 top-16 md:absolute md:inset-auto md:right-0 md:mt-3 w-auto md:w-96 bg-white border border-slate-200 rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-top-2 md:zoom-in-95 duration-200 origin-top-right z-50">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Pusat Informasi</h4>
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">Update Real-time Sistem</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsNotificationsOpen(false)}
                                        className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-900 shadow-sm"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="max-h-[400px] md:max-h-[450px] overflow-y-auto custom-scrollbar">
                                    {loading && notifications.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <Loader2 size={24} className="animate-spin text-blue-500 mx-auto mb-3" />
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memuat Update...</p>
                                        </div>
                                    ) : notifications.length > 0 ? (
                                        <div className="divide-y divide-slate-100">
                                            {notifications.map((notif) => (
                                                <div 
                                                    key={notif.id} 
                                                    onClick={() => handleNotifClick(notif.requestId)}
                                                    className="p-5 md:p-6 hover:bg-slate-50 transition-colors cursor-pointer group active:bg-slate-100"
                                                >
                                                    <div className="flex gap-4">
                                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                            {notif.icon}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <p className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-tight">{notif.title}</p>
                                                                <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{notif.time}</span>
                                                            </div>
                                                            <p className="text-[10px] md:text-[11px] text-slate-500 leading-relaxed font-bold uppercase">{notif.desc}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-16 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                                <Bell size={24} className="text-slate-200" />
                                            </div>
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Belum ada update baru</p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                                    <Link 
                                        to="/requests" 
                                        onClick={() => setIsNotificationsOpen(false)}
                                        className="w-full flex items-center justify-center gap-2 py-4 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-[0.2em] transition-all bg-white border border-blue-100 rounded-2xl shadow-sm"
                                    >
                                        Monitoring Berkas <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="h-8 w-px bg-slate-200"></div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-slate-800 leading-none mb-1">{user?.full_name}</p>
                            <p className="text-[9px] text-blue-600 font-bold uppercase tracking-tighter">{getRoleLabel()}</p>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-sm ${
                            user?.role === 'admin' ? 'bg-slate-900 text-white' :
                            user?.role === 'kepala_bidang' ? 'bg-emerald-100 text-emerald-700' :
                            user?.role === 'validator_ppk' ? 'bg-purple-100 text-purple-700' : 
                            user?.role === 'validator_tu' ? 'bg-indigo-100 text-indigo-700' :
                            user?.role === 'validator_program' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                            {user?.full_name?.charAt(0)}
                        </div>
                        
                        <button 
                            onClick={() => setShowLogoutConfirm(true)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ml-1"
                            title="Keluar Aplikasi"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300 no-print">
                    <div className="bg-white w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
                                <LogOut size={24} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1.5">Konfirmasi Keluar</h3>
                            <p className="text-[11px] font-bold text-slate-500 mb-6 uppercase tracking-wide">Apakah Anda yakin ingin keluar?</p>
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

export default Header;
