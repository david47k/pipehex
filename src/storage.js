/* Copyright 2022 David Atkinson */

const prefix = 'phex_';

/** @param {string} key
 *  @param {any} val
 *  @returns {any} */
function replacerMap(key, val) {
	if(val instanceof Map) {
		return { dataType: 'Map', val: Array.from(val.entries()) };
	}
    return val;
}

/** @param {string} key
 *  @param {any} val 
 *  @returns {any} */
function reviverMap(key, val) {
	if(typeof val === 'object' && val !== null && val.dataType === 'Map') {
		return new Map(val.val);
    }
	return val;
}

export default {
	/** @param {string} key
	 *  @param {any} val */
	save: function(key,val) {
		localStorage.setItem('phex_'+key, val);
	},
	/** @param {string} key
	 *  @param {number} val */
	saveInt: function(key,val) { this.save(key,val); },
	/** @param {string} key
	 *  @param {string} val */
	saveStr: function(key,val) { this.save(key,val); },
	/** @param {string} key
	 *  @param {Map<any,any>} val */
	saveMap: function(key,val) {		
		localStorage.setItem('phex_'+key, JSON.stringify(val, replacerMap));
	},
	/** @param {string} key
	 *  @param {Map<any,any>} def */
	loadMap: function(key,def) {
		var o = localStorage.getItem('phex_'+key);
		if(o == null) return def;
		return JSON.parse(o, reviverMap);
	},
	/** @param {string} key
	 *  @param {number | null} def */
	loadInt: function(key,def) {
		var x = parseInt(localStorage.getItem('phex_'+key));
		if(isNaN(x)) return def;
		return x;
	},
	/** @param {string} key
	 *  @param {string | null} def */
	loadStr: function(key,def) {
		let r = localStorage.getItem('phex_'+key);
		if(r == null) return def;
		return r;
	},
	/** @param {string} key
	 *  @param {any} val */
	saveObj: function(key,val) {
		localStorage.setItem('phex_'+key, JSON.stringify(val));
	},
	/** @param {string} key
	 *  @param {any} def */
	loadObj: function(key,def) {
		var o = localStorage.getItem('phex_'+key);
		if(o == null) return def;
		return JSON.parse(o);
	},
}
