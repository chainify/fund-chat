export default (config, env, helpers) => {
  delete config.entry.polyfills;
  config.output.filename = "[name].js";

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