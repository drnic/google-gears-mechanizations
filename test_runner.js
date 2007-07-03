/**
 * Copyright (c) 2007, Ravi Chodavarapu
 * 
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, are permitted 
 * provided that the following conditions are met:
 * 
 *  * Redistributions of source code must retain the above copyright notice, this list of 
 *    conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice, this list of 
 *    conditions and the following disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name Ravi Chodavarapu nor the names of other contributors may be used to endorse
 *    or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var TestRunner = {
	run: function(test) {
		var describe = function(obj) {
			if (obj instanceof Array) return '[' + obj.join(',') + ']'
			else if (obj instanceof Object) {
				var pairs = [];
				jQuery.each(obj, function(k, v) {pairs.push(k + ': ' + v);});
				return '{' + pairs.join(',') + '}';
			}
			else return obj;
		};
		
		var error = function(message) {
			throw new Error('Assert failed: ' + message);
		};
		
		assertEquals = function(a, b) {
			if (typeof(a) != typeof(b)) error(typeof(a) + ' != ' + typeof(b));
			if (describe(a) !== describe(b)) error(describe(a) + ' != ' + describe(b));
		};
		
		assertThrows = function(fn) {
			try {
				fn.apply(test);
			} catch (exception) {
				return;
			}
			error('Expected an error to be thrown!');
		};
		
		var tests = 0;
		var errors = 0;
		
		try {
			if (test['setUp']) test['setUp']();
		} catch (exception) {
			Logger.error('<span style="font-weight: bold; color: #f00;">Test fixture failed ' + 
				 '(Expect further errors): ' + name + ': ' + exception.message + '</span>');
		}
		for (var name in test) {
			if (name.length > 4 && name.substr(0, 4).toLowerCase() === 'test') {
				++tests;
				try {
					Logger.info('<b>Test: ' + name + '</b>');
					test[name]();
				} catch (exception) {
					Logger.error('<span style="font-weight: bold; color: #f00;">Test failed: ' + 
						name + ': ' + exception.message + '</span>');
					++errors;
					continue;
				}
				Logger.info('<span style="font-weight: bold; color: #090;">Test succeeded: ' + 
					name + '</span>');
			}
		}
		try {
			if (test['tearDown']) test['tearDown']();
		} catch (exception) {
			Logger.error('<span style="font-weight: bold; color: #f00;">Test teardown failed: ' + 
				name + ': ' + exception.message + '</span>');
		}
		
		if (errors) alert(errors + ' out of ' + tests + ' tests failed. Check the log for details.');
		else Logger.info('All ' + tests + ' test(s) passed.');
	}
};
