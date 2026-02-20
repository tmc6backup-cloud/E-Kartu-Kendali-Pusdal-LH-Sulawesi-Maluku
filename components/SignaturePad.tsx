
import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, Trash2, Check, Loader2 } from 'lucide-react';

interface SignaturePadProps {
    onSave: (dataUrl: string) => void;
    onClose: () => void;
    title: string;
    loading?: boolean;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClose, title, loading }) => {
    const sigCanvas = useRef<SignatureCanvas>(null);

    const clear = () => {
        sigCanvas.current?.clear();
    };

    const save = () => {
        if (sigCanvas.current?.isEmpty()) {
            alert("Silakan bubuhkan tanda tangan terlebih dahulu.");
            return;
        }
        const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
        if (dataUrl) {
            onSave(dataUrl);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-8 space-y-6">
                    <div className="border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 overflow-hidden touch-none">
                        <SignatureCanvas 
                            ref={sigCanvas}
                            penColor='black'
                            canvasProps={{
                                className: 'w-full h-64 cursor-crosshair'
                            }}
                        />
                    </div>
                    
                    <div className="flex gap-4">
                        <button 
                            onClick={clear}
                            className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                        >
                            <Trash2 size={16} /> Bersihkan
                        </button>
                        <button 
                            onClick={save}
                            disabled={loading}
                            className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            Simpan Tanda Tangan
                        </button>
                    </div>
                </div>
                
                <div className="p-4 bg-amber-50 border-t border-amber-100">
                    <p className="text-[8px] font-bold text-amber-700 uppercase tracking-tight text-center">
                        Gunakan jari atau mouse untuk membubuhkan tanda tangan pada area di atas.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignaturePad;
