// (c) 2012 Salsita s.r.o.
// Dual-licensed under MIT license and GPL v2.

// Implementation of CommonJS require() for browser environments where synchronous
// loading is approach (e.g. browser extension).

var require = function(id, scriptPath) {
  var extensionUrlRegExp = "chrome-extension:\/\/[a-w]+\/(.+)\/([^\/]+)(\.js)?$"
  var pathInfo = null;

  if (id[0] == "/") {
    // Absolute path
    pathInfo = id.match("\/(.+)\/([^\/]+)$");
    scriptPath = pathInfo[1];
    id = pathInfo[2];
  }
  if (!scriptPath) {
    // Relative path
    try {
      throw new Error();
    } catch(ex) {
      var skippedFirst = false;
      // Currently this only supports Chrome extensions. When we add support for
      // another environment this should be refactored (probably by moving the stack
      // dump code to a separate module that has implementations for all the different
      // browser (and potentially other) environments.
      var lines = ex.stack.split("\n");
      for (i in lines) {
        var frame = lines[i].match(extensionUrlRegExp);
        if (frame) {
          if (skippedFirst) {
            scriptPath = frame[1];
            break;
          }
          else {
            skippedFirst = true;
          }
        }
      }
    }
  }

  var filePath = id + ".js";

  if (scriptPath) {
    filePath = scriptPath + "/" + filePath;
  }
  var url = chrome.extension.getURL(normalize(filePath));
  if (!pathInfo) {
    // Canonicalize the path and ID.
    // This is necessary since the ID that is passed in might include a relative path.
    var pathInfo = url.match(extensionUrlRegExp);
    scriptPath = pathInfo[1];
    id = pathInfo[2];
  }

  if (!(url in require._cache)) {
    var responseText = null;
    $.ajax(url, {
      async: false,
      success: function(data) {
        responseText = data;
      },
      error: function(jqXHR, statusText) {
        throw new Error("Can't load module " + id + " (" + url + ")");
      }
    });
    // CommonJS modules expect three symbols to be available:
    // - require is this function.
    // - exports is the context to which any exported symbols should be attached.
    // - module contains additional metadata about the module.
    // See http://wiki.commonjs.org/wiki/Modules/1.1#Module_Context for more information.
    // So we wrap the code in a function that takes these symbols as arguments.
    var func = new Function("require", "exports", "module", responseText);
    var context = {};
    // jQuery is not a CommonJS module, include it in the context
    // if it was loaded already:
    if (jQuery) {
      context.jQuery = jQuery;
      context.$ = jQuery;
    }
    var exports = require._cache[url] = {};
    var module = { id: id, uri: url };
    // Invoke our function with the appropriate parameters.
    // We use a closure for require since we want to pass in the current script path.
    // This ensures that relative paths in the module will be resolved properly.
    func.call(context, function(id) { return require(id, scriptPath); }, exports, module);
  }
  return require._cache[url];

  // Normalize paths that contain . and .. segments
  function normalize(path) {
    var segments = path.split("/");
    var normalizedSegments = [];
    for (var i=0; i<segments.length; i++) {
      var segment = segments[i];
      if (segment === ".") {
        continue;
      }
      else if (segment === "..") {
        if (normalizedSegments.length == 0) {
          throw Error("Invalid path: " + path);
        }
        normalizedSegments.pop();
      }
      else {
        normalizedSegments.push(segment);
      }
    }
    return normalizedSegments.join("/");
  }
};

require._cache = {};
