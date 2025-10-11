import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import {terser} from 'rollup-plugin-terser';

export default {
  input: 'src/Aura.ts',
  output: {
    file: 'dist/aura.js',
    format: 'iife',
    name: 'LightwardAura',
    exports: 'default'
  },
  plugins: [
    resolve({
      browser: true
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      outputToFilesystem: false,
    }),
    terser(),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
  ],
};
