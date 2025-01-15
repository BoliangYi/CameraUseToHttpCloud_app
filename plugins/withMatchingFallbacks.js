const { withGradleProperties } = require('@expo/config-plugins');

function withMatchingFallbacks(config) {
  return withGradleProperties(config, (config) => {
    const buildScript = `
      buildTypes {
        release {
          matchingFallbacks = ['generalRelease', 'mlkitRelease']
        }
      }
    `;

    // Append or inject the configuration script
    config.modResults.push(buildScript);
    return config;
  });
}

module.exports = withMatchingFallbacks;
