const SCOPE = process.env.SCOPE;

const config = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: 'spec\.ts$',
  coverageDirectory: './coverage/',
  coveragePathIgnorePatterns: [
    'dist',
    'testing',
    '@integration',
    'spec-util.ts$',
    'integration.spec.ts$',
    'integration.ts$'
  ],
  collectCoverageFrom : ['packages/**/*.ts'],
  moduleFileExtensions: [
    'ts',
    'js',
    'json'
  ],
  globals: {
    'ts-jest': {
      tsConfig: './tsconfig.test.json',
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
