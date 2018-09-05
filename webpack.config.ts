import * as path from 'path';
import * as webpack from 'webpack';
import * as nodeExternals from 'webpack-node-externals';

export const getConfig = (base: string): webpack.Configuration => ({
  entry: path.resolve(base, './src/index.ts'),
  devtool: 'inline-source-map',
  mode: 'production',
  target: 'node',
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json'],
    modules: ['node_modules'],
    symlinks: false,
  },
  module: {
    rules: [{
      test: /\.tsx?$/,
      exclude: ['node_modules'],
      use: ['ts-loader'],
      sideEffects: false,
    }]
  },
  output: {
    filename: 'index.js',
    path: path.resolve(base, 'dist'),
    libraryTarget: 'commonjs2',
  },
  externals: [
    nodeExternals(),
    nodeExternals({
      modulesDir: path.resolve(base, '../../node_modules')
    }),
  ],
  stats: {
    colors: true,
  },
});
