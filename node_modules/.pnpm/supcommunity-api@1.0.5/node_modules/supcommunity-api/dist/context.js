"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

var _utils = require("./utils");

var ProxyAgent = require('https-proxy-agent');

var SharedContext = function () {
  function SharedContext(_ref) {
    var proxy = _ref.proxy,
        headers = _ref.headers;
    (0, _classCallCheck2["default"])(this, SharedContext);
    this.fetch = _nodeFetch["default"];
    this.agent = proxy === undefined ? undefined : new ProxyAgent((0, _utils.formatProxy)(proxy));
    this.headers = headers;
  }

  (0, _createClass2["default"])(SharedContext, [{
    key: "setProxy",
    value: function setProxy(proxy) {
      this.proxy = proxy;
    }
  }]);
  return SharedContext;
}();

var _default = SharedContext;
exports["default"] = _default;