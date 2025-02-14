// @ts-check
import path from 'path';
import fs from 'fs';
import { EXTENSION_PATH } from './constants.mjs';

/**
 * Write runtime config file to disk.
 *
 * This file is read by the extension during it's start-up.
 * Since runtime.json is part of the extension manifest we
 * are allowed to read it. This 'trick' is used to share
 * runtime info with the extension that otherwise would be
 * nearly impossible.
 * Most importantly we are able to share port & host info of
 * the server, from there the extension may use the REST API
 * to communicate with the server.
 *
 * @typedef {Object} RuntimeConfig - Runtime configuration
 * @property {string} host - hostname
 * @property {number} port - port number
 * @param {RuntimeConfig} config - Config object
 */
export default function persistRuntimeConfig(config) {
  fs.writeFileSync(
    path.join(EXTENSION_PATH, 'runtime.json'),
    JSON.stringify(config, null, 2)
  );
}
