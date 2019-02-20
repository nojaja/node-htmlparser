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
  /*
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
  */

  if (typeof window !== 'undefined') {
    if (!window.Tautologistics) {
      window.Tautologistics = {};
    }
    window.Tautologistics.NodeHtmlParser = exports;
  }


})();

  function inherits(ctor, superCtor) {
    var tempCtor = function () { };
    tempCtor.prototype = superCtor.prototype;
    ctor.super_ = superCtor;
    ctor.prototype = new tempCtor();
    ctor.prototype.constructor = ctor;
  }

  var Mode = {
    Text: "text",
    Script: "script",
    Tag: "tag",
    Attr: "attr",
    CData: "cdata",
    Doctype: "doctype",
    Comment: "comment"
  };
  var TagType = [
    {
      langName: "mustache",
      open: "{{",
      close: "}}",
      openCode: "\uFFF0",
      closeCode: "\uFFF1"
    },
    {
      langName: "singleMustache",
      open: "{",
      close: "}",
      openCode: "\uFFF2",
      closeCode: "\uFFF3"
    }
  ];

  var opentags = [];
  TagType.forEach(function (tagtype) {
    opentags.push(tagtype.openCode);
  }, this);

//Node版の場合はParserをStreamからの継承にする
/*
//ES6だとこの方法は動かないので別の方法を考えなくてはならない
  if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    var Stream = require("stream");
    inherits(Parser, Stream);
  }
*/

  function RssBuilder(callback) {
    RssBuilder.super_.call(this, callback, {
      ignoreWhitespace: true,
      verbose: false,
      enforceEmptyTags: false,
      caseSensitiveTags: true
    });
  }
 // inherits(RssBuilder, HtmlBuilder);


  RssBuilder.prototype.done = function RssBuilder$done() {
    var feed = {};
    var feedRoot;

    var found = DomUtils.getElementsByTagName(
      function (value) {
        return value == "rss" || value == "feed";
      },
      this.dom,
      false
    );
    if (found.length) {
      feedRoot = found[0];
    }
    if (feedRoot) {
      if (feedRoot.name == "rss") {
        feed.type = "rss";
        feedRoot = feedRoot.children[0]; //<channel/>
        feed.id = "";
        try {
          feed.title = DomUtils.getElementsByTagName(
            "title",
            feedRoot.children,
            false
          )[0].children[0].data;
        } catch (ex) { }
        try {
          feed.link = DomUtils.getElementsByTagName(
            "link",
            feedRoot.children,
            false
          )[0].children[0].data;
        } catch (ex) { }
        try {
          feed.description = DomUtils.getElementsByTagName(
            "description",
            feedRoot.children,
            false
          )[0].children[0].data;
        } catch (ex) { }
        try {
          feed.updated = new Date(
            DomUtils.getElementsByTagName(
              "lastBuildDate",
              feedRoot.children,
              false
            )[0].children[0].data
          );
        } catch (ex) { }
        try {
          feed.author = DomUtils.getElementsByTagName(
            "managingEditor",
            feedRoot.children,
            false
          )[0].children[0].data;
        } catch (ex) { }
        feed.items = [];
        DomUtils.getElementsByTagName("item", feedRoot.children).forEach(
          function (item, index, list) {
            var entry = {};
            try {
              entry.id = DomUtils.getElementsByTagName(
                "guid",
                item.children,
                false
              )[0].children[0].data;
            } catch (ex) { }
            try {
              entry.title = DomUtils.getElementsByTagName(
                "title",
                item.children,
                false
              )[0].children[0].data;
            } catch (ex) { }
            try {
              entry.link = DomUtils.getElementsByTagName(
                "link",
                item.children,
                false
              )[0].children[0].data;
            } catch (ex) { }
            try {
              entry.description = DomUtils.getElementsByTagName(
                "description",
                item.children,
                false
              )[0].children[0].data;
            } catch (ex) { }
            try {
              entry.pubDate = new Date(
                DomUtils.getElementsByTagName(
                  "pubDate",
                  item.children,
                  false
                )[0].children[0].data
              );
            } catch (ex) { }
            feed.items.push(entry);
          }
        );
      } else {
        feed.type = "atom";
        try {
          feed.id = DomUtils.getElementsByTagName(
            "id",
            feedRoot.children,
            false
          )[0].children[0].data;
        } catch (ex) { }
        try {
          feed.title = DomUtils.getElementsByTagName(
            "title",
            feedRoot.children,
            false
          )[0].children[0].data;
        } catch (ex) { }
        try {
          feed.link = DomUtils.getElementsByTagName(
            "link",
            feedRoot.children,
            false
          )[0].attributes.href.value;
        } catch (ex) { }
        try {
          feed.description = DomUtils.getElementsByTagName(
            "subtitle",
            feedRoot.children,
            false
          )[0].children[0].data;
        } catch (ex) { }
        try {
          feed.updated = new Date(
            DomUtils.getElementsByTagName(
              "updated",
              feedRoot.children,
              false
            )[0].children[0].data
          );
        } catch (ex) { }
        try {
          feed.author = DomUtils.getElementsByTagName(
            "email",
            feedRoot.children,
            true
          )[0].children[0].data;
        } catch (ex) { }
        feed.items = [];
        DomUtils.getElementsByTagName("entry", feedRoot.children).forEach(
          function (item, index, list) {
            var entry = {};
            try {
              entry.id = DomUtils.getElementsByTagName(
                "id",
                item.children,
                false
              )[0].children[0].data;
            } catch (ex) { }
            try {
              entry.title = DomUtils.getElementsByTagName(
                "title",
                item.children,
                false
              )[0].children[0].data;
            } catch (ex) { }
            try {
              entry.link = DomUtils.getElementsByTagName(
                "link",
                item.children,
                false
              )[0].attributes.href.value;
            } catch (ex) { }
            try {
              entry.description = DomUtils.getElementsByTagName(
                "summary",
                item.children,
                false
              )[0].children[0].data;
            } catch (ex) { }
            try {
              entry.pubDate = new Date(
                DomUtils.getElementsByTagName(
                  "updated",
                  item.children,
                  false
                )[0].children[0].data
              );
            } catch (ex) { }
            feed.items.push(entry);
          }
        );
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
          if (
            element.type !== Mode.Text &&
            element.type !== Mode.Comment &&
            element.type !== Mode.CData
          ) {
            return false;
          }
          if (!options["tag_contains"](element.data)) {
            return false;
          }
        } else {
          //if (!element.attributes || !element.attributes[key] || !options[key](element.attributes[key].value)) {
          if (
            !element.attributes ||
            !element.attributes[key] ||
            !DomUtils.testAttribute(options[key], element.attributes[key])
          ) {
            return false;
          }
        }
      }

      return true;
    },

    getElements: function DomUtils$getElements(
      options,
      currentElement,
      recurse,
      limit
    ) {
      
      setPrototypeOfDomUtils = function(array) {};
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
        found = found.concat(
          DomUtils.getElements(options, elementList[i], recurse, limit)
        );
        if (limit >= 0 && found.length >= limit) {
          break;
        }
      }

      return found;
    },

    getElementById: function DomUtils$getElementById(
      id,
      currentElement,
      recurse
    ) {
      var result = DomUtils.getElements({ id: id }, currentElement, recurse, 1);
      return result.length ? result[0] : null;
    },

    getElementsByTagName: function DomUtils$getElementsByTagName(
      name,
      currentElement,
      recurse,
      limit
    ) {
      return DomUtils.getElements(
        { tag_name: name },
        currentElement,
        recurse,
        limit
      );
    },

    getElementsByTagType: function DomUtils$getElementsByTagType(
      type,
      currentElement,
      recurse,
      limit
    ) {
      return DomUtils.getElements(
        { tag_type: type },
        currentElement,
        recurse,
        limit
      );
    },
    removeChild: function DomUtils$removeChild(element, currentElement) {
      for (var i = 0; i < currentElement.children.length; i++) {
        if (element === currentElement.children[i]) {
          currentElement.children.splice(i, 1);//i番目から1つだけ削除
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

  /*
  exports.Parser = Parser;

  exports.HtmlBuilder = HtmlBuilder;
  exports.DefaultHandler = HtmlBuilder;

  exports.parseDOM = parseDOM;

  exports.RssBuilder = RssBuilder;

  exports.ElementType = Mode;

  exports.DomUtils = DomUtils;
*/

//export { HtmlBuilder as HtmlBuilder, HtmlBuilder as DefaultHandler };