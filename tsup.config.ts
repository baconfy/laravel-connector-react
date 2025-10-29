import {defineConfig} from 'tsup'
import {readFileSync, writeFileSync, existsSync} from 'fs'
import {resolve} from 'path'

export default defineConfig(() => ({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: true,
  external: ['react', 'laravel-connector'],
  async onSuccess() {
    const files = [
      resolve('dist', 'index.js'),
      resolve('dist', 'index.mjs'),
    ]

    console.log('\n🔧 Adding "use client" directive...')

    files.forEach(file => {
      try {
        if (!existsSync(file)) {
          console.warn(`⚠️  File not found: ${file}`)
          return
        }

        let content = readFileSync(file, 'utf-8')

        if (!content.startsWith('"use client"') && !content.startsWith("'use client'")) {
          content = '"use client";\n' + content
          writeFileSync(file, content, 'utf-8')
          console.log(`✅ ${file.split('/').pop()}`)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`❌ ${file.split('/').pop()}:`, message)
      }
    })

    console.log('✨ Done!\n')
  },
}))