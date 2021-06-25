const path = require('path');

const SCOPE = process.env.SCOPE;

const config = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testEnvironment: 'node',
  testRegex: 'spec\.ts$',
  coverageDirectory: './coverage/',
  coveragePathIgnorePatterns: [
    'dist',
    '\\+internal/testing',
    '@integration',
    '\\.spec-(util|setup)\\.ts$',
    '\\.spec\\.ts$',
    'integration\\.ts$'
  ],
  collectCoverageFrom : ['packages/**/*.ts'],
  moduleFileExtensions: [
    'ts',
    'js',
    'json'
  ],
  globals: {
    'ts-jest': {
      tsconfig: path.join(path.dirname(__filename), './tsconfig.test.json'),
      diagnostics: {
        ignoreCodes: [2300],
      },
    },
  },
};

if (SCOPE === 'integration') {
  config.testRegex = 'integration\.spec\.ts$';
  console.info('RUNNING INTEGRATION TESTS');
}

if (SCOPE === 'unit') {
  config.testRegex = '^((?!integration).)*\.spec\.ts$';
  console.info('RUNNING UNIT TESTS');
}

module.exports = config;
