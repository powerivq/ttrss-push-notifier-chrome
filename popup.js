'use strict';

function setPauseStatus(status) {
  if (status) {
    $('#statusBar').text('Paused');
    $('#btnStatus').text('Restart');
  } else {
    $('#statusBar').text('Working');
    $('#btnStatus').text('Pause');
  }
}

window.onload = function() {
  $('#btnChangeTimeout').click(function() {
    var newTimeout = parseInt($('#txtTimeout').val());
    console.log(newTimeout);
    chrome.storage.local.set({timeout: newTimeout});
  });

  $('#btnStatus').click(function() {
    chrome.storage.local.get('paused', function(result) {
      chrome.storage.local.set({paused: !result.paused});
      setPauseStatus(!result.paused);
    });
  });
  
  $('#btnSetUrl').click(function() {
    chrome.storage.local.set({url: $('#txtUrl').val()});
  });
  
  chrome.storage.local.get(['paused', 'url', 'registered', 'timeout'], function(result) {
    setPauseStatus(result.paused);
    $('#txtUrl').val(result.url);
    var regID = result.registered;
    $('#regID').text(regID ? regID : 'Unregistered');
    $('#txtTimeout').val(result.timeout ? result.timeout : 15);
  });  
};
