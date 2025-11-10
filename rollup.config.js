import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import typescript from "rollup-plugin-typescript2";
import commonjs from "@rollup/plugin-commonjs";
import postcss from "rollup-plugin-postcss";
import clear from "rollup-plugin-clear";
import terser from "@rollup/plugin-terser";

export default [
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.js",
      format: "esm",
      sourcemap: true,
    },
    external: ["react", "react-dom"],
    plugins: [
      clear({
        targets: ["dist"],
      }),
      postcss({
        extract: true, // 将 CSS 提取到生成 JS 文件的同一位置，但扩展名 .css
        minimize: true, // 是否压缩 CSS
        inject: false, // 将 CSS 注入 <head>，当 extract：true 时它总是 false
        sourceMap: true, // 是否生成 source map
        modules: false, // 启用 CSS 模块或为 postcss-modules 设置选项
        config: {
          path: "./postcss.config.cjs", // 指定 postcss 配置文件的路径
          ctx: {},
        },
      }),
      resolve(),
      commonjs(),
      typescript({
        useTsconfigDeclarationDir: true,
        clean: true,
        tsconfigOverride: {
          compilerOptions: {
            declaration: true,
            declarationDir: "./dist",
          },
          exclude: ["**/*.test.*", "**/*.spec.*"],
        },
      }),
      babel({
        exclude: "node_modules/**",
        babelHelpers: "bundled",
      }),
      terser(),
    ],
  },
];
