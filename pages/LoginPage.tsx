
import React, { useState, useContext } from 'react';
import { AuthContext } from '../App.tsx';
import { 
    User, 
    ArrowRight, 
    Loader2, 
    UserCircle2, 
    Lock,
    CheckCircle2,
    Eye,
    EyeOff,
    ShieldCheck
} from 'lucide-react';
import Logo from '../components/Logo.tsx';

const LoginPage: React.FC = () => {
    const { login } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!username.trim() || !password.trim()) {
            setError("Nama dan Password wajib diisi.");
            return;
        }

        setLoading(true);
        try {
            await login(username.trim(), password);
            setShowSuccess(true);
        } catch (err: any) {
            setError(err.message || "Gagal masuk ke sistem.");
        } finally {
            setLoading(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col items-center justify-center">
                <div className="relative z-10 text-center space-y-8 animate-success-pop">
                    <div className="relative inline-block">
                        <div className="w-32 h-32 bg-white rounded-[40px] shadow-2xl flex items-center justify-center p-6 border border-slate-50">
                            <Logo className="w-full h-full object-contain" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-10 h-10 bg-emerald-500 text-white rounded-[14px] flex items-center justify-center shadow-xl animate-bounce">
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Login Berhasil</h2>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Mempersiapkan Dashboard Anda...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">
            {/* Branding Side */}
            <div className="hidden md:flex md:w-1/2 lg:w-[60%] bg-slate-900 relative p-12 lg:p-24 flex-col justify-between overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-15%] right-[-10%] w-[90%] h-[90%] border-[50px] border-white/20 rounded-full"></div>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-20">
                        <div className="bg-white p-2 rounded-xl shadow-xl">
                            <Logo className="h-8 w-auto" />
                        </div>
                        <h2 className="text-white font-black text-lg tracking-tight uppercase">E-KARTU KENDALI</h2>
                    </div>
                    <div className="space-y-6 max-w-lg">
                        <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight">
                            Akses Portal <span className="text-emerald-400">Anggaran</span> Terpadu
                        </h1>
                        <p className="text-slate-400 font-medium leading-relaxed">
                            Sistem kendali anggaran Pusdal LH Suma yang akuntabel dan transparan.
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-6">
                   <div className="flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                           Copyright of PUSDAL LH Sulawesi Maluku
                       </p>
                   </div>
                </div>
            </div>

            {/* Login Side */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-md space-y-10">
                    <div className="text-center md:text-left space-y-2">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Masuk Sistem</h2>
                        <p className="text-slate-400 text-sm font-medium">Masukkan kredensial Anda untuk melanjutkan</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-3">
                                <ShieldCheck size={18} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nama Lengkap</label>
                            <div className="relative">
                                <UserCircle2 className="absolute left-4 top-4 text-slate-300" size={20} />
                                <input 
                                    type="text"
                                    placeholder="Username / Nama SK"
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none text-sm font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Password Otoritas</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-4 text-slate-300" size={20} />
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl outline-none text-sm font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-4 text-slate-300 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-slate-900 text-white rounded-3xl font-bold text-sm flex items-center justify-center gap-3 shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                            Masuk Sekarang
                        </button>
                    </form>

                    <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
                            Lupa password? <br /> Hubungi <span className="text-blue-600">Admin Sub Bagian Umum</span> untuk reset.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
