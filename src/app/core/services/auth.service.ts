import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Auth,
  GoogleAuthProvider,
  UserCredential,
  createUserWithEmailAndPassword,
  getIdToken,
  signInWithEmailAndPassword,
  signInWithPopup,
} from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly http = inject(HttpClient);

  async signInWithGoogle(): Promise<void> {
    const cred = await signInWithPopup(this.auth, new GoogleAuthProvider());
    await this.syncUser(cred);
  }

  async signInWithEmail(email: string, password: string): Promise<void> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    await this.syncUser(cred);
  }

  async signUpWithEmail(email: string, password: string, name?: string): Promise<void> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    await this.syncUser(cred, name);
  }

  private async syncUser(cred: UserCredential, name?: string): Promise<void> {
    const token = await getIdToken(cred.user);
    const body = name ? { name } : {};
    await firstValueFrom(
      this.http.post('/api/users/sync', body, {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      }),
    );
  }
}
