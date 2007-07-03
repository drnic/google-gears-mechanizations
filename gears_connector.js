/**
 * Copyright (c) 2007, Ravi Chodavarapu
 * 
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, are permitted 
 * provided that the following conditions are met:
 * 
 *  * Redistributions of source code must retain the above copyright notice, this list of 
 *    conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice, this list of 
 *    conditions and the following disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name Ravi Chodavarapu nor the names of other contributors may be used to endorse
 *    or promote products derived from this software without specific prior written permission.
 *    
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var GearsConnector = function(database) {
	var self = this;
	var gears = null;
	
	var executeR = function(query, bind) {
		log(query + (bind ? '; [' + bind.join(', ') + ']' : ''));
		return gears.execute(query, bind);
	};
	
	var executeNR = function(query, bind) {
		var resultSet = executeR(query, bind);
		resultSet.close();
	};
	
	var hashify = function(resultSet) {
		var hash = {};
		for (var i = 0, count = resultSet.fieldCount(); i < count; ++i)
			hash[resultSet.fieldName(i)] = false;
		return hash;
	};
	
	var log = function(query) {
		Logger.info('DB Query: ' + query);
	};
	
	var tableExists = function(name) {
		var results = self.select('sqlite_master', ['name'], 
			{where: ['type="table" AND name=?', name]});
		if (results && results.length > 0) return true;
		else return false;
	};
	
	var migrationVersion = function(id) {
		self.createTable('_migrations', {'id': 'TEXT PRIMARY KEY', version: 'INTEGER'});
		var results = self.select('_migrations', ['version'], {where: ['id=?', id]});
		if (results && results.length > 0) {
			version = results[0]['_migrations_version'];
			return version;
		} else {
			return -1;
		}
	};
	
	var prepareResults = function(resultSet, options) {
		var resultColumns = hashify(resultSet);
		var results = [];
		while (resultSet.isValidRow()) {
			var result = jQuery.extend({}, resultColumns);
			for (var column in resultColumns)
				result[column] = resultSet.fieldByName(column);
			
			results.push(result);
			resultSet.next();
		}
		
		Logger.info('DB Result: ' + results.length + ' row(s) returned.');
		if (options && options['headers']) results.unshift(resultColumns);
		return results;
	};
	
	this.createTable = function(name, definition, options) {
		if (tableExists(name)) {
			if (options && options['force']) this.dropTable(name);
			else return;
		}
		
		var columnsDef = $.join(definition, ' ', ',');		
		executeNR('CREATE TABLE ' + name + ' (' + columnsDef + ')');
	};
	
	this.columns = function(name) {
		return $.keys(this.select(name, {limit: 0, headers: true})[0]);
	};
	
	this.deleteRows = function(name, options) {
		var query = 'DELETE FROM ' + name;
		var bind;
		if (options && options['where']) {
			query += ' WHERE ' + options['where'][0];
			if (options['where'].length > 1)
				bind = options['where'].slice(1, options['where'].length);
		}
		executeNR(query, bind);
	};
	
	this.execute = function(statement, options) {
		var resultSet;
		if (statement instanceof Array)
			resultSet = executeR(statement[0], statement.slice(1, statement.length));
		else resultSet = executeR(statement);
		
		if (resultSet.fieldCount() > 0)
			return prepareResults(resultSet, options);
	}
	
	this.dropTable = function(name, options) {
		executeNR('DROP TABLE ' + ((options && options['ensureExists']) ? '' : 'IF EXISTS ') + 
			name);
	};
	
	this.insert = function(name, data, options) {
		var query = (options && options['replace']) ? 'REPLACE ' : 'INSERT ';
		query += 'INTO ' + name;
	
		if (!(data instanceof Array)) {
			var keys = $.keys(data);
			query += ' (' + $.keys(data).join(',') + ')';
			data = $.values(data, keys);
		}
		
		query += ' VALUES (' + $.repeatChar('?', data.length, ',') + ')';
		executeNR(query, data);
	};
	
	this.migrate = function(migrations, version, id) {
		if (version < -1 || version >= migrations.length)
			throw new Error('Invalid version to migrate to!');
			
		if (!id) id = 'default';
		
		var dbVersion = migrationVersion(id);
		if (dbVersion < -1 || dbVersion >= migrations.length)
			throw new Error("Don't know how to migrate from present version!");
		
		var result = this.transaction(function(connector) {
			if (dbVersion < version) {
				for (var i = dbVersion + 1; i <= version; ++i)
					migrations[i].up(connector);
			} else if (version < dbVersion) {
				for (var i = dbVersion; i > version; --i)
					migrations[i].down(connector);
			}
		});
		
		if (result) {
			this.insert('_migrations', {'id': id, 'version': version}, {replace: true});
			Logger.info('DB Migrated: Migrations Set: ' + id + ', Version: ' + version);
			return true;
		} else {
			Logger.error('DB Migration Failed: Migrations Set: ' + id + 
				', Remaining At: ' + dbVersion);
			return false;
		}
	};
	
	this.open = function(database) {
		if (!gears) {
			gears = google.gears.factory.create('beta.database', '1.0');
		} else {
			Logger.info('DB Close');
			gears.close();
		}
		
		Logger.info('DB Open: ' + database);
		gears.open(database);
	};
	
	this.renameTable = function(name, newName) {
		executeNR('ALTER TABLE ' + name + ' RENAME TO ' + newName);
	};
	
	this.select = function(name, columns, options) {
		if (!columns) columns = ['*'];
		else if (columns instanceof Array && columns.length == 0) columns = ['*'];
		else if (!(columns instanceof Array)) {
			options = columns;
			columns = ['*'];
		}
		
		var columnsDef = (columns.length == 1 && columns[0] === '*') ?
			[name + '.*'] :
			jQuery.map(columns, function(c) {return name + '.' + c + ' AS ' + name + '_' + c;});
		columnsDef = columnsDef.join(',');
		var query = 'SELECT ' + columnsDef + ' FROM ' + name;
		var bind;
		
		if (options) {
			if (options['where']) {
				query += ' WHERE ' + options['where'][0];
				if (options['where'].length > 1)
					bind = options['where'].slice(1, options['where'].length);
			}
			if (options['orderBy'])
				query += ' ORDER BY ' + options['orderBy'];
			if (typeof(options['limit']) != 'undefined') {
				query += ' LIMIT ' + options['limit'];
				if (options['offset'])
					query += ', ' + options['offset'];
			}
		}
		
		var resultSet = executeR(query, bind);
		var results = prepareResults(resultSet, options);
		resultSet.close();
		
		return results;
	};
	
	this.tables = function() {
		return jQuery.map(
			this.select('sqlite_master', ['name'], {where: ['type="table"'], orderBy: 'name ASC'}),
			function(i) {return i['sqlite_master_name']});
	};
	
	this.transaction = function(fn) {
		try {
			executeNR('BEGIN TRANSACTION');
			fn(this);
		} catch (exception) {
			executeNR('ROLLBACK TRANSACTION');
			return false;
		}
		
		executeNR('COMMIT TRANSACTION');
		return true;
	};
	
	if (database) this.open(database);
};
