module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx)$',
  coverageDirectory: './coverage/',
  mapCoverage: true,
  moduleFileExtensions: [
    'ts',
    'js',
    'json'
  ]
};
