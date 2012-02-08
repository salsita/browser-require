describe("Loading of CommonJS modules", function() {
  it("should load a CommonJS module using a relative path", function() {
    var module1 = require("../modules/module1");
    expect(module1.module_name).toEqual("module1");
  });
  it("should load a CommonJS module using an absolute path", function() {
    var module1 = require("/tests/js/modules/module1");
    expect(module1.module_name).toEqual("module1");
  });
  it("should load a nested CommonJS module using an absolute path", function() {
    var module3 = require("/tests/js/modules/module3");
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