import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  resource,
  signal,
  untracked,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmCardImports } from '@spartan-ng/helm/card';

import {
  ApiService,
  type Character,
  type CritiqueResult,
  type TonePeg,
} from '../../core/services/api.service';

// ---------------------------------------------------------------------------
// Tone peg catalogue
// ---------------------------------------------------------------------------

interface TonePegDef {
  value: TonePeg;
  label: string;
  symbol: string;
  description: string;
  tone: number;
}

export const TONE_PEGS: TonePegDef[] = [
  { value: 'table', label: 'Flat Table', symbol: '▬', description: 'Tone 1 — high, flat', tone: 1 },
  { value: 'staircase', label: 'Rising Staircase', symbol: '⌐', description: 'Tone 2 — rising', tone: 2 },
  { value: 'valley', label: 'Valley', symbol: '∪', description: 'Tone 3 — dips then rises', tone: 3 },
  { value: 'axe', label: 'Falling Axe', symbol: '↘', description: 'Tone 4 — sharp falling', tone: 4 },
  { value: 'neutral', label: 'Neutral', symbol: '○', description: 'Tone 5 — unstressed', tone: 0 },
];

const TONE_TO_PEG: Record<number, TonePeg> = {
  0: 'neutral',
  1: 'table',
  2: 'staircase',
  3: 'valley',
  4: 'axe',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-forge',
  standalone: true,
  imports: [RouterLink, HlmButtonImports, HlmBadgeImports, HlmCardImports],
  templateUrl: './forge.component.html',
  styleUrl: './forge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);

  // Expose catalogue to template
  readonly tonePegs = TONE_PEGS;

  // ---------------------------------------------------------------------------
  // Route param → resources
  // ---------------------------------------------------------------------------

  readonly characterId = toSignal(this.route.params.pipe(map(p => p['characterId'] as string)));

  readonly characterResource = resource({
    params: () => this.characterId(),
    loader: ({ params: id }) => this.api.getCharacter(Number(id)),
  });

  readonly mnemonicResource = resource({
    params: () => this.characterId(),
    loader: ({ params: id }) => this.api.getMyMnemonic(Number(id)),
  });

  // ---------------------------------------------------------------------------
  // Mutable UI state
  // ---------------------------------------------------------------------------

  readonly selectedPeg = signal<TonePeg | null>(null);
  readonly mnemonicText = signal('');
  readonly critique = signal<CritiqueResult | null>(null);
  readonly isLoadingCritique = signal(false);
  readonly isSaving = signal(false);
  readonly showRateLimitDialog = signal(false);
  readonly saveEnabled = signal(false);

  // Flag prevents the pre-population effect from overwriting in-progress edits
  private hasPrePopulated = false;

  // ---------------------------------------------------------------------------
  // Effects — pre-populate signals when data arrives
  // ---------------------------------------------------------------------------

  constructor() {
    // Set default peg from character tone the first time the character loads
    effect(
      () => {
        const char = this.characterResource.value();
        if (char && this.selectedPeg() === null) {
          this.selectedPeg.set(TONE_TO_PEG[char.tone] ?? 'neutral');
        }
      },
      { allowSignalWrites: true },
    );

    // Pre-fill form from existing mnemonic (editing flow)
    effect(
      () => {
        const mnemonic = this.mnemonicResource.value();
        if (mnemonic && !this.hasPrePopulated) {
          this.hasPrePopulated = true;
          untracked(() => {
            this.mnemonicText.set(mnemonic.substituteWordStory);
            if (mnemonic.tonePegObject) this.selectedPeg.set(mnemonic.tonePegObject);
            if (mnemonic.vividnessScore) {
              this.critique.set({
                vividnessScore: mnemonic.vividnessScore,
                critique: mnemonic.aiCritique ?? '',
                suggestions: mnemonic.aiSuggestions ?? [],
              });
              this.saveEnabled.set(true);
            }
          });
        }
      },
      { allowSignalWrites: true },
    );
  }

  // ---------------------------------------------------------------------------
  // Computed helpers
  // ---------------------------------------------------------------------------

  readonly wordCount = computed(() => {
    const t = this.mnemonicText().trim();
    return t ? t.split(/\s+/).length : 0;
  });

  readonly wordCountClass = computed(() => {
    const n = this.wordCount();
    if (n === 0) return 'text-muted-foreground';
    if (n < 25 || n > 80) return 'text-amber-500';
    return 'text-emerald-500';
  });

  readonly scoreClass = computed(() => {
    const s = this.critique()?.vividnessScore ?? 0;
    if (s >= 8) return 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
    if (s >= 5) return 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
    return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
  });

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async doCritique(): Promise<void> {
    const char = this.characterResource.value();
    const peg = this.selectedPeg();
    if (!char || !peg || this.mnemonicText().trim().length === 0) return;

    this.isLoadingCritique.set(true);
    try {
      const result = await this.api.critiqueMnemonic({
        hanzi: char.hanzi,
        pinyin: char.pinyin,
        tone: char.tone,
        englishMeaning: char.englishMeaning,
        radicalComponents: (char.radicalComponents ?? []).map(r => `${r.char} (${r.meaning})`),
        userMnemonic: this.mnemonicText(),
        tonePegObject: peg,
      });
      this.critique.set(result);
      this.saveEnabled.set(true);
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 429) {
        this.showRateLimitDialog.set(true);
      } else {
        const msg =
          err instanceof HttpErrorResponse
            ? (err.error?.error?.message ?? err.message)
            : 'Critique failed. Please try again.';
        toast.error(msg);
      }
    } finally {
      this.isLoadingCritique.set(false);
    }
  }

  async doSave(): Promise<void> {
    const char = this.characterResource.value();
    if (!char || this.mnemonicText().trim().length === 0) return;

    const cr = this.critique();
    this.isSaving.set(true);
    try {
      await this.api.saveMnemonic({
        characterId: char.id,
        substituteWordStory: this.mnemonicText(),
        tonePegObject: this.selectedPeg(),
        vividnessScore: cr?.vividnessScore ?? null,
        aiCritique: cr?.critique ?? null,
        aiSuggestions: cr?.suggestions ?? null,
      });
      toast.success('Mnemonic forged! 🔥');
      await this.router.navigate(['/dashboard']);
    } catch {
      toast.error('Save failed. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  saveWithoutCritique(): void {
    this.saveEnabled.set(true);
    this.showRateLimitDialog.set(false);
    void this.doSave();
  }

  speakHanzi(char: Character): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(char.hanzi);
    utt.lang = 'zh-CN';
    utt.rate = 0.8;
    window.speechSynthesis.speak(utt);
  }

  scrollToTextarea(): void {
    document.getElementById('mnemonic-textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
