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
var GearsConnectorTest = {
	setUp: function() {
		this.connector = new GearsConnector('test');
		this.connector.dropTable('test_table');
		this.connector.dropTable('test_table1');
		this.connector.dropTable('_migrations');
	},
	
	testCreateTable: function() {
		this.connector.createTable('test_table', {id: 'INTEGER', name: 'TEXT'});
		assertEquals(this.connector.columns('test_table'), ['id', 'name']);
		this.connector.createTable('test_table', {id: 'INTEGER', name: 'TEXT', col: 'TEXT'});
		assertEquals(this.connector.columns('test_table'), ['id', 'name']);
		this.connector.createTable('test_table', {id: 'INTEGER', name: 'TEXT', col: 'TEXT'}, {force: true});
		assertEquals(this.connector.columns('test_table'), ['id', 'name', 'col']);
		this.connector.dropTable('test_table');
	},

	testColumns: function() {
		this.connector.createTable('test_table', {id: 'INTEGER', name: 'TEXT'});
		assertEquals(this.connector.columns('test_table'), ['id', 'name']);
		this.connector.dropTable('test_table');
	},
	
	testDeleteRows: function() {
		this.connector.createTable('test_table', {id: 'INTEGER PRIMARY KEY', name: 'TEXT'});
		this.connector.insert('test_table', [0, 'R1']);
		this.connector.insert('test_table', [1, 'R2']);
		this.connector.deleteRows('test_table');
		assertEquals(this.connector.select('test_table').length, 0);
		this.connector.insert('test_table', [0, 'R1']);
		this.connector.insert('test_table', [1, 'R2']);
		this.connector.deleteRows('test_table', {where: ['id=0']});
		assertEquals(this.connector.select('test_table').length, 1);
		this.connector.dropTable('test_table');
	},
	
	testDropTable: function() {
		this.connector.createTable('test_table', {id: 'INTEGER', name: 'TEXT'});
		this.connector.dropTable('test_table');
		assertThrows(function() {this.connector.columns('test_table')});
		assertThrows(function() {this.connector.dropTable('test_table', {ensureExists: true})});
	},
	
	testExecute: function() {
		assertEquals(this.connector.execute('CREATE TABLE IF NOT EXISTS test_table (id INTEGER)'), undefined);
		this.connector.execute('INSERT INTO test_table VALUES (0)');
		this.connector.execute('INSERT INTO test_table VALUES (1)');
		assertEquals(this.connector.execute('SELECT * FROM test_table').length, 2);
		assertEquals(this.connector.execute(['SELECT * FROM test_table WHERE id=0']).length, 1);
		assertEquals(this.connector.execute(['SELECT * FROM test_table WHERE id=?', 1]).length, 1);
		assertEquals(this.connector.execute('DROP TABLE test_table'), undefined);
	},
	
	testInsert: function() {
		this.connector.createTable('test_table', {id: 'INTEGER PRIMARY KEY', name: 'TEXT'});
		this.connector.insert('test_table', [0, 'R1']);
		assertEquals(this.connector.select('test_table', {where: ['id=0']})[0], {id: 0, name: 'R1'});
		this.connector.insert('test_table', {id: 1, name: 'R2'});
		assertEquals(this.connector.select('test_table', {where: ['id=1']})[0], {id: 1, name: 'R2'});
		this.connector.insert('test_table', {id: 1, name: 'R3'}, {replace: true});
		assertEquals(this.connector.select('test_table', {where: ['id=1']})[0], {id: 1, name: 'R3'});
		this.connector.dropTable('test_table');
	},
	
	testOpen: function() {
		this.connector.open('test2');
		this.connector.open('test');
	},
	
	testMigrate: function() {
		var migrations = [
			{ // version 0
				up: function(c) {
					c.createTable('test_table', {id: 'INTEGER', name: 'TEXT'});
				},
				down: function(c) {
					c.dropTable('test_table');
				}
			},
			{ // version 1
				up: function(c) {
					c.createTable('test_table1', {id: 'INTEGER'});
				},
				down: function(c) {
					c.dropTable('test_table1');
				}
			},
			{ // version 2
				up: function(c) {
					c.dropTable('test_table');
					c.dropTable('test_table1');
				},
				down: function(c) {
					c.createTable('test_table', {id: 'INTEGER', name: 'TEXT'});
					c.createTable('test_table1', {id: 'INTEGER'});
				}
			},
			{ // version 3
				up: function(c) {
					c.renameTable('test_table', 'test_table1');
				},
				down: function(c) {
					c.renameTable('test_table1', 'test_table');
				}
			}
		];
		
		this.connector.migrate(migrations, 0);
		assertEquals(this.connector.tables(), ['_migrations','test_table']);
		assertEquals(this.connector.select('_migrations', ['version'], 
			{where: ['id="default"']})[0]['_migrations_version'], 0);
		this.connector.migrate(migrations, 2);
		assertEquals(this.connector.tables(), ['_migrations']);
		assertEquals(this.connector.select('_migrations', ['version'], 
			{where: ['id="default"']})[0]['_migrations_version'], 2);
		this.connector.migrate(migrations, -1);
		assertEquals(this.connector.tables(), ['_migrations']);
		assertEquals(this.connector.select('_migrations', ['version'], 
			{where: ['id="default"']})[0]['_migrations_version'], -1);
		this.connector.migrate(migrations, 3);
		assertEquals(this.connector.tables(), ['_migrations']);
		assertEquals(this.connector.select('_migrations', ['version'], 
			{where: ['id="default"']})[0]['_migrations_version'], -1);
	},
	
	testRenameTable: function() {
		this.connector.createTable('test_table', {id: 'INTEGER', name: 'TEXT'});
		this.connector.renameTable('test_table', 'test_table1');
		assertEquals(this.connector.columns('test_table1'), ['id', 'name']);
		this.connector.dropTable('test_table1');
	},
	
	testSelect: function() {
		this.connector.createTable('test_table', {id: 'INTEGER', name: 'TEXT'});
		this.connector.insert('test_table', [0, 'R1']);
		this.connector.insert('test_table', [1, 'R2']);
		this.connector.insert('test_table', [2, 'R3']);
		assertEquals(this.connector.select('test_table').length, 3);
		assertEquals($.keys(this.connector.select('test_table', [])[0]).length, 2);
		assertEquals($.keys(this.connector.select('test_table', ['*'])[0]).length, 2);
		assertEquals(this.connector.select('test_table', {headers: true}).length, 4);
		assertEquals(this.connector.select('test_table', {where: ['id=?', 0]}).length, 1);
		assertEquals(this.connector.select(
			'test_table', ['id'], {where: ['id>?', 0], limit: 1})[0]['test_table_id'], 1);
		assertEquals(this.connector.select(
			'test_table', {where: ['id>?', 0], limit: 1, offset: 1})[0]['id'], 2);
		assertEquals(this.connector.select(
			'test_table', ['id'], {orderBy: 'id DESC'})[0]['test_table_id'], 2);
		this.connector.dropTable('test_table');
	},
	
	testTables: function() {
		this.connector.createTable('test_table', {id: 'INTEGER', name: 'TEXT'});
		this.connector.createTable('test_table1', {id: 'INTEGER', name: 'TEXT'});
		try { assertEquals(this.connector.tables(), ['_migrations','test_table', 'test_table1']); }
		catch (exception) { assertEquals(this.connector.tables(), ['test_table', 'test_table1']); }
		this.connector.dropTable('test_table1');
		this.connector.dropTable('test_table');
	},
	
	testTransaction: function() {
		this.connector.createTable('test_table', {id: 'INTEGER PRIMARY KEY', name: 'TEXT'});
		this.connector.transaction(function(c) {
			c.insert('test_table', [0, 'R0']);
			c.insert('test_table', [1, 'R1']);
		});
		assertEquals(this.connector.select('test_table').length, 2);
		this.connector.transaction(function(c) {
			c.insert('test_table', [2, 'R2']);
			c.insert('test_table', [3, 'R3']);
			c.insert('test_table', [3, 'R3']);
		});
		assertEquals(this.connector.select('test_table').length, 2);
		this.connector.dropTable('test_table');
	}
};
