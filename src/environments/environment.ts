// NG_APP_* variables are injected at build time by @angular/build (Vite).
// Set them in .env.local for local dev.
export const environment = {
  firebase: {
    apiKey: import.meta.env['NG_APP_FIREBASE_API_KEY'] as string,
    authDomain: import.meta.env['NG_APP_FIREBASE_AUTH_DOMAIN'] as string,
    projectId: import.meta.env['NG_APP_FIREBASE_PROJECT_ID'] as string,
    appId: import.meta.env['NG_APP_FIREBASE_APP_ID'] as string,
  },
};
