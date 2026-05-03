import type { Request, Response } from 'express';

export default function handler(req: Request, res: Response): void {
  res.status(200).json({
    ok: true,
    dbUrl: !!process.env['DATABASE_URL'],
    firebaseProject: !!process.env['FIREBASE_PROJECT_ID'],
  });
}
