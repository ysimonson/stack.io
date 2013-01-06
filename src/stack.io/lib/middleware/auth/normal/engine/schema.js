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

var dbModule = require('sqlite-wrapper');

module.exports = function(dbName, errorCallback, finishCallback) {
    var db = dbModule(dbName);

    var schema = {
        groups: {
            id: { type: 'INTEGER', primary: true, notnull: true },
            name: { type: 'TEXT', unique: true, notnull: true }
        },
        user_groups: {
            group_id: { type: 'INTEGER', ref: 'groups', notnull: true },
            user_id: { type: 'INTEGER', ref: 'users', notnull: true }
        },
        users: {
            id: { primary: true, type: 'INTEGER', notnull: true },
            username: { unique: true, type: 'TEXT', notnull: true },
            password_hash: { type: 'TEXT', notnull: true }
        },
        permissions: {
            id: { type: 'INTEGER', primary: true, notnull: true },
            group_id: { ref: 'groups', type: 'INTEGER', notnull: true },
            service: { type: 'TEXT', notnull: true },
            method: { type: 'TEXT', notnull: true }
        }
    };

    var createdCount = 0;

    var callback = function(err) {
        if(err) errorCallback(err);
        createdCount++;
        if(createdCount == 4) finishCallback();
    };

    for (var table in schema)
        db.createTable(table, schema[table], callback);
};
