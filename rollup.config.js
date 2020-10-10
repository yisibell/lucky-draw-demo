import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'

const PKG_NAME = 'aidol-lucky-draw'

export default {
  input: 'src/index.js',
  output: [
    {
      file: `dist/${PKG_NAME}.umd.js`,
      format: 'umd',
      name: 'AidolUtils'
    },
    {
      file: `dist/${PKG_NAME}.es.js`,
      format: 'es'
    }
  ],
  plugins: [
    resolve(),
    babel({
      exclude: 'node_modules/**' // 只编译我们的源代码
    })
  ]
}