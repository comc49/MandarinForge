import * as admin from 'firebase-admin';

function ensureInitialized(): void {
  if (admin.apps.length > 0) return;

  const projectId = process.env['FIREBASE_PROJECT_ID'];
  const clientEmail = process.env['FIREBASE_CLIENT_EMAIL'];
  // Vercel stores multiline secrets with literal \n — restore actual newlines.
  const privateKey = process.env['FIREBASE_PRIVATE_KEY']?.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

export function getAuth(): admin.auth.Auth {
  ensureInitialized();
  return admin.auth();
}
