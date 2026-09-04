const scoreboard = (function () {
  const server = 'ws://scoreboard.local:8080';
  const dataKeyInitDone = 'scoreboard';
  let ws;
  let updateInterval;
  let colorTeamA = '255,0,0';
  let colorTeamB = '0,255,0';

  // Cleanup resources: close websocket and clear intervals
  function cleanup() {
    try {
      if (ws) ws.close();
    } catch (err) {
      // ignore
    }
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  }

  $(window).on('beforeunload', cleanup);

  function _connect() {
    ws = new ReconnectingWebSocket(server);

    ws.onopen = function () {
      updateInterval = setInterval(sendUpdate, 500);
      $('#scoreboardConnectionStatus').css('fill', 'darkgreen');
    };

    ws.onclose = function (event) {
      $('#scoreboardConnectionStatus').css('fill', 'darkred');
    };

    function sendUpdate() {
      let msg = '';
      const match = cockpitStorage.getMatch();
      if (match != null && match.MatchStatus != matchStatus.NotPlayed) {
        const teamAData = {
          score: $('.matchResult .goalsA').data('value'),
          color: colorTeamA
        };

        const teamBData = {
          score: $('.matchResult .goalsB').data('value'),
          color: colorTeamB
        };

        if ($('#switchteams').prop('checked')) {
          msg += `ScoreL=${teamBData.score};ColorL=${teamBData.color};`;
          msg += `ScoreR=${teamAData.score};ColorR=${teamAData.color};`;
        } else {
          msg += `ScoreL=${teamAData.score};ColorL=${teamAData.color};`;
          msg += `ScoreR=${teamBData.score};ColorR=${teamBData.color};`;
        }

        msg += `Time=${cockpitClock.getClockDetails().secondsRemaining};`;
        msg += `Shotclock=${cockpitClock.getClockDetails().shotClockRemaining};`;

        if (ws != null && ws.readyState == 1) {
          ws.send(msg);
        }

        // for testing
        //console.log(msg);
      }
    }
  }

  function _hexToRgbString(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) : null;
  }

  // Safely trigger a click on a target. Accepts a DOM element, a jQuery object, or a selector.
  // Tries to call the native `click()` on the first element and falls back to jQuery's `trigger('click')`.
  function safeClick(target) {
    if (!target) return;
    var $el = (target instanceof jQuery) ? target : $(target);
    if (!$el || $el.length === 0) return;
    var dom = $el[0];
    try {
      if (typeof dom.click === 'function') {
        dom.click();
        return;
      }
    } catch (err) {
      // fall through to jQuery trigger
    }
    $el.trigger('click');
  }

  function _init() {
    $('.leftSide .teamName').append('<input type="color" class="colorPicker" id="changeColorTeamA" value="#ff0000"/>');
    $('.rightSide .teamName').append('<input type="color" class="colorPicker" id="changeColorTeamB" value="#00ff00"/>');
    $(document).on('change', '#changeColorTeamA', function (event) {
      colorTeamA = _hexToRgbString(event.target.value);
    });
    $(document).on('change', '#changeColorTeamB', function (event) {
      colorTeamB = _hexToRgbString(event.target.value);
    });
    
    $(document).on('click', '#waitButton', function (event) {
      colorTeamA = '255,0,0';
      colorTeamB = '0,255,0';
      $('#changeColorTeamA').value = '#ff0000';
      $('#changeColorTeamB').value = '#00ff00';
    });

    // Keyboard shortcuts:
    // - Space: start/time-out/resume
    // - Enter: refresh shotclock
    // - Plus (`+`): play/pause of shotclock

    $(document).on('keydown', function (e) {
      const key = e.which || e.keyCode;

      const active = document.activeElement;
      // Don't trigger when typing in inputs, textareas or contenteditable elements
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

      // Space: trigger match control button click
      if (key === 32) { // 32 = Space
        const btn = $('#matchControlButton');
        if (btn.length === 0) return;
        e.preventDefault();
        safeClick(btn);
        return;
      }

      // Enter: trigger visible .fa-refresh
      if (key === 13 || e.key === 'Enter') { // 13 = Enter
        e.preventDefault();
        const refresh = $('.fa-refresh:visible').first();
        if (refresh.length > 0) {
          safeClick(refresh);
          return;
        }
      }

      // Plus: trigger visible shot clock play/pause child (.fa-play or .fa-pause)
      // Handle '+': e.key === '+' or key codes (187 with Shift, 107 on numpad)
      if (e.key === '+' || (key === 187 && e.shiftKey) || key === 107) {
        e.preventDefault();
        const playChild = $('.shotClock').has('.fa-play:visible').find('.fa-play:visible').first();
        const pauseChild = $('.shotClock').has('.fa-pause:visible').find('.fa-pause:visible').first();
        let el = null;
        if (playChild.length > 0) el = playChild[0];
        else if (pauseChild.length > 0) el = pauseChild[0];

        if (!el) return;
        safeClick(el);
        return;
      }
    });

    $('#connectivityIndicator .container').append(
      `<div id="scoreboardConnectionStatus" class="scoreboardConnectionStatus knlTopMenu knlTopMenuSmall hidden-xs hidden-inApp" title="${getConnectionStatusLabel()}"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"> <path d="M176 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h16V98.4C92.3 113.8 16 200 16 304c0 114.9 93.1 208 208 208s208-93.1 208-208c0-41.8-12.3-80.7-33.5-113.2l24.1-24.1c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L355.7 143c-28.1-23-62.2-38.8-99.7-44.6V64h16c17.7 0 32-14.3 32-32s-14.3-32-32-32H224 176zm72 192V320c0 13.3-10.7 24-24 24s-24-10.7-24-24V192c0-13.3 10.7-24 24-24s24 10.7 24 24z" /> </svg> </div>`
    );
    $('#connectivityIndicator .container').append(
      `<div class="knlTopMenu"><label><input type="checkbox" id="switchteams" /><span id="switchLabel">${getSwitchTeamsLabel()}</span></label></div>`
    );

    const finishConfirmDialog = `<div id="confirm-finish" title="${getConfirmDialogText()}">`;
    $('body').append(finishConfirmDialog);

    afterViewUpdate();
    if (typeof cockpitUiHelper !== 'undefined') {
      // Attach function to UI helper, so we can update the UI on every view change
      cockpitUiHelper.viewUpdateExternalCallback = afterViewUpdate;
    }
  }

  function afterViewUpdate() {
    const sideSwitcher = $('#mainSection .sideSwitcher');
    // Only init side switcher, when there is one and it's not already been initialized
    if (sideSwitcher.length > 0 && sideSwitcher.data(dataKeyInitDone) !== true) {
      sideSwitcher.data(dataKeyInitDone, true).on('click', function () {
        $('#switchteams').click();
      });
    }

    const oldMcb = $('#mainSection #matchControlButton');
    // Replace match control button, when there is one and it's not already been replaced
    if (oldMcb.length > 0 && oldMcb.data(dataKeyInitDone) !== true) {
      sideSwitcher.data(dataKeyInitDone, true);
      const newMcb = oldMcb.clone();
      oldMcb.replaceWith(newMcb);
    
      newMcb.data(dataKeyInitDone, true).on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    
        if (cockpitStorage.getMatch().MatchStatus != matchStatus.Preliminary) {
          kayakers.cpt.cockpit.updateMatchStatus(e);
        } else {
          $('#confirm-finish').dialog({
            resizable: false,
            height: 'auto',
            width: 400,
            modal: true,
            buttons: {
              Continue: function () {
                $(this).dialog('close');
                kayakers.cpt.cockpit.updateMatchStatus(e);
              },
              Cancel: function () {
                $(this).dialog('close');
              }
            }
          });
        }
      });
    }
  }

  const me = {
    connect: _connect,
    init: _init,
  };
  return me;
})();

scoreboard.connect();
scoreboard.init();
