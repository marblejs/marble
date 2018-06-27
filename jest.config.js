const SCOPE_ALL = 'all';
const SCOPE_UNIT = 'unit';
const SCOPE = process.env.SCOPE || SCOPE_ALL;

module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: SCOPE === SCOPE_UNIT
    ? '^((?!integration).)*\.spec\.ts$'
    : '.?(spec|integration\.spec)\.ts$',
  coverageDirectory: './coverage/',
  coveragePathIgnorePatterns: ['spec-util.ts$', '.d.ts$', '.spec.ts'],
  collectCoverageFrom : ['packages/**/*.ts'],
  moduleFileExtensions: [
    'ts',
    'js',
    'json'
  ],
  globals: {
    'ts-jest': {
      tsConfigFile: './tsconfig.spec.json',
    }
  }
};
