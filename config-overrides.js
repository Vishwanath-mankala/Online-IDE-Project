const path = require('path');

module.exports = function override(config) {
  // Add any customizations to webpack config here
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, 'src'),
  };

  return config;
};