const pkg = (() => {
  try { return require('../package.json'); }
  catch { return { version: require('./node_modules/react-inline-calc/package.json').version }; }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['react-inline-calc'],
  env: {
    LIB_VERSION: pkg.version,
  },
};

module.exports = nextConfig;
