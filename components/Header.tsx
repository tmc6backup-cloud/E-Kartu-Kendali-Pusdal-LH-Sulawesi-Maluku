
import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext, isValidatorRole } from '../context/AuthContext';
import { Bell, Search, LogOut, X, Clock, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import Logo from './Logo';

const Header: React.FC = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    const fetchNotif = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const allRequests = await dbService.getAllRequests();
            const newNotifs = [];
            if (isValidatorRole(user.role)) {
                const myQueue = allRequests.filter(r => r.status === 'pending');
                if (myQueue.length > 0) {
                    newNotifs.push({
                        id: 'q',
                        title: 'Antrian Baru',
                        desc: `Ada ${myQueue.length} berkas menunggu.`,
                        icon: <Clock className="text-amber-500" />
                    });
                }
            }
            setNotifications(newNotifs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotif();
        const handleClickOutside = (e: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) setIsNotificationsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [user]);

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 no-print">
            <div className="flex items-center gap-6 flex-1">
                <div className="lg:hidden flex items-center gap-2">
                    <Logo className="w-8 h-8" />
                    <span className="font-bold text-[10px] tracking-tighter uppercase">E-Kendali</span>
                </div>
                <div className="relative max-w-md w-full hidden sm:block">
                    <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                    <input type="text" placeholder="Cari berkas..." className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-sm outline-none" />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative" ref={notificationRef}>
                    <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl relative">
                        <Bell size={20} />
                        {notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
                    </button>
                    {isNotificationsOpen && (
                        <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-50">
                            <div className="p-4 bg-slate-50 border-b font-bold text-xs uppercase">Pusat Informasi</div>
                            <div className="max-h-60 overflow-y-auto">
                                {notifications.length > 0 ? notifications.map(n => (
                                    <div key={n.id} className="p-4 hover:bg-slate-50 cursor-pointer flex gap-3">
                                        {n.icon}
                                        <div>
                                            <p className="text-xs font-bold">{n.title}</p>
                                            <p className="text-[10px] text-slate-500">{n.desc}</p>
                                        </div>
                                    </div>
                                )) : <div className="p-8 text-center text-xs text-slate-400">Tidak ada update</div>}
                            </div>
                        </div>
                    )}
                </div>
                <div className="h-8 w-px bg-slate-200"></div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-800 leading-none mb-1">{user?.full_name}</p>
                        <p className="text-[9px] text-blue-600 font-bold uppercase">{user?.role}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">{user?.full_name?.charAt(0)}</div>
                    <button onClick={logout} className="p-2 text-slate-400 hover:text-red-600"><LogOut size={20} /></button>
                </div>
            </div>
        </header>
    );
};

export default Header;
