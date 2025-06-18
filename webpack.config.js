import path from 'path';
import { fileURLToPath } from 'url';
import { VueLoaderPlugin } from 'vue-loader';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: {
    background: './src/background/index.ts',
    content: './src/content/main.ts',
    popup: './src/popup/main.ts',
    options: './src/options/main.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js', '.vue', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          appendTsSuffixTo: [/\.vue$/],
          configFile: 'tsconfig.json'
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/manifest.json',
          to: 'manifest.json',
        },
        {
          from: 'public',
          to: '.', // 將 public 的內容複製到 dist 根目錄
        },
        {
          from: 'src/popup/index.html',
          to: 'popup.html',
        },
        {
          from: 'src/options/index.html',
          to: 'options.html',
        },
      ],
    }),
  ],
};