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
