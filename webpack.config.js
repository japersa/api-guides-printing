const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const _ = require('lodash');
const slsw = require('serverless-webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
require('source-map-support').install();

module.exports = {
  entry: slsw.lib.entries,
  target: 'node',
  mode: 'production',
  externals: nodeExternals(),
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: 'assets', to: 'assets' }],
    }),
  ],
  optimization: {
    nodeEnv: false,
  },
  resolve: {
    modules: ['src', 'node_modules'],
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    alias: {},
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        loader: 'ts-loader',
      },
    ],
  },
};
