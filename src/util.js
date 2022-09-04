/* util.js
 * Misc utility functions.
 * Copyright 2022 David Atkinson <david47k@d47.co>
 */

/** @param {any} a
 *  @param {any} b 
 *  @returns {boolean}
 */
export function arrayEqual(a, b) {
    if(Array.isArray(a) && Array.isArray(b)) {
		return a.length === b.length && a.every((v, i) => arrayEqual(v,b[i]));
	} else {
		return a === b;
	}
}
