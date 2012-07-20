// Open Source Initiative OSI - The MIT License (MIT):Licensing
//
// The MIT License (MIT)
// Copyright (c) 2012 DotCloud Inc (opensource@dotcloud.com)
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

var sqlite = require('sqlite3').verbose();
var db = null;

var DEBUG = false;

// Utility functions for constructing queries. Real API is below, move along =)

function dissect(obj) {
    var res = {
        columns : [],
        values : [],
        valuesPlaceholder : '('
    }, first = true;
    for (var i in obj) {
        res.columns.push(i);
        res.values.push(obj[i]);
        res.valuesPlaceholder += (first ? (first = false, '?') : ',?');
    }
    res.valuesPlaceholder += ')';
    return res;
}

function cols(columns) {
    if (Array.isArray(columns)) {
        return columns.join(',');
    }

    res = '';
    var first = true;
    for (var col in columns) {
        res += (first ? (first = false, '') : ',') + col + 
            (columns[col] ? ' AS ' + columns[col] : '');
    }
    return res;
}

function repeat(seq, sep, n) {
    var res = '';
    while (n > 1) {
        if (n % 2 == 1) {
            res += sep + seq;
            n--;
        }
        seq += sep + seq;
        n /= 2;
    }
    return seq + res;
}

/**
 * Init with DB filename, or ':memory:' for in-memory DB, or no argument for 
 * anonymous DB.
 * Needs to be called before anything else.
 * It returns 'this' so that you can write require('wrapper').init()
 */
exports.init = function(dbFile) {
    db = new sqlite.Database(dbFile);
    return this;
}

// Don't shoot yourself in the foot... I can't protect this one against
// injections, but tables are not created upon user input!!!
exports.createTable = function(tblName, columns, cb) {
    var query = 'CREATE TABLE IF NOT EXISTS ' + tblName + ' (';
    var first = true;
    for (var key in columns) {
        var deflt = columns[key]['default'],
            ref = columns[key].ref;
        var columnDec = (first ? (first = false, '') : ',') + key +
            (columns[key].type ? ' ' + columns[key].type : '') +
            (columns[key].primary ? ' PRIMARY KEY' : '') + 
            (columns[key].unique ? ' UNIQUE' : '') +
            (columns[key].notnull ? ' NOT NULL' : '') +
            (deflt ? (' DEFAULT ' + deflt) : '') + 
            (ref ? ' REFERENCES ' + ref : '');
        query += columnDec;
    }
    query += ');';
    
    db.run(query, cb);
}

// Basic CRUD below.

/**
 * insert('Users', { username : 'foo', password : 'bar' }, function(err) { });
 */
exports.insert = function(table, obj, cb) {
    var dissected = dissect(obj);
    var query = 'INSERT INTO ' + table + ' (' + dissected.columns.join(',') + ')' +
        ' VALUES ' + dissected.valuesPlaceholder + ';';
    if (DEBUG) console.log(query, '\n', dissected.values);
    db.run(query, dissected.values, cb);
}

exports.insertAll = function(table, objs, cb) {
    var columns = Object.keys(objs[0]);
    var firstRow = '';
    columns.forEach(function(column) {
        firstRow += (firstRow ? ', ?' : '?') + ' AS ' + column;
    });
    var values = objs.reduce(function(prev, item) {
        for (var i = 0, l = columns.length; i < l; i++) {
            prev.push(item[columns[i]] != undefined ? item[columns[i]] : null);
        }
        return prev;
    }, []);

    var query = 'INSERT INTO ' + table + ' (' + columns.join(',') + ') SELECT ' + firstRow +
        repeat(' UNION SELECT ' + repeat('?', ',', columns.length), '', objs.length) + ';';
    if (DEBUG) console.log(query, '\n', values);
    db.run(query, values, cb);
}

/**
 * update('Users', 'username=?', ['foo'], { username : 'bar' }, function(err) {});
 */
exports.update = function(table, whereClause, whereValues, obj, cb) {
    var dissected = dissect(obj);
    var query = 'UPDATE ' + table + ' SET ';
    for (var i = 0, l = dissected.columns.length; i < l; i++) {
        query += dissected.columns[i] + '=?' + (i < l - 1 ? ',' : '');
    }
    query += ' WHERE ' + whereClause + ';';
    if (DEBUG) console.log(query);
    db.run(query, dissected.values.concat(whereValues), cb);
}
/**
 * remove('Users', 'email IS NULL', null, function(err) {});
 */
exports.remove = function(table, whereClause, whereValues, cb) {
    var query = 'DELETE FROM ' + table + ' WHERE ' + whereClause + ';';
    if (DEBUG) console.log(query);
    db.run(query, whereValues, cb);
}

/**
 * select('Torrents', { 'Users' : 'Users.id=Torrents.UserId' }, null,
 *   'Torrents.UserId=?', [1], function(err, rows) { ... });
 */
exports.select = function(table, joins, columns, whereClause, whereValues, cb, order, limit, distinct) {
    var query = 'SELECT ' + (distinct ? 'DISTINCT ' : '') + 
        (columns ? cols(columns) : '*') + ' FROM ' + table;
    if (joins) {
        for (var table in joins) {
            query += ', ' + table + ' ON ' + joins[table];
        }
    }
    query += ' WHERE ' + whereClause + (order ? ' ORDER BY ' + order : '') +
        (limit ? ' LIMIT ' + limit : '') + ';';
    if (DEBUG) console.log(query, '\n', whereValues);
    db.all(query, whereValues, cb);
}

/**
 * selectOne('Users', null, { 'Users.username': 'name' }, 'name=?', ['bar'],
 *   function(err, row) { });
 */
exports.selectOne = function(table, joins, columns, whereClause, whereValues, cb) {
    var query = 'SELECT ' + (columns ? cols(columns) : '*') + ' FROM ' + table;
    if (joins) {
        for (var table in joins) {
            query += ', ' + table + ' ON ' + joins[table];
        }
    }
    query += ' WHERE ' + whereClause + ';';
    if (DEBUG) console.log(query, '\n', whereValues);
    db.get(query, whereValues, cb);
}

// Shortcut methods for common tasks, using those above.

/**
 * find('Users', 1, function(err, user) { });
 */
exports.find = function(table, id, cb) {
    this.selectOne(table, null, null, 'id=?', [id], cb);
}

/**
 * list('Users', function(err, users) { });
 */
exports.list = function(table, cb) {
    this.select(table, null, null, '1', [], cb);
}

/**
 * Two ways of using this one:
 * updateById('Users', 1, { username : 'foo' }, function(err) {});
 * updateById('Users', { id : 1, username : 'foo' }, function(err) {});
 */
exports.updateById = function(table, id, obj, cb) {
    if (arguments.length == 3) {
        cb = obj;
        obj = id;
        id = obj.id;
    }
    this.update(table, 'id=?', [id], obj, cb);
}

/**
 * removeById('Users', 1, function(err) {});
 */
exports.removeById = function(table, id, cb) {
    this.remove(table, 'id=?', [id], cb);
}

// Just a proxy to the underlying sqlite3 functions.

exports.serialize = function(cb) {
    db.serialize(cb);
}

exports.parallelize = function(cb) {
    db.parallelize(cb);
}

exports.close = function(cb) {
    db.close(cb);
}