Google Gears Mechanizations
---------------------------

This JavaScript project provides an ActiveRecord-esque API for the Google Gears
SQLite database.

Usage
=====

To manage database schema migrations:

    var migrations = [
      { // version 0
        up: function(c) {
          c.createTable('people', {id: 'INTEGER', name: 'TEXT'});
        },
        down: function(c) {
          c.dropTable('people');
        }
      },
      { // version 1
        up: function(c) {
          c.createTable('addresses', {id: 'INTEGER', person_id: 'INTEGER', address: 'TEXT});
        },
        down: function(c) {
          c.dropTable('addresses');
        }
      }
    ];
    connector = new GearsConnector('test');
    connector.migrate(migrations, 1);

To perform CRUD:

    connector.insert('people', [1, 'Dr Nic']);
    connector.insert('people', [2, 'Ravi Chodavarapu']);
    var person = connector.select('people', {where: ['id=?', 1]});

More information
================

* [Original SVN site](http://code.google.com/p/mechanizations/)
* [Original blog entry by Ravi](http://ravichodavarapu.blogspot.com/2007/07/mechanizations-towards-activerecord-for.html)


Maintainer
==========

Dr Nic Williams, http://drnicwilliams.com, drnicwilliams@gmail.com

Original author
===============

Ravi Chodavarapu, http://ravichodavarapu.blogspot.com