const metroBabelTransformer = require('metro-babel-transformer');

function safeStringify(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return String(obj);
  }
}

module.exports.transform = function(transformArgs) {
  try {
    const { filename, options } = transformArgs || {};
    console.log('\n[metro-transformer-logger] Transform called for:', filename);
    if (options) {
      console.log('[metro-transformer-logger] options keys:', Object.keys(options));
      console.log('[metro-transformer-logger] babel options.preview:', safeStringify(options));
      if (options && options.plugins && options.plugins.length >= 2) {
        console.log('[metro-transformer-logger] options.plugins[1] =', safeStringify(options.plugins[1]));
      }
    } else {
      console.log('[metro-transformer-logger] no options object passed');
    }

    // Also log the explicit `plugins` argument passed by Metro to the transformer
    try {
      if (transformArgs && typeof transformArgs.plugins !== 'undefined') {
        console.log('[metro-transformer-logger] transformArgs.plugins =', safeStringify(transformArgs.plugins));
        if (Array.isArray(transformArgs.plugins) && transformArgs.plugins.length >= 2) {
          console.log('[metro-transformer-logger] transformArgs.plugins[1] =', safeStringify(transformArgs.plugins[1]));
        }
      } else {
        console.log('[metro-transformer-logger] transformArgs.plugins is undefined');
      }
    } catch (e) {
      console.error('[metro-transformer-logger] error logging transformArgs.plugins', e);
    }
  } catch (err) {
    console.error('[metro-transformer-logger] error while logging transform args:', err);
  }

  // Sanitize the plugins array (remove null/undefined) to avoid Babel validation errors
  try {
    if (transformArgs && Array.isArray(transformArgs.plugins)) {
      const filtered = transformArgs.plugins.filter((p) => p != null);
      // Always replace the plugins array with a filtered one to avoid passing null/undefined
      transformArgs = Object.assign({}, transformArgs, { plugins: filtered });
      if (filtered.length !== 0) {
        console.log('[metro-transformer-logger] using filtered plugins array (non-empty):', filtered);
      } else {
        console.log('[metro-transformer-logger] filtered plugins array is empty; passing empty plugins array');
      }
    }
  } catch (e) {
    console.error('[metro-transformer-logger] error sanitizing plugins', e);
  }

  // Delegate to the real metro-babel-transformer
  return metroBabelTransformer.transform(transformArgs);
};

module.exports.getCacheKey = function() {
  if (typeof metroBabelTransformer.getCacheKey === 'function') {
    return metroBabelTransformer.getCacheKey.apply(null, arguments);
  }
  return null;
};
