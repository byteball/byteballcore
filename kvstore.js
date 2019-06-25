/*jslint node: true */
"use strict";
var fs = require('fs'+'');
var rocksdb = require('level-rocksdb');
var app_data_dir = require('./desktop_app.js'+'').getAppDataDir();
var path = app_data_dir + '/rocksdb';

try{
	fs.statSync(app_data_dir);
}
catch(e){
	var mode = parseInt('700', 8);
	var parent_dir = require('path'+'').dirname(app_data_dir);
	try { fs.mkdirSync(parent_dir, mode); } catch(e){}
	try { fs.mkdirSync(app_data_dir, mode); } catch(e){}
}

var db = rocksdb(path);

module.exports = {
	get: function(key, cb){
		db.get(key, function(err, val){
			if (err){
				if (err.notFound)
					return cb();
				throw Error("get "+key+" failed: "+err);
			}
			cb(val);
		});
	},
	
	put: function(key, val, cb){
		db.put(key, val, function(err){
			if (err)
				throw Error("put "+key+" = "+val+" failed: "+err);
			cb();
		});
	},
	
	del: function(key, cb){
		db.del(key, function(err){
			if (err)
				throw Error("del " + key + " failed: " + err);
			if (cb)
				cb();
		});
	},
	
	batch: function(){
		return db.batch();
	},
	
	createReadStream: function(options){
		return db.createReadStream(options);
	},
	
	createKeyStream: function(options){
		return db.createKeyStream(options);
	},
	
	close: function(cb){
		db.close(cb);
	}
};