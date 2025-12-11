import { GoogleGenAI, Type } from "@google/genai";

const SOLVER_SYSTEM_INSTRUCTION = `You are an IGNOU Academic Expert. 
Your task is to write 'Human polished' comprehensive, 500-word academic answers for each question provided by the user. 
The user will either provide a list of questions text or a PDF containing the questions.

STRICT GUIDELINES:
1.  **Format:** Use a formal academic tone. Structure each answer with clear Sub-headings, Bullet points where applicable, and a Concluding Summary.
2.  **Source Material:** Base your answers on standard IGNOU study material concepts.
3.  **Context:** Ensure data and references are relevant to the 2025-2026 academic session.
4.  **Region:** If a question requires current affairs or specific examples, use the **INDIAN Context**.
5.  **Structure:** 
    *   Start with the Question Title/Number.
    *   Introduction.
    *   Body Paragraphs (with sub-headings).
    *   Conclusion/Summary.
6.  **Volume:** Aim for approximately 500 words per answer unless the question specifically asks for a short note.
`;

// Helper to convert file to base64
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateAssignment = async (
  questions: string, 
  file: File | null,
  onProgress: (partialResult: string, status: string) => void
) => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-2.5-flash';

  try {
    const inputParts: any[] = [];

    // Add file if present
    if (file) {
      const filePart = await fileToGenerativePart(file);
      inputParts.push(filePart);
    }

    // Add text questions if present
    if (questions.trim()) {
      inputParts.push({ text: questions });
    }

    if (inputParts.length === 0) {
      throw new Error("Please provide either text questions or a PDF file.");
    }

    // STEP 1: Extract Questions
    onProgress("", "Analyzing document to identify questions...");

    const extractionResponse = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          ...inputParts,
          { 
            text: `Analyze the provided content and extract all assignment questions. 
            Return ONLY a JSON array of strings, where each string is a question text (including its number). 
            Example output: ["Q1. Explain...", "Q2. Discuss..."]. 
            Ensure all questions from the document are captured.` 
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    let extractedQuestions: string[] = [];
    try {
      extractedQuestions = JSON.parse(extractionResponse.text || "[]");
    } catch (e) {
      console.warn("Failed to parse extracted questions JSON", e);
    }

    // Fallback if extraction returned nothing but we have raw text input
    if (extractedQuestions.length === 0) {
      if (questions.trim()) {
        // Attempt to split by common question markers if manual text provided
        const potentialQs = questions.split(/\nQ\d+\.|^\d+\./gm).filter(q => q.trim().length > 10);
        if (potentialQs.length > 0) {
          extractedQuestions = potentialQs;
        } else {
           extractedQuestions = [questions];
        }
      } else {
         // If file only and extraction failed, try to treat as one big prompt
         extractedQuestions = ["Solve the assignment questions found in the document."];
      }
    }

    // STEP 2: Solve each question sequentially
    let fullResponse = "";
    
    for (let i = 0; i < extractedQuestions.length; i++) {
      const currentQuestion = extractedQuestions[i];
      const progressMsg = `Solving Question ${i + 1} of ${extractedQuestions.length}...`;
      onProgress(fullResponse, progressMsg);

      const solveResponse = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            ...inputParts, // Provide context every time
            { 
              text: `Based on the provided document/context, write a comprehensive, academic answer for the following question.
              
              QUESTION: ${currentQuestion}
              
              Follow the academic guidelines provided in the system instruction.` 
            }
          ]
        },
        config: {
          systemInstruction: SOLVER_SYSTEM_INSTRUCTION,
          temperature: 0.3,
          maxOutputTokens: 8192,
        },
      });

      const answer = solveResponse.text;
      
      // Append answer to full response
      fullResponse += `### ${currentQuestion}\n\n${answer}\n\n---\n\n`;
      
      // Update UI with new chunk
      onProgress(fullResponse, `Completed ${i + 1} of ${extractedQuestions.length}`);
    }

    return fullResponse;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate assignment solutions.");
  }
};