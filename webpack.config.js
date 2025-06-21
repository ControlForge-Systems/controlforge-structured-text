const path = require('path');

// Base configuration that applies to both client and server
const baseConfig = {
  mode: 'production', // 'production' for minification, 'development' for readable output
  target: 'node', // VS Code extensions run in Node.js
  node: {
    __dirname: false // Handle __dirname correctly
  },
  externals: {
    vscode: 'commonjs vscode', // Exclude vscode module
  },
  resolve: {
    extensions: ['.ts', '.js'], // Resolve these extensions
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  devtool: 'nosources-source-map', // Enable source maps but don't include source content
};

// Client-side configuration
const clientConfig = {
  ...baseConfig,
  entry: './src/extension.ts', // Extension entry point
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
  }
};

// Server-side configuration
const serverConfig = {
  ...baseConfig,
  entry: './src/server/server.ts', // Server entry point
  output: {
    path: path.resolve(__dirname, 'dist', 'server'),
    filename: 'server.js',
    libraryTarget: 'commonjs2',
  }
};

module.exports = [clientConfig, serverConfig]; // Export both configurations
