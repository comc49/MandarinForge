import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [HlmButtonImports, HlmCardImports],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  async signInWithGoogle(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      await signInWithPopup(this.auth, new GoogleAuthProvider());
      await this.router.navigate(['/forge', 1]);
    } catch (err) {
      this.error.set('Sign-in failed. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
