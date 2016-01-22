/* @flow */'use strict';

var Set = require('Immutable').Set;

/*::
  type MySegmentsDTO = Array<string>;
*/
function mySegmentMutationsFactory(mySegments /*: MySegmentsDTO */) /*: Function */{

  return function segmentMutations(storageMutator /*: Function */) /*: void */{
    storageMutator(new Set(mySegments));
  };
}

module.exports = mySegmentMutationsFactory;
//# sourceMappingURL=mySegments.js.map