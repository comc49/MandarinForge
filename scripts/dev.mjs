import { config } from 'dotenv';
import { spawn } from 'child_process';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });

const vars = [
  'NG_APP_FIREBASE_API_KEY',
  'NG_APP_FIREBASE_AUTH_DOMAIN',
  'NG_APP_FIREBASE_PROJECT_ID',
  'NG_APP_FIREBASE_APP_ID',
];

const defineArgs = vars
  .filter(k => process.env[k])
  .map(k => `--define "import.meta.env['${k}']='${process.env[k]}'"`)
  .join(' ');

const child = spawn(`ng serve --proxy-config proxy.conf.json ${defineArgs}`, {
  stdio: 'inherit',
  shell: true,
});

child.on('exit', code => process.exit(code ?? 0));
