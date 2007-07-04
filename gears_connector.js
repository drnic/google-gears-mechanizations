/**
 * Mechanizations - http://code.google.com/p/mechanizations
 * Copyright (c) 2007, Ravi Chodavarapu - http://ravichodavarapu.blogspot.com
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
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
