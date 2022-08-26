module.exports = {
    mocha: {
        grep: '@skip-on-coverage', // Find everything with this tag
        invert: true, // Run the grep's inverse set.
    },
    configureYulOptimizer: true,
    skipFiles: ['v0.7/mocks/', 'v0.7/test/', 'v0.8/mocks/', 'v0.8/test/'],
};
