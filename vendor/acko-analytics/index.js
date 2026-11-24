'use strict';

/**
 * Local drop-in replacement for @acko-tech/building-blocks.ui.acko-analytics.
 * Implements the subset of the API this app uses on top of Segment analytics.js.
 */

function getAnalytics() {
  if (typeof window === 'undefined') return undefined;
  return window.analytics;
}

/** Returns an inline script string that bootstraps Segment analytics.js. */
function initAckoAnalytics(anonymousId, writeKey) {
  var key = JSON.stringify(String(writeKey || ''));
  var anonId = JSON.stringify(String(anonymousId || ''));
  return (
    '!function(){var i="analytics",analytics=window[i]=window[i]||[];if(!analytics.initialize){if(analytics.invoked){return}' +
    'analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","screen","once","off","on","addSourceMiddleware","addIntegrationMiddleware","setAnonymousId","addDestinationMiddleware","register"];' +
    'analytics.factory=function(e){return function(){var t=Array.prototype.slice.call(arguments);t.unshift(e);analytics.push(t);return analytics}};' +
    'for(var n=0;n<analytics.methods.length;n++){var key=analytics.methods[n];analytics[key]=analytics.factory(key)}' +
    'analytics.load=function(key,n){var t=document.createElement("script");t.type="text/javascript";t.async=!0;' +
    't.src="https://cdn.segment.com/analytics.js/v1/"+key+"/analytics.min.js";var r=document.getElementsByTagName("script")[0];' +
    'r.parentNode.insertBefore(t,r);analytics._loadOptions=n};analytics._writeKey=' + key + ';analytics.SNIPPET_VERSION="5.2.0";' +
    'if(' + anonId + ')analytics.setAnonymousId(' + anonId + ');analytics.load(' + key + ');}}();'
  );
}

/** Resolves once analytics.js has loaded (or after a timeout, so callers never hang). */
function waitForAnalyticsLoad(timeoutMs) {
  var limit = typeof timeoutMs === 'number' ? timeoutMs : 10000;
  return new Promise(function (resolve) {
    var analytics = getAnalytics();
    if (!analytics || typeof analytics.ready !== 'function') {
      resolve();
      return;
    }
    var done = false;
    var finish = function () {
      if (!done) {
        done = true;
        resolve();
      }
    };
    setTimeout(finish, limit);
    analytics.ready(finish);
  });
}

function trackEvent(eventName, properties) {
  var analytics = getAnalytics();
  if (analytics && typeof analytics.track === 'function') {
    analytics.track(eventName, properties || {});
  }
}

function pageEvent(eventName, properties) {
  var analytics = getAnalytics();
  if (analytics && typeof analytics.page === 'function') {
    analytics.page(eventName, properties || {});
  }
}

module.exports = {
  initAckoAnalytics: initAckoAnalytics,
  waitForAnalyticsLoad: waitForAnalyticsLoad,
  trackEvent: trackEvent,
  pageEvent: pageEvent,
};
