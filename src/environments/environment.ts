// NG_APP_* variables are injected at build time by @angular/build (Vite).
// Set them in .env.local for local dev and in Vercel env vars for prod.
const env = (import.meta as any).env ?? {};

export const environment = {
  firebase: {
    apiKey: env.NG_APP_FIREBASE_API_KEY ?? '',
    authDomain: env.NG_APP_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: env.NG_APP_FIREBASE_PROJECT_ID ?? '',
    appId: env.NG_APP_FIREBASE_APP_ID ?? '',
  },
};
