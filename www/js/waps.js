// ============================================================================
//  Properties
// ============================================================================

var _service_root      = 'http://waps.commissionaires.ab.ca/';
var _version           = '1.2.8';
var _button_reference  = null;

function splash_timer()
{
	setTimeout(function() {
		try
		{
			$.mobile.changePage('#main_page',{
				reverse    : false,
				changeHash : false
			});
		}
		catch (e)
		{
			splash_timer();
		}
	}, 2000);
}

function start_the_app()
{
    security_check(splash_timer, function() {
        console.log('security check failed');
    });

	window.plugins.insomnia.keepAwake();

	if ('' == WAPS.worker_phone)
	{
		window.plugins.sim.getSimInfo(
			function(result) {
				WAPS.worker_phone = result.phoneNumber.substr(result.phoneNumber.length - 10);
				Settings.save({'worker_phone' : WAPS.worker_phone});

				$('#phone_number').val(Utils.Format.toPhoneNumber(WAPS.worker_phone));
			},
			function(error) {
				console.log(error);
			}
		);
	}
}

$(document).bind('ready_state', function(e, log_buffer) {

    $.each(log_buffer, function(i, e)
    {
        Utils.Log.debug(e);
    });

	Utils.Log.debug('ready_state triggered');

	//region - Page Initializers

	$('div[data-role="page"]:not(#splash_page, #console_page)').off('pagebeforeshow').on('pagebeforeshow', function(e, data)
    {
		Utils.Log.debug('pagebeforeshow triggered');

		var page = $(this);

		security_check(function()
        {
			page.trigger('securitycheckpassed');
            WAPS.doTimedStuff();
		}, function()
        {
			$.mobile.changePage('#login_page', {
				reverse    : false,
				changeHash : false
			});
		});
	});

	$('#main_page').off('securitycheckpassed').on('securitycheckpassed', function() {
		Utils.Log.debug('showing home page');
		WAPS.updateMainPageUI();
	});

	$('#audio_page').off('securitycheckpassed').on('securitycheckpassed', function() {
		Utils.Log.debug('showing audio page');
		WAPS.updateAudioPageUI();
	});

	$('#setup_page').off('securitycheckpassed').on('securitycheckpassed', function() {
		Utils.Log.debug('showing setup page');
		$('#callback_minutes').val(WAPS.callback_minutes).slider('refresh');
        $('#warning_minutes').val(WAPS.warning_minutes).slider('refresh');
		$('#callback_number').val(Utils.Format.toPhoneNumber(WAPS.callback_number));
	});

	$('#setup_page').off('pagebeforehide').on('pagebeforehide', function() {

		Utils.Log.debug('leaving setup page');
		WAPS.callback_minutes = $('#callback_minutes').val();
        WAPS.warning_minutes = $('#warning_minutes').val();

		// the callback number
		var cn = Utils.Clean.stripNonNumeric($('#callback_number').val());
		if (cn != WAPS.callback_number) {
			WAPS.callback_number = cn;
			WAPS.call('setLastCallbackNumber', [WAPS.worker_id, WAPS.callback_number], function() {
				Utils.Log.debug('setLastCallbackNumber called with new number');
				Settings.save({'callback_number' : WAPS.callback_number});
				Utils.Log.debug('callback number saved');
			});
		}
		Settings.save({
            'callback_minutes' : WAPS.callback_minutes,
            'warning_minutes' : WAPS.warning_minutes
        });
		Utils.Log.debug('callback minutes saved');
	});

	$('#login_page').off('pagebeforeshow').on('pagebeforeshow', function() {
		Utils.Log.debug('showing login page');
		$('#phone_number').val(Utils.Format.toPhoneNumber(WAPS.worker_phone));
		if (typeof device == 'undefined') {
			$('#cor_version').html(' ');
		} else {
			$('#cor_version').html(' '+device.cordova);
		}
		$('#app_version').html('ver. '+_version);
		//XXX: TESTING
		$('#root').val(_service_root)
		//XXX: TESTING
	});

	$('#console_page').off('pagebeforeshow').on('pagebeforeshow', function() {
		Utils.Log.debug('showing console page');
		$('#console_area').html(Utils.Log.getBuffer());
	});

    //endregion

    //region - Buttons -

    $('#splash_page').off('click').on('click', function(event, ui) {
        $.mobile.changePage('#main_page', {
            reverse    : false,
            changeHash : false
        });
    });

	$('a#mon_start, a#mon_update').off('click').on('click', function(event, ui) {
		_button_reference = $('a#mon_start, a#mon_update');

		UI.disableButton(_button_reference);
		WAPS.checkIn();
	});

	$('a#mon_end').off('click').on('click', function(event, ui) {
		// get the user to enter their PIN
		$.mobile.changePage("#enter_pin");
	});

	$('#end_mon_confirm').off('click').on('click', function(event, ui) {
		_button_reference = $('#end_mon_cancel');
		UI.disableButton(_button_reference);

		WAPS.call('getworkerpin', [WAPS.worker_id], function(result) {
			// false would mean that the PIN could not be retrieved
			if (true != result.success) {
				UI.alert('PIN could not be found');
				return;
			}
			var pin = Utils.Clean.stripWhitespace($('#security_check_pin').val());
			pin = Utils.Hash.sha1(pin);
			$('#security_check_pin').val('');
			// here we compare the two
			if (result.value != pin) {
				UI.alert('PIN is incorrect');
				return;
			}
			WAPS.call('setWorkerStatus', [WAPS.worker_id, WAPS.STATUS_NONE, 0], function(result) {
				$.mobile.changePage('#main_page',{
					reverse    : false,
					changeHash : false
				});
				WAPS.updateMainPageUI();
			});
		});
	});

	$('#end_mon_cancel').off('click').on('click', function(event, ui) {
		$('#security_check_pin').val('');
		$.mobile.changePage('#main_page',{
			reverse    : false,
			changeHash : false
		});
	});

	$('a#mon_emergency').off('click').on('click', function(event, ui) {
		_button_reference = $('a#emergency');
		UI.disableButton(_button_reference);
		WAPS.call('setWorkerStatus', [WAPS.worker_id, WAPS.STATUS_SILENT_ALARM, 0], function(result) {
			WAPS.updateMainPageUI();
		});
	});

	$('a#play_name').off('click').on('click', function(event, ui) {
        event.preventDefault();
        event.stopPropagation();
		WAPS.call('nameRecordingURI', [WAPS.worker_id], function(result) {
			if (true == result.success) {
                Utils.Audio.play(result.value);
			}
		});
	});

	$('a#play_message').off('click').on('click', function(event, ui) {
		WAPS.call('messageRecordingURI', [WAPS.worker_id], function(result) {
			if (true == result.success) {
				Utils.Audio.play(result.value);
			}
		});
	});

	$('a#record_name').off('click').on('click', function(event, ui) {
		Utils.Audio.record(3, function(path) {
			var uri = _service_root + 'services/phoneservices/upload_audio/';
			$.mobile.showPageLoadingMsg('b', 'Uploading audio file...');
			Utils.Upload.audio(uri, path, { user: WAPS.worker_id, type : 'name' },
				function() {
					$.mobile.hidePageLoadingMsg();
					UI.info('Audio uploaded successfully!');
					WAPS.updateAudioPageUI();
				},
				function() {
					$.mobile.hidePageLoadingMsg();
					UI.alert('Audio upload failed!');
					WAPS.updateAudioPageUI();
				}
			);
		});
	});

	$('a#record_message').off('click').on('click', function(event, ui) {
		Utils.Audio.record(10, function(path) {
			var uri = _service_root + 'services/phoneservices/upload_audio/';
			$.mobile.showPageLoadingMsg('b', 'Uploading audio file...');
			Utils.Upload.audio(uri, path, { user: WAPS.worker_id, type : 'message' },
				function() {
					WAPS.updateAudioPageUI();
					$.mobile.hidePageLoadingMsg();
				},
				function() {
					WAPS.updateAudioPageUI();
					$.mobile.hidePageLoadingMsg();
				}
			);
		});
	});

	$('a#logout').off('click').on('click', function(event, ui) {
		_button_reference = $('a#logout');

		UI.disableButton(_button_reference);

		clearTimeout(WAPS._timer);

		WAPS.worker_id = null;
		Settings.save({'worker_id' : WAPS.worker_id});

		$.mobile.changePage('#login_page', {
			reverse    : false,
			changeHash : false
		});
	});

	$('a#login').off('click').on('click', function(event, ui) {
		var login_button = $(this);
		var number = Utils.Clean.stripNonNumeric($('#phone_number').val());
		var pin    = Utils.Clean.stripWhitespace($('#pin').val());
		$('#pin').val('');

		UI.disableButton(login_button);

		_service_root = $('#root').val();
		//make sure it ends in a slash
		if ('/' != _service_root.charAt(_service_root.length - 1))
		{
			_service_root = _service_root + '/';
		}
		Settings.save({
			'service_root' : _service_root
		});

		WAPS.login(number, pin, function()
        {
			UI.enableButton(login_button);

			$.mobile.changePage('#main_page',{
				reverse    : false,
				changeHash : false
			});
		}, function()
        {
			UI.enableButton(login_button);
			UI.alert('Login Failed!<br /><br />Please make sure the phone number and PIN are correct and log in again.<br /><br />If you have not set a PIN, please do so in the main WAPS application. Ask your administrator if you need assistance.');
		});
	});

    //endregion

    start_the_app();

}); // end @ $(document).bind('ready_state', function() {

//region - WAPS

var TimedProcedure = function(name, interval, action) {
    return {
        last_run: Date.now(),
        name: name,
        interval: interval,
        action: action
    };
};

var WAPS = {

// ============================================================================
//  Properties
// ============================================================================

	STATUS_NONE          : 0,
	STATUS_CALLBACK      : 1,
	STATUS_GRACE         : 2,
	STATUS_EMERGENCY     : 3,
	STATUS_ACKNOWLEDGED  : 4,
	STATUS_SILENT_ALARM  : 5,
    STATUS_AUTO_CALLBACK : 0x21,
    STATUS_AUTO_CHECKOUT : 0x22,

	worker_id      : null,
	worker_pin     : null,
	worker_phone   : null,

	status : null,
    old_status : null,
	callback_timestamp : 0,
	callback_minutes : 15,
    warning_minutes : 2,
	callback_number : '',
    shift_end_timestamp : 0,

	_auth_hash      : null,
	_post_data      : null,
    _annoying_alarm : null,
    _timer          : null,

    timedProcedures : [
        TimedProcedure('GPS Update', 120000, function()
        {
            Utils.GPS.tryToUpdateTheServerWithOurLocation(WAPS.worker_id);
        }),
        TimedProcedure('Update Status', 5000, function()
        {
            WAPS.updateStatusScreen();
        }),
        TimedProcedure('Update Time Remaining', 1000, function(now, last_run)
        {
            WAPS.updateCallbackTimeRemaining();

            if (WAPS.status == WAPS.STATUS_CALLBACK || WAPS.status == WAPS.STATUS_AUTO_CALLBACK)
            {
                var warning_timestamp = WAPS.callback_timestamp - (WAPS.warning_minutes * 60000);

                if (last_run < warning_timestamp && warning_timestamp < now)
                {
					console.log(last_run, warning_timestamp, now);
                    WAPS.annoy();
                }
            }
        })
    ],

// ============================================================================
//  Public Methods
// ============================================================================

	/**
	 *
	*/
	login: function(phone_number, pin, success, fail)
    {
		// hash the pin
		pin = Utils.Hash.sha1(pin);
		// remember authentication information
		WAPS._auth_hash = Utils.Encode.base64(':'+pin+':'+phone_number);
		// first - get the worker ID from the phone number
		WAPS.call('getworkerid', [phone_number], function(result) {
			if (true != result.success) {
				WAPS._handleError('WAPS.login() - phone number was not found', fail);
				return;
			}
			// remember the phone number and worker ID
			WAPS.worker_phone = phone_number;
			WAPS.worker_id = parseInt(result.value);
			// compare the PIN entered with the stored hash
			WAPS.call('getworkerpin', [WAPS.worker_id], function(result) {
				// false would mean that the PIN could not be retrieved
				if (true != result.success) {
					WAPS._handleError('WAPS.login() - PIN could not be found', fail);
					return;
				}
				// here we compare the two
				if (result.value != pin) {
					WAPS._handleError('WAPS.login() - PIN is incorrect', fail);
					return;
				}
				// remember the PIN hash
				WAPS.worker_pin = result.value;
				// do we have a callback number
				WAPS.call('getlastcallbacknumber', [WAPS.worker_id], function(result) {
					// we got one!
					if (true == result.success) {
						WAPS.callback_number = result.value;
					}
					if ('' == WAPS.callback_number) {
						WAPS.callback_number = WAPS.worker_phone;
						WAPS.call('setlastcallbacknumber', [WAPS.worker_id, WAPS.callback_number]);
					}
				});
				// save the phone number and pin
				Settings.save({
					'worker_id'       : WAPS.worker_id,
					'worker_pin'      : WAPS.worker_pin,
					'worker_phone'    : WAPS.worker_phone,
					'callback_number' : WAPS.callback_number
				});
				Utils.Log.debug('worker ID, pin, phone number and callback number saved to settings.');
				// remember authentication information
				WAPS._auth_hash = Utils.Encode.base64(WAPS.worker_id+':'+WAPS.worker_pin+':'+WAPS.worker_phone);
				// execute callback if all went well
				if (success) success();
			}, fail);
		}, fail);
	},

    checkIn: function()
    {
        var report_time = Math.floor(Date.now() / 1000); //now
            report_time += 60 * WAPS.callback_minutes;

        WAPS.call('setWorkerStatus', [WAPS.worker_id, WAPS.STATUS_CALLBACK, report_time], function(result) {
            WAPS.updateMainPageUI();
        });
    },

    annoy: function()
    {
        navigator.notification.confirm('You are going to go into alarm soon!', function(buttonIndex)
        {
            WAPS.releaseAnnoyingAlarmMedia();

            if (1 == buttonIndex)
            {
                WAPS.checkIn();
            }

        }, 'Alarm Warning', ['Check In!', 'Dismiss']);

        WAPS.playAnnoyingAlarmMedia();

        navigator.vibrate(2000);
    },

    endOfShiftNotification: function()
    {
        navigator.notification.confirm('Your shift has ended. Please end monitoring before the grace time run out.', function(buttonIndex)
        {
            WAPS.releaseAnnoyingAlarmMedia();

            if (1 == buttonIndex)
            {
                // get the user to enter their PIN
                $.mobile.changePage("#enter_pin");
            }

        }, 'End of Shift', ['End Monitoring', 'Dismiss']);

        WAPS.playAnnoyingAlarmMedia();

        navigator.vibrate(2000);
    },

    releaseAnnoyingAlarmMedia: function()
    {
        if (null != WAPS._annoying_alarm)
        {
            WAPS._annoying_alarm.stop();
            WAPS._annoying_alarm.release();
            WAPS._annoying_alarm = null;
        }
    },

    playAnnoyingAlarmMedia: function()
    {
        if (null == WAPS._annoying_alarm)
        {
            var url = (device.platform.toLowerCase() === 'android')
                ? '/android_asset/www/sounds/annoying.mp3'
                : '/sounds/annoying.mp3';

            WAPS._annoying_alarm = new Media(url);
        }

        WAPS._annoying_alarm.play({
            numberOfLoops : 5,
            playAudioWhenScreenIsLocked : true
        })
    },

	updateMainPageUI: function()
    {
		// Initialize the UI state
		$.mobile.loading('show', 'a', 'loading...');
		UI.buttonHide($('#mon_start, #mon_update, #mon_end'));
        WAPS.resetTimedStuff();
	},

	updateAudioPageUI: function()
    {
		UI.disableButton($('#play_name'));
		UI.disableButton($('#play_message'));

		WAPS.call('nameRecordingURI', [WAPS.worker_id], function(result) {
			if (true == result.success) {
				UI.enableButton($('#play_name'));
			}
		});

		WAPS.call('messageRecordingURI', [WAPS.worker_id], function(result) {
			if (true == result.success) {
				UI.enableButton($('#play_message'));
			}
		});
	},

	updateStatusScreen: function()
    {
        WAPS._getCurrentMonitoringStatus(function()
        {
            UI.buttonHide($('#mon_start, #mon_update, #mon_end, #mon_emergency'));

            $('#cb_number').html(Utils.Format.toPhoneNumber(WAPS.callback_number));

            var callback_time = Utils.Format.date(WAPS.callback_timestamp);
            $('#cb_time').html(('' == callback_time) ? '&nbsp;' : callback_time);

            $('#current_status').html(WAPS.getStatusString(WAPS.status));

            switch (WAPS.status) {
                case WAPS.STATUS_NONE:          // user is not active in the system
                    UI.buttonShow($('#mon_start, #mon_emergency'));
                    break;
                case WAPS.STATUS_AUTO_CHECKOUT: // auto-monitoring is about to end
                    UI.buttonShow($('#mon_end, #mon_emergency'));
                    if (WAPS.old_status != WAPS.STATUS_AUTO_CHECKOUT)
                    {
                        WAPS.old_status = WAPS.STATUS_AUTO_CHECKOUT;

                        WAPS.endOfShiftNotification();
                    }
                    break;
                case WAPS.STATUS_CALLBACK:      // user is active and set to callback
                case WAPS.STATUS_GRACE:         // user missed the first check in time
                case WAPS.STATUS_AUTO_CALLBACK: // monitoring started automatically
                    UI.buttonShow($('#mon_update, #mon_end, #mon_emergency'));
                    WAPS._getEndOfShiftTimestampFromServer();
                    break;
                case WAPS.STATUS_EMERGENCY:     // user missed the second check in time
                case WAPS.STATUS_ACKNOWLEDGED:  // monitoring center has acknowledged an emergency
                case WAPS.STATUS_SILENT_ALARM:  // user initiated emergency
                    UI.buttonShow($('#mon_end'));
                    break;
            }

            if (undefined != $.mobile)
            {
                $.mobile.loading('hide');
            }
        });
	},

    resetTimedStuff: function()
    {
        clearTimeout(WAPS._timer);
        WAPS.timedProcedures.forEach(function(procedure)
        {
            procedure.last_run = Date.now();
        });
        WAPS.doTimedStuff();
    },

    doTimedStuff: function()
    {
        var now = Date.now();

        WAPS.timedProcedures.forEach(function(procedure)
        {
            if (now - procedure.last_run >= procedure.interval)
            {
                async(function() {
					procedure.action(now, procedure.last_run);
	                procedure.last_run = now;
				});
            }
        });

        WAPS._timer = setTimeout(function() { WAPS.doTimedStuff(); }, 200);
    },

	updateCallbackTimeRemaining: function()
    {
		var timestamp = parseInt(WAPS.callback_timestamp) - Date.now();
        timestamp = (isNaN(timestamp) || 0 > timestamp) ? 0 : timestamp;
        $('#remaining').html(Utils.Format.span(timestamp));

        var end_of_shift = parseInt(WAPS.shift_end_timestamp) - Date.now();
        end_of_shift = (isNaN(end_of_shift) || 0 > end_of_shift) ? 0 : end_of_shift;
        $('#se_time').html(Utils.Format.span(end_of_shift));
	},

    getStatusString: function(status_id)
    {
        switch (status_id) {
            case WAPS.STATUS_NONE:
                return '<span style="color:#666666;">not monitored</span>';
            case WAPS.STATUS_CALLBACK:
                return '<span style="color:#00bb33;">actively monitored</span>';
            case WAPS.STATUS_GRACE:
                return '<span style="color:#dddd00;">check-in time missed';
            case WAPS.STATUS_EMERGENCY:
                return '<span style="color:red;">emergency</span>';
            case WAPS.STATUS_ACKNOWLEDGED:
                return '<span style="color:#0077bb">acknowledged</span>';
            case WAPS.STATUS_SILENT_ALARM:
                return '<span style="color:red;">emergency</span>';
            case WAPS.STATUS_AUTO_CALLBACK:
                return '<span style="color:#00bb33;">monitored (auto)</span>';
            case WAPS.STATUS_AUTO_CHECKOUT:
                return '<span style="color:#0077bb">checkout (auto)</span>';
            default:
                return '<span style="color:#333333;">unkown</span>';
        }
    },

// ============================================================================
//  Private Methods
// ============================================================================


    _getEndOfShiftTimestampFromServer: function(callback)
    {
        WAPS.call('getEndOfShift', [WAPS.worker_id], function(result) {

            // if we got a usable result back
            if (true != result.success)
            {
                WAPS._handleError('getEndOfShift() - failed to load');

                if (undefined != callback) callback();

                return;
            }

            WAPS.shift_end_timestamp = Utils.Clean.getInteger(result.value) * 1000;

            if (undefined != callback)
            {
                callback();
            }
        }, null, true);
    },

	_getCurrentMonitoringStatus: function(callback)
    {
		// get the latest user status
		WAPS.call('getCurrentMonitoringStatus', [WAPS.worker_id], function(result) {

			// if we got a usable result back
			if (true != result.success)
            {
				WAPS._handleError('pollForStatus() - failed to load current monitoring status');

				if (undefined != callback) callback();

				return;
			}

            // remember the old status
            WAPS.old_status = WAPS.status;

			// current monitoring status
			WAPS.status = Utils.Clean.getInteger(result.value.status_id);

			// the callback number
			var callback_number = Utils.Clean.stripNonNumeric(result.value.callback_number);

			if ('' != callback_number)
            {
				if (WAPS.callback_number != callback_number)
                {
					// if a callback number has not been set
					WAPS.callback_number = callback_number;
					Settings.save({'callback_number': WAPS.callback_number});
					Utils.Log.debug('!!! callback number has been updated.');
				}
			}

			// set the callback time (it comes from the server in seconds)
			WAPS.callback_timestamp = Utils.Clean.getInteger(result.value.callback_timestamp) * 1000;

			if (undefined != callback)
            {
                callback();
            }
		}, null, true);
	},

	call: function(service, args, success, fail, nolog)
    {
		// if we don't know where to send it
		if ('' == _service_root) { if (fail) fail(); };

		// form the URI
		var arguments = '/' + args.join('/');
		var url = _service_root + 'services/phoneservices/' + service + arguments;

		// are we to log this monumentous event?
		if (undefined == nolog)
        {
			Utils.Log.debug('>>> - ' + service + arguments);
		}

		// make the asynchronous call
		$.ajax({
			type     : 'POST',
            beforeSend: function (request) {
                request.setRequestHeader('WAPS_ID', WAPS._auth_hash);
            },
			url      : url,
			data     : WAPS._post_data,
			async    : true,
			cache    : true,
			dataType : 'json',
			timeout  : 10000,
			success  : function(obj)
            {
				// clear the data
				WAPS._post_data = null;

				// make sure any disabled buttons are enabled
				UI.enableButton(_button_reference);

				if (obj.hasOwnProperty('result')) {
					if (success) {
						success(obj.result);
					}
				}
				else if (obj.hasOwnProperty('exception')) {
					WAPS._handleServiceException(obj.exception, fail);
				}
				else {
					Utils.log.debug(obj);
				}
			},
			error: function(xhr, status, errorThrown) {
				// clear the data
				WAPS._post_data = null;
				// make sure any disabled buttons are enabled
				UI.enableButton(_button_reference);

				WAPS._handleError(status + errorThrown, fail);
			}
		});
	},

	_handleServiceException: function(exception, callback) {
		Utils.Log.error(exception.message);
		if (callback) callback();
	},

	_handleError: function(message, callback) {
		Utils.Log.error(message);
		if (callback) callback();
	}
};

//endregion

//region - Security

function security_check(success, fail) {

    Utils.Log.debug('running a security check');

    WAPS.worker_id = Utils.Clean.getInteger(Settings.get('worker_id'));
    WAPS.worker_pin = Utils.Clean.stripWhitespace(Settings.get('worker_pin'));

    var sr = Settings.get('service_root');
    if ('' != sr) _service_root = sr;

    WAPS.worker_phone = Utils.Clean.getInteger(Settings.get('worker_phone'));
    if (-1 == WAPS.worker_phone) WAPS.worker_phone = '';

    WAPS.callback_minutes = Utils.Clean.getInteger(Settings.get('callback_minutes'));
    if ('' == WAPS.callback_minutes) WAPS.callback_minutes = 15;

    WAPS.warning_minutes = Utils.Clean.getInteger(Settings.get('warning_minutes'));
    if ('' == WAPS.warning_minutes) WAPS.warning_minutes = 2;

    var cn = Settings.get('callback_number');
    if ('' != cn) WAPS.callback_number = cn;
    if ('' == WAPS.callback_number) WAPS.callback_number = WAPS.worker_phone;

    if (1 > WAPS.worker_id || '' == WAPS.worker_pin) {
        if (fail) fail();
        return;
    }
    Utils.Log.debug('worker ID set to: ' + WAPS.worker_id);
    Utils.Log.debug('worker phone number set to: ' + WAPS.worker_phone);
    Utils.Log.debug('callback minutes set to: ' + WAPS.callback_minutes);
    Utils.Log.debug('warning minutes set to: ' + WAPS.warning_minutes);
    Utils.Log.debug('callback phone number set to: ' + WAPS.callback_number);

    WAPS._auth_hash = Utils.Encode.base64(WAPS.worker_id+':'+WAPS.worker_pin+':'+WAPS.worker_phone);

    if (success) success();
}

//endregion
