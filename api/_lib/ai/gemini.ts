import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';

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
      description: 'Score 1–10. 8+ means the scene is vivid enough to stick.',
    },
    critique: {
      type: SchemaType.STRING,
      description: 'Concise evaluation against the four criteria.',
    },
    suggestions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: '2–3 concrete, actionable improvements.',
    },
  },
  required: ['vividnessScore', 'critique', 'suggestions'],
};

export function getGeminiClient(): GoogleGenerativeAI {
  return new GoogleGenerativeAI(process.env['GEMINI_API_KEY']!);
}

function buildPrompt(p: CritiqueMnemonicParams): string {
  return `You are an expert in the Lorayne & Lucas substitute-word memory system. \
Evaluate the mnemonic below against FOUR strict criteria and return only valid JSON.

CHARACTER: ${p.hanzi} (${p.pinyin}, tone ${p.tone})
ENGLISH MEANING: ${p.englishMeaning}
RADICAL COMPONENTS (must all appear as concrete objects in the scene): ${p.radicalComponents.join(', ')}
TONE PEG OBJECT (must interact physically in the scene): ${p.tonePegObject}
USER'S MNEMONIC: ${p.userMnemonic}

EVALUATION CRITERIA:
(a) RADICALS — Does the scene physically incorporate ALL of: [${p.radicalComponents.join(', ')}]? \
Missing even one is a critical flaw. Abstract mentions do not count; they must be props or actors.
(b) TONE PEG — Does "${p.tonePegObject}" appear as a visible object or actor that does something \
in the scene? A passing mention ("…and there's a ${p.tonePegObject}…") fails this criterion.
(c) VIVIDNESS — Is the scene absurd, exaggerated, multi-sensory, and hyper-specific? \
Generic imagery ("someone thinks about ${p.englishMeaning}") scores 1–3.
(d) MEANING LINK — Is the connection between the scene's climax/outcome and "${p.englishMeaning}" \
unmistakable without any explanation?

SCORING RUBRIC:
1–3  Fails ≥2 criteria; mostly abstract or generic
4–5  Meets 1–2 criteria partially
6–7  Meets most criteria but lacks punch or specificity
8–9  Meets all four; vivid, absurd, every component woven in
10   Perfect — bizarre, multi-sensory, crystal-clear meaning link

Give exactly 2–3 concrete suggestions for weaker mnemonics (fewer if score ≥ 9).`;
}

export async function critiqueMnemonic(
  params: CritiqueMnemonicParams,
): Promise<CritiqueMnemonicResult> {
  const model = getGeminiClient().getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  try {
    const result = await model.generateContent(buildPrompt(params));
    return JSON.parse(result.response.text()) as CritiqueMnemonicResult;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
      throw new Error(
        'Gemini rate limit reached (free tier: 15 RPM). Please wait a moment and try again.',
      );
    }
    throw err;
  }
}
