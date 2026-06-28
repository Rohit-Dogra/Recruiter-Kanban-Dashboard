const isProd = process.env.NODE_ENV === 'production';
const debugEnabled = process.env.DEBUG_LOGGING === 'true';

const info = (...args) => {
  if (!isProd) console.log(...args);
};

const debug = (...args) => {
  if (debugEnabled) console.debug(...args);
};

const error = (...args) => {
  console.error(...args);
};

const warn = (...args) => {
  console.warn(...args);
};

module.exports = { info, debug, error, warn };
