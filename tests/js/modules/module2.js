(function() {
  exports.module_name = "module2";
  exports.dependent_module = require("module1");
}).call(this);