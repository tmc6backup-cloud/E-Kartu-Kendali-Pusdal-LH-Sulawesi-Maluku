
import { GoogleGenAI } from "@google/genai";

export const analyzeBudgetRequest = async (title: string, amount: number, description: string) => {
  try {
    // Inisialisasi dilakukan di dalam fungsi tepat sebelum pemanggilan
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analisis pengajuan anggaran pemerintah berikut:
      Judul: ${title}
      Jumlah: Rp ${amount.toLocaleString('id-ID')}
      Deskripsi: ${description}

      Berikan analisis singkat (maks 150 kata) mengenai:
      1. Apakah pengajuan ini terdengar masuk akal secara biaya?
      2. Apa potensi risiko atau ketidakefisienan?
      3. Saran untuk peningkatan akuntabilitas.
      
      Gunakan Bahasa Indonesia yang formal dan profesional.`,
      config: {
        thinkingConfig: { thinkingBudget: 4096 },
        temperature: 0.7,
        topP: 0.95,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Gagal melakukan analisis otomatis. Silakan tinjau secara manual.";
  }
};

export const getBudgetInsights = async (totalPending: number, totalApproved: number) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Dashboard Pengajuan Anggaran:
        Total Pending: Rp ${totalPending.toLocaleString('id-ID')}
        Total Approved: Rp ${totalApproved.toLocaleString('id-ID')}
        
        Berikan 1 kalimat insight strategis untuk pimpinan mengenai alokasi anggaran ini.`,
      });
      return response.text;
    } catch (error) {
      return "Gunakan data dashboard untuk memantau performa anggaran.";
    }
}
