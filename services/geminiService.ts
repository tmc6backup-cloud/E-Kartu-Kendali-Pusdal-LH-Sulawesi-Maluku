
import { GoogleGenAI } from "@google/genai";

// Initialize GoogleGenAI with API key directly from environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeBudgetRequest = async (title: string, amount: number, description: string) => {
  try {
    const response = await ai.models.generateContent({
      // Use Pro model for complex reasoning and analysis tasks
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
        // Enable thinking budget for more detailed reasoning on complex budget data
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
      const response = await ai.models.generateContent({
        // Flash model is sufficient for basic text summarization/insight tasks
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
