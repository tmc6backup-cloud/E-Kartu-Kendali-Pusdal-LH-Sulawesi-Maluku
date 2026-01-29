
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { UserCircle2, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';

const LoginPage: React.FC = () => {
    const { login, isLoggedIn } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (isLoggedIn) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!username.trim() || !password.trim()) {
            setError("Lengkapi form.");
            return;
        }
        setLoading(true);
        try {
            await login(username.trim(), password);
        } catch (err: any) {
            setError(err.message || "Gagal masuk.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">
            <div className="hidden md:flex md:w-1/2 bg-slate-900 p-24 flex-col justify-between text-white">
                <div className="flex items-center gap-4">
                    <Logo className="h-10 w-10" />
                    <h2 className="font-black uppercase tracking-tighter">E-KARTU KENDALI</h2>
                </div>
                <h1 className="text-6xl font-black leading-tight">Sistem <span className="text-emerald-400">Anggaran</span> Pusdal LH Suma</h1>
            </div>
            <div className="flex-1 flex items-center justify-center p-12">
                <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-8">
                    <h2 className="text-3xl font-black uppercase">Masuk Sistem</h2>
                    {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold">{error}</div>}
                    <div className="space-y-4">
                        <div className="relative">
                            <UserCircle2 className="absolute left-4 top-4 text-slate-300" size={20} />
                            <input type="text" className="w-full pl-12 pr-4 py-4 border rounded-2xl outline-none" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-4 text-slate-300" size={20} />
                            <input type={showPassword ? "text" : "password"} className="w-full pl-12 pr-4 py-4 border rounded-2xl outline-none" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-300">{showPassword ? <EyeOff /> : <Eye />}</button>
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-bold flex items-center justify-center gap-3">
                        {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />} MASUK
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
