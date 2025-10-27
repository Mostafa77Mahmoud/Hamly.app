module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            "@": "./",
          },
        },
      ],
      // لازم يكون آخر plugin
      "react-native-reanimated/plugin",
    ],
  };
};
