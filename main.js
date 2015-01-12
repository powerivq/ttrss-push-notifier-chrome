'use strict';

function registerCallback(regID) {
  chrome.storage.local.set({registered: regID});
}

function creationCallback(notID) {
  currentNotID = notID;
  setTimeout(function() {
    chrome.notifications.clear(notID, function() {});
  }, timeout * 1000);
}

function updateUnreadCount() {
  if (!url) return;
  $.ajax(url)
    .done(function(data) {
      chrome.browserAction.setBadgeText({text: data});
    })
    .fail(function() {
      chrome.browserAction.setBadgeText({text: ''});
    });
}

function doNotify() {
  var msg = msgList[0];
  chrome.notifications.create('feed-msg' + new Date().toISOString(),
    {
      type: 'basic',
      title: msg.title,
      iconUrl: msg.iconUrl ? msg.iconUrl : 'icon.png',
      priority: 2,
      message: msg.detail,
      contextMessage: msg.source,
      buttons: [
                 {
                   title: 'Open Link'
                 }                          
               ]
    }, creationCallback);
}

var msgList = [];
var timeout = 15;
var paused = false;
var currentNotID = '';
var url = '';

window.onload = function() {
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (var key in changes) {
      if (key === 'timeout') timeout = changes.timeout.newValue;
      if (key === 'paused') {
        paused = changes.paused.newValue;
        chrome.browserAction.setIcon({path: paused ? 'icon_dark.png' : 'icon.png'});
        if (msgList.length && !paused) doNotify();
      }
      if (key === 'url') {
        url = changes.url.newValue;
        updateUnreadCount();
      }
    }
  });
  
  chrome.gcm.onMessage.addListener(function(message) {
    msgList.push(message.data);
    updateUnreadCount();
    if (msgList.length === 1 && !paused) doNotify();
  });
  
  chrome.notifications.onButtonClicked.addListener(function() {
    window.open(msgList[0].url);
    chrome.notifications.clear(currentNotID, function() {});
  });
  
  chrome.notifications.onClicked.addListener(function() {
    window.open(msgList[0].url);
    chrome.notifications.clear(currentNotID, function() {});
  });
  
  chrome.notifications.onClosed.addListener(function() {
    msgList.splice(0, 1);
    if (msgList.length && !paused) doNotify();
  });
  
  chrome.storage.local.get(['paused', 'url', 'registered', 'timeout'], function(result) {
    if (result.paused) {
      paused = true;
      chrome.browserAction.setIcon({path: 'icon_dark.png'});
    }
    if (result.url) {
      url = result.url;
      updateUnreadCount();
    }
    if (result.timeout) timeout = result.timeout;
    if (result.registered) return;
    chrome.gcm.register(senderIds, registerCallback);
  });
  
  setInterval(updateUnreadCount, 60000);
};
