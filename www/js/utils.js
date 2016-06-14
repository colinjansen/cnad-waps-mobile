var UI = {
	disableButton: function(obj) {
		if (null == obj) return;
		obj.addClass('ui-disabled').attr('disabled', 'disabled');
	},
	enableButton: function(obj) {
		if (null == obj) return;
		obj.removeClass('ui-disabled').attr('disabled', '');
	},
	buttonText: function(obj, text) {
		$('.ui-btn-text', obj).text(text);
	},
	buttonHide: function(obj) {
		obj.closest('.ui-btn').hide();
	},
	buttonShow: function(obj) {
		obj.closest('.ui-btn').show();
	},
	info: function(message) {
		UI._showDialog('info...', '<b>'+message+'</b>', 'b');
	},
	alert: function(message) {
		UI._showDialog('uh oh...', '<b>'+message+'</b>', 'e');
	},
	_showDialog: function(title, message, theme) {
		if (undefined == theme) theme = 'a';
		$('<div data-role="popup" id="alert" data-theme="'+theme+'" data-overlay-theme="a"></div>')
			.append('<h2 class="alert-1">'+title+'</h2><hr />')
			.append('<p class="alert-2">'+message+'</p>')
			.popup().popup('open');
	},
};

var Utils = {

	_base64_key : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
	
	getPhoneGapPath: function() {
		var path = window.location.pathname;
		path = path.substr(path, path.length - 10);
		return 'file://' + path;
	},
	
	Log: {
		_buffer: [],
		
		debug: function(message) {
			if (Settings.debug) {
				Utils.Log._log('debug', message);
			}
		},
		error: function(message) {
			Utils.Log._log('error', message);
			if (Settings.debug && 'object' != typeof(message)) {
				UI.alert(message);
			}
		},
		alert: function(message) {
			Utils.Log._log('alert', message);
		},
		info: function(message) {
			Utils.Log._log('info', message);
		},
		getBuffer: function() {
			var b = '';
			for (var i in Utils.Log._buffer) {
				b += Utils.Log._buffer[i] + '<br />';
			}
			return b;
		},
		_log: function(type, message) {
			var text = '['+type+'] '+message;
			Utils.Log._buffer.splice(0, 0, text);
			Utils.Log._buffer.splice(100, 1);
			console.log('['+(Math.floor(+new Date() / 1000))+'] '+text);
		}
	},
	
	Test: {
		runningOnDesktop: function() {
			var mobile_browser = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/);
			return false;
			//return (null == mobile_browser);
		},
		runningOnBlackberry: function() {
			return (navigator.userAgent.match(/(BlackBerry)/)) ? true : false;
		},
		runningInChrome: function() {
			var a = navigator.userAgent.toLowerCase();
			return (-1 < a.indexOf('maxthon'))
				? false
				: (-1 < a.indexOf('chrome'));
		},
		connection: function() {
			if (undefined == navigator.connection) {
				Utils.Log.error('connection() - navigator.connection is undefined');
				retrn;
			}
			var networkState = navigator.connection.type;
			var states = {};
			states[Connection.UNKNOWN]  = 'Unknown connection';
			states[Connection.ETHERNET] = 'Ethernet connection';
			states[Connection.WIFI]     = 'WiFi connection';
			states[Connection.CELL_2G]  = 'Cell 2G connection';
			states[Connection.CELL_3G]  = 'Cell 3G connection';
			states[Connection.CELL_4G]  = 'Cell 4G connection';
			states[Connection.NONE]     = 'No network connection';

			Utils.Log.debug('connection type: ' + states[networkState]);
		}
	},
	
	Format: {
		date: function(timestamp)
        {
			return (1 > timestamp)
                ? ''
                : new Date(parseInt(timestamp)).toLocaleString();
		},
		span: function(s)
        {
            var DAY  = 86000000,
                HOUR = 3600000,
                MINUTE = 60000,
                SECOND = 1000;

			s = Math.floor(s);

            var d = Math.floor(s / DAY);
			s -= d * DAY;

			var h = Math.floor(s / HOUR);
			s -= h * HOUR;

			var m = Math.floor(s / MINUTE);
			s -= m * MINUTE;

            s = Math.floor(s / SECOND);

			if (d < 10) d = '0'+d;
			if (h < 10) h = '0'+h;
			if (m < 10) m = '0'+m;
			if (s < 10) s = '0'+s;
			
			return (0 < parseInt(d))
				? d+' <span class="dim">days</span> '+h+' <span class="dim">:</span> '+m+' <span class="dim">:</span> '+s
				: h+' <span class="dim">:</span> '+m+' <span class="dim">:</span> '+s
				
		},
		toPhoneNumber: function(val)
        {
			val = Utils.Clean.stripNonNumeric(val);
			var l = val.length;
			
			if (4 >= l)
            {
				return val;
			}

			if (7 >= l)
            {
				return val.substring(0,l-4) + '-' + val.substring(l-4);
			}

			if (10 >= l)
            {
				return '('+val.substring(0,l-7) + ') ' + val.substring(l-7,l-4) + '-' + val.substring(l-4);
			}

			if (11 == val.length)
            {
				return '+' + val.substring(0,l-10) + ' ' + '('+val.substring(l-10,l-7) + ') ' + val.substring(l-7,l-4) + '-' + val.substring(l-4);
			}

			return val;
		}
	},
	
	Clean: {
	
		stripNonNumeric: function(string) { 
			return (''+string).replace(/[^0-9]/g, '');
		},
		
		stripWhitespace: function(string) { 
			return (''+string).replace(/\s+/g, '');
		},
		
		getInteger: function(val) {
			var n = parseInt(val);
			return (isNaN(n)) ? -1 : n;
		}
	},
	
	Encode: {

		base64: function (data) {
			var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
				ac = 0,
				enc = '',
				tmp_arr = [];

			if (!data) {
				return data;
			}

			do { // pack three octets into four hexets
				o1 = data.charCodeAt(i++);
				o2 = data.charCodeAt(i++);
				o3 = data.charCodeAt(i++);

				bits = o1 << 16 | o2 << 8 | o3;

				h1 = bits >> 18 & 0x3f;
				h2 = bits >> 12 & 0x3f;
				h3 = bits >> 6 & 0x3f;
				h4 = bits & 0x3f;

				// use hexets to index into b64, and append result to encoded string
				tmp_arr[ac++] = Utils._base64_key.charAt(h1) + Utils._base64_key.charAt(h2) + Utils._base64_key.charAt(h3) + Utils._base64_key.charAt(h4);
			} while (i < data.length);

			enc = tmp_arr.join('');

			var r = data.length % 3;

			return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
		},
	
		/**
		 * Encode multi-byte Unicode string into utf-8 multiple single-byte characters 
		 * (BMP / basic multilingual plane only)
		 *
		 * Chars in range U+0080 - U+07FF are encoded in 2 chars, U+0800 - U+FFFF in 3 chars
		 *
		 * @param {String} strUni Unicode string to be encoded as UTF-8
		 * @returns {String} encoded string
		*/
		utf8: function(strUni) {
			// use regular expressions & String.replace callback function for better efficiency 
			// than procedural approaches
			var strUtf = strUni.replace(
			  /[\u0080-\u07ff]/g,  // U+0080 - U+07FF => 2 bytes 110yyyyy, 10zzzzzz
			  function(c) { 
				var cc = c.charCodeAt(0);
				return String.fromCharCode(0xc0 | cc>>6, 0x80 | cc&0x3f); }
			);
			strUtf = strUtf.replace(
			  /[\u0800-\uffff]/g,  // U+0800 - U+FFFF => 3 bytes 1110xxxx, 10yyyyyy, 10zzzzzz
			  function(c) { 
				var cc = c.charCodeAt(0); 
				return String.fromCharCode(0xe0 | cc>>12, 0x80 | cc>>6&0x3F, 0x80 | cc&0x3f); }
			);
			return strUtf;
		}
	},

	Decode: {
	
		base64: function (data) {
			var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
				ac = 0,
				dec = '',
				tmp_arr = [];

			if (!data) {
				return data;
			}

			data += '';

			do { // unpack four hexets into three octets using index points in b64
				h1 = Utils._base64_key.indexOf(data.charAt(i++));
				h2 = Utils._base64_key.indexOf(data.charAt(i++));
				h3 = Utils._base64_key.indexOf(data.charAt(i++));
				h4 = Utils._base64_key.indexOf(data.charAt(i++));

				bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

				o1 = bits >> 16 & 0xff;
				o2 = bits >> 8 & 0xff;
				o3 = bits & 0xff;

				if (h3 == 64) {
					tmp_arr[ac++] = String.fromCharCode(o1);
				} else if (h4 == 64) {
					tmp_arr[ac++] = String.fromCharCode(o1, o2);
				} else {
					tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
				}
			} while (i < data.length);

			dec = tmp_arr.join('');

			return dec;
		},

		/**
		 * Decode utf-8 encoded string back into multi-byte Unicode characters
		 *
		 * @param {String} strUtf UTF-8 string to be decoded back to Unicode
		 * @returns {String} decoded string
		*/
		utf8: function(strUtf) {
			// note: decode 3-byte chars first as decoded 2-byte strings could appear to be 3-byte char!
			var strUni = strUtf.replace(
			  /[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g,  // 3-byte chars
			  function(c) {  // (note parentheses for precence)
				var cc = ((c.charCodeAt(0)&0x0f)<<12) | ((c.charCodeAt(1)&0x3f)<<6) | ( c.charCodeAt(2)&0x3f); 
				return String.fromCharCode(cc); }
			);
			strUni = strUni.replace(
			  /[\u00c0-\u00df][\u0080-\u00bf]/g,                 // 2-byte chars
			  function(c) {  // (note parentheses for precence)
				var cc = (c.charCodeAt(0)&0x1f)<<6 | c.charCodeAt(1)&0x3f;
				return String.fromCharCode(cc); }
			);
			return strUni;
		}
	},
	
	Hash: {

		/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
		/*  SHA-1 implementation in JavaScript | (c) Chris Veness 2002-2010 | www.movable-type.co.uk      */
		/*   - see http://csrc.nist.gov/groups/ST/toolkit/secure_hashing.html                             */
		/*         http://csrc.nist.gov/groups/ST/toolkit/examples.html                                   */
		/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
	
		/**
		 * Generates SHA-1 hash of string
		 *
		 * @param {String} msg                String to be hashed
		 * @param {Boolean} [utf8encode=true] Encode msg as UTF-8 before generating hash
		 * @returns {String}                  Hash of msg as hex character string
		 */
		sha1: function(msg, utf8encode) {
		
			utf8encode = (typeof utf8encode == 'undefined') ? true : utf8encode;

			// convert string to UTF-8, as SHA only deals with byte-streams
			if (utf8encode) msg = Utils.Encode.utf8(msg);

			// constants [�4.2.1]
			var K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];

			// PREPROCESSING 

			msg += String.fromCharCode(0x80);  // add trailing '1' bit (+ 0's padding) to string [�5.1.1]

			// convert string msg into 512-bit/16-integer blocks arrays of ints [�5.2.1]
			var l = msg.length/4 + 2;  // length (in 32-bit integers) of msg + �1� + appended length
			var N = Math.ceil(l/16);   // number of 16-integer-blocks required to hold 'l' ints
			var M = new Array(N);

			for (var i=0; i<N; i++) {
				M[i] = new Array(16);
				for (var j=0; j<16; j++) {  // encode 4 chars per integer, big-endian encoding
					M[i][j] = (msg.charCodeAt(i*64+j*4)<<24) | (msg.charCodeAt(i*64+j*4+1)<<16) | (msg.charCodeAt(i*64+j*4+2)<<8) | (msg.charCodeAt(i*64+j*4+3));
				} // note running off the end of msg is ok 'cos bitwise ops on NaN return 0
			}
			
			// add length (in bits) into final pair of 32-bit integers (big-endian) [�5.1.1]
			// note: most significant word would be (len-1)*8 >>> 32, but since JS converts
			// bitwise-op args to 32 bits, we need to simulate this by arithmetic operators
			M[N-1][14] = ((msg.length-1)*8) / Math.pow(2, 32); M[N-1][14] = Math.floor(M[N-1][14])
			M[N-1][15] = ((msg.length-1)*8) & 0xffffffff;

			// set initial hash value [�5.3.1]
			var H0 = 0x67452301;
			var H1 = 0xefcdab89;
			var H2 = 0x98badcfe;
			var H3 = 0x10325476;
			var H4 = 0xc3d2e1f0;

			// HASH COMPUTATION [�6.1.2]

			var W = new Array(80); var a, b, c, d, e;
			for (var i=0; i<N; i++) {

				// 1 - prepare message schedule 'W'
				for (var t=0;  t<16; t++) W[t] = M[i][t];
				for (var t=16; t<80; t++) W[t] = Utils.Hash._rotateLeft(W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16], 1);

				// 2 - initialise five working variables a, b, c, d, e with previous hash value
				a = H0; b = H1; c = H2; d = H3; e = H4;

				// 3 - main loop
				for (var t=0; t<80; t++) {
					var s = Math.floor(t/20); // seq for blocks of 'f' functions and 'K' constants
					var T = (Utils.Hash._rotateLeft(a,5) + Utils.Hash._f(s,b,c,d) + e + K[s] + W[t]) & 0xffffffff;
					e = d;
					d = c;
					c = Utils.Hash._rotateLeft(b, 30);
					b = a;
					a = T;
				}

				// 4 - compute the new intermediate hash value
				H0 = (H0+a) & 0xffffffff;  // note 'addition modulo 2^32'
				H1 = (H1+b) & 0xffffffff; 
				H2 = (H2+c) & 0xffffffff; 
				H3 = (H3+d) & 0xffffffff; 
				H4 = (H4+e) & 0xffffffff;
			}

			return Utils.Hash._hex(H0) + Utils.Hash._hex(H1) + Utils.Hash._hex(H2) + Utils.Hash._hex(H3) + Utils.Hash._hex(H4);
		},

		/**
		 * hexadecimal representation of a number 
		 *   (note toString(16) is implementation-dependant, and  
		 *   in IE returns signed numbers when used on full words)
		*/
		_hex: function(n) {
			var s="", v;
			for (var i=7; i>=0; i--) { v = (n>>>(i*4)) & 0xf; s += v.toString(16); }
			return s;
		},

		
		/**
		 * function '_f' [�4.1.1]
		*/
		_f: function(s, x, y, z)  {
			switch (s) {
				case 0: return (x & y) ^ (~x & z);           // Ch()
				case 1: return x ^ y ^ z;                    // Parity()
				case 2: return (x & y) ^ (x & z) ^ (y & z);  // Maj()
				case 3: return x ^ y ^ z;                    // Parity()
			}
		},

		/**
		 * rotate left (circular left shift) value x by n positions [�3.2.5]
		*/
		_rotateLeft: function(x, n) {
			return (x<<n) | (x>>>(32-n));
		},
	},
	
	Upload: {
	    audio: function(uri, path, params, success, fail) {
		
            var options = new FileUploadOptions();
				options.fileKey  = 'files[]';
				options.fileName = 'audio.wav';
				options.mimeType = 'audio/wav';
				options.chunkedMode = false;
				options.params = params;
			
            var ft = new FileTransfer();
            ft.upload(path, encodeURI(uri), 
				function(response) {
					Utils.Log.debug('Upload.audio: success - ' + response.bytesSent);
					if (success) success();
				},
				function(error) {
					Utils.Log.debug('Upload.audio: ' + error.code);
					if (fail) fail();
				},
				options
			);
        }
	},
	
	Audio: {
		_playing: false,
        _timer: null,
        _duration: 0,
		_media: null,

        stop: function() {
            if (Utils.Audio._media) {
                Utils.Audio._media.stop();
                Utils.Audio._media.release();
            }
            clearInterval(Utils.Audio._timer);
            Utils.Audio._playing = false;
            Utils.Audio._timer = null;
            Utils.Audio._media = null;
            $('.progressbarinternal').css('width', '3%');
            $('.progressbar').hide();
        },

		play: function(uri) {

			// release the media object if it is in use
			if (null != Utils.Audio._media) {
				Utils.Audio._media.stop();
				Utils.Audio._media.release();
				Utils.Audio._media = null;
                clearInterval(Utils.Audio._timer);
                Utils.Audio._timer = null;
                Utils.Audio._playing = true;
			}

            Utils.Audio._duration = 0;
            $('.progressbarinternal').css('width', '0');
            $('.progressbar').show();

			// create the new media object
			Utils.Audio._media = new Media(uri,
				function() {
                    if (Utils.Audio._media && Utils.Audio._playing == false) {
                        //$('.stop-button').removeClass('stop-button');
                        $('.progressbarinternal').css('width', '3%');
                        $('.progressbar').hide();
                        Utils.Audio._media.release();
                    }
				},
				function(error) {
					Utils.Log.debug('Utils.Audio.play: ['+ error.code + '] ' + error.message);
                    $('.progressbar').hide();
				}
			);

            // Code to find out the duration of the file
            Utils.Audio._getDuration();

			// try to play it
			Utils.Audio._media.play();

            // Update my_media position every second
            if (Utils.Audio._timer == null) {
                Utils.Audio._timer = setInterval(function() {
                    // get my_media position
                    Utils.Audio._media.getCurrentPosition(
                        // success callback
                        function(pos) {
                            if (pos > -1) {
                                // Get the current position of the video
                                percentage = Math.round(100 * (pos / Utils.Audio._duration)) + '%';
                                Utils.Audio._playing = false; // ?
                                $('.progressbarinternal').css('width', percentage);
                            }
                        },
                        function(e) {
                            Utils.Log.debug('Utils.Audio.play: error getting media position ' + e);
                        }
                    );
                }, 1000);
            }
		},

		record: function(seconds, success) {
			navigator.device.capture.captureAudio(
				function(files) {
					var file = files[0].fullPath; //there will only be one in there.
					Utils.Log.debug('Audio.record: success');
					if (undefined != success) success(file);
				},
				function(error) {
					Utils.Log.debug('Audio.record: ' + error.message);
				},
				{
					limit    : 1,
					duration : seconds
				}
			);
		},

		_getDuration: function() {
            if (Utils.Audio._media) {
                var c = 0;
                var t = setInterval(function() {
                    c = c + 100;
                    if (c > 4000) clearInterval(t);
                    var d = Utils.Audio._media.getDuration();
                    if (d > 0) {
                        clearInterval(t);
                        Utils.Audio._duration = d;
                        Utils.Log.debug('audio duration is ' + Utils.Audio._duration);
                    }
                }, 100);
            }
        },

		_getFileContents: function(filePath, success, fail) {
			try {
				window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {
					fs.root.getFile(filePath, { create: true, exclusive: false }, function(entry) {
						entry.file(function(file) {
							var reader = new FileReader();
							reader.onloadend = function(evt) {
								var content = evt.target.result;
								Utils.Log.debug('got file contents: ' + content.length);
								if (undefined != success) success(content);
							};
							reader.readAsDataURL(file);
						}, function() {
							if (undefined != fail) fail('Audio._getFileContents() - could not get file');
						});
					}, function() {
						if (undefined != fail) fail('Audio._getFileContents() - error while created file: '+filePath);
					});
				}, function(){
					if (undefined != fail) fail('Audio._getFileContents() - could not get file system');
				});
			} catch (e) {
				if (undefined != fail) fail('Audio._getFileContents() - ' + e.message);
			}
		}
	},

    GPS: {

        tryToUpdateTheServerWithOurLocation: function(worker_id)
        {
            navigator.geolocation.getCurrentPosition(function(position)
            {
                var lat = ''+position.coords.latitude;
                var lon = ''+position.coords.longitude;

                if (lat.length && lon.length)
                {
                    var timestamp = Math.floor(position.timestamp / 1000);

                    WAPS.call('setCurrentUserGPSCoordinates', [worker_id, lat, lon, timestamp], function(result)
                    {
                        Utils.Log.debug('updateGPS() - gps updated');
                    });
                }
            }, function(error)
            {
                Utils.Log.error('updateGPS() - ' + error.message)
            }, {
                maximumAge         : 600000,
                timeout            :   5000,
                enableHighAccuracy :   true
            });
        }
    }
};

var Settings = {
		
	debug     : Utils.Test.runningOnDesktop(),
	_settings : null,
	_key      : 'waps_settings',
	
	get: function(name) {
		Settings._getArray();
		if (undefined == name) {
			return Settings._settings;
		} else {
			return (Settings._settings.hasOwnProperty(name)) ? Settings._settings[name] : '';
		}
	},
	
	save: function(entries) {
		Settings._getArray();
		for (var name in entries) {
			Settings._settings[name] = entries[name];
		}
		localStorage.setItem(Settings._key, JSON.stringify(Settings._settings));
	},
		
	_getArray: function(refresh) {
		if (null == Settings._settings || true == refresh) {
			Settings._settings = localStorage.getItem(Settings._key);
			// initialize
			if (typeof Settings._settings != 'string') {
				localStorage.setItem(Settings._key, JSON.stringify({}));
				Settings._settings = localStorage.getItem(Settings._key);
			}
			Settings._settings = JSON.parse(Settings._settings);
			Utils.Log.debug('Setting._getArray() - got settings array from localStorage');
		}
		return Settings._settings;
	},
	
	_fail: function(error) {
        Utils.Log.error(error);
    }
};

// shim the Date.now function
if (!Date.now) {
    Date.now = function() { return new Date().getTime(); }
}

function async(fn)
{
    setTimeout(function() { fn(); }, 0);
}