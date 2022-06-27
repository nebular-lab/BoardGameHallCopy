/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

const baseConfig = require('./jest.config.base');

module.exports = {
  ...baseConfig,
  // https://jestjs.io/ja/docs/configuration#projects-arraystring--projectconfig
  projects: ['<rootDir>/packages/*/jest.config.js'],
};
