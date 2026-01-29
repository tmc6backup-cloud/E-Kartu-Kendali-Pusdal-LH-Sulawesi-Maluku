
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ArrowRight, Loader2, UserCircle2, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
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
            setError("Lengkapi Nama dan Password.");
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
            <div className="hidden md:flex md:w-1/2 bg-slate-900 p-24 flex-col justify-between text-white relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-20 bg-white/10 w-fit p-3 rounded-2xl border border-white/5">
                        <Logo className="h-8 w-8" />
                        <h2 className="font-black tracking-tighter uppercase text-sm">E-KARTU KENDALI</h2>
                    </div>
                    <h1 className="text-6xl font-black leading-tight">Portal <span className="text-emerald-400">Anggaran</span> Terpadu LH Suma</h1>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Pusdal LH Sulawesi Maluku © 2024</p>
            </div>
            <div className="flex-1 flex items-center justify-center p-12">
                <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-8">
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Otorisasi Akses</h2>
                    {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-bold uppercase border border-red-100 flex items-center gap-3"><ShieldCheck size={16} /> {error}</div>}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nama Lengkap</label>
                            <div className="relative"><UserCircle2 className="absolute left-4 top-4 text-slate-300" size={20} />
                                <input type="text" className="w-full pl-12 pr-4 py-4 border rounded-2xl font-bold outline-none focus:border-blue-600" value={username} onChange={e => setUsername(e.target.value)} disabled={loading} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                            <div className="relative"><Lock className="absolute left-4 top-4 text-slate-300" size={20} />
                                <input type={showPassword ? "text" : "password"} className="w-full pl-12 pr-12 py-4 border rounded-2xl font-bold outline-none focus:border-blue-600" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-300">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                            </div>
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-bold flex items-center justify-center gap-3 shadow-xl hover:bg-slate-800 transition-all">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <><ArrowRight size={20} /> MASUK SISTEM</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
