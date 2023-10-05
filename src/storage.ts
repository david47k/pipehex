/* Copyright 2022 David Atkinson */

const prefix = 'phex_';

function replacerMap(key: string, val: any) {
	if(val instanceof Map) {
		return { dataType: 'Map', val: Array.from(val.entries()) };
	}
    return val;
}

function reviverMap(key: string, val: any) {
	if(typeof val === 'object' && val !== null && val.dataType === 'Map') {
		return new Map(val.val);
    }
	return val;
}

export default {
	save: function(key: string, val: any) {
		localStorage.setItem('phex_'+key, val);
	},
	saveInt: function(key: string, val: number) { this.save(key,val); },
	saveStr: function(key: string, val: string) { this.save(key,val); },
	saveMap: function(key: string, val: Map<any,any>) {		
		localStorage.setItem('phex_'+key, JSON.stringify(val, replacerMap));
	},
	loadMap: function(key: string, def: Map<any,any>) {
		var o = localStorage.getItem('phex_'+key);
		if(o == null) return def;
		return JSON.parse(o, reviverMap);
	},
	loadInt: function(key: string, def: number | null) {
		var x = parseInt(localStorage.getItem('phex_'+key));
		if(isNaN(x)) return def;
		return x;
	},
	loadStr: function(key: string, def: string | null) {
		let r = localStorage.getItem('phex_'+key);
		if(r == null) return def;
		return r;
	},
	saveObj: function(key: string, val: any) {
		localStorage.setItem('phex_'+key, JSON.stringify(val));
	},
	loadObj: function(key: string, def: any) {
		var o = localStorage.getItem('phex_'+key);
		if(o == null) return def;
		return JSON.parse(o);
	},
}
