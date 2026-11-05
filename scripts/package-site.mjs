import { mkdir, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
const files = [
  "README.md",
  ".env.example",
  ".gitignore",
  "netlify.toml",
  "vite.config.ts",
  "vite.netlify.config.ts",
  "tsconfig.json",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "client",
  "server",
  "shared",
  "netlify",
  "scripts/generate-sitemap.mjs",
  "scripts/package-site.mjs",
  "drizzle",
  "patches",
  "components.json",
];
const cwd = process.cwd();
const staging = `${cwd}/.zip-staging`;
await rm(staging, { recursive: true, force: true });
await mkdir(staging, { recursive: true });
const copier = spawn(
  "python3",
  [
    "-c",
    `import shutil,pathlib,sys\nbase=pathlib.Path(sys.argv[1]);dest=pathlib.Path(sys.argv[2])\nfor item in sys.argv[3:]:\n src=base/item\n if not src.exists(): continue\n target=dest/item\n if src.is_dir(): shutil.copytree(src,target,ignore=shutil.ignore_patterns('node_modules','.DS_Store','.vite','.netlify','__manus__'))\n else: target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,target)`,
    cwd,
    staging,
    ...files,
  ],
  { stdio: "inherit" }
);
if ((await new Promise(r => copier.once("exit", r))) !== 0)
  throw new Error("ZIP source copy failed");
const zipPath = `${cwd}/세탁베스트드라이-Netlify-홈페이지.zip`;
const zipper = spawn(
  "python3",
  [
    "-c",
    `import zipfile,pathlib,sys\nroot=pathlib.Path(sys.argv[1]);target=pathlib.Path(sys.argv[2])\nwith zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=8) as z:\n for p in sorted(root.rglob('*')):\n  if p.is_file(): z.write(p, pathlib.Path('bestdry-netlify')/p.relative_to(root))\nprint(f'Created: {target} ({target.stat().st_size:,} bytes, {sum(1 for p in root.rglob(\"*\") if p.is_file())} files)')`,
    staging,
    zipPath,
  ],
  { stdio: "inherit" }
);
if ((await new Promise(r => zipper.once("exit", r))) !== 0)
  throw new Error("ZIP creation failed");
await rm(staging, { recursive: true, force: true });
