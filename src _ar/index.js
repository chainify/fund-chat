let poly = require("preact-cli/lib/lib/webpack/polyfills");

import { h } from "preact";
import habitat from "preact-habitat";
import App from "./components/App";


let _habitat = habitat(App);

_habitat.render({
	selector: '#app',
  inline: false
});
