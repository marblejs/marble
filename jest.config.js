module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx)$',
  coverageDirectory: './coverage/',
  coveragePathIgnorePatterns: ['spec-util.ts$', 'index.ts$', '.d.ts$'],
  collectCoverageFrom : ['packages/**/*.ts'],
  moduleFileExtensions: [
    'ts',
    'js',
    'json'
  ]
};
