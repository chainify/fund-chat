const webpack = require('webpack');
const { parsed: localEnv } = require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env',
});

export default (config, env, helpers) => {
  delete config.entry.polyfills;
  config.output.filename = "[name].js";

  config.plugins.push(new webpack.EnvironmentPlugin(localEnv));

  let { plugin } = helpers.getPluginsByName(config, "ExtractTextPlugin")[0];
  plugin.options.disable = false;

  let css = helpers.getLoadersByName(config, 'css-loader')[0];
  css.loader.options.modules = false;

	config.node.process = true;
	config.node.Buffer = true;

  if (env.production) {
    config.output.libraryTarget = "umd";
  }
};