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

/*
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

  */

export function parseDOM(data, options) {
    var handler = new HtmlBuilder(options);
    new Parser(handler, options).parseComplete(data);

    var newElement = new Element("#document", data);
    newElement.parentNode = {};
    newElement.children = handler.dom || [];
    return newElement;
}
