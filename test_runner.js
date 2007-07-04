/**
 * Mechanizations - http://code.google.com/p/mechanizations
 * Copyright (c) 2007, Ravi Chodavarapu - http://ravichodavarapu.blogspot.com
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
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
