/**
 * A shim lib for providing access to promise version of fs that is backwards compatible.
 * This doesn't intend to polyfill exactly, it is purely an iteration over the current
 * methods.
 */

import * as fs from 'fs';
import { promisify } from 'util';

// constants for ease of use
export const constants = fs.constants;

// simple iteration over every fs method
// they are done explicitly to allow proper typing
export const access = promisify(fs.access);
export const appendFile = promisify(fs.appendFile);
export const chmod = promisify(fs.chmod);
export const chown = promisify(fs.chown);
export const close = promisify(fs.close);
export const copyFile = promisify(fs.copyFile);
export const exists = promisify(fs.exists);
export const fchmod = promisify(fs.fchmod);
export const fchown = promisify(fs.fchown);
export const fstat = promisify(fs.fstat);
export const ftruncate = promisify(fs.ftruncate);
export const futimes = promisify(fs.futimes);
export const link = promisify(fs.link);
export const lstat = promisify(fs.lstat);
export const mkdir = promisify(fs.mkdir);
export const mkdtemp = promisify(fs.mkdtemp);
export const open = promisify(fs.open);
export const read = promisify(fs.read);
export const readdir = promisify(fs.readdir);
export const readFile = promisify(fs.readFile);
export const readlink = promisify(fs.readlink);
export const realpath = promisify(fs.realpath);
export const rename = promisify(fs.rename);
export const rmdir = promisify(fs.rmdir);
export const stat = promisify(fs.stat);
export const symlink = promisify(fs.symlink);
export const truncate = promisify(fs.truncate);
export const unlink = promisify(fs.unlink);
export const utimes = promisify(fs.utimes);
export const write = promisify(fs.write);
export const writeFile = promisify(fs.writeFile);

// functions that do not have callbacks
// these are still kept here so that the fsp module mimics the
// fs module closely
export const createReadStream = fs.createReadStream;
export const createWriteStream = fs.createWriteStream;
export const unwatchFile = fs.unwatchFile;
export const watch = fs.watch;
export const watchFile = fs.watchFile;
