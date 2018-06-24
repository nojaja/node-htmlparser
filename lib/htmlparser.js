"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/***********************************************
Copyright 2010 - 2012 Chris Winberry <chris@winberry.net>. All rights reserved.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
***********************************************/
/* v3.0.0 */

(function () {
  var exports;
  if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    exports = module.exports;
  } else {
    exports = {};
    if (!this.Tautologistics) {
      this.Tautologistics = {};
    }
    if (this.Tautologistics.NodeHtmlParser) {
      return;
    }
    this.Tautologistics.NodeHtmlParser = exports;
  }

  function inherits(ctor, superCtor) {
    var tempCtor = function tempCtor() {};
    tempCtor.prototype = superCtor.prototype;
    ctor.super_ = superCtor;
    ctor.prototype = new tempCtor();
    ctor.prototype.constructor = ctor;
  }

  function setPrototypeOfDomUtils(array) {}

  var Mode = {
    Text: "text",
    Script: "script",
    Tag: "tag",
    Attr: "attr",
    CData: "cdata",
    Doctype: "doctype",
    Comment: "comment"
  };
  var TagType = [{
    langName: "mustache",
    open: "{{",
    close: "}}",
    openCode: "\uFFF0",
    closeCode: "\uFFF1"
  }, {
    langName: "singleMustache",
    open: "{",
    close: "}",
    openCode: "\uFFF2",
    closeCode: "\uFFF3"
  }];

  var opentags = [];
  TagType.forEach(function (tagtype) {
    opentags.push(tagtype.openCode);
  }, this);

  var Parser = function () {
    function Parser(builder, options) {
      _classCallCheck(this, Parser);

      this.writable = true;

      this._options = options ? options : {};
      // if (this._options.includeLocation === undefined) {
      //     this._options.includeLocation = false; //Include position of element (row, col) on nodes
      // }
      this._validateBuilder(builder);
      var self = this;
      this._builder = builder;
      this.reset();

      this.writable = true;
      var parseText = new ParseText(this);
      this._parseText = parseText._parseText;
      var parseScript = new ParseScript(this);
      this._parseScript = parseScript._parseScript;
      var parseTag = new ParseTag(this);
      this._parseTag = parseTag._parseTag;
      var parseAttr = new ParseAttr(this);
      this._parseAttr = parseAttr._parseAttr;
      var parseCData = new ParseCData(this);
      this._parseCData = parseCData._parseCData;
      var parseDoctype = new ParseDoctype(this);
      this._parseDoctype = parseDoctype._parseDoctype;
      var parseComment = new ParseComment(this);
      this._parseComment = parseComment._parseComment;
    }

    _createClass(Parser, [{
      key: "write",
      value: function write(data) {
        if (data instanceof Buffer) {
          data = data.toString();
        }
        this.parseChunk(data);
      }
    }, {
      key: "end",
      value: function end(data) {
        if (arguments.length) {
          this.write(data);
        }
        this.writable = false;
        this.done();
      }
    }, {
      key: "destroy",
      value: function destroy() {
        this.writable = false;
      }
      //**Public**//

    }, {
      key: "reset",
      value: function reset() {
        this._state = {
          mode: Mode.Text,
          lastMode: Mode.Text,
          pos: 0,
          data: null,
          pendingText: null,
          pendingWrite: null,
          lastTag: null,
          isScript: false,
          needData: false,
          output: [],
          done: false,
          commentTagType: ">",
          scriptTagType: null
          // line: 1,
          // col: 1
        };
        this._builder.reset();
      }
    }, {
      key: "parseChunk",
      value: function parseChunk(chunk) {
        this._state.needData = false;
        this._state.data = this._state.data !== null ? this._state.data.substr(this.pos) + chunk : chunk;
        while (this._state.pos < this._state.data.length && !this._state.needData) {
          this._parse(this._state);
        }
      }
    }, {
      key: "parseComplete",
      value: function parseComplete(data) {
        if (!data) return;
        this.reset();
        TagType.forEach(function (tagtype) {
          data = data.replace(new RegExp(tagtype.open, "g"), tagtype.openCode).replace(new RegExp(tagtype.close, "g"), tagtype.closeCode);
        }, this);
        this.parseChunk(data);
        this.done();
      }
    }, {
      key: "done",
      value: function done() {
        this._state.done = true;
        this._parse(this._state);
        this._flushWrite();
        this._builder.done();
      }

      //**Private**//

    }, {
      key: "_validateBuilder",
      value: function _validateBuilder(builder) {
        if ((typeof builder === "undefined" ? "undefined" : _typeof(builder)) != "object") {
          throw new Error("Builder is not an object");
        }
        if (typeof builder.reset != "function") {
          throw new Error("Builder method 'reset' is invalid");
        }
        if (typeof builder.done != "function") {
          throw new Error("Builder method 'done' is invalid");
        }
        if (typeof builder.write != "function") {
          throw new Error("Builder method 'write' is invalid");
        }
        if (typeof builder.error != "function") {
          throw new Error("Builder method 'error' is invalid");
        }
      }
    }, {
      key: "_parse",
      value: function _parse() {
        switch (this._state.mode) {
          case Mode.Text:
            return this._parseText(this._state);
          case Mode.Script:
            return this._parseScript(this._state);
          case Mode.Tag:
            return this._parseTag(this._state);
          case Mode.Attr:
            return this._parseAttr(this._state);
          case Mode.CData:
            return this._parseCData(this._state);
          case Mode.Doctype:
            return this._parseDoctype(this._state);
          case Mode.Comment:
            return this._parseComment(this._state);
        }
      }
    }, {
      key: "_writePending",
      value: function _writePending(node) {
        if (!this._state.pendingWrite) {
          this._state.pendingWrite = [];
        }
        this._state.pendingWrite.push(node);
      }
    }, {
      key: "_flushWrite",
      value: function _flushWrite() {
        if (this._state.pendingWrite) {
          for (var i = 0, len = this._state.pendingWrite.length; i < len; i++) {
            var node = this._state.pendingWrite[i];
            this._builder.write(node);
          }
          this._state.pendingWrite = null;
        }
      }
    }, {
      key: "_write",
      value: function _write(node) {
        this._flushWrite();
        this._builder.write(node);
      }
    }]);

    return Parser;
  }();

  var ParseText = function ParseText(perser) {
    var _this = this;

    _classCallCheck(this, ParseText);

    this._re_parseText_tagOpen = new RegExp("([\\<" + opentags.join("") + "])", "g");
    this._re_parseText_scriptClose = /<\s*\/\s*(x\-)?script/gi;

    this._parseText = function (state) {
      var nextMode = Mode.Tag;
      var foundPos;
      if (state.isScript) {
        _this._re_parseText_scriptClose.lastIndex = state.pos;
        foundPos = _this._re_parseText_scriptClose.exec(state.data);
        foundPos = foundPos ? foundPos.index : -1;
      } else {
        _this._re_parseText_tagOpen.lastIndex = state.pos;
        var match = _this._re_parseText_tagOpen.exec(state.data);
        if (match) {
          if (match[0] == "<") {
            nextMode = Mode.Tag;
            foundPos = match.index;
          } else {
            TagType.forEach(function (tagtype) {
              if (match[0] == tagtype.openCode) {
                nextMode = Mode.Script;
                state.lastMode = Mode.Text;
                foundPos = match.index;
                state.scriptTagType = tagtype;
              }
            }, _this.perser);
          }
        } else {
          nextMode = Mode.Tag;
          foundPos = -1;
        }
      }
      var text = foundPos === -1 ? state.data.substring(state.pos, state.data.length) : state.data.substring(state.pos, foundPos);
      if (foundPos < 0 && state.done) {
        foundPos = state.data.length;
      }
      if (foundPos < 0) {
        if (state.isScript) {
          state.needData = true;
          return;
        }
        if (!state.pendingText) {
          state.pendingText = [];
        }
        state.pendingText.push(state.data.substring(state.pos, state.data.length));
        state.pos = state.data.length;
      } else {
        if (state.pendingText) {
          state.pendingText.push(state.data.substring(state.pos, foundPos));
          text = state.pendingText.join("");
          state.pendingText = null;
        } else {
          text = state.data.substring(state.pos, foundPos);
        }
        if (text !== "") {
          _this.perser._write({ type: Mode.Text, data: text });
        }
        state.pos = foundPos + 1;
        state.mode = nextMode;
      }
    };

    this.perser = perser;
  };

  var ParseScript = function ParseScript(perser) {
    var _this2 = this;

    _classCallCheck(this, ParseScript);

    this.re_parseScript = /\s*([\/\#][^\s\}]+)?(\!\-*)?\s*([^\}]*?)\}/g;

    this._parseScript = function (state) {
      var re_parseScript = "\\s*([\\/\\#][^\\s" + state.scriptTagType.closeCode + "]+)?(\\!\\-*)?\\s*([^" + state.scriptTagType.closeCode + "]*?)" + state.scriptTagType.closeCode;
      _this2.re_parseScript = new RegExp(re_parseScript, "g");

      _this2.re_parseScript.lastIndex = state.pos;
      var match = _this2.re_parseScript.exec(state.data);
      if (match) {
        state.mode = Mode.Script;
        if (match[2] && match[2].substr(0, 3) === "!--") {
          state.mode = Mode.Comment;
          state.commentTagType = state.scriptTagType.closeCode;
          state.pos += 3;
          return;
        }
        if (match[2] && match[2].charAt(0) == "!") {
          state.mode = Mode.Comment;
          state.commentTagType = state.scriptTagType.closeCode;
          state.pos += 1;
        }
        var text = match[3];
        if (state.pendingText) {
          state.pendingText.push(text);
          text = state.pendingText.join("");
          state.pendingText = null;
        }
        if (text !== "") {
          _this2.perser._write({
            type: state.mode,
            name: match[1] || match[2],
            data: text,
            langName: state.scriptTagType.langName
          });
        }
        state.pos += match[0].length;
        state.mode = state.lastMode;
      } else {
        //TODO: end of tag?
        //TODO: push to pending?
        state.needData = true;
      }
    };

    this.perser = perser;
  };

  var ParseTag = function ParseTag(perser) {
    var _this3 = this;

    _classCallCheck(this, ParseTag);

    this.re_parseTag = /\s*(\/?)\s*([^\s>\/]+)(\s*)\??(>?)/g;

    this._parseTag = function (state) {
      _this3.re_parseTag.lastIndex = state.pos;
      var match = _this3.re_parseTag.exec(state.data);
      if (match) {
        if (!match[1] && match[2].substr(0, 3) === "!--") {
          state.mode = Mode.Comment;
          state.commentTagType = ">";
          state.pos += 3;
          return;
        }
        if (!match[1] && match[2].substr(0, 8) === "![CDATA[") {
          state.mode = Mode.CData;
          state.pos += 8;
          return;
        }
        if (!match[1] && match[2].substr(0, 8) === "!DOCTYPE") {
          state.mode = Mode.Doctype;
          state.pos += 8;
          return;
        }
        if (!state.done && state.pos + match[0].length === state.data.length) {
          //We're at the and of the data, might be incomplete
          state.needData = true;
          return;
        }
        var raw;
        if (match[4] === ">") {
          state.mode = Mode.Text;
          raw = match[0].substr(0, match[0].length - 1);
        } else {
          state.mode = Mode.Attr;
          raw = match[0];
        }
        state.pos += match[0].length;
        var tag = { type: Mode.Tag, name: match[1] + match[2], raw: raw };
        if (state.mode === Mode.Attr) {
          state.lastTag = tag;
        }
        if (tag.name.toLowerCase() === "script") {
          state.isScript = true;
        } else if (tag.name.toLowerCase() === "/script") {
          state.isScript = false;
        }
        if (tag.name.toLowerCase() === "x-script") {
          state.isScript = true;
        } else if (tag.name.toLowerCase() === "/x-script") {
          state.isScript = false;
        }
        if (state.mode === Mode.Attr) {
          _this3.perser._writePending(tag);
        } else {
          _this3.perser._write(tag);
        }
      } else {
        //TODO: end of tag?
        //TODO: push to pending?
        state.needData = true;
      }
    };

    this.perser = perser;
  };

  var ParseAttr_findName = function ParseAttr_findName(perser) {
    var _this4 = this;

    _classCallCheck(this, ParseAttr_findName);

    this.re_parseAttr_findName = /\s*([^=<>\s'"\/]+)\s*/g;

    this._parseAttr_findName = function (state) {
      _this4.re_parseAttr_findName.lastIndex = state.pos;
      var match = _this4.re_parseAttr_findName.exec(state.data);
      if (!match) {
        return null;
      }
      if (state.pos + match[0].length !== _this4.re_parseAttr_findName.lastIndex) {
        return null;
      }
      return {
        match: match[0],
        name: match[1]
      };
    };

    this.perser = perser;
  };

  var ParseAttr_findValue = function ParseAttr_findValue(perser) {
    var _this5 = this;

    _classCallCheck(this, ParseAttr_findValue);

    this.re_parseAttr_findValue = /\s*=\s*(?:'([^']*)'|"([^"]*)"|([^'"\s\/>]+))\s*/g;
    this.re_parseAttr_findValue_last = /\s*=\s*['"]?(.*)$/g;

    this._parseAttr_findValue = function (state) {
      _this5.re_parseAttr_findValue.lastIndex = state.pos;
      var match = _this5.re_parseAttr_findValue.exec(state.data);
      if (!match) {
        if (!state.done) {
          return null;
        }
        _this5.re_parseAttr_findValue_last.lastIndex = state.pos;
        match = _this5.re_parseAttr_findValue_last.exec(state.data);
        if (!match) {
          return null;
        }
        return {
          match: match[0],
          value: match[1] !== "" ? match[1] : null
        };
      }
      if (state.pos + match[0].length !== _this5.re_parseAttr_findValue.lastIndex) {
        return null;
      }
      return {
        match: match[0],
        value: match[1] || match[2] || match[3]
      };
    };

    this.perser = perser;
  };

  var ParseAttr = function ParseAttr(perser) {
    var _this6 = this;

    _classCallCheck(this, ParseAttr);

    this.re_parseAttr_splitValue = /^\s*=\s*['"]?/g;
    this.re_parseAttr_selfClose = /(\s*\/\s*)(>?)/g;

    this._parseAttr = function (state) {
      var name_data = _this6.parseAttr_findName._parseAttr_findName(state);
      if (!name_data || name_data.name === "?") {
        _this6.re_parseAttr_selfClose.lastIndex = state.pos;
        var matchTrailingSlash = _this6.re_parseAttr_selfClose.exec(state.data);
        if (matchTrailingSlash && matchTrailingSlash.index === state.pos) {
          if (!state.done && !matchTrailingSlash[2] && state.pos + matchTrailingSlash[0].length === state.data.length) {
            state.needData = true;
            return;
          }
          state.lastTag.raw += matchTrailingSlash[1];
          // state.output.push({ type: Mode.Tag, name: '/' + state.lastTag.name, raw: null });
          _this6._write({
            type: Mode.Tag,
            name: "/" + state.lastTag.name,
            raw: null
          });
          state.pos += matchTrailingSlash[1].length;
        }
        var foundPos = state.data.indexOf(">", state.pos);
        if (foundPos < 0) {
          if (state.done) {
            //TODO: is this needed?
            state.lastTag.raw += state.data.substr(state.pos);
            state.pos = state.data.length;
            return;
          }
          state.needData = true;
        } else {
          // state.lastTag = null;
          state.pos = foundPos + 1;
          state.mode = Mode.Text;
        }
        return;
      }
      if (!state.done && state.pos + name_data.match.length === state.data.length) {
        state.needData = true;
        return null;
      }
      state.pos += name_data.match.length;
      var value_data = _this6.parseAttr_findValue._parseAttr_findValue(state);
      if (value_data) {
        if (!state.done && state.pos + value_data.match.length === state.data.length) {
          state.needData = true;
          state.pos -= name_data.match.length;
          return;
        }
        state.pos += value_data.match.length;
      } else {
        _this6.re_parseAttr_splitValue.lastIndex = state.pos;
        if (_this6.re_parseAttr_splitValue.exec(state.data)) {
          state.needData = true;
          state.pos -= name_data.match.length;
          return;
        }
        value_data = {
          match: "",
          value: null
        };
      }
      state.lastTag.raw += name_data.match + value_data.match;

      var foundCloseScriptPos = -1;
      var data = [];
      if (value_data.value) {
        var handler = new HtmlBuilder(function (err, dom) {}, _this6.perser._builder._options);
        var parser = new Parser(handler);
        parser.parseComplete(value_data.value);
        data = handler.dom;
      }

      _this6.perser._writePending({ type: Mode.Attr, name: name_data.name, data: data });
    };

    this.perser = perser;
    this.parseAttr_findName = new ParseAttr_findName(perser);
    this.parseAttr_findValue = new ParseAttr_findValue(perser);
  };

  var ParseCData = function ParseCData(perser) {
    var _this7 = this;

    _classCallCheck(this, ParseCData);

    this.re_parseCData_findEnding = /\]{1,2}$/;

    this._parseCData = function (state) {
      var foundPos = state.data.indexOf("]]>", state.pos);
      if (foundPos < 0 && state.done) {
        foundPos = state.data.length;
      }
      if (foundPos < 0) {
        _this7.re_parseCData_findEnding.lastIndex = state.pos;
        var matchPartialCDataEnd = _this7.re_parseCData_findEnding.exec(state.data);
        if (matchPartialCDataEnd) {
          state.needData = true;
          return;
        }
        if (!state.pendingText) {
          state.pendingText = [];
        }
        state.pendingText.push(state.data.substr(state.pos, state.data.length));
        state.pos = state.data.length;
        state.needData = true;
      } else {
        var text;
        if (state.pendingText) {
          state.pendingText.push(state.data.substring(state.pos, foundPos));
          text = state.pendingText.join("");
          state.pendingText = null;
        } else {
          text = state.data.substring(state.pos, foundPos);
        }
        _this7.perser._write({ type: Mode.CData, data: text });
        state.mode = Mode.Text;
        state.pos = foundPos + 3;
      }
    };

    this.perser = perser;
  };

  var ParseDoctype = function ParseDoctype(perser) {
    var _this8 = this;

    _classCallCheck(this, ParseDoctype);

    this._parseDoctype = function (state) {
      var foundPos = state.data.indexOf(">", state.pos);
      if (foundPos < 0 && state.done) {
        foundPos = state.data.length;
      }
      if (foundPos < 0) {
        _this8.re_parseCData_findEnding.lastIndex = state.pos;
        if (!state.pendingText) {
          state.pendingText = [];
        }
        state.pendingText.push(state.data.substr(state.pos, state.data.length));
        state.pos = state.data.length;
        state.needData = true;
      } else {
        var text;
        if (state.pendingText) {
          state.pendingText.push(state.data.substring(state.pos, foundPos));
          text = state.pendingText.join("");
          state.pendingText = null;
        } else {
          text = state.data.substring(state.pos, foundPos);
        }
        _this8.perser._write({ type: Mode.Doctype, data: text });
        state.mode = Mode.Text;
        state.pos = foundPos + 1;
      }
    };

    this.perser = perser;
  };

  var ParseComment = function ParseComment(perser) {
    var _this9 = this;

    _classCallCheck(this, ParseComment);

    this.re_parseComment_findEnding = /\-{1,2}$/;

    this._parseComment = function (state) {
      var foundPos = state.data.indexOf("--" + state.commentTagType, state.pos);
      if (foundPos < 0 && state.done) {
        foundPos = state.data.length;
      }
      if (foundPos < 0) {
        _this9.re_parseComment_findEnding.lastIndex = state.pos;
        var matchPartialCommentEnd = _this9.re_parseComment_findEnding.exec(state.data);
        if (matchPartialCommentEnd) {
          state.needData = true;
          return;
        }
        if (!state.pendingText) {
          state.pendingText = [];
        }
        state.pendingText.push(state.data.substr(state.pos, state.data.length));
        state.pos = state.data.length;
        state.needData = true;
      } else {
        var text;
        if (state.pendingText) {
          state.pendingText.push(state.data.substring(state.pos, foundPos));
          text = state.pendingText.join("");
          state.pendingText = null;
        } else {
          text = state.data.substring(state.pos, foundPos);
        }
        _this9.perser._write({ type: Mode.Comment, data: text });
        state.mode = Mode.Text;
        state.pos = foundPos + 3;
      }
    };

    this.perser = perser;
  };

  if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    var Stream = require("stream");
    inherits(Parser, Stream);
  }

  var HtmlBuilder = function () {
    function HtmlBuilder(callback, options) {
      _classCallCheck(this, HtmlBuilder);

      //Properties//
      this._options = null; //Builder options for how to behave
      this._callback = null; //Callback to respond to when parsing done
      this._done = false; //Flag indicating whether builder has been notified of parsing completed
      this._tagStack = null; //List of parents to the currently element being processed


      this.reset();
      if (typeof callback == "function") {
        this._callback = callback;
      } else {
        options = callback;
      }
      this._options = options ? options : {};
      if (this._options.ignoreWhitespace === undefined) {
        this._options.ignoreWhitespace = false; //Keep whitespace-only text nodes
      }
      if (this._options.includeLocation === undefined) {
        this._options.includeLocation = false; //Include position of element (row, col) on nodes
      }
      if (this._options.verbose === undefined) {
        this._options.verbose = true; //Keep data property for tags and raw property for all
      }
      if (this._options.enforceEmptyTags === undefined) {
        this._options.enforceEmptyTags = true; //Don't allow children for HTML tags defined as empty in spec
      }
      if (this._options.caseSensitiveTags === undefined) {
        this._options.caseSensitiveTags = false; //Lowercase all tag names
      }
      if (this._options.caseSensitiveAttr === undefined) {
        this._options.caseSensitiveAttr = false; //Lowercase all attribute names
      }
      //HTML Tags that shouldn't contain child nodes
      this._emptyTags = {
        area: 1,
        base: 1,
        basefont: 1,
        br: 1,
        col: 1,
        frame: 1,
        hr: 1,
        img: 1,
        input: 1,
        isindex: 1,
        link: 1,
        meta: 1,
        param: 1,
        embed: 1,
        "?xml": 1,
        wbr: 1
      };
      //Regex to detect whitespace only text nodes
      this.reWhitespace = /^\s*$/;
      //Properties//
      this.dom = null; //The hierarchical object containing the parsed HTML
    }
    //Methods//
    //Resets the builder back to starting state


    _createClass(HtmlBuilder, [{
      key: "reset",
      value: function reset() {
        this.dom = [];
        setPrototypeOfDomUtils(this.dom);
        // this._raw = [];
        this._done = false;
        this._tagStack = [];
        this._lastTag = null;
        this._tagStack.last = function HtmlBuilder$_tagStack$last() {
          return this.length ? this[this.length - 1] : null;
        };
        this._line = 1;
        this._col = 1;
      }
    }, {
      key: "done",

      //Signals the builder that parsing is done
      value: function done() {
        this._done = true;
        this.handleCallback(null);
      }
    }, {
      key: "error",
      value: function error(_error) {
        this.handleCallback(_error);
      }
    }, {
      key: "handleCallback",
      value: function handleCallback(error) {
        if (typeof this._callback != "function") {
          if (error) {
            throw error;
          } else {
            return;
          }
        }
        this._callback(error, this.dom);
      }
    }, {
      key: "isEmptyTag",
      value: function isEmptyTag(element) {
        var name = element.name.toLowerCase();
        if (name.charAt(0) == "?") {
          return true;
        }
        if (name.charAt(0) == "/") {
          name = name.substring(1);
        }
        return this._options.enforceEmptyTags && !!this._emptyTags[name];
      }
    }, {
      key: "_getLocation",
      value: function _getLocation() {
        return { line: this._line, col: this._col };
      }
    }, {
      key: "_updateLocation",


      // HtmlBuilder.reLineSplit = /(\r\n|\r|\n)/g;
      value: function _updateLocation(node) {
        var positionData = node.type === Mode.Tag ? node.raw : node.data;
        if (positionData === null) {
          return;
        }
        // var lines = positionData.split(HtmlBuilder.reLineSplit);
        var lines = positionData.split("\n");
        this._line += lines.length - 1;
        if (lines.length > 1) {
          this._col = 1;
        }
        this._col += lines[lines.length - 1].length;
        if (node.type === Mode.Tag) {
          this._col += 2;
        } else if (node.type === Mode.Comment) {
          this._col += 7;
        } else if (node.type === Mode.CData) {
          this._col += 12;
        }
      }
    }, {
      key: "_copyElement",
      value: function _copyElement(element, parentNode) {
        //var newElement = { type: element.type, parentNode: parentNode};
        var newElement = new Element(element.type, parentNode);

        if (this._options.verbose && element["raw"] !== undefined) {
          newElement.raw = element.raw;
        }
        if (element["name"] !== undefined) {
          switch (element.type) {
            case Mode.Tag:
              newElement.name = this._options.caseSensitiveTags ? element.name : element.name.toLowerCase();
              break;

            case Mode.Attr:
              newElement.name = this._options.caseSensitiveAttr ? element.name : element.name.toLowerCase();
              break;

            default:
              newElement.name = this._options.caseSensitiveTags ? element.name : element.name.toLowerCase();
              break;
          }
        }
        if (element["data"] !== undefined) {
          TagType.forEach(function (tagtype) {
            element.data = element.data.replace(new RegExp(tagtype.openCode, "g"), tagtype.open).replace(new RegExp(tagtype.closeCode, "g"), tagtype.close);
          }, this);
          newElement.data = element.data;
        }

        if (element["langName"] !== undefined) {
          newElement.langName = element.langName;
        }

        if (element.location) {
          newElement.location = {
            line: element.location.line,
            col: element.location.col
          };
        }

        return newElement;
      }
    }, {
      key: "write",
      value: function write(element) {
        // this._raw.push(element);
        if (this._done) {
          this.handleCallback(new Error("Writing to the builder after done() called is not allowed without a reset()"));
        }
        if (this._options.includeLocation) {
          if (element.type !== Mode.Attr) {
            element.location = this._getLocation();
            this._updateLocation(element);
          }
        }
        if (element.type === Mode.Text && this._options.ignoreWhitespace) {
          if (this.reWhitespace.test(element.data)) {
            return;
          }
        }
        var parent;
        var node;
        if (!this._tagStack.last()) {
          //There are no parent elements
          //If the element can be a container, add it to the tag stack and the top level list
          if (element.type === Mode.Tag) {
            if (element.name.charAt(0) != "/") {
              //Ignore closing tags that obviously don't have an opening tag
              node = this._copyElement(element);
              this.dom.push(node);
              if (!this.isEmptyTag(node)) {
                //Don't add tags to the tag stack that can't have children
                this._tagStack.push(node);
              }
              this._lastTag = node;
            }
          } else if (element.type === Mode.Attr && this._lastTag) {
            if (!this._lastTag.attributes) {
              this._lastTag.attributes = {};
            }
            this._lastTag.attributes[this._options.caseSensitiveAttr ? element.name : element.name.toLowerCase()] = element.data;
          } else if (element.type === Mode.Script) {
            if (element.name && element.name.charAt(0) == "/") {
              return;
            } else if (element.name && element.name.charAt(0) == "!") {
              element.name = this._options.caseSensitiveTags ? element.name.substring(1) : element.name.substring(1).toLowerCase();
              node = this._copyElement(element);
              this.dom.push(node);
              this._lastTag = node;
            } else if (element.name) {
              if (element.name) element.name = this._options.caseSensitiveTags ? element.name.substring(1) : element.name.substring(1).toLowerCase();
              node = this._copyElement(element);
              this.dom.push(node);
              this._tagStack.push(node); //Don't add tags to the tag stack that can't have children
              this._lastTag = node;
            } else {
              //This is not a closing tag
              node = this._copyElement(element);
              this.dom.push(node);
              this._lastTag = node;
            }
          } else {
            //Otherwise just add to the top level list
            this.dom.push(this._copyElement(element));
          }
        } else {
          //There are parent elements
          //If the element can be a container, add it as a child of the element
          //on top of the tag stack and then add it to the tag stack
          if (element.type === Mode.Tag) {
            if (element.name.charAt(0) == "/") {
              //This is a closing tag, scan the tagStack to find the matching opening tag
              //and pop the stack up to the opening tag's parent
              var baseName = this._options.caseSensitiveTags ? element.name.substring(1) : element.name.substring(1).toLowerCase();
              if (!this.isEmptyTag(element)) {
                var pos = this._tagStack.length - 1;
                while (pos > -1 && this._tagStack[pos--].name != baseName) {}
                if (pos > -1 || this._tagStack[0].name == baseName) {
                  while (pos < this._tagStack.length - 1) {
                    this._tagStack.pop();
                  }
                }
              }
            } else {
              //This is not a closing tag
              parent = this._tagStack.last();
              if (element.type === Mode.Attr) {
                if (!parent.attributes) {
                  parent.attributes = {};
                }
                parent.attributes[this._options.caseSensitiveAttr ? element.name : element.name.toLowerCase()] = element.data;
              } else {
                node = this._copyElement(element, parent);
                if (!parent.children) {
                  parent.children = [];
                }
                parent.children.push(node);
                if (!this.isEmptyTag(node)) {
                  //Don't add tags to the tag stack that can't have children
                  this._tagStack.push(node);
                }
                if (element.type === Mode.Tag) {
                  this._lastTag = node;
                }
              }
            }
          } else if (element.type === Mode.Script) {
            if (element.name && element.name.charAt(0) == "/") {
              //This is a closing tag, scan the tagStack to find the matching opening tag
              //and pop the stack up to the opening tag's parent
              var baseName = this._options.caseSensitiveTags ? element.name.substring(1) : element.name.substring(1).toLowerCase();
              if (!this.isEmptyTag(element)) {
                var pos = this._tagStack.length - 1;
                while (pos > -1 && this._tagStack[pos--].name != baseName) {}
                if (pos > -1 || this._tagStack[0].name == baseName) {
                  while (pos < this._tagStack.length - 1) {
                    this._tagStack.pop();
                  }
                }
              }
            } else if (element.name && element.name.charAt(0) == "!") {
              parent = this._tagStack.last();
              if (element.name) element.name = this._options.caseSensitiveTags ? element.name.substring(1) : element.name.substring(1).toLowerCase();
              node = this._copyElement(element, parent);
              if (!parent.children) {
                parent.children = [];
              }
              parent.children.push(node);
              this._lastTag = node;
            } else {
              //This is not a closing tag
              parent = this._tagStack.last();
              if (element.name) element.name = this._options.caseSensitiveTags ? element.name.substring(1) : element.name.substring(1).toLowerCase();
              node = this._copyElement(element, parent);
              if (!parent.children) {
                parent.children = [];
              }
              parent.children.push(node);
              if (element.name) {
                //Don't add tags to the tag stack that can't have children
                this._tagStack.push(node); //子要素にする
              }
              this._lastTag = node;
            }
          } else {
            //This is not a container element
            parent = this._tagStack.last();
            if (element.type === Mode.Attr) {
              if (!this._lastTag.attributes) {
                this._lastTag.attributes = {};
              }
              this._lastTag.attributes[this._options.caseSensitiveAttr ? element.name : element.name.toLowerCase()] = element.data;
              /*
                        if (!parent.attributes) {
                            parent.attributes = {};
                        }
                        parent.attributes[this._options.caseSensitiveAttr ? element.name : element.name.toLowerCase()] =
                            element.data;
                      */
            } else {
              if (!parent.children) {
                parent.children = [];
              }
              parent.children.push(this._copyElement(element, parent));
            }
          }
        }
      }
    }]);

    return HtmlBuilder;
  }();

  var Element = function () {
    function Element(_type, _parentNode) {
      _classCallCheck(this, Element);

      this.type = _type;
      this.parentNode = _parentNode;
    }

    _createClass(Element, [{
      key: "getElementById",
      value: function getElementById(id, recurse) {
        return DomUtils.getElementById(id, this, recurse);
      }
    }, {
      key: "getElementsByTagName",
      value: function getElementsByTagName(id, recurse, limit) {
        return DomUtils.getElementsByTagName(id, this, recurse, limit);
      }
    }, {
      key: "getElementsByTagType",
      value: function getElementsByTagType(type, recurse, limit) {
        return DomUtils.getElementsByTagType(type, this, recurse, limit);
      }
    }, {
      key: "getElements",
      value: function getElements(options, recurse, limit) {
        return DomUtils.getElements(options, this, recurse, limit);
      }
    }, {
      key: "removeChildAll",
      value: function removeChildAll() {
        return DomUtils.removeChildAll(this);
      }
    }, {
      key: "removeChild",
      value: function removeChild(element) {
        return DomUtils.removeChild(element, this);
      }
    }, {
      key: "createNode",
      value: function createNode(type, parentNode) {
        return new Element(type, parentNode || null);
      }
    }, {
      key: "createElement",
      value: function createElement(tagName, parentNode) {
        var newElement = new Element("tag", parentNode || null);
        newElement.name = tagName;
        return newElement;
      }
    }, {
      key: "createTextNode",
      value: function createTextNode(text, parentNode) {
        var newElement = new Element("text", parentNode || null);
        newElement.data = text;
        return newElement;
      }
    }, {
      key: "appendChild",
      value: function appendChild(element) {
        this.children = this.children || [];
        element.parentNode = this;
        this.children.push(element);
      }
    }, {
      key: "insertBefore",
      value: function insertBefore(newNode, referenceNode) {
        this.children = this.children || [];
        var index = this.children.indexOf(referenceNode);
        this.children.splice(index, 0, newNode);
      }
    }, {
      key: "getAttribute",
      value: function getAttribute(name) {
        this.attributes[name];
      }
    }, {
      key: "cloneElement",
      value: function cloneElement(parentNode) {
        function cloneAttributes(attributes) {
          var newAttributes = {};
          for (var key in attributes) {
            var attribute = attributes[key]; //list
            var _attribute = [];
            for (var i = 0; i < attribute.length; i++) {
              var attributeElement = attribute[i]; //object {type,data,langName}
              var _attributeElement = {
                type: attributeElement.type,
                data: attributeElement.data
              };
              if (attributeElement.langName) _attributeElement.langName = attributeElement.langName;
              _attribute.push(_attributeElement);
            }
            newAttributes[key] = _attribute;
          }
          return newAttributes;
        }
        var newElement = this.createNode(this.type, parentNode || {});
        if (this.name) newElement.name = this.name;
        if (this.raw) newElement.raw = this.raw;
        if (this.location) newElement.location = {
          line: this.location.line,
          col: this.location.col
        };
        if (this.langName) newElement.langName = this.langName;
        if (this.data) newElement.data = this.data;

        if (this.attributes) newElement.attributes = cloneAttributes(this.attributes);
        if (this.children) {
          newElement.children = [];
          for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            child.cloneElement(newElement);
          }
        }
        if (newElement.parentNode.children) {
          newElement.parentNode.children.push(newElement);
        } else {
          newElement.parentNode.children = [newElement];
        }
        return newElement;
      }
    }, {
      key: "nextSibling",
      get: function get() {
        if (!this.parentNode || !this.parentNode.children) return null;
        var i = this.parentNode.children.indexOf(this);
        if (i == -1 || this.parentNode.children.lenght <= i) return null;
        return this.parentNode.children[i + 1];
      }
    }, {
      key: "attribs",
      get: function get() {
        if (!this.attributes) return null;
        var ret = {};
        for (var _key in this.attributes) {
          var content = "";
          this.attributes[_key].forEach(function (_row) {
            content = _row.data || "";
          });
          ret[_key] = content;
        }
        console.log("attribs", ret);
        return ret;
      }
    }]);

    return Element;
  }();

  function RssBuilder(callback) {
    RssBuilder.super_.call(this, callback, {
      ignoreWhitespace: true,
      verbose: false,
      enforceEmptyTags: false,
      caseSensitiveTags: true
    });
  }
  inherits(RssBuilder, HtmlBuilder);

  RssBuilder.prototype.done = function RssBuilder$done() {
    var feed = {};
    var feedRoot;

    var found = DomUtils.getElementsByTagName(function (value) {
      return value == "rss" || value == "feed";
    }, this.dom, false);
    if (found.length) {
      feedRoot = found[0];
    }
    if (feedRoot) {
      if (feedRoot.name == "rss") {
        feed.type = "rss";
        feedRoot = feedRoot.children[0]; //<channel/>
        feed.id = "";
        try {
          feed.title = DomUtils.getElementsByTagName("title", feedRoot.children, false)[0].children[0].data;
        } catch (ex) {}
        try {
          feed.link = DomUtils.getElementsByTagName("link", feedRoot.children, false)[0].children[0].data;
        } catch (ex) {}
        try {
          feed.description = DomUtils.getElementsByTagName("description", feedRoot.children, false)[0].children[0].data;
        } catch (ex) {}
        try {
          feed.updated = new Date(DomUtils.getElementsByTagName("lastBuildDate", feedRoot.children, false)[0].children[0].data);
        } catch (ex) {}
        try {
          feed.author = DomUtils.getElementsByTagName("managingEditor", feedRoot.children, false)[0].children[0].data;
        } catch (ex) {}
        feed.items = [];
        DomUtils.getElementsByTagName("item", feedRoot.children).forEach(function (item, index, list) {
          var entry = {};
          try {
            entry.id = DomUtils.getElementsByTagName("guid", item.children, false)[0].children[0].data;
          } catch (ex) {}
          try {
            entry.title = DomUtils.getElementsByTagName("title", item.children, false)[0].children[0].data;
          } catch (ex) {}
          try {
            entry.link = DomUtils.getElementsByTagName("link", item.children, false)[0].children[0].data;
          } catch (ex) {}
          try {
            entry.description = DomUtils.getElementsByTagName("description", item.children, false)[0].children[0].data;
          } catch (ex) {}
          try {
            entry.pubDate = new Date(DomUtils.getElementsByTagName("pubDate", item.children, false)[0].children[0].data);
          } catch (ex) {}
          feed.items.push(entry);
        });
      } else {
        feed.type = "atom";
        try {
          feed.id = DomUtils.getElementsByTagName("id", feedRoot.children, false)[0].children[0].data;
        } catch (ex) {}
        try {
          feed.title = DomUtils.getElementsByTagName("title", feedRoot.children, false)[0].children[0].data;
        } catch (ex) {}
        try {
          feed.link = DomUtils.getElementsByTagName("link", feedRoot.children, false)[0].attributes.href.value;
        } catch (ex) {}
        try {
          feed.description = DomUtils.getElementsByTagName("subtitle", feedRoot.children, false)[0].children[0].data;
        } catch (ex) {}
        try {
          feed.updated = new Date(DomUtils.getElementsByTagName("updated", feedRoot.children, false)[0].children[0].data);
        } catch (ex) {}
        try {
          feed.author = DomUtils.getElementsByTagName("email", feedRoot.children, true)[0].children[0].data;
        } catch (ex) {}
        feed.items = [];
        DomUtils.getElementsByTagName("entry", feedRoot.children).forEach(function (item, index, list) {
          var entry = {};
          try {
            entry.id = DomUtils.getElementsByTagName("id", item.children, false)[0].children[0].data;
          } catch (ex) {}
          try {
            entry.title = DomUtils.getElementsByTagName("title", item.children, false)[0].children[0].data;
          } catch (ex) {}
          try {
            entry.link = DomUtils.getElementsByTagName("link", item.children, false)[0].attributes.href.value;
          } catch (ex) {}
          try {
            entry.description = DomUtils.getElementsByTagName("summary", item.children, false)[0].children[0].data;
          } catch (ex) {}
          try {
            entry.pubDate = new Date(DomUtils.getElementsByTagName("updated", item.children, false)[0].children[0].data);
          } catch (ex) {}
          feed.items.push(entry);
        });
      }

      this.dom = feed;
    }
    RssBuilder.super_.prototype.done.call(this);
  };

  var DomUtils = {
    testAttribute: function DomUtils$testAttribute(option, attributes) {
      for (var i = 0; i < attributes.length; i++) {
        if (option(attributes[i].data)) return true;
      }
      return false;
    },
    testElement: function DomUtils$testElement(options, element) {
      if (!element) {
        return false;
      }

      for (var key in options) {
        if (!options.hasOwnProperty(key)) {
          continue;
        }
        if (key == "tag_name") {
          if (element.type !== Mode.Tag) {
            return false;
          }
          if (!options["tag_name"](element.name)) {
            return false;
          }
        } else if (key == "tag_type") {
          if (!options["tag_type"](element.type)) {
            return false;
          }
        } else if (key == "tag_contains") {
          if (element.type !== Mode.Text && element.type !== Mode.Comment && element.type !== Mode.CData) {
            return false;
          }
          if (!options["tag_contains"](element.data)) {
            return false;
          }
        } else {
          //if (!element.attributes || !element.attributes[key] || !options[key](element.attributes[key].value)) {
          if (!element.attributes || !element.attributes[key] || !DomUtils.testAttribute(options[key], element.attributes[key])) {
            return false;
          }
        }
      }

      return true;
    },

    getElements: function DomUtils$getElements(options, currentElement, recurse, limit) {
      recurse = recurse === undefined || recurse === null || !!recurse;
      limit = isNaN(parseInt(limit)) ? -1 : parseInt(limit);

      var found = [];
      var elementList;
      setPrototypeOfDomUtils(found);

      if (!currentElement) {
        return found;
      }

      function getTest(checkVal) {
        return function (value) {
          return value == checkVal;
        };
      }
      for (var key in options) {
        if (typeof options[key] != "function") {
          options[key] = getTest(options[key]);
        }
      }

      if (DomUtils.testElement(options, currentElement)) {
        found.push(currentElement);
      }

      if (limit >= 0 && found.length >= limit) {
        return found;
      }

      if (recurse && currentElement.children) {
        elementList = currentElement.children;
      } else if (currentElement instanceof Array) {
        elementList = currentElement;
      } else {
        return found;
      }

      for (var i = 0; i < elementList.length; i++) {
        found = found.concat(DomUtils.getElements(options, elementList[i], recurse, limit));
        if (limit >= 0 && found.length >= limit) {
          break;
        }
      }

      return found;
    },

    getElementById: function DomUtils$getElementById(id, currentElement, recurse) {
      var result = DomUtils.getElements({ id: id }, currentElement, recurse, 1);
      return result.length ? result[0] : null;
    },

    getElementsByTagName: function DomUtils$getElementsByTagName(name, currentElement, recurse, limit) {
      return DomUtils.getElements({ tag_name: name }, currentElement, recurse, limit);
    },

    getElementsByTagType: function DomUtils$getElementsByTagType(type, currentElement, recurse, limit) {
      return DomUtils.getElements({ tag_type: type }, currentElement, recurse, limit);
    },
    removeChild: function DomUtils$removeChild(element, currentElement) {
      for (var i = 0; i < currentElement.children.length; i++) {
        if (element === currentElement.children[i]) {
          currentElement.children.splice(i, 1); //i番目から1つだけ削除
        }
      }
    },
    removeChildAll: function DomUtils$removeChildAll(currentElement) {
      currentElement.children = [];
    }
  };

  function parseDOM(data, options) {
    var handler = new HtmlBuilder(options);
    new Parser(handler, options).parseComplete(data);

    var newElement = new Element("#document", data);
    newElement.parentNode = {};
    newElement.children = handler.dom || [];
    return newElement;
    //return handler.dom;
  }

  exports.Parser = Parser;

  exports.HtmlBuilder = HtmlBuilder;
  exports.DefaultHandler = HtmlBuilder;

  exports.parseDOM = parseDOM;

  exports.RssBuilder = RssBuilder;

  exports.ElementType = Mode;

  exports.DomUtils = DomUtils;
})();
