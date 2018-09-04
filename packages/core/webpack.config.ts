import * as path from 'path';
import * as webpack from 'webpack';
import * as nodeExternals from 'webpack-node-externals';

const config: webpack.Configuration = {
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  target: 'node',
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json'],
    modules: ['node_modules'],
    symlinks: false,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: ['node_modules'],
        use: ['ts-loader'],
      }
    ]
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs2',
  },
  externals: [
    nodeExternals(),
    nodeExternals({
      modulesDir: path.resolve(__dirname, '../../node_modules')
  })],
  optimization: {
    minimize: false
  },
};

export default config;
