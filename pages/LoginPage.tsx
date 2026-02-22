
import React, { useState, useContext, useEffect } from 'react';
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
    ShieldCheck,
    Lightbulb
} from 'lucide-react';
import Logo from '../components/Logo.tsx';

const LoginPage: React.FC = () => {
    const { login, isLoggedIn } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLightOn, setIsLightOn] = useState(false);

    // Jika sudah login (misal dari auto-login localStorage), jangan tampilkan form
    if (isLoggedIn) return null;

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
        } catch (err: any) {
            setError(err.message || "Gagal masuk ke sistem.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] transition-colors duration-700">
            {/* Branding Side (Left) */}
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
                            Ajukan <span className="text-emerald-400">Penggunaan Anggaran</span> Disini
                        </h1>
                        <p className="text-slate-400 font-medium leading-relaxed">
                            Akses E-Kartu Kendali anda dimana saja dan kapan saja.
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-6">
                   <div className="flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                           Copyright of PUSDAL LH SULAWESI MALUKU
                       </p>
                   </div>
                </div>
            </div>

            {/* Login Side (Right) - Updated Layout */}
            <div className={`flex-1 flex items-center justify-center p-6 md:p-12 transition-all duration-700 ${isLightOn ? 'bg-[#F8FAFC]' : 'bg-slate-950'}`}>
                <div className="w-full max-w-md space-y-12">
                    
                    {/* Centered Lamp Section */}
                    <div className="flex flex-col items-center">
                        <button 
                            onClick={() => setIsLightOn(!isLightOn)}
                            className={`mb-12 p-5 rounded-full transition-all duration-500 relative group ${isLightOn ? 'bg-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.6)] scale-110' : 'bg-slate-800 shadow-inner'}`}
                            title={isLightOn ? "Matikan Lampu" : "Nyalakan Lampu"}
                        >
                            {/* Shortened Lamp Cord */}
                            <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-slate-700 transition-all ${isLightOn ? 'bg-yellow-600' : ''}`}></div>
                            
                            <Lightbulb 
                                size={26} 
                                className={`transition-all duration-500 ${isLightOn ? 'text-white rotate-12' : 'text-slate-600'}`} 
                                fill={isLightOn ? "currentColor" : "none"}
                            />
                            
                            {/* Floating Instruction Text */}
                            {!isLightOn && (
                                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 w-max">
                                    <span className="text-[7px] font-black uppercase text-slate-600 tracking-[0.3em] animate-pulse">
                                        Klik untuk menyalakan
                                    </span>
                                    <div className="w-1 h-1 bg-slate-700 rounded-full animate-bounce"></div>
                                </div>
                            )}
                        </button>

                        <div className={`text-center space-y-2 transition-colors duration-500 ${isLightOn ? 'text-slate-900' : 'text-slate-500'}`}>
                            <h2 className="text-3xl font-black tracking-tight uppercase">Silahkan Login</h2>
                            <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isLightOn ? 'text-slate-500' : 'text-slate-700'}`}>
                                {isLightOn ? 'Masukkan Username dan Password Anda' : ''}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className={`space-y-6 transition-all duration-700 ${isLightOn ? 'opacity-100 translate-y-0' : 'opacity-10 translate-y-8 pointer-events-none grayscale'}`}>
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-3 animate-shake shadow-sm">
                                <ShieldCheck size={18} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 transition-colors ${isLightOn ? 'text-slate-400' : 'text-slate-700'}`}>Username</label>
                            <div className="relative">
                                <UserCircle2 className={`absolute left-4 top-4 transition-colors ${isLightOn ? 'text-slate-300' : 'text-slate-800'}`} size={20} />
                                <input 
                                    type="text"
                                    placeholder="Username"
                                    className={`w-full pl-12 pr-4 py-4 border rounded-2xl outline-none text-sm font-bold transition-all ${isLightOn ? 'bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={loading || !isLightOn}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 transition-colors ${isLightOn ? 'text-slate-400' : 'text-slate-700'}`}>Password</label>
                            <div className="relative">
                                <Lock className={`absolute left-4 top-4 transition-colors ${isLightOn ? 'text-slate-300' : 'text-slate-800'}`} size={20} />
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className={`w-full pl-12 pr-12 py-4 border rounded-2xl outline-none text-sm font-bold transition-all ${isLightOn ? 'bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading || !isLightOn}
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
                            disabled={loading || !isLightOn}
                            className={`w-full py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl ${isLightOn ? 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Verifikasi...
                                </>
                            ) : (
                                <>
                                    <ArrowRight size={18} />
                                    Masuk Ke Dashboard
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center pt-4">
                        <p className={`text-[9px] font-bold uppercase tracking-[0.2em] leading-loose transition-colors ${isLightOn ? 'text-slate-400' : 'text-slate-800'}`}>
                            Lupa password? <br /> Hubungi <span className={`font-black ${isLightOn ? 'text-blue-600' : 'text-slate-700'}`}>Bagian Program & Anggaran</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
