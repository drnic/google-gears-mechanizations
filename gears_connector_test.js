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
