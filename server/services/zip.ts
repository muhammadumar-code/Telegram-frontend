import fs from 'fs';
import path from 'path';
import { ZipArchive } from 'archiver';

const EXCLUDED_DIRS = new Set(['node_modules', 'dist', '.git', '.idea', '.vscode']);
const EXCLUDED_FILES = new Set(['.env', '.DS_Store']);

function shouldSkipItem(fullPath: string, relativePath: string): boolean {
  if (relativePath === '' || relativePath === '.') return false;

  const segments = relativePath.split(path.sep);
  if (segments.some((segment) => EXCLUDED_DIRS.has(segment))) {
    return true;
  }

  if (segments.some((segment) => EXCLUDED_FILES.has(segment))) {
    return true;
  }

  return false;
}

async function addDirectoryToZip(zip: any, baseDir: string, currentDir: string) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relativePath = path.relative(baseDir, fullPath).split(path.sep).join('/');

    if (shouldSkipItem(fullPath, relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      await addDirectoryToZip(zip, baseDir, fullPath);
      continue;
    }

    zip.file(fullPath, { name: relativePath });
  }
}

export async function createTelegramProZip(outputPath: string): Promise<string> {
  const projectRoot = process.cwd();
  const outputDir = path.dirname(outputPath);

  fs.mkdirSync(outputDir, { recursive: true });

  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const zip = new ZipArchive({ zlib: { level: 9 } });

    output.on('close', () => resolve(outputPath));
    output.on('error', (error) => reject(error));
    zip.on('error', (error) => reject(error));

    zip.pipe(output);
    addDirectoryToZip(zip, projectRoot, projectRoot)
      .then(() => {
        zip.finalize();
      })
      .catch(reject);
  });
}
