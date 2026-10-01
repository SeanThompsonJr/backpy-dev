// Reads content/ from disk into the same { "content/...": text } map the site gets from Vite.
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

export function readContentFiles(root = process.cwd(), dir = 'content'): Record<string, string> {
  const files: Record<string, string> = {}
  const walk = (abs: string) => {
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      const path = join(abs, entry.name)
      if (entry.isDirectory()) walk(path)
      else files[relative(root, path).split(sep).join('/')] = readFileSync(path, 'utf8')
    }
  }
  walk(join(root, dir))
  return files
}
