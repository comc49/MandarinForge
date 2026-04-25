// @angular/build uses Vite internally; this augments ImportMeta so
// import.meta.env['NG_APP_*'] reads are type-safe.
interface ImportMeta {
  readonly env: Record<string, string | undefined>;
}
