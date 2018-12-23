module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '.?(spec|integration\.spec)\.ts$',
  coverageDirectory: './coverage/',
  coveragePathIgnorePatterns: [
    'spec-util.ts$',
    'integration.ts$',
    '.d.ts$',
    '.spec.ts',
    'webpack.config.ts',
    '@example',
    '@integration',
    '\\+internal/testing',
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
