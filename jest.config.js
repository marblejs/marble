module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx)$',
  coverageDirectory: './coverage/',
  collectCoverageFrom : ['src/**/*.ts'],
  moduleFileExtensions: [
    'ts',
    'js',
    'json'
  ]
};
