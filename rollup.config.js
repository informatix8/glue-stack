import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

export default [

    //
    // DEV BUNDLE
    //

    {
        input: 'src/js/main.js',
        output: {
            name: 'GlueStack',
            file: 'public/glue-stack.js',
            format: 'iife', // immediately-invoked function expression — suitable for <script> tags
            sourcemap: true
        },
        plugins: [
            resolve(),
            commonjs()
        ]
    },

    //
    // PROD BUNDLE
    //

    {
        input: 'src/js/main.js',
        output: {
            name: 'GlueStack',
            file: 'dist/glue-stack.umd.js',
            format: 'umd',
            compact: true
        },
        external: [
            'lodash.merge',
            'glue-stick'
        ],
        plugins: [
            resolve(),
            commonjs(),
            terser({
                ecma: 5
            }),
            filesize()
        ]
    },
    {
        input: 'src/js/main.js',
        output: {
            name: 'GlueStack',
            file: 'dist/glue-stack.all.umd.js',
            format: 'umd',
            compact: true
        },
        plugins: [
            resolve(),
            commonjs(),
            terser({
                ecma: 5
            }),
            filesize()
        ]
    },
    {
        input: 'src/js/main.js',
        external: [
            'lodash.merge',
            'glue-stick'
        ],
        output: [
            {
                file: pkg.main,
                compact: true,
                format: 'cjs'
            },
            {
                file: pkg.module,
                compact: true,
                format: 'es'
            }
        ],
        plugins: [
            terser({
                ecma: 5
            }),
            filesize()
        ]
    }

];
