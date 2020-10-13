import path from 'path'
import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import alias from '@rollup/plugin-alias'
import { terser } from 'rollup-plugin-terser'

const PKG_NAME = 'aidol-lucky-draw'

const customResolver = resolve({
  extensions: ['.mjs', '.js', '.jsx', '.json', '.sass', '.scss', '.css']
})

const projectRootDir = path.resolve(__dirname)

export default {
  input: 'src/index.js',
  output: [
    {
      file: `dist/${PKG_NAME}.umd.js`,
      format: 'umd',
      name: 'AidolLuckyDraw'
    },
    {
      file: `dist/${PKG_NAME}.es.js`,
      format: 'es'
    }
  ],
  plugins: [
    alias({
      entries: [
        {
          find: 'src',
          replacement: path.resolve(projectRootDir, 'src')
          // OR place `customResolver` here. See explanation below.
        }
      ],
      customResolver
    }),
    resolve(),
    babel({
      exclude: 'node_modules/**' // 只编译我们的源代码
    }),
    terser({
      output: {
        comments: false
      }
    })
  ]
}