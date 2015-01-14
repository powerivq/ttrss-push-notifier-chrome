'use strict';

function registerCallback(regID) {
  chrome.storage.local.set({registered: regID});
}

function creationCallback(notID) {
  chrome.notifications.getAll(function(result) {
    if (result[notID] === undefined) {
      if (!paused && msgList.length) doNotify();
    }
  });

  currentNotID = notID;
  setTimeout(function() {
    chrome.notifications.clear(notID, function() {});
  }, timeout * 1000);
}

function updateUnreadCount() {
  if (!url || !username) return;
  $.ajax(url + 'public.php?op=getUnread&login=' + username)
    .done(function(data) {
      chrome.browserAction.setBadgeText({text: data});
    })
    .fail(function() {
      chrome.browserAction.setBadgeText({text: ''});
    });
}

function doNotify() {
  var msg = msgList.splice(0,1)[0];
  var options =
  {
    type: 'basic',
    title: msg.title,
    iconUrl: 'icon.png',
    priority: 2,
    message: msg.detail,
    contextMessage: msg.source,
    buttons: [
               { title: 'Open Link' }, { title: 'Flag as Read' }                        
             ]
  };
  $.ajax(msg.iconUrl ? msg.iconUrl : 'NOT_HERE')
   .done(function() {
      options.iconUrl = msg.iconUrl;
      chrome.notifications.create(msg.url, options, creationCallback);
   })
   .fail(function() {
      chrome.notifications.create(msg.url, options, creationCallback);
   });
}

function clickBtn(notID, index) {
  flagAsRead(notID);
  if (index == 0) window.open(notID);
  chrome.notifications.clear(notID, function() {});
}

function flagAsRead(notID) {
  $.ajax({
    url: url + 'plugins/zzz_ttrss_push_notifier/flag.php',
    type: 'POST',
    data: {url: notID, user: username, reg_id: regid}
  }).done(function(data){console.log('resp: '+data);}).fail(function(){console.log('noway');});
}

var msgList = [];
var timeout = 15;
var paused = false;
var currentNotID = '';
var url = '';
var username = '';
var regid = '';

window.onload = function() {
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    var update = false;
    for (var key in changes) {
      if (key === 'timeout') timeout = changes.timeout.newValue;
      if (key === 'paused') {
        paused = changes.paused.newValue;
        chrome.browserAction.setIcon({path: paused ? 'icon_dark.png' : 'icon.png'});
        if (msgList.length && !paused) doNotify();
      }
      if (key === 'url') {
        url = changes.url.newValue;
        update = true;
      }
      if (key === 'username') {
        username = changes.username.newValue;
        update = true;
      }
    }
    if (update) updateUnreadCount();
  });
  
  chrome.gcm.onMessage.addListener(function(message) {
    msgList.push(message.data);
    updateUnreadCount();
    if (msgList.length === 1 && !paused) doNotify();
  });
  
  chrome.notifications.onButtonClicked.addListener(clickBtn);
  
  chrome.notifications.onClicked.addListener(function(notID) {
    clickBtn(notID, 0);
  });
  
  chrome.notifications.onClosed.addListener(function(notID, byUser) {
    if (msgList.length && !paused) doNotify();
  });
  
  chrome.storage.local.get(['paused', 'url', 'username', 'registered', 'timeout'], function(result) {
    if (result.paused) {
      paused = true;
      chrome.browserAction.setIcon({path: 'icon_dark.png'});
    }
    if (result.url) url = result.url;
    if (result.username) username = result.username;
    updateUnreadCount();
    if (result.timeout) timeout = result.timeout;
    if (result.registered) {
      regid = result.registered; return;
    }
    chrome.gcm.register(senderIds, registerCallback);
  });
  
  setInterval(updateUnreadCount, 60000);
};
