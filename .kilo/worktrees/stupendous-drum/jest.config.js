module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    testPathIgnorePatterns: ['/node_modules/', '/.kilo/', '/worktrees/', '/dist/', '/seba-pos-frontend/'],
    clearMocks: true,
};
