//   Copyright 2014 Eric Thiebaut-George
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.

var topics = {};

// ps.unsubscribe(string topic, function callback )
// ps.unsubscribe(string topic, object context, function callback )
var subscribe = function(topic, p2, p3) {
	var callback = p3 ? p3 : p2;
	var context = p3 ? p2 : p3;
	
	if (!topics.hasOwnProperty(topic)) {
		topics[topic] = [];
    }
 
    topics[topic].push([context, callback]);
};

// ps.unsubscribe(string topic, function callback )
// ps.unsubscribe(string topic, object context, function callback )
var unsubscribe = function(topic, p2, p3) {
	var callback = p3 ? p3 : p2;
	var context = p3 ? p2 : p3;
	 
    if (topics.hasOwnProperty(topic)) {
    	var thisTopic = topics[topic];
 
    	for (var i = 0, j = thisTopic.length ; i < j ; i++) {
        	if (thisTopic[i][0] === context && thisTopic[i][1] === callback) {
				thisTopic.splice(i, 1);
				j--;
				// Don't break here, dups are possible
			}
		}
	}
};

// ps.sendMessage(string topic, object data )
var sendMessage = function(topic, data) {
    if (topics.hasOwnProperty(topic)) {
    	var promisses = [];
    	var thisTopic = topics[topic];
    	for ( var i = 0, j = thisTopic.length; i < j; i++ ) {
			var ret = thisTopic[i][1].call(thisTopic[i][0], data);
			if (typeof ret === "object" && "then" in ret) {
				promisses.push(ret);
			}
		}
		if (promisses.length > 0) {
			return Q.all(promisses);
		}
    }
    
    // Nothing to wait for, return resolved promise
    var deferred = Q.defer();
    deferred.resolve();
    return deferred.promise;
};

// ps.postMessage(string topic, object data )
var postMessage = function(topic, data) {
	var deferred = Q.defer();
	setTimeout(function() {
	    if (topics.hasOwnProperty(topic)) {
	    	var promisses = [];
	    	var thisTopic = topics[topic];
	    	for ( var i = 0, j = thisTopic.length; i < j; i++ ) {
				var ret = thisTopic[i][1].call(thisTopic[i][0], data);
				if (typeof ret === "object" && "then" in ret) {
					promisses.push(ret);
				}
			}
			if (promisses.length > 0) {
				Q.all(promisses).then(function() {
					deferred.resolve();
				});
				return deferred;
			}
	    }

	    // Nothing to wait for, resolve promise
	    deferred.resolve();
	}, 0);
    return deferred.promise;
};

var hasListeners = function(topic) {
	return topics.hasOwnProperty(topic) && topics[topic].length > 0;
};

module.exports = {
	subscribe: subscribe,
	unsubscribe: unsubscribe,
	sendMessage: sendMessage,
	postMessage: postMessage,
	hasListeners: hasListeners
};
