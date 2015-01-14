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

function verifyStatus() {
  chrome.storage.local.get(['url', 'registered'], function(result) {
    $.ajax({
      url: result.url + 'plugins/zzz_ttrss_push_notifier/flag.php',
      type: 'POST',
      data: {test_regid: result.registered}
    })
     .done(function(data) {
      $('#checkBar').text(data == 'ok' ? ', Server OK' : ', Error: need config');
    })
     .fail(function() {
      $('#checkBar').text(', Cannot connect: check URL');
    });
  });
}

window.onload = function() {
  $('#btnStatus').click(function() {
    chrome.storage.local.get('paused', function(result) {
      chrome.storage.local.set({paused: !result.paused});
      setPauseStatus(!result.paused);
    });
  });
  
  $('#apply').click(function() {
    chrome.storage.local.set({timeout: parseInt($('#txtTimeout').val()),
                              url: $('#txtUrl').val(),
                              username: $('#txtUsername').val()
                             });
    verifyStatus();
  });
  
  chrome.storage.local.get(['paused', 'url', 'username', 'registered', 'timeout'], function(result) {
    setPauseStatus(result.paused);
    $('#txtUrl').val(result.url);
    $('#txtUsername').val(result.username);
    var regID = result.registered;
    $('#regID').text(regID ? regID : 'Unregistered');
    $('#txtTimeout').val(result.timeout ? result.timeout : 15);
  });
  verifyStatus();
};
