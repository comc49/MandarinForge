import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// ---------------------------------------------------------------------------
// Shared domain types
// ---------------------------------------------------------------------------

export type TonePeg = 'table' | 'staircase' | 'valley' | 'axe' | 'neutral';

export interface RadicalComponent {
  char: string;
  meaning: string;
}

export interface Character {
  id: number;
  hanzi: string;
  pinyin: string;
  tone: number;
  englishMeaning: string;
  hskLevel: number;
  radicalComponents: RadicalComponent[] | null;
  strokeCount: number | null;
}

export interface CritiqueInput {
  hanzi: string;
  pinyin: string;
  tone: number;
  englishMeaning: string;
  radicalComponents: string[];
  userMnemonic: string;
  tonePegObject: string;
}

export interface CritiqueResult {
  vividnessScore: number;
  critique: string;
  suggestions: string[];
}

export interface MnemonicSaveInput {
  characterId: number;
  substituteWordStory: string;
  tonePegObject?: TonePeg | null;
  vividnessScore?: number | null;
  aiCritique?: string | null;
  aiSuggestions?: string[] | null;
}

export interface Mnemonic {
  id: string;
  userId: string;
  characterId: number;
  substituteWordStory: string;
  tonePegObject: TonePeg | null;
  vividnessScore: number | null;
  aiCritique: string | null;
  aiSuggestions: string[] | null;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getCharacter(id: number): Promise<Character> {
    return firstValueFrom(this.http.get<Character>(`/api/characters/${id}`));
  }

  critiqueMnemonic(input: CritiqueInput): Promise<CritiqueResult> {
    return firstValueFrom(this.http.post<CritiqueResult>('/api/mnemonics/critique', input));
  }

  saveMnemonic(input: MnemonicSaveInput): Promise<Mnemonic> {
    return firstValueFrom(this.http.post<Mnemonic>('/api/mnemonics', input));
  }

  getMyMnemonic(characterId: number): Promise<Mnemonic | null> {
    return firstValueFrom(
      this.http.get<Mnemonic | null>(`/api/mnemonics?characterId=${characterId}`),
    );
  }
}
