const baseConfig = require('../../jest.config.base');

module.exports = {
  ...baseConfig,
  collectCoverageFrom: ['src/**/*.ts'],
};
