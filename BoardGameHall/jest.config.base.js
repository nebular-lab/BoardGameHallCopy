module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  errorOnDeprecated: true,
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
