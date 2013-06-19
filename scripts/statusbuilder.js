// 
// animations.js
// 
// Copyright (c) 2013 Panic Inc. All rights reserved.
// 


var StatusBuilder = {};


// 
// Utilities
// 

StatusBuilder.extend = function(destination, source) {
    var args = Array.prototype.slice.call(arguments);
    var sources = args.slice(1);
    if (sources.length > 0) {
        for (var i=0; i<sources.length; i++) {
            var source = sources[i];
            for (var property in source) {
                if (source.hasOwnProperty(property)) {
                    destination[property] = source[property];
                }
            }
        }
    }
    return destination;
};

StatusBuilder.uuid = function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    };
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

StatusBuilder.getParameters = function() {
    var params = {};
    var query = window.location.search.replace("?", "").replace("/", "");
    var vars = query.split('&');
    for (var i=0; i<vars.length; i++) {
        var pair = vars[i].split('=');
        if (pair.length == 2) {
            var key = decodeURIComponent(pair[0]);
            var value = decodeURIComponent(pair[1]);
            if (key && value) {
                params[key] = value;
            }
        }
    }
    return params;
}
        
StatusBuilder.getPanicboardURL = function(url, source) {
    return 'panicboard://?url=' + encodeURIComponent(url) + '&panel=diy&sourceDisplayName=' + encodeURIComponent(source);
};


// 
// Animations
// 

StatusBuilder.transition = function(element, properties, options) {
    var defaults = {
        duration: 500,
        delay: 0,
        timing: 'ease-in-out',
        complete: null
    };
    var settings = StatusBuilder.extend({}, defaults, options);
    
    // Prevent animation triggers if the animation is already playing   
    if (element.isPlaying) {
        return;
    }
    
    var prefixes = ['Webkit', 'Moz'];
    
    var transition = {};
    var i=0;
    for (var propertyName in properties) {
        if (i == 0) {
            transition.property = propertyName;
            transition.duration = (settings.duration / 1000) + 's';
            if (settings.delay) {
                transition.delay = (settings.delay / 1000) + 's';
            }
            if (settings.timing) {
                transition.timing = settings.timing;
            }
        }
        else {
            transition.property = transition.property + ', ' + propertyName;
            transition.duration = transition.property + ', ' + (settings.duration / 1000) + 's';
            if (settings.delay) {
                transition.delay = transition.delay + ', ' + (settings.delay / 1000) + 's';
            }
            if (settings.timing) {
                transition.timing = transition.delay + ', ' + settings.timing;
            }
        }
    }
    transition.values = properties;
    
    // Start the animation
    var start = new Date().getTime();
    
    // Variables used by the runloop
    var current = percentage = roundedKey = keyframe = null;
    
    var applyCSSTransition = function(trans) {
        for (var i=0; i<prefixes.length; i++) {
            if (element.style[prefixes[i] + 'TransitionProperty'] !== undefined) {
                element.style[prefixes[i] + 'TransitionDuration']       = trans.duration;
                element.style[prefixes[i] + 'TransitionTimingFunction'] = trans.timing;
                element.style[prefixes[i] + 'TransitionDelay']          = trans.delay;
                element.style[prefixes[i] + 'TransitionProperty']       = trans.property;
                break;
            }
        }
        for (var propertyName in transition.values) {
            var value = properties[propertyName];
            element.style[propertyName] = value;
        }
    };
    
    // Trigger the transition
    applyCSSTransition(transition);
    
    element.isPlaying = true;
    
    // Use a runloop to workout when callbacks should occur
    (function runloop() {
        current = new Date().getTime(); // Get the current timestamp
        percent = Math.floor(((current - start) / settings.duration) * 100); // Work out the percentage of the way through the animation
        
        if (percent < 100) {
            requestAnimFrame(runloop, element);
        }
        else {
            // Reset the styling so it can be triggered again
            applyCSSTransition({
                duration: 0,
                delay: 0,
                timing: null,
                property: null,
                values: {},
            });
            
            element.isPlaying = false;
            
            if (settings.complete) {
                settings.complete();
            }
        }
    })();
}

// Locate a WebKitCSSKeyframesRule
// Modified version of code found @ https://github.com/joelambert/CSSAnimationKeyframeEvents/blob/master/js/cssanimation.js
StatusBuilder.findAnimation = function(a) {
    var ss = document.styleSheets;
    for (var i = ss.length - 1; i >= 0; i--) {
        try {
            var s = ss[i];
            var rs = (s.cssRules ? s.cssRules : (s.rules ? s.rules : []));
            
            for (var j = rs.length - 1; j >= 0; j--) {
                if ((rs[j].type === window.CSSRule.KEYFRAMES_RULE || rs[j].type === window.CSSRule.WEBKIT_KEYFRAMES_RULE || rs[j].type === window.CSSRule.O_KEYFRAMES_RULE || rs[j].type === window.CSSRule.MS_KEYFRAMES_RULE || rs[j].type === window.CSSRule.MOZ_KEYFRAMES_RULE) && rs[j].name == a) {
                    return rs[j];
                }
            }
        }
        catch(e) { /* Trying to interrogate a stylesheet from another domain will throw a security error */ }
    }
    return null;
};

// Perform an animation
// Modified version of code found @ https://github.com/joelambert/CSSAnimationKeyframeEvents/blob/master/js/cssanimation.js
StatusBuilder.animate = function(element, animationName, duration, complete, options) {
    var defaults = {
        base: 5,
        iterationCount: 1,
        timing: 'ease-in-out'
    };
    var settings = StatusBuilder.extend({}, defaults, options);
    
    var keyframes = {};
    var loggedKeyframes = {};
    var animation = null;
    var start = 0;
    var cycle = 0
    var prefixes = ['Webkit', 'Moz'];
    
    // Prevent animation triggers if the animation is already playing   
    if (element.isPlaying) {
        return;
    }
    
    // Can we find the animaition called animationName?
    animation = StatusBuilder.findAnimation(animationName);
    
    if (!animation) {
        console.log("Unable to find animation with name " + animationName);
        return false;
    }
    
    // Work out the timings of keyframes
    keyframes = {};
    
    for (var i=0; i < animation.cssRules.length; i++) {
        var kf = animation.cssRules[i]
        var name = kf.keyText
        var percentage = 0;
        
        // Work out the percentage
        if (name == 'from') {
            percentage = 0;
        }
        else if (name == 'to') {
            percentage = 1;
        }
        else {
            percentage = name.replace('%', '') / 100;
        }
        
        // Store keyframe for easy recall
        keyframes[(percentage * 100) + '%'] = kf;
    }
    
    // Start the animation
    var start = new Date().getTime();
    
    // Variables used by the runloop
    var current = percentage = roundedKey = keyframe = null;
    var raiseEvent = function(keyText, elapsedTime) {
        var event = document.createEvent("Event");
        event.initEvent("StatusBuilderAnimationKeyframe", true, true);
        event.animationName = animationName;
        event.keyText = keyText;
        event.elapsedTime = elapsedTime;
        element.dispatchEvent(event);
    }
    
    var applyCSSAnimation = function(anim) {
        for (var i=0; i<prefixes.length; i++) {
            if (element.style[prefixes[i] + 'AnimationName'] !== undefined) {
                element.style[prefixes[i] + 'AnimationDuration']          = anim.duration;
                element.style[prefixes[i] + 'AnimationTimingFunction']    = anim.timingFunction;
                element.style[prefixes[i] + 'AnimationIterationCount']    = anim.iterationCount;  
                element.style[prefixes[i] + 'AnimationName']              = anim.name;
                break;
            }
        }
    };
    
    // Trigger the animation
    applyCSSAnimation({
        name: animationName,
        duration: duration + 'ms',
        timingFunction: settings.timing,
        iterationCount: settings.iterationCount
    });
    
    element.isPlaying = true;
    
    // Use a runloop to workout when callbacks should occur
    (function runloop() {
        current = new Date().getTime(); // Get the current timestamp
        percent = Math.floor(((current - (start + cycle * duration)) / duration) * 100); // Work out the percentage of the way through the animation
        key = (percent - (percent % settings.base)) + '%'; // Round the percentage
        keyframe = keyframes[key];   // Check if a keyframe exists
        
        if (keyframe && !loggedKeyframes[key]) {
            loggedKeyframes[key] = true;
            raiseEvent(key, (current - start) / 1000);
        }
        
        if (percent < 100) {
            requestAnimFrame(runloop, element);
        }
        else {
            if (!loggedKeyframes['100%']) {
                raiseEvent('100%', (current - start) / 1000);
            }
            
            // Trigger the animation again if its repeating
            cycle++;
            if (cycle < settings.iterationCount || settings.iterationCount == 'infinite') {
                loggedKeyframes = {};
                requestAnimFrame(runloop, element);
            }
            else {
                // Reset the styling so it can be triggered again
                applyCSSAnimation({
                    name: null,
                    duration: null,
                    timingFunction: null,
                    iterationCount: 0
                });
                
                element.isPlaying = false;
                
                if (complete) {
                    complete();
                }
            }
        }
    })();
};


// requestAnimationFrame() shim by Paul Irish
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function() {
    return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function(/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();;
