// Copyright 2011 Joyent, Inc.  All rights reserved.

var ldap = require('ldapjs');
var log4js = require('log4js');
var test = require('tap').test;
var uuid = require('node-uuid');

var schema = require('../lib/schema');



///--- Globals

var Change = ldap.Change;

var SCHEMA;
var SOCKET = '/tmp/.' + uuid();
var SUFFIX = 'dc=unit-test';

var backend;
var client;
var server;



///--- Tests

test('setup', function(t) {
  log4js.setGlobalLogLevel('DEBUG');
  server = ldap.createServer({
    log4js: log4js
  });
  t.ok(server);

  server.add(SUFFIX,
             function(req, res, next) {
               req.schema = SCHEMA;
               return next();
             },
             schema.add,
             function(req, res, next) {
               res.end();
             }
            );

  server.modify(SUFFIX,
                function(req, res, next) {
                  req.entry = {
                    dn: ldap.parseDN(SUFFIX),
                    attributes: {
                      objectclass: ['unittest'],
                      dc: ['foo'],
                      cn: ['bar'],
                      sn: ['moo']
                    }
                  };
                  req.schema = SCHEMA;
                  return next();
                },
                schema.modify,
                function(req, res, next) {
                  res.end();
                }
               );

  server.listen(SOCKET, function() {
    client = ldap.createClient({
      socketPath: SOCKET,
      log4js: log4js
    });
    t.ok(client);
    t.end();
  });
});


test('load schema', function(t) {
  schema.load(__dirname + '/schema', function(err, schema) {
    t.ifError(err);
    t.ok(schema);
    SCHEMA = schema;
    t.end();
  });
});

test('add all ok', function(t) {
  var entry = {
    dc: 'unit-test',
    cn: ['blah', 'blarg'],
    sn: ['snidely', 'whiplash'],
    objectclass: 'unittest'
  };

  client.add(SUFFIX, entry, function(err, res) {
    t.ifError(err);
    t.ok(res);
    t.equal(res.status, 0);
    t.end();
  });
  t.end();
});


test('add missing required', function(t) {
  var entry = {
    cn: ['blah', 'blarg'],
    sn: ['sniedely', 'whiplash'],
    objectClass: 'unittest'
  };

  client.add(SUFFIX, entry, function(err, res) {
    t.ok(err);
    t.ok(err instanceof ldap.ObjectclassViolationError);
    t.end();
  });
  t.end();
});


test('add too many', function(t) {
  var entry = {
    dc: 'unittest',
    cn: ['blah', 'blarg', 'foo', 'bar', 'blarg'],
    sn: ['sniedely', 'whiplash'],
    objectClass: 'unittest'
  };

  client.add(SUFFIX, entry, function(err, res) {
    t.ok(err);
    t.ok(err instanceof ldap.ObjectclassViolationError);
    t.end();
  });
  t.end();
});


test('add extra params', function(t) {
  var entry = {
    dc: 'unittest',
    cn: ['blah'],
    sn: ['sniedely', 'whiplash'],
    foo: 'moo',
    objectClass: 'unittest'
  };

  client.add(SUFFIX, entry, function(err, res) {
    t.ok(err);
    t.ok(err instanceof ldap.ObjectclassViolationError);
    t.end();
  });
  t.end();
});


test('add not strict', function(t) {
  var entry = {
    foo: 'moo',
    objectClass: 'unittestanything'
  };

  client.add(SUFFIX, entry, function(err, res) {
    t.ifError(err);
    t.ok(res);
    t.equal(res.status, 0);
    t.end();
  });
  t.end();
});


test('modify strict ok', function(t) {
  var changes = [];
  changes.push(new Change({
    type: 'add',
    modification: {
      cn: 'bullwinkle'
    }
  }));
  changes.push(new Change({
    type: 'replace',
    modification: {
      dc: 'boo'
    }
  }));
  changes.push(new Change({
    type: 'delete',
    modification: {
      sn: 'moo'
    }
  }));

  client.modify(SUFFIX, changes, function(err, res) {
    t.ifError(err);
    t.ok(res);
    t.equal(res.status, 0);
    t.end();
  });
});


test('modify strict not ok', function(t) {
  var changes = [];
  changes.push(new Change({
    type: 'delete',
    modification: {
      dc: 'foo'
    }
  }));

  client.modify(SUFFIX, changes, function(err, res) {
    t.ok(err);
    t.ok(!res);
    t.ok(err instanceof ldap.ObjectclassViolationError);
    t.end();
  });
});


test('teardown', function(t) {
  client.unbind(function() {
    server.on('close', function() {
      t.end();
    });
    server.close();
  });
});