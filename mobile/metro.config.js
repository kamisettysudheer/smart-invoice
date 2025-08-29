const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);

  return {
    ...defaultConfig,
    // your customizations here, for example:
    transformer: {
      ...defaultConfig.transformer,
      // your transformer options
    },
    resolver: {
      ...defaultConfig.resolver,
      // your resolver options
    },
  };
})();
