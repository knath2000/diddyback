"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.capitalizeString = exports.formatProxy = exports.checkStatus = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var checkStatus = function checkStatus(res) {
  var status, error;
  return _regenerator["default"].async(function checkStatus$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          status = res.status;
          console.log(status);

          if (!(status !== 200 && status !== 304)) {
            _context.next = 9;
            break;
          }

          error = new Error("Invalid status code");
          error.status = status;
          _context.next = 7;
          return _regenerator["default"].awrap(res.text());

        case 7:
          error.body = _context.sent;
          throw error;

        case 9:
          ;

        case 10:
        case "end":
          return _context.stop();
      }
    }
  });
};

exports.checkStatus = checkStatus;

var formatProxy = function formatProxy(proxy) {
  var splitProxy = proxy.split(':');
  if (splitProxy.length == 2) return "http://".concat(splitProxy[0], ":").concat(splitProxy[1]);else return "http://".concat(splitProxy[2], ":").concat(splitProxy[3], "@").concat(splitProxy[0], ":").concat(splitProxy[1]);
};

exports.formatProxy = formatProxy;

var capitalizeString = function capitalizeString(s) {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

exports.capitalizeString = capitalizeString;