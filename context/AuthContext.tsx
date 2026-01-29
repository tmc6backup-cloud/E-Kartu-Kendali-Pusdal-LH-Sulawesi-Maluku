
import React, { useState, useEffect, createContext } from 'react';
import { UserRole, Profile } from '../types';
import { dbService } from '../services/dbService';

interface AuthContextType {
    user: Profile | null;
    isLoggedIn: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({ 
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<Profile | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAuthResolving, setIsAuthResolving] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('e_anggaran_user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
                setIsLoggedIn(true);
            } catch (e) {
                localStorage.removeItem('e_anggaran_user');
            }
        }
        setIsAuthResolving(false);
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
            {children}
        </AuthContext.Provider>
    );
};
