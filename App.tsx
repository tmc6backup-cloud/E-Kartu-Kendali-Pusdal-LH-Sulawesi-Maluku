
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.tsx';
import NewRequest from './pages/NewRequest.tsx';
import RequestList from './pages/RequestList.tsx';
import RequestDetail from './pages/RequestDetail.tsx';
import UserManagement from './pages/UserManagement.tsx';
import AdminPagu from './pages/AdminPagu.tsx';
import LoginPage from './pages/LoginPage.tsx';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import { UserRole, Profile } from './types.ts';
import { dbService } from './services/dbService.ts';

interface AuthContextType {
    user: Profile | null;
    isLoggedIn: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

export const AuthContext = React.createContext<AuthContextType>({ 
    user: null, 
    isLoggedIn: false,
    login: async () => {}, 
    logout: () => {} 
});

export const isValidatorRole = (role?: UserRole) => {
    if (!role) return false;
    const validatorRoles: UserRole[] = [
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
    }, []);

    const login = async (username: string, password: string) => {
        const u = username.trim();
        const p = password.trim();
        
        const cleanName = u.toLowerCase().replace(/\s+/g, '_');
        const userId = u.toLowerCase() === 'admin' ? 'user_admin' : `user_${cleanName}`;
        
        try {
            const profile = await dbService.getProfile(userId);
            if (!profile || profile.password !== p) {
                throw new Error("Kredensial tidak valid.");
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

    if (isAuthResolving) return null;

    return (
        <AuthContext.Provider value={{ user, isLoggedIn, login, logout }}>
            <HashRouter>
                <Routes>
                    <Route path="/login" element={!isLoggedIn ? <LoginPage /> : <Navigate to="/" replace />} />
                    <Route path="/*" element={
                        isLoggedIn ? (
                            <div className="flex min-h-screen bg-slate-50">
                                <Sidebar />
                                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                                    <Header />
                                    <main className="flex-1 overflow-y-auto p-4 md:p-8">
                                        <Routes>
                                            <Route path="/" element={<Dashboard />} />
                                            <Route path="/requests" element={<RequestList />} />
                                            <Route path="/requests/new" element={<NewRequest />} />
                                            <Route path="/requests/edit/:id" element={<NewRequest />} />
                                            <Route path="/requests/:id" element={<RequestDetail />} />
                                            <Route path="/users" element={user?.role === 'admin' ? <UserManagement /> : <Navigate to="/" replace />} />
                                            <Route path="/ceilings" element={user?.role === 'admin' ? <AdminPagu /> : <Navigate to="/" replace />} />
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
