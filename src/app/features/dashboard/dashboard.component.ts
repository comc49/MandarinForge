import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmCardImports } from '@spartan-ng/helm/card';

import { ApiService, type MnemonicWithCharacter } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink, HlmButtonImports, HlmBadgeImports, HlmCardImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly api = inject(ApiService);

  readonly mnemonicsResource = resource<MnemonicWithCharacter[], void>({
    loader: () => this.api.getMyMnemonics(),
  });

  readonly mnemonics = computed(() => this.mnemonicsResource.value() ?? []);
  readonly isLoading = computed(() => this.mnemonicsResource.isLoading());
  readonly error = computed(() => this.mnemonicsResource.error());

  readonly totalCount = computed(() => this.mnemonics().length);

  readonly avgVividness = computed(() => {
    const scored = this.mnemonics().filter(m => m.vividnessScore !== null);
    if (scored.length === 0) return null;
    const sum = scored.reduce((acc, m) => acc + (m.vividnessScore ?? 0), 0);
    return Math.round((sum / scored.length) * 10) / 10;
  });

  readonly byHskLevel = computed(() => {
    const counts: Record<number, number> = {};
    for (const m of this.mnemonics()) {
      const lvl = m.character.hskLevel;
      counts[lvl] = (counts[lvl] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([lvl, count]) => ({ level: Number(lvl), count }))
      .sort((a, b) => a.level - b.level);
  });

  readonly recent = computed(() => this.mnemonics().slice(0, 8));

  readonly lastActivity = computed(() => {
    const m = this.mnemonics()[0];
    return m ? new Date(m.updatedAt) : null;
  });
}
