
const prefix = 'phex_';
export default {
	save: function(key,val) {
		localStorage.setItem('phex_'+key, val);
	},
	saveInt: function(key,val) { this.save(key,val); },
	saveStr: function(key,val) { this.save(key,val); },
	loadInt: function(key,def) {
		var x = parseInt(localStorage.getItem('phex_'+key));
		if(isNaN(x)) return def;
		return x;
	},
	loadStr: function(key,def) {
		let r = localStorage.getItem('phex_'+key);
		if(r == null) return def;
		return r;
	},
	saveObj: function(key,val) {
		localStorage.setItem('phex_'+key, JSON.stringify(val));
	},
	loadObj: function(key,def) {
		var o = localStorage.getItem('phex_'+key);
		if(o == null) return def;
		return JSON.parse(o);
	},
}
