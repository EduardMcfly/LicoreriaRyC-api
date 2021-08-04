/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const slsw = require('serverless-webpack');
const ESLintPlugin = require('eslint-webpack-plugin');

const { stage } = slsw.lib.options;

/**
 * @type {import('webpack').Configuration}
 */
const config = {
  mode: 'development',
  entry: slsw.lib.entries,
  target: 'node',
  externals: [nodeExternals()],
  resolve: {
    extensions: ['.js', '.json', '.ts'],
    enforceExtension: false,
    plugins: [new TsconfigPathsPlugin()],
  },
  plugins: [new ESLintPlugin({ extensions: ['ts', 'js'] })],
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        use: [{ loader: 'ts-loader' }],
      },
    ],
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack', stage || ''),
    filename: '[name].js',
  },
  devtool: 'source-map',
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve('.webpackCache'),
  },
};

module.exports = config;
