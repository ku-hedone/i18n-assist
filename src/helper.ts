import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

export const collectFilesOnly = async (path: string) => {
  const paths = await readdir(path);
  const files: string[] = [];
  for await (const p of paths) {
    const wd = join(path, p);
    const stats = await stat(wd);
    if (stats.isFile()) {
      files.push(p);
    }
  }
  return files;
};

export const getTimeStamp = () => {
  const date = new Date();
  const formatted = `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()}-${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  return formatted;
};