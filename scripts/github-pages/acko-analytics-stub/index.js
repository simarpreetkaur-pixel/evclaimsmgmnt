'use strict';

// Analytics are intentionally off for the public prototype.
exports.initAckoAnalytics = function initAckoAnalytics() {
  return '';
};
exports.pageEvent = function pageEvent() {};
exports.trackEvent = function trackEvent() {};
exports.waitForAnalyticsLoad = function waitForAnalyticsLoad() {
  return Promise.resolve();
};
