import logFactory from '../../utils/logger';
import { uniq } from '../../utils/lang';
import { SPLIT_IMPRESSION, SPLIT_EVENT } from '../../utils/constants';
const log = logFactory('splitio-split-to-ga');

class SplitToGa {

  // Default mapper function.
  static defaultMapper({ type, payload }) {
    switch (type) {
      case SPLIT_IMPRESSION:
        return {
          hitType: 'event',
          eventCategory: 'split-impression',
          eventAction: 'Evaluate ' + payload.impression.feature,
          eventLabel: 'Treatment: ' + payload.impression.treatment + '. Targeting rule: ' + payload.impression.label + '.',
          nonInteraction: true,
          splitHit: true,
        };
      case SPLIT_EVENT:
        return {
          hitType: 'event',
          eventCategory: 'split-event',
          eventAction: payload.eventTypeId,
          eventValue: payload.value,
          nonInteraction: true,
          splitHit: true,
        };
    }
    return null;
  }

  // Util to access ga command queue, accounting for the possibility that it has been renamed.
  static getGa() {
    return typeof window !== 'undefined' ? window[window['GoogleAnalyticsObject'] || 'ga'] : undefined;
  }

  /**
   * Validates if a given object is a UniversalAnalytics.FieldsObject instance, and logs a warning if not.
   * It checks that the object contains a `hitType`, since it is the minimal field required to send the hit
   * and avoid the GA error `No hit type specified. Aborting hit.`.
   * Other validations (e.g., an `event` hitType must have a `eventCategory` and `eventAction`) are handled
   * and logged (as warnings or errors depending the case) by GA debugger, but the hit is sent anyway.
   *
   * @param {UniversalAnalytics.FieldsObject} fieldsObject object to validate.
   * @returns {boolean} Whether the data instance is a valid FieldsObject or not.
   */
  static validateFieldsObject(fieldsObject) {
    if (fieldsObject && fieldsObject.hitType)
      return true;

    log.warn('your custom mapper returned an invalid FieldsObject instance. It must be an object with at least a `hitType` field.');
    return false;
  }

  constructor(options) {

    // Check if `ga` object is available
    if (typeof SplitToGa.getGa() !== 'function') {
      log.warn('`ga` command queue not found. No hits will be sent.');
      // Return an empty object to avoid creating a SplitToGa instance
      return {};
    }

    this.trackerNames = SplitToGa.defaultTrackerNames;

    if (options) {
      if (typeof options.filter === 'function') this.filter = options.filter;
      if (typeof options.mapper === 'function') this.mapper = options.mapper;
      // We strip off duplicated values if we received a `trackerNames` param.
      // We don't warn if a tracker does not exist, since the user might create it after the SDK is initialized.
      // Note: GA allows to create and get trackers using a string or number as tracker name, and does nothing if other types are used.
      if (Array.isArray(options.trackerNames)) this.trackerNames = uniq(options.trackerNames);
    }

    log.info('Started Split-to-GA integration');
  }

  queue(data) {

    const ga = SplitToGa.getGa();
    if (ga) {

      let fieldsObject;
      try { // only try/catch filter and mapper, which might be defined by the user
        // filter
        if (this.filter && !this.filter(data))
          return;

        // map data into a FieldsObject instance
        fieldsObject = SplitToGa.defaultMapper(data);
        if (this.mapper) {
          fieldsObject = this.mapper(data, fieldsObject);
          // don't send the hit if it is falsy or invalid
          if (!fieldsObject || !SplitToGa.validateFieldsObject(fieldsObject))
            return;
        }
      } catch (err) {
        log.warn(`SplitToGa queue method threw: ${err}. No hit was sent.`);
        return;
      }

      // send the hit
      this.trackerNames.forEach(trackerName => {
        const sendCommand = trackerName ? `${trackerName}.send` : 'send';
        // access ga command queue via `getGa` method, accounting for the possibility that
        // the global `ga` reference was not yet mutated by analytics.js.
        ga(sendCommand, fieldsObject);
      });
    }
  }

}

// A falsy object represents the default tracker
SplitToGa.defaultTrackerNames = [''];

export default SplitToGa;