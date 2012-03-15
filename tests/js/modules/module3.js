(function() {
  exports.module_name = "module3";
  exports.dependent_module = require(__dirname + "/module1");
}).call(this);