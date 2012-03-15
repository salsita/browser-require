function printStackTrace() {
  return [
    "Object.createException (file:///path/to/js/frameworks/stacktrace.js:44:18)",
    "Object.run (file:///path/to/js/frameworks/stacktrace.js:31:25)",
    "printStackTrace (file:///path/to/js/frameworks/stacktrace.js:18:62)",
    "require()@file:///path/to/require.js:8:11",
    "(?)()@file://" + __dirname + "/require.spec.js:3:17",
    "(?)()@file:///path/to/js/background.js:52:4",
  ];
}

var path = require("path");
var fs = require("fs");

var jQuery = {
  ajax: function(url, options) {
    // Quick-and-dirty hack to strip of the file:// scheme.
    options.success(fs.readFileSync(url.substr(7), "utf8"));
  }
};
var $ = jQuery;

var script_data = fs.readFileSync("./require.js", "utf8");
eval(script_data);

describe("Loading of CommonJS modules", function() {
  beforeEach(function() {
  });
  it("should load a CommonJS module using a relative path", function() {
    var module1 = require("../modules/module1");
    expect(module1.module_name).toEqual("module1");
  });
  it("should load a CommonJS module using an absolute path", function() {
    var module1 = require(path.join(__dirname, "../modules/module1"));
    expect(module1.module_name).toEqual("module1");
  });
  it("should load a nested CommonJS module using an absolute path", function() {
    var module3 = require(path.join(__dirname, "../modules/module3"));
    expect(module3.dependent_module.module_name).toEqual("module1");
  });
  it("should allow modules that it loads to load other modules using relative paths", function() {
    var module2 = require("../modules/module2");
    expect(module2.module_name).toEqual("module2");
    expect(module2.dependent_module.module_name).toEqual("module1");
  });
  it("should handle relative paths", function() {
    var module2 = require("../one/../two/three/./.././../modules/./module2");
    expect(module2.module_name).toEqual("module2");
    expect(module2.dependent_module.module_name).toEqual("module1");
  });
});