import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.tsx';
import NewRequest from './pages/NewRequest.tsx';
import RequestList from './pages/RequestList.tsx';
import RequestDetail from './pages/RequestDetail.tsx';
import UserManagement from './pages/UserManagement.tsx';
import AdminPagu from './pages/AdminPagu.tsx';
import MasterData from './pages/MasterData.tsx';
import BudgetAnalysis from './pages/BudgetAnalysis.tsx';
import LoginPage from './pages/LoginPage.tsx';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import { UserRole, Profile } from './types.ts';
import { dbService } from './services/dbService.ts';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
    user: Profile | null;
    isLoggedIn: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    deferredPrompt: any;
    installApp: () => void;
}

export const AuthContext = React.createContext<AuthContextType>({ 
    user: null, 
    isLoggedIn: false,
    login: async () => {}, 
    logout: () => {},
    deferredPrompt: null,
    installApp: () => {}
});

export const isValidatorRole = (role?: UserRole | string) => {
    if (!role) return false;
    const validatorRoles: string[] = [
        'kpa', 'validator_program', 'validator_tu', 'validator_ppk', 'admin', 
        'kepala_bidang', 'bendahara', 'pic_verifikator', 'pic_tu', 
        'pic_wilayah_1', 'pic_wilayah_2', 'pic_wilayah_3'
    ];
    return validatorRoles.includes(role);
};

const App: React.FC = () => {
    const [user, setUser] = useState<Profile | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAuthResolving, setIsAuthResolving] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        const checkSession = () => {
            const savedUser = localStorage.getItem('e_anggaran_user');
            if (savedUser) {
                try {
                    const parsed = JSON.parse(savedUser);
                    setUser(parsed);
                    setIsLoggedIn(true);
                } catch (e) {
                    localStorage.removeItem('e_anggaran_user');
                }
            }
            setIsAuthResolving(false);
        };
        checkSession();

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        });

        window.addEventListener('appinstalled', () => {
            setDeferredPrompt(null);
            console.log('E-Kendali berhasil diinstal!');
        });
    }, []);

    const installApp = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: any) => {
                setDeferredPrompt(null);
            });
        }
    };

    const login = async (username: string, password: string) => {
        const u = username.trim();
        const p = password.trim();
        const cleanName = u.toLowerCase().replace(/\s+/g, '_');
        const userId = u.toLowerCase() === 'admin' ? 'user_admin' : `user_${cleanName}`;
        
        try {
            const profile = await dbService.getProfile(userId);
            if (!profile || profile.password !== p) {
                throw new Error("Username atau Password salah.");
            }

            const profileToLogin = { ...profile };
            delete profileToLogin.password;
            
            localStorage.setItem('e_anggaran_user', JSON.stringify(profileToLogin));
            setUser(profileToLogin);
            setIsLoggedIn(true);
        } catch (err: any) { 
            throw err; 
        }
    };

    const logout = () => {
        setUser(null);
        setIsLoggedIn(false);
        localStorage.removeItem('e_anggaran_user');
    };

    if (isAuthResolving) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-900 flex-col gap-4 text-white">
                <Loader2 className="animate-spin text-emerald-400" size={48} />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Memuat Sesi Aman...</p>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, isLoggedIn, login, logout, deferredPrompt, installApp }}>
            <HashRouter>
                <Routes>
                    <Route path="/login" element={!isLoggedIn ? <LoginPage /> : <Navigate to="/" replace />} />
                    <Route path="/*" element={
                        isLoggedIn ? (
                            <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
                                <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
                                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                                    <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
                                    <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                                        <Routes>
                                            <Route path="/" element={<Dashboard />} />
                                            <Route path="/requests" element={<RequestList />} />
                                            <Route path="/requests/new" element={<NewRequest />} />
                                            <Route path="/requests/edit/:id" element={<NewRequest />} />
                                            <Route path="/requests/:id" element={<RequestDetail />} />
                                            <Route path="/users" element={user?.role === 'admin' ? <UserManagement /> : <Navigate to="/" replace />} />
                                            <Route path="/ceilings" element={user?.role === 'admin' ? <AdminPagu /> : <Navigate to="/" replace />} />
                                            <Route path="/master-data" element={user?.role === 'admin' ? <MasterData /> : <Navigate to="/" replace />} />
                                            <Route path="/budget-analysis" element={user?.role === 'admin' ? <BudgetAnalysis /> : <Navigate to="/" replace />} />
                                            <Route path="*" element={<Navigate to="/" replace />} />
                                        </Routes>
                                    </main>
                                </div>
                            </div>
                        ) : <Navigate to="/login" replace />
                    } />
                </Routes>
            </HashRouter>
        </AuthContext.Provider>
    );
};

export default App;