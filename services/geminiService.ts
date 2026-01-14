import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { Message, QuizData, VocabularyItem, TextAnalysis, GermanLevel, WritingTopic, WritingAnalysis, ReadingStory, PronunciationFeedback } from "../types";
import { SYSTEM_INSTRUCTION_CHAT_BASE, SYSTEM_INSTRUCTION_QUIZ_BASE, SYSTEM_INSTRUCTION_EXPERT } from "../constants";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

// In-memory cache for word analysis to reduce API calls
const wordAnalysisCache: Record<string, TextAnalysis> = {};

/**
 * Wraps an API call with exponential backoff retry logic for handling rate limits (429) and 503s.
 */
async function withRetry<T>(operation: () => Promise<T>, retries = 5, initialDelay = 2000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const isRateLimit = error.status === 429 || 
                        (error.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')));
    const isServerOverload = error.status === 503 || (error.message && error.message.includes('503'));
    
    if ((isRateLimit || isServerOverload) && retries > 0) {
      const jitter = Math.random() * 1000;
      const delay = initialDelay + jitter;
      console.warn(`API Busy (Status ${error.status || 'Unknown'}). Retrying in ${Math.round(delay)}ms... (${retries} left)`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, initialDelay * 1.5);
    }
    
    if (isRateLimit) {
      throw new Error("Ліміт запитів вичерпано (Quota Exceeded). Система перевантажена, будь ласка, спробуйте через 15-30 секунд.");
    }
    
    throw error;
  }
}

// --- CHAT SERVICE ---

export const sendChatMessage = async (
  history: Message[], 
  newMessage: string, 
  level: GermanLevel, 
  mode: 'chat' | 'expert' = 'chat',
  customContext?: string
): Promise<Message> => {
  const ai = getClient();
  
  let systemInstruction = mode === 'expert' ? SYSTEM_INSTRUCTION_EXPERT : SYSTEM_INSTRUCTION_CHAT_BASE;
  
  if (mode === 'chat') {
    systemInstruction += `\n\nIMPORTANT: Adjust your vocabulary and sentence structure strictly to CEFR Level ${level}.`;
    if (customContext) {
      systemInstruction += `\n\nCURRENT SCENARIO/ROLEPLAY:\n${customContext}\nStay in character strictly.`;
    }
  }
  
  // Format history for the API
  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));
  
  // Add new user message
  contents.push({
    role: 'user',
    parts: [{ text: newMessage }]
  });

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: contents,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "Your response. In Expert mode, use Markdown formatting." },
          correction: { type: Type.STRING, description: "Corrected version of the user's input (only if it was German and had errors). Null otherwise." },
          explanation: { type: Type.STRING, description: "Short explanation of the correction. Null if no correction." }
        },
        required: ["text"]
      }
    }
  }));

  if (!response.text) {
    throw new Error("No response from AI");
  }

  try {
    const json = JSON.parse(response.text);
    return {
      role: 'model',
      text: json.text,
      correction: json.correction,
      explanation: json.explanation
    };
  } catch (e) {
    return {
      role: 'model',
      text: response.text ?? ""
    };
  }
};

// --- LESSON TUTOR (CONTEXTUAL HELP) ---

export const askLessonTutor = async (history: Message[], userQuery: string, currentQuestionContext: string): Promise<Message> => {
  const ai = getClient();

  const contextInstruction = `
    You are Professor Müller, helping a student during a German exam.
    CURRENT QUIZ CONTEXT:
    ${currentQuestionContext}

    The student is stuck or has a question about THIS specific problem.
    1. Explain the grammar rule related to this specific question in UKRAINIAN.
    2. Do NOT just give the answer immediately if possible, guide them. But if they ask for the answer, give it with explanation.
    3. Be concise and helpful.
  `;

  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));
  
  contents.push({ role: 'user', parts: [{ text: userQuery }] });

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: contents,
    config: {
      systemInstruction: contextInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
         type: Type.OBJECT,
         properties: {
           text: { type: Type.STRING, description: "Explanation in Ukrainian" }
         }
      }
    }
  }));

  if (!response.text) throw new Error("No response");
  
  try {
    return { role: 'model', text: JSON.parse(response.text).text };
  } catch (e) {
    return { role: 'model', text: response.text ?? "" };
  }
};

// --- GRAMMAR THEORY GENERATOR ---

export const getGrammarTheory = async (topicTitle: string, level: GermanLevel): Promise<string> => {
  const ai = getClient();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create a DETAILED and STRUCTURED grammar lesson for the topic "${topicTitle}" for a student at level ${level}.
    Target Language: Ukrainian (for explanations), German (for examples).
    Format: Markdown.
    
    Structure MUST include:
    1. **Core Rule**: Clear explanation of the rule in Ukrainian.
    2. **Tables**: Provide clear Markdown tables for conjugations, declensions, or sentence structure (TeKaMoLo etc).
    3. **Usage Examples**: 5-7 varied examples with translations.
    4. **Exceptions & Special Cases**: List important exceptions (e.g. n-declension exceptions, mixed verbs).
    5. **Common Mistakes**: A section titled "⚠️ Часті помилки", listing what learners usually do wrong.
    6. **Pro Tip**: A quick hack to remember the rule.
    
    Make it visually appealing with bold text and lists.`,
  }));
  
  return response.text || "Не вдалося завантажити теорію.";
};

// --- QUIZ GENERATOR ---

export const generateGrammarQuiz = async (topicContext: string, level: GermanLevel): Promise<QuizData> => {
  const ai = getClient();

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['multiple_choice', 'sentence_order', 'fill_gap'] },
            question: { type: Type.STRING, description: "The prompt. For sentence_order: 'Translate: [Ukrainian Sentence]'. For fill_gap: Sentence with ____." },
            options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "For MC: choices. For sentence_order: Shuffled words list. For fill_gap: empty or hint words." },
            correctAnswer: { type: Type.STRING, description: "The exact correct string." },
            explanation: { type: Type.STRING, description: "Explanation in Ukrainian." }
          },
          required: ["type", "question", "correctAnswer", "explanation"]
        }
      }
    },
    required: ["topic", "questions"]
  };

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a 7-question VARIED and CHALLENGING exercise set for German level ${level}. 
    Topic Context: "${topicContext}". 
    
    CRITICAL INSTRUCTIONS:
    1. **Variety**: Do NOT use the same verbs or nouns in every question. Use varied vocabulary suitable for ${level}.
    2. **Complexity**: Do not make it too easy. Include trick questions where appropriate for the level.
    3. **Mix Types**: You MUST strictly use a mix of 'multiple_choice' (3), 'sentence_order' (2), and 'fill_gap' (2).
    4. **Sentence Order**: For 'sentence_order', provide a complex Ukrainian sentence to translate, and the German words in 'options' shuffled.
    5. **Fill Gap**: Focus on the specific grammar rule (e.g., correct ending, correct preposition).
    
    Make it feel like a real exam.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_QUIZ_BASE,
      responseMimeType: 'application/json',
      responseSchema: schema
    }
  }));

  if (!response.text) throw new Error("Empty response");
  return JSON.parse(response.text) as QuizData;
};

// --- VOCABULARY GENERATOR ---

export const generateVocabulary = async (theme: string, level: GermanLevel): Promise<VocabularyItem[]> => {
  const ai = getClient();

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 5 German vocabulary words suitable for CEFR Level ${level} related to the theme: "${theme}".`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            german: { type: Type.STRING },
            ukrainian: { type: Type.STRING },
            exampleSentence: { type: Type.STRING, description: `A sentence using the word, suitable for ${level} level.` }
          },
          required: ["german", "ukrainian", "exampleSentence"]
        }
      }
    }
  }));

  if (!response.text) throw new Error("Empty response");
  return JSON.parse(response.text) as VocabularyItem[];
};

// --- TEXT ANALYZER (SELECTION LOOKUP) ---

export const analyzeSelection = async (text: string): Promise<TextAnalysis> => {
  const normalizedKey = text.trim().toLowerCase();
  
  if (wordAnalysisCache[normalizedKey]) {
    return wordAnalysisCache[normalizedKey];
  }

  const ai = getClient();
  
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the German word/phrase: "${text}". Provide translation to Ukrainian, grammar details, and examples.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "The base form of the word (Lemma)." },
          translation: { type: Type.STRING, description: "Ukrainian translation." },
          partOfSpeech: { type: Type.STRING, description: "Noun, Verb, Adjective, etc." },
          grammarInfo: { type: Type.STRING, description: "For Nouns: Gender & Plural. For others: relevant info." },
          conjugation: { 
            type: Type.ARRAY, 
            description: "If it is a Verb, provide Present and Präteritum tense. Empty otherwise.",
            items: {
              type: Type.OBJECT,
              properties: {
                tense: { type: Type.STRING },
                forms: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of conjugated forms: ich ..., du ... etc" }
              }
            }
          },
          examples: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2 example sentences." }
        },
        required: ["word", "translation", "partOfSpeech", "grammarInfo", "examples"]
      }
    }
  }));

  if (!response.text) throw new Error("Empty response");
  
  const result = JSON.parse(response.text) as TextAnalysis;
  wordAnalysisCache[normalizedKey] = result; 
  return result;
};

// --- WRITING LAB SERVICES ---

export const generateWritingTopic = async (level: GermanLevel): Promise<WritingTopic> => {
  const ai = getClient();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate an engaging and specific German writing task for CEFR Level ${level}.
    Avoid generic topics like "My Summer Holiday". Be creative.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING, description: "The main title/question." },
          description: { type: Type.STRING, description: "Explanation of what to write (in Ukrainian)." },
          hints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 vocabulary words or grammar points to include." }
        },
        required: ["topic", "description", "hints"]
      }
    }
  }));
  
  if (!response.text) throw new Error("Failed to generate topic");
  return JSON.parse(response.text) as WritingTopic;
};

export const analyzeWriting = async (text: string, topic: string, level: GermanLevel): Promise<WritingAnalysis> => {
  const ai = getClient();
  
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Act as a strict German language examiner. Analyze this student essay.
    Student Level: ${level}
    Topic: ${topic}
    Student Text: "${text}"
    
    Tasks:
    1. Correct grammar and spelling errors.
    2. Provide a "Native Speaker" version (C1 level) that conveys the same meaning but elegantly.
    3. Score it 1-10 based on B1.2 standards.
    `,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          correctedText: { type: Type.STRING, description: "The student's text but with ONLY grammar/spelling fixed." },
          feedback: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 3-5 critical mistakes explained in Ukrainian." },
          improvedVersion: { type: Type.STRING, description: "A rewritten version that sounds like a native speaker." },
          score: { type: Type.NUMBER, description: "Score from 1 to 10." },
          levelAssessment: { type: Type.STRING, description: "Estimated CEFR level of this text (e.g. 'Weak A2', 'Strong B1')." },
          generalComment: { type: Type.STRING, description: "Encouraging comment in Ukrainian." }
        },
        required: ["correctedText", "feedback", "improvedVersion", "score", "levelAssessment", "generalComment"]
      }
    }
  }));

  if (!response.text) throw new Error("Failed to analyze text");
  return JSON.parse(response.text) as WritingAnalysis;
};

// --- READING ROOM SERVICES ---

export const generateReadingStory = async (genre: string, level: GermanLevel): Promise<ReadingStory> => {
  const ai = getClient();
  
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a sophisticated short story (approx 300 words) in German for a student at level ${level}.
    Genre: ${genre}.
    Make it rich in vocabulary but suitable for the level.
    Include 3 deep comprehension questions (not just facts, but inference).
    Highlight 5 challenging vocabulary words.
    `,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING, description: "The story text." },
          genre: { type: Type.STRING },
          vocabularyHighlights: { 
            type: Type.ARRAY, 
            description: "List of difficult German words with Ukrainian translation.",
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                translation: { type: Type.STRING }
              },
              required: ["word", "translation"]
            }
          },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: "Question in German." },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.NUMBER, description: "Index of the correct option (0-based)." }
              },
              required: ["question", "options", "correctAnswer"]
            }
          }
        },
        required: ["title", "content", "genre", "vocabularyHighlights", "questions"]
      }
    }
  }));

  if (!response.text) throw new Error("Failed to generate story");
  return JSON.parse(response.text) as ReadingStory;
};

// --- PRONUNCIATION TRAINER ---

export const generatePronunciationExercise = async (level: GermanLevel): Promise<string> => {
  const ai = getClient();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a single challenging but useful German sentence for pronunciation practice at CEFR level ${level}.
    It should contain difficult sounds like 'ü', 'ö', 'ch' (ich-Laut/ach-Laut), or 'r'.
    Output only the German sentence string.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sentence: { type: Type.STRING }
        }
      }
    }
  }));

  if (!response.text) throw new Error("Failed");
  return JSON.parse(response.text).sentence;
};

export const analyzePronunciation = async (targetText: string, recognizedText: string): Promise<PronunciationFeedback> => {
  const ai = getClient();
  
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Act as a German Voice Coach. Compare the target sentence with what the speech recognition heard.
    Target: "${targetText}"
    Heard: "${recognizedText}"
    
    1. Score the pronunciation match (0-100). If the recognized text is very different, the score should be low.
    2. Provide feedback in UKRAINIAN about which sounds might have been mispronounced based on the difference.
    3. Give 2 tips to improve.
    `,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          recognizedText: { type: Type.STRING },
          feedback: { type: Type.STRING, description: "Specific phonetic feedback in Ukrainian" },
          tips: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["score", "recognizedText", "feedback", "tips"]
      }
    }
  }));

  if (!response.text) throw new Error("Failed");
  return JSON.parse(response.text) as PronunciationFeedback;
};