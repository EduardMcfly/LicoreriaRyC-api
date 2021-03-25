/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const slsw = require('serverless-webpack');

/**
 * @type {import('webpack').Configuration}
 */
const config = {
  mode: 'development',
  entry: slsw.lib.entries,
  target: 'node',
  externals: [nodeExternals()],
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    enforceExtension: false,
    plugins: [new TsconfigPathsPlugin()],
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'cache-loader',
            options: {
              cacheDirectory: path.resolve('.webpackCache'),
            },
          },
          'ts-loader',
        ],
      },
    ],
  },
  output: {
    libraryTarget: 'commonjs-module',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
  },
  devtool: 'source-map',
};

module.exports = config;
