// Generated by CoffeeScript 1.4.0
(function() {
  var events, isEmpty, sax,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  sax = require('sax');

  events = require('events');

  isEmpty = function(thing) {
    return typeof thing === "object" && (thing != null) && Object.keys(thing).length === 0;
  };

  exports.defaults = {
    "0.1": {
      explicitCharkey: false,
      trim: true,
      normalize: true,
      normalizeTags: false,
      attrkey: "@",
      charkey: "#",
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: false,
      explicitRoot: false,
      validator: null,
      xmlns: false,
      explicitChildren: false,
      childkey: '@@',
      charsAsChildren: false
    },
    "0.2": {
      explicitCharkey: false,
      trim: false,
      normalize: false,
      normalizeTags: false,
      attrkey: "$",
      charkey: "_",
      explicitArray: true,
      ignoreAttrs: false,
      mergeAttrs: false,
      explicitRoot: true,
      validator: null,
      xmlns: false,
      explicitChildren: false,
      childkey: '$$',
      charsAsChildren: false
    }
  };

  exports.ValidationError = (function(_super) {

    __extends(ValidationError, _super);

    function ValidationError(message) {
      this.message = message;
    }

    return ValidationError;

  })(Error);

  exports.Parser = (function(_super) {

    __extends(Parser, _super);

    function Parser(opts) {
      this.parseString = __bind(this.parseString, this);

      this.reset = __bind(this.reset, this);

      var key, value, _ref;
      this.options = {};
      _ref = exports.defaults["0.2"];
      for (key in _ref) {
        if (!__hasProp.call(_ref, key)) continue;
        value = _ref[key];
        this.options[key] = value;
      }
      for (key in opts) {
        if (!__hasProp.call(opts, key)) continue;
        value = opts[key];
        this.options[key] = value;
      }
      if (this.options.xmlns) {
        this.options.xmlnskey = this.options.attrkey + "ns";
      }
      this.reset();
    }

    Parser.prototype.reset = function() {
      var attrkey, charkey, err, stack,
        _this = this;
      this.removeAllListeners();
      this.saxParser = sax.parser(true, {
        trim: false,
        normalize: false,
        xmlns: this.options.xmlns
      });
      err = false;
      this.saxParser.onerror = function(error) {
        if (!err) {
          err = true;
          return _this.emit("error", error);
        }
      };
      this.EXPLICIT_CHARKEY = this.options.explicitCharkey;
      this.resultObject = null;
      stack = [];
      attrkey = this.options.attrkey;
      charkey = this.options.charkey;
      this.saxParser.onopentag = function(node) {
        var key, obj, _ref;
        obj = {};
        obj[charkey] = "";
        if (!_this.options.ignoreAttrs) {
          _ref = node.attributes;
          for (key in _ref) {
            if (!__hasProp.call(_ref, key)) continue;
            if (!(attrkey in obj) && !_this.options.mergeAttrs) {
              obj[attrkey] = {};
            }
            if (_this.options.mergeAttrs) {
              obj[key] = node.attributes[key];
            } else {
              obj[attrkey][key] = node.attributes[key];
            }
          }
        }
        obj["#name"] = _this.options.normalizeTags ? node.name.toLowerCase() : node.name;
        if (_this.options.xmlns) {
          obj[_this.options.xmlnskey] = {
            uri: node.uri,
            local: node.local
          };
        }
        return stack.push(obj);
      };
      this.saxParser.onclosetag = function() {
        var node, nodeName, obj, old, s, xpath;
        obj = stack.pop();
        nodeName = obj["#name"];
        delete obj["#name"];
        s = stack[stack.length - 1];
        if (obj[charkey].match(/^\s*$/)) {
          delete obj[charkey];
        } else {
          if (_this.options.trim) {
            obj[charkey] = obj[charkey].trim();
          }
          if (_this.options.normalize) {
            obj[charkey] = obj[charkey].replace(/\s{2,}/g, " ").trim();
          }
          if (Object.keys(obj).length === 1 && charkey in obj && !_this.EXPLICIT_CHARKEY) {
            obj = obj[charkey];
          }
        }
        if (_this.options.emptyTag !== void 0 && isEmpty(obj)) {
          obj = _this.options.emptyTag;
        }
        if (_this.options.validator != null) {
          xpath = "/" + ((function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = stack.length; _i < _len; _i++) {
              node = stack[_i];
              _results.push(node["#name"]);
            }
            return _results;
          })()).concat(nodeName).join("/");
          try {
            obj = _this.options.validator(xpath, s && s[nodeName], obj);
          } catch (err) {
            _this.emit("error", err);
          }
        }
        if (_this.options.explicitChildren && !_this.options.mergeAttrs && typeof obj === 'object') {
          node = {};
          if (_this.options.attrkey in obj) {
            node[_this.options.attrkey] = obj[_this.options.attrkey];
            delete obj[_this.options.attrkey];
          }
          if (!_this.options.charsAsChildren && _this.options.charkey in obj) {
            node[_this.options.charkey] = obj[_this.options.charkey];
            delete obj[_this.options.charkey];
          }
          if (Object.getOwnPropertyNames(obj).length > 0) {
            node[_this.options.childkey] = obj;
          }
          obj = node;
        }
        if (stack.length > 0) {
          if (!_this.options.explicitArray) {
            if (!(nodeName in s)) {
              return s[nodeName] = obj;
            } else if (s[nodeName] instanceof Array) {
              return s[nodeName].push(obj);
            } else {
              old = s[nodeName];
              s[nodeName] = [old];
              return s[nodeName].push(obj);
            }
          } else {
            if (!(s[nodeName] instanceof Array)) {
              s[nodeName] = [];
            }
            return s[nodeName].push(obj);
          }
        } else {
          if (_this.options.explicitRoot) {
            old = obj;
            obj = {};
            obj[nodeName] = old;
          }
          _this.resultObject = obj;
          return _this.emit("end", _this.resultObject);
        }
      };
      return this.saxParser.ontext = this.saxParser.oncdata = function(text) {
        var s;
        s = stack[stack.length - 1];
        if (s) {
          return s[charkey] += text;
        }
      };
    };

    Parser.prototype.parseString = function(str, cb) {
      if ((cb != null) && typeof cb === "function") {
        this.on("end", function(result) {
          this.reset();
          return process.nextTick(function() {
            return cb(null, result);
          });
        });
        this.on("error", function(err) {
          this.reset();
          return process.nextTick(function() {
            return cb(err);
          });
        });
      }
      if (str.toString().trim() === '') {
        this.emit("end", null);
        return true;
      }
      return this.saxParser.write(str.toString());
    };

    return Parser;

  })(events.EventEmitter);

  exports.parseString = function(str, a, b) {
    var cb, options, parser;
    if (b != null) {
      if (typeof b === 'function') {
        cb = b;
      }
      if (typeof a === 'object') {
        options = a;
      }
    } else {
      if (typeof a === 'function') {
        cb = a;
      }
      options = {};
    }
    parser = new exports.Parser(options);
    return parser.parseString(str, cb);
  };

}).call(this);
