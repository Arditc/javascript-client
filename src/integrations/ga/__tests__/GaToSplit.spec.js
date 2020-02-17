/**
 * Unit tests:
 *  DONE-validateIdentities
 *  DONE-defaultFilter
 *  DONE-defaultBuilder
 *  DONE-GaToSplitFactory & SplitTracker: requires GA mock
 */

import tape from 'tape';
import sinon from 'sinon';
import GaToSplit, { validateIdentities, defaultFilter, defaultMapper } from '../GaToSplit';
import { gaMock, gaRemove, modelMock } from './gaMock';

tape('validateIdentities', assert => {
  assert.equal(validateIdentities(undefined), undefined);
  assert.equal(validateIdentities(null), undefined);
  assert.equal(validateIdentities(123), undefined);
  assert.equal(validateIdentities(true), undefined);
  assert.equal(validateIdentities('something'), undefined);
  assert.equal(validateIdentities({}), undefined);
  assert.equal(validateIdentities(/asd/ig), undefined);
  assert.equal(validateIdentities(function () { }), undefined);

  assert.deepEqual(validateIdentities([]), []);
  assert.deepEqual(validateIdentities([undefined, /asd/ig, function () { }]), []);
  assert.deepEqual(validateIdentities([{
    key: 'key', trafficType: 'user' // First occurence of this item
  }, {
    key: 'key', trafficType: function () { } // Invalid item (invalid TT)
  }, {
    key: 'keyu', trafficType: 'ser' // First occurence of this item
  }, {
    key: true, trafficType: 'user' // Invalid item (invalid key)
  }, {
    key: 'key2', trafficType: 'user2' // First occurence of this item
  }, {
    key: 12, trafficType: 'user' // First occurence of this item
  }, {
    key: 'key', trafficType: 'user' // Duplicated item
  },
  {} // Invalid item (undefined key and traffic type)
  ]), [{
    key: 'key', trafficType: 'user'
  }, {
    key: 'keyu', trafficType: 'ser'
  }, {
    key: 'key2', trafficType: 'user2'
  }, {
    key: 12, trafficType: 'user'
  }]);
  assert.end();
});

const hitSample = {
  hitType: 'pageview',
  page: '/path',
};
const eventDataSample = {
  eventTypeId: 'ga-pageview',
  value: undefined,
  properties: { page: hitSample.page },
};

tape('defaultFilter', assert => {
  assert.equal(defaultFilter(modelMock({})), true, 'should return true for any hitType');
  assert.equal(defaultFilter(modelMock(hitSample)), true, 'should return true for any hitType');
  assert.end();
});

tape('defaultMapper', assert => {
  assert.deepEqual(defaultMapper(modelMock(hitSample)),
    eventDataSample,
    'should return the corresponding event data instance for a given pageview hit');

  // @TODO test default mapping for other hitTypes

  assert.end();
});

const sdkOptions = {
  type: 'GA_TO_SPLIT',
};
const coreSettings = {
  key: 'key',
  trafficType: 'user',
};
const fakeStorage = {
  events: {
    track: sinon.stub()
  }
};
function customMapper() {
  return { eventTypeId: 'eventType', value: 1, properties: { someProp: 'someProp' } };
}
function customMapper2() {
  return { eventTypeId: 'eventType2', value: 2, properties: { someProp2: 'someProp2' } };
}
function customFilter() {
  return true;
}
const customIdentities = [{ key: 'key2', trafficType: 'tt2' }];

tape('GaToSplit', assert => {

  const { ga, tracker } = gaMock();

  // provide SplitTracker plugin
  GaToSplit(sdkOptions, fakeStorage, coreSettings);
  assert.true(ga.calledWith('provide', 'splitTracker'));
  let SplitTracker = ga.lastCall.args[2];
  assert.true(typeof SplitTracker === 'function');

  /** Default behavior */

  // init plugin on default tracker. equivalent to calling `ga('require', 'splitTracker')`
  new SplitTracker(tracker);

  // send hit and assert that it was properly tracked as a Split event
  window.ga('send', hitSample);
  let event = fakeStorage.events.track.lastCall.args[0];
  assert.deepEqual(event,
    {
      ...eventDataSample,
      key: coreSettings.key,
      trafficTypeName: coreSettings.trafficType,
      timestamp: event.timestamp,
    }, 'should track an event using the default mapper and key and traffic type from the SDK config');

  /** Custom behavior: plugin options */

  // init plugin with custom options
  new SplitTracker(tracker, { mapper: customMapper, filter: customFilter, identities: customIdentities });

  // send hit and assert that it was properly tracked as a Split event
  window.ga('send', hitSample);
  event = fakeStorage.events.track.lastCall.args[0];
  assert.deepEqual(event,
    {
      ...customMapper(),
      key: customIdentities[0].key,
      trafficTypeName: customIdentities[0].trafficType,
      timestamp: event.timestamp,
    }, 'should track an event using a custom mapper and identity from the plugin options');

  /** Custom behavior: SDK options */

  // provide a new SplitTracker plugin with custom SDK options
  GaToSplit({
    type: 'GA_TO_SPLIT', mapper: customMapper2, filter: customFilter, identities: customIdentities
  }, fakeStorage, coreSettings);
  assert.true(ga.lastCall.calledWith('provide', 'splitTracker'));
  SplitTracker = ga.lastCall.args[2];
  assert.true(typeof SplitTracker === 'function');

  // init plugin
  new SplitTracker(tracker);

  // send hit and assert that it was properly tracked as a Split event
  window.ga('send', hitSample);
  event = fakeStorage.events.track.lastCall.args[0];
  assert.deepEqual(event,
    {
      ...customMapper2(),
      key: customIdentities[0].key,
      trafficTypeName: customIdentities[0].trafficType,
      timestamp: event.timestamp,
    }, 'should track the event using a custom mapper and identity from the SDK options');

  gaRemove();

  assert.end();
});