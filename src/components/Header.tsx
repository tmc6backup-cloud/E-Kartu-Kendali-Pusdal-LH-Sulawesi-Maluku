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
    ArrowRight, 
    Loader2, 
    Megaphone,
    Menu,
    DownloadCloud,
    Vibrate
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService.ts';
import { supabase } from '../lib/supabase.ts';
import { checkPushStatus, subscribeToNotifications } from '../utils/pushUtils.ts';
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
    const [toastData, setToastData] = useState<{title: string, desc: string, type: 'success' | 'danger' | 'info'} | null>(null);
    const [pushStatus, setPushStatus] = useState<string>('default');
    const notificationRef = useRef<HTMLDivElement>(null);

    const getRoleLabel = () => {
        if (!user?.role) return 'PERSONIL';
        if (user.role === 'admin') return 'ADMIN UTAMA';
        if (user.role === 'kpa') return 'KPA';
        if (user.role === 'bendahara') return 'BENDAHARA';
        if (user.role === 'kepala_bidang') return 'KEPALA BIDANG';
        return 'PERSONIL / STAF';
    };

    const processNotifications = (allRequests: any[]) => {
        if (!user) return [];
        const newNotifs: RealNotification[] = [];
        const now = new Date();
        const userDepts = user.department?.split(', ').map(d => d.trim().toLowerCase()) || [];

        if (isValidatorRole(user.role)) {
            let targetStatus = '';
            if (user.role === 'kepala_bidang') targetStatus = 'pending';
            else if (user.role === 'validator_program') targetStatus = 'reviewed_bidang';
            else if (user.role === 'validator_tu') targetStatus = 'reviewed_program';
            else if (user.role === 'validator_ppk') targetStatus = 'reviewed_tu';
            else if (user.role === 'bendahara') targetStatus = 'reviewed_pic';
            else if (user.role.startsWith('pic_')) targetStatus = 'approved';

            const myQueue = allRequests.filter(r => {
                if (r.status !== targetStatus) return false;
                // Filter departemen untuk PIC dan Kabid
                if (user.role.startsWith('pic_') || user.role === 'kepala_bidang') {
                    return userDepts.includes(r.requester_department?.toLowerCase() || '');
                }
                return true;
            });

            if (myQueue.length > 0) {
                newNotifs.push({
                    id: 'queue_alert',
                    type: 'pending',
                    title: 'Antrian Perlu Validasi',
                    desc: `Ada ${myQueue.length} berkas ${user.role.startsWith('pic_') ? 'siap verifikasi SPJ' : 'baru'} menunggu Anda.`,
                    time: 'Baru Saja',
                    icon: <Clock className="text-amber-500" />
                });
            }
        } else {
            const myRequests = allRequests.filter(r => r.requester_id === user.id);
            myRequests.forEach(r => {
                const updatedAt = new Date(r.updated_at);
                const diffMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);

                if (diffMinutes < 120) {
                    if (r.status === 'approved' || r.status === 'reviewed_pic' || r.status === 'realized') {
                        newNotifs.push({
                            id: `n_${r.id}`,
                            type: 'approved',
                            title: 'Update: Disetujui',
                            desc: `Berkas "${r.title.substring(0, 20)}..." disyahakan.`,
                            time: 'Baru Saja',
                            icon: <CheckCircle2 className="text-emerald-500" />,
                            requestId: r.id
                        });
                    } else if (r.status === 'rejected') {
                        newNotifs.push({
                            id: `n_${r.id}`,
                            type: 'rejected',
                            title: 'Update: Revisi',
                            desc: `Perbaiki berkas: "${r.title.substring(0, 20)}..."`,
                            time: 'Baru Saja',
                            icon: <AlertCircle className="text-red-500" />,
                            requestId: r.id
                        });
                    }
                }
            });
        }
        return newNotifs;
    };

    const fetchInitialData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await dbService.getAllRequests();
            const processed = processNotifications(data);
            setNotifications(processed);
            setHasUnread(processed.length > 0);
        } catch (e) {
            console.error("Notif Error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();

        const channel = supabase
            .channel('realtime-header')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'budget_requests' }, (payload) => {
                const updated = payload.new;
                const userDepts = user?.department?.split(', ').map(d => d.trim().toLowerCase()) || [];
                const isDeptMatch = userDepts.includes(updated.requester_department?.toLowerCase() || '');
                
                let showNotification = false;
                let customTitle = 'Update Status Berkas';
                let customDesc = `Berkas "${updated.title.substring(0, 20)}..." telah berubah.`;

                // 1. Cek jika user adalah pengaju berkas tersebut
                if (updated.requester_id === user?.id) {
                    showNotification = true;
                } 
                // 2. Cek jika user adalah PIC Verifikator (harus sesuai departemen & status 'approved')
                else if (user?.role.startsWith('pic_')) {
                    if (isDeptMatch && updated.status === 'approved') {
                        showNotification = true;
                        customTitle = 'Berkas Siap Verifikasi';
                        customDesc = `Berkas baru "${updated.title.substring(0, 20)}..." siap Anda verifikasi SPJ-nya.`;
                    }
                }
                // 3. Cek jika user adalah Kepala Bidang (harus sesuai departemen & status 'pending')
                else if (user?.role === 'kepala_bidang') {
                    if (isDeptMatch && updated.status === 'pending') {
                        showNotification = true;
                        customTitle = 'Antrian Baru';
                        customDesc = `Ada usulan baru "${updated.title.substring(0, 20)}..." menunggu persetujuan Anda.`;
                    }
                }
                // 4. Cek validator kantor lainnya (Program, TU, PPK, Bendahara)
                else if (isValidatorRole(user?.role)) {
                    const rolesToStatus: any = {
                        'validator_program': 'reviewed_bidang',
                        'validator_tu': 'reviewed_program',
                        'validator_ppk': 'reviewed_tu',
                        'bendahara': 'reviewed_pic'
                    };
                    if (updated.status === rolesToStatus[user?.role || '']) {
                        showNotification = true;
                        customTitle = 'Tugas Validasi Baru';
                        customDesc = `Berkas "${updated.title.substring(0, 20)}..." masuk ke antrian Anda.`;
                    }
                }
                
                if (showNotification) {
                    setToastData({
                        title: customTitle,
                        desc: customDesc,
                        type: updated.status === 'rejected' ? 'danger' : 'success'
                    });
                    setShowToast(true);
                    setHasUnread(true);
                    setTimeout(() => setShowToast(false), 7000);
                    fetchInitialData();
                }
            })
            .subscribe();

        const checkPush = async () => {
            const status = await checkPushStatus();
            setPushStatus(status);
        };
        checkPush();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, user?.role, user?.department]);

    const handleNotifClick = (requestId?: string) => {
        setIsNotificationsOpen(false);
        if (requestId) navigate(`/requests/${requestId}`);
        else navigate('/requests');
    };

    return (
        <>
            {showToast && toastData && (
                <div className="fixed top-20 right-4 left-4 md:left-auto md:right-8 z-[100] animate-in slide-in-from-right-8 duration-500">
                    <div className={`backdrop-blur-xl border p-5 rounded-[28px] shadow-2xl flex items-center gap-5 min-w-[300px] ${
                        toastData.type === 'danger' ? 'bg-red-900/90 border-red-500/30' : 'bg-slate-900/90 border-white/20'
                    }`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${toastData.type === 'danger' ? 'bg-red-600' : 'bg-emerald-600'}`}>
                            <Megaphone size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-white text-[11px] font-black uppercase tracking-tight">{toastData.title}</h4>
                            <p className="text-slate-300 text-[9px] font-bold uppercase leading-tight">{toastData.desc}</p>
                        </div>
                        <button onClick={() => setShowToast(false)} className="text-white/40 p-2"><X size={16} /></button>
                    </div>
                </div>
            )}

            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 no-print">
                <div className="flex items-center gap-4 flex-1">
                    <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-500"><Menu size={24} /></button>
                    <div className="lg:hidden flex items-center gap-2">
                        <Logo className="w-8 h-8 object-contain" />
                        <span className="font-bold text-[10px] text-slate-800 uppercase tracking-tighter">E-Kendali</span>
                    </div>
                    <div className="relative max-w-md w-full hidden sm:block">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Search size={18} /></span>
                        <input type="text" placeholder="Cari kegiatan..." className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-xs font-bold outline-none" />
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    {pushStatus !== 'granted' && (
                        <button 
                            onClick={() => subscribeToNotifications(user?.id || '')} 
                            className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                            title="Aktifkan Notifikasi HP"
                        >
                            <Vibrate size={18} />
                        </button>
                    )}

                    {deferredPrompt && (
                        <button onClick={installApp} className="hidden md:flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase">
                            <DownloadCloud size={14} /> Instal App
                        </button>
                    )}

                    <div className="relative" ref={notificationRef}>
                        <button 
                            onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); if(!isNotificationsOpen) setHasUnread(false); }}
                            className={`relative p-2.5 rounded-xl transition-all ${isNotificationsOpen ? 'bg-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Bell size={20} />
                            {hasUnread && <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
                        </button>

                        {isNotificationsOpen && (
                            <div className="fixed inset-x-4 top-16 md:absolute md:inset-auto md:right-0 md:mt-3 w-auto md:w-80 bg-white border border-slate-200 rounded-[28px] shadow-2xl z-50 overflow-hidden">
                                <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
                                    <h4 className="text-[9px] font-black uppercase tracking-widest">Update Terbaru</h4>
                                    <button onClick={() => setIsNotificationsOpen(false)}><X size={14} /></button>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {loading ? (
                                        <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></div>
                                    ) : notifications.length > 0 ? (
                                        notifications.map(n => (
                                            <div key={n.id} onClick={() => handleNotifClick(n.requestId)} className="p-4 hover:bg-slate-50 cursor-pointer border-b flex gap-3 transition-colors">
                                                <div className="shrink-0 mt-1">{n.icon}</div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-slate-900">{n.title}</p>
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase leading-tight">{n.desc}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center">
                                            <p className="text-[9px] font-black text-slate-300 uppercase">Tidak ada berita baru</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-black text-slate-800 leading-none">{user?.full_name}</p>
                            <p className="text-[8px] text-blue-600 font-bold uppercase mt-1">{getRoleLabel()}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 border border-slate-200 uppercase">
                            {user?.full_name?.charAt(0) || '?'}
                        </div>
                        <button onClick={() => setShowLogoutConfirm(true)} className="p-2 text-slate-400 hover:text-red-600 transition-all">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-xs rounded-[32px] p-6 text-center space-y-6 shadow-2xl">
                        <h3 className="text-lg font-black uppercase">Keluar Sistem?</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Sesi Anda akan segera berakhir.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase">Batal</button>
                            <button onClick={logout} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-red-100">Keluar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;