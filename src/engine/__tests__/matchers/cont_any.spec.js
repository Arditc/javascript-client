/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/
'use strict';

const tape = require('tape-catch');
const matcherTypes = require('../../matchers/types').enum;
const matcherFactory = require('../../matchers');

tape('MATCHER CONTAINS_ANY_OF_SET / should return true ONLY when value contains any of set ["update", "add"]', function (assert) {

  let matcher = matcherFactory({
    negate: false,
    type: matcherTypes.CONTAINS_ANY_OF_SET,
    value: ['update', 'add']
  });

  assert.true(matcher(['update', 'add']),           '["update", "add"] contains any of set ["update", "add"]');
  assert.true(matcher(['rename', 'add', 'delete']), '["rename", "add", "delete"] contains any of set ["update", "add"]');
  assert.true(matcher(['update']),                  '["update"] contains any of set ["update", "add"]');
  assert.true(matcher(['add', 'create']),           '["add", "create"] contains any of set ["update", "add"]');
  assert.true(matcher(['add']),                     '["add"] contains any of set ["update", "add"]');
  assert.false(matcher(['rename']),                 '["rename"] does not contain any of set ["update", "add"]');
  assert.false(matcher(['rename', 'admin']),        '["rename", "admin"] does not contain any of set ["update", "add"]');
  assert.end();

});

tape('MATCHER CONTAINS_ANY_OF_SET / negate should return false when the expected return value is true', function (assert) {

  let matcher = matcherFactory({
    negate: true,
    type: matcherTypes.CONTAINS_ANY_OF_SET,
    value: ['update', 'add']
  });

  assert.false(matcher(['update', 'add']),           'NOT ["update", "add"] contains any of set ["update", "add"]');
  assert.false(matcher(['rename', 'add', 'delete']), 'NOT ["rename", "add", "delete"] contains any of set ["update", "add"]');
  assert.false(matcher(['update']),                  'NOT ["update"] contains any of set ["update", "add"]');
  assert.false(matcher(['add', 'create']),           'NOT ["add", "create"] contains any of set ["update", "add"]');
  assert.false(matcher(['add']),                     'NOT ["add"] contains any of set ["update", "add"]');
  assert.true(matcher(['rename']),                   'NOT ["rename"] does not contain any of set ["update", "add"]');
  assert.true(matcher(['rename', 'admin']),          'NOT ["rename", "admin"] does not contain any of set ["update", "add"]');
  assert.end();
});
