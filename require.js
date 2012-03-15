// (c) 2012 Salsita s.r.o.
// Dual-licensed under MIT license and GPL v2.

// Implementation of CommonJS require() for browser environments where synchronous
// loading is approach (e.g. browser extension).

// Makes use of printStackTrace() as defined in https://github.com/eriwen/javascript-stacktrace.

var require = function(id, scriptUrl) {
  if (!scriptUrl) {
    frames = printStackTrace();
    // We are interested in the frame right below the first call to require().
    var foundRequireFrame = false;
    for (var i=0; i<frames.length; i++) {
      var match = frames[i].match("([^@]+)\\(\\)@(.*)\/.+\.js:");
      if (foundRequireFrame) {
        scriptUrl = match[2];
        break;
      }
      if (match && match[1] == "require") {
        foundRequireFrame = true;
      }
    }
    if (!scriptUrl) {
      throw new Error("Cannot get the path of the current module");
    }
  }
  if (id[0] == "/") {
    // Separate the path and filename;
    var pathInfo = id.match("(.+)/([^/]+)$");
    var path = pathInfo[1];
    id = pathInfo[2];

    // Extract the part of the URL preceding the path, e.g.:
    // file:///path/to/ -> file://
    // http://server/path/to/ -> http://server
    var urlPrefix = scriptUrl.match("([^:]+://[^/]*)/")[1];
    // Turn the path into a URL
    scriptUrl = urlPrefix + path;
  }

  var url = normalize(scriptUrl + "/" + id + ".js");
  // Recalculate scriptUrl to be the full path based on the normalized URL.
  scriptUrl = url.match("(.*)/[^/]+\.js")[1];

  if (!(url in require._cache)) {
    var responseText = null;
    $.ajax(url, {
      async: false,
      success: function(data) {
        responseText = data;
      },
      error: function(jqXHR, statusText) {
        throw new Error("Cannot load module " + id + " (" + url + "): " + statusText);
      }
    });
    // CommonJS modules expect three symbols to be available:
    // - require is this function.
    // - exports is the context to which any exported symbols should be attached.
    // - module contains additional metadata about the module.
    // See http://wiki.commonjs.org/wiki/Modules/1.1#Module_Context for more information.
    // So we wrap the code in a function that takes these symbols as arguments.
    // For compatibility with Node.js, we create a header that defines global variables
    // that it provides to modules.
    var header = "var __dirname = '" + scriptUrl.match(".*://(.*)")[1] + "';";
    var func = new Function("require", "exports", "module", header + responseText);
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
    func.call(context, function(id) { return require(id, scriptUrl); }, exports, module);
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
