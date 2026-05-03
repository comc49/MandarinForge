import { config } from 'dotenv';
import { resolve } from 'path';
import express from 'express';
import type { Request, Response } from 'express';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });

const app = express();
app.use(express.json());

type Handler = (req: Request, res: Response) => unknown | Promise<unknown>;

const wrap = (importPath: string): Handler => {
  return async (req, res) => {
    const mod = await import(resolve(process.cwd(), importPath));
    return mod.default(req, res);
  };
};

app.get('/api/test', wrap('api/test.ts'));

app.get('/api/characters/:id', async (req, res) => {
  Object.defineProperty(req, 'query', {
    value: { ...req.query, id: req.params['id'] },
    configurable: true,
  });
  const mod = await import(resolve(process.cwd(), 'api/characters/[id].ts'));
  return mod.default(req, res);
});

app.all('/api/mnemonics', wrap('api/mnemonics/index.ts'));
app.post('/api/mnemonics/critique', wrap('api/mnemonics/critique.ts'));
app.get('/api/users/me', wrap('api/users/me.ts'));
app.post('/api/users/sync', wrap('api/users/sync.ts'));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API server ready at http://localhost:${PORT}`);
});
