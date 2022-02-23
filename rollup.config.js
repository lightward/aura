// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json'
import { terser } from "rollup-plugin-terser";
import dev from 'rollup-plugin-dev'

export default [
{
  input: 'src/main.js',
  output: {
    file: 'dist/bundle.js'
  },
  plugins: [json(), terser(), resolve(), babel({ babelHelpers: 'bundled' })]
}];