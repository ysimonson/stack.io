var db = require('./sqlite-wrapper');

module.exports = function(dbName) {
    db.init(dbName);

    var schema = {
        groups: {
            id: { type: 'INTEGER', primary: true },
            name: { type: 'TEXT', unique: true }
        },
        user_groups: {
            group_id: { type: 'INTEGER', ref: 'groups' },
            user_id: { type: 'INTEGER', ref: 'users' }
        },
        users: {
            id: { primary: true, type: 'INTEGER' },
            username: { unique: true, type: 'TEXT', notnull: true },
            password_hash: { type: 'TEXT', notnull: true }
        },
        permissions: {
            id: { type: 'INTEGER', primary : true },
            group_id: { ref: 'groups', type: 'INTEGER' },
            service: { type: 'TEXT' },
            method: { type: 'TEXT' }
        }
    }

    for (var table in schema) {
        console.log('Creating ' + table);
        
        db.createTable(table, schema[table], function(err) {
            err && console.log(err);
        });
    }
};