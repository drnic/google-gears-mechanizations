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
$.join = function(hash, delim1, delim2) {
	var ret = '';
	for (var key in hash)
		ret += key + delim1 + hash[key] + delim2;
	return ret.substr(0, ret.length - delim2.length);
};

$.keys = function(hash) {
	var keys = [];
	for (var key in hash)
		keys.push(key);
	return keys;
};

$.repeatChar = function(character, repeat, delim) {
	var chars = new Array(repeat);
	chars = jQuery.each(chars, function(i) {chars[i] = character});
	return chars.join(delim);
};

$.values = function(hash, keys) {
	var values = [];
	for (var i = 0; i < keys.length; ++i)
		values.push(hash[keys[i]]);
	return values;
}

var Logger = {
	enabled: true,
	log: [],
	
	error: function(item) {
		if (this.enabled) this.log.push('ERROR: ' + item);
	},
	
	info: function(item) {
		if (this.enabled) this.log.push('INFO: ' + item);
	},
	
	toString: function() {
		return this.log.join('\n');
	}
};
