/*jslint node: true */
"use strict";

var VERSION = 6;

var async = require('async');
var bCordova = (typeof window === 'object' && window.cordova);

function migrateDb(connection, onDone){
	connection.db[bCordova ? 'query' : 'all']("PRAGMA user_version", function(err, result){
		if (err)
			throw Error("PRAGMA user_version failed: "+err);
		var rows = bCordova ? result.rows : result;
		if (rows.length !== 1)
			throw Error("PRAGMA user_version returned "+rows.length+" rows");
		var version = rows[0].user_version;
		console.log("db version "+version);
		if (version > VERSION)
			throw Error("user version "+version+" > "+VERSION);
		if (version === VERSION)
			return onDone();
		var arrQueries = [];
		if (version < 1){
			connection.addQuery(arrQueries, "CREATE INDEX IF NOT EXISTS unitAuthorsIndexByAddressDefinitionChash ON unit_authors(address, definition_chash)");
			connection.addQuery(arrQueries, "CREATE INDEX IF NOT EXISTS outputsIsSerial ON outputs(is_serial)");
			connection.addQuery(arrQueries, "CREATE INDEX IF NOT EXISTS bySequence ON units(sequence)");
		}
		if (version < 2){
			connection.addQuery(arrQueries, "CREATE UNIQUE INDEX IF NOT EXISTS hcobyAddressMci ON headers_commission_outputs(address, main_chain_index)");
			connection.addQuery(arrQueries, "CREATE UNIQUE INDEX IF NOT EXISTS byWitnessAddressMci ON witnessing_outputs(address, main_chain_index)");
			connection.addQuery(arrQueries, "CREATE INDEX IF NOT EXISTS inputsIndexByAddressTypeToMci ON inputs(address, type, to_main_chain_index)");
			connection.addQuery(arrQueries, "DELETE FROM known_bad_joints");
		}
		if (version < 4) {
			connection.addQuery(arrQueries, "DELETE FROM known_bad_joints");
		}
		if (version < 5){
			connection.addQuery(arrQueries, "CREATE TABLE IF NOT EXISTS push_registrations (registrationId TEXT, device_address TEXT NOT NULL, PRIMARY KEY (device_address))");
		}
		if (version < 6){
			connection.addQuery(arrQueries, "CREATE TABLE IF NOT EXISTS chat_messages ( \n\
				id INTEGER PRIMARY KEY, \n\
				correspondent_address CHAR(33) NOT NULL, \n\
				message LONGTEXT NOT NULL, \n\
				creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, \n\
				is_incoming INTEGER(1) NOT NULL, \n\
				type CHAR(15) NOT NULL DEFAULT 'text', \n\
				FOREIGN KEY (correspondent_address) REFERENCES correspondent_devices(device_address) \n\
			)");
			connection.addQuery(arrQueries, "CREATE INDEX IF NOT EXISTS chatMessagesIndexByDeviceAddress ON chat_messages(correspondent_address, id)");
			connection.addQuery(arrQueries, "ALTER TABLE correspondent_devices ADD COLUMN my_record_pref INTEGER DEFAULT 1");
			connection.addQuery(arrQueries, "ALTER TABLE correspondent_devices ADD COLUMN peer_record_pref INTEGER DEFAULT 1");
		}
		connection.addQuery(arrQueries, "PRAGMA user_version="+VERSION);
		async.series(arrQueries, onDone);
	});
}

exports.migrateDb = migrateDb;