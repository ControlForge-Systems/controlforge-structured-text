const path = require('path');

// Base configuration that applies to both client and server
const baseConfig = {
  target: 'node', // VS Code extensions run in Node.js
  node: {
    __dirname: false // Handle __dirname correctly
  },
  externals: {
    vscode: 'commonjs vscode', // Exclude vscode module
  },
  resolve: {
    extensions: ['.ts', '.js'], // Resolve these extensions
    mainFields: ['main'], // Use the "main" field in package.json
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
  infrastructureLogging: {
    level: "log", // Enable logging
  },
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
  },
  // Make sure to bundle vscode-languageserver modules in the server bundle
  externals: {
    vscode: 'commonjs vscode', // Exclude vscode module
  },
};

module.exports = [clientConfig, serverConfig]; // Export both configurations
