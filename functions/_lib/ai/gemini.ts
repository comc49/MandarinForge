import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';

export function getGeminiClient(apiKey: string): GoogleGenerativeAI {
  return new GoogleGenerativeAI(apiKey);
}

export interface CritiqueMnemonicParams {
  hanzi: string;
  pinyin: string;
  tone: number;
  englishMeaning: string;
  radicalComponents: string[];
  userMnemonic: string;
  tonePegObject: string;
}

export interface CritiqueMnemonicResult {
  vividnessScore: number;
  critique: string;
  suggestions: string[];
}

const RESPONSE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    vividnessScore: {
      type: SchemaType.NUMBER,
      description: 'Score from 1 to 10. 8+ means memorable enough to stick.',
    },
    critique: {
      type: SchemaType.STRING,
      description: 'Concise evaluation of the mnemonic against the four criteria.',
    },
    suggestions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Concrete, actionable improvements to strengthen the mnemonic.',
    },
  },
  required: ['vividnessScore', 'critique', 'suggestions'],
};

function buildPrompt(p: CritiqueMnemonicParams): string {
  return `You are an expert in the Lorayne & Lucas memory system. Evaluate the mnemonic below against FOUR strict criteria and return only valid JSON.

CHARACTER: ${p.hanzi} (${p.pinyin}, tone ${p.tone})
ENGLISH MEANING: ${p.englishMeaning}
RADICAL COMPONENTS: ${p.radicalComponents.join(', ')}
TONE PEG OBJECT (must appear physically in the scene): ${p.tonePegObject}
USER'S MNEMONIC: ${p.userMnemonic}

EVALUATION CRITERIA — score and critique each:
(a) RADICALS: Does the scene physically incorporate ALL of these radicals/components as concrete objects or characters: [${p.radicalComponents.join(', ')}]? Missing even one is a critical flaw.
(b) TONE PEG: Does "${p.tonePegObject}" appear as a physical object or actor doing something visible in the scene? A mere mention doesn't count — it must interact.
(c) VIVIDNESS: Is the scene absurd, exaggerated, multi-sensory, and specific? Generic or abstract imagery (e.g. "someone is thinking about ${p.englishMeaning}") scores low.
(d) MEANING LINK: Is the connection between the scene's action/outcome and "${p.englishMeaning}" immediate and unmistakable — not requiring inference?

SCORING:
1–3 = Fails multiple criteria, mostly abstract
4–5 = Meets 1–2 criteria partially
6–7 = Meets most criteria but lacks punch
8–9 = Meets all criteria; vivid and specific
10  = Perfect — bizarre, multi-sensory, all components woven in, meaning crystal-clear

Return JSON matching exactly: { "vividnessScore": <number 1-10>, "critique": "<string>", "suggestions": ["<string>", ...] }`;
}

export async function critiqueMnemonic(
  params: CritiqueMnemonicParams,
  apiKey: string,
): Promise<CritiqueMnemonicResult> {
  const client = getGeminiClient(apiKey);
  const model = client.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  try {
    const result = await model.generateContent(buildPrompt(params));
    const text = result.response.text();
    return JSON.parse(text) as CritiqueMnemonicResult;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
      throw new Error(
        'Gemini rate limit reached (free tier: 15 RPM). Please wait a moment and try again.',
      );
    }
    throw error;
  }
}
