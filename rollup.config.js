import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import {terser} from 'rollup-plugin-terser';

export default [
  // Original React app bundle
  {
    input: 'src/main.tsx',
    output: {
      file: 'dist/bundle.js',
      format: 'cjs',
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        outputToFilesystem: false,
      }),
      terser(),
      babel({
        exclude: 'node_modules/**',
        presets: ['@babel/preset-react'],
        babelHelpers: 'bundled',
      }),
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
    ],
  },
  // Library build for script tag usage
  {
    input: 'src/Aura.ts',
    output: {
      file: 'dist/aura.js',
      format: 'iife',
      name: 'LightwardAura'
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
  },
];
