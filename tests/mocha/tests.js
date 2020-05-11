var chai = require('chai')
var mocha = require('mocha')
var htmlparser = require('../../lib/htmlparser')

  //mocha初期化
  // mocha.setup('bdd');
  // CHAI
  var assert = chai.assert; // ChaiのAPIを使用
  var expect = chai.expect;
  var should = chai.should();

  //Test Code
  /*
  migration guide
  v1.7.6 -> v2.1
  DefaultHandler -> HtmlBuilder

  result
  attribs -> attributes
  attribs:'data' -> attributes.data:'data'

  ex.
  script tag
        attribs: {
            language: 'javascript'
         },

          type: 'script'
   ->
        attributes: {
            language: [{
              data: 'javascript',
              type: 'text'
            }]
         },
         type: 'tag'
  */

  //var htmlparser = Tautologistics.NodeHtmlParser;

  var parseHtml2 = function(rawHtml) {
    return htmlparser.parseDOM(rawHtml,{
      enforceEmptyTags: true,
      ignoreWhitespace: true,
      verbose: false
    });
  };

  var handler = new htmlparser.HtmlBuilder(function(err, dom) {
    if (err) console.error(err);
  }, {
    enforceEmptyTags: true,
    ignoreWhitespace: true,
    verbose: false
  });
  var parser = new htmlparser.Parser(handler, {
    includeLocation: true
  });
  var parseHtml = function(rawHtml) {
    parser.parseComplete(rawHtml);
    // parseしたオブジェクトを返却
    //return toJson(handler.dom);
    return handler.dom;
  };

 var wrapper = function(parseData) {
    for (var key in parseData) {
      if (key == 'attributes'){
        parseData['attribs'] = {};
        for (var _key in parseData[key]) {
          var content = "";
          parseData[key][_key].forEach( function(_row){
            content = _row.data||'';
          });
          parseData['attribs'][_key] = content
        }
        delete parseData['attributes'];

       var _parseData = {};
       for (var __key in parseData) {
         if (typeof parseData[__key] !== undefined)
         _parseData[__key] = parseData[__key];
       }
       parseData = _parseData;

      }
      if (key == 'name' && parseData[key]=='script'){
        parseData['type'] = 'script';
      }
      if (typeof parseData[key] === 'object' && parseData[key] !== null) {
        parseData[key] = wrapper(parseData[key]);
      }
    };
   return parseData;
  }
  var toJson = function(parseData) {
    var cache = [];
    var tmp = JSON.stringify(parseData, function(key, value) {
      if (key == 'parentNode') return;
      if (key == 'attribs') return value;
      if (key == 'nextSibling') return;
      if (typeof value === 'object' && value !== null) {
        if (cache.indexOf(value) !== -1) { // Circular reference found, discard key
          return;
        }
        // Store value in our collection
        cache.push(value);
      }
      return value;
    });
    //console.log(tmp);
    return JSON.parse(tmp);
  }

    console.log("function1",wrapper(toJson(
       parseHtml(
          `<div onPress={this.inputDigit(0)}></div>`
        ))));

    console.log("function2",wrapper(toJson(
       parseHtml(
          `<div onPress={> this.inputDigit(0)}></div>`
        ))));

  describe('NodeHtmlParser v1.7.6', function() {
    console.log("wrapper",wrapper(toJson(parseHtml(
          `<script language= javascript>var foo = '<<bar>>';</ script>`
        ))));
    console.log("toJson",(toJson(parseHtml(
          `<script language= javascript>var foo = '<<bar>>';</ script>`
        ))));
    console.log("row",((parseHtml(
          `<script language= javascript>var foo = '<<bar>>';</ script>`
        ))));
    describe('html', function() {
      it('script tag', function() {
        assert.deepEqual(wrapper(toJson(parseHtml(
          `<script language= javascript>var foo = '<<bar>>';</ script>`
        ))), [{
          attribs: {
            language: 'javascript'
          },
          children: [{
            data: 'var foo = \'<<bar>>\';',
            type: 'text'
          }],
          name: 'script',
          type: 'script'
        }]);
        assert.deepEqual(wrapper(toJson(parseHtml(
          `<script language='html'><div>test</div></ script>`
        ))), [{
          attribs: {
            language: 'html'
          },
          children: [{
            data: '<div>test</div>',
            type: 'text'
          }],
          name: 'script',
          type: 'script'
        }]);
      });
      it('basic', function() {
        assert.deepEqual(wrapper(toJson(parseHtml(
          `Xyz <script language= javascript>var foo = '<<bar>>';</ script><!--<!-- Waah! -- -->`))), [{
          type: 'text',
          data: 'Xyz '
        }, {
          attribs: {
            language: 'javascript'
          },
          children: [{
            data: 'var foo = \'<<bar>>\';',
            type: 'text'
          }],
          type: 'script',
          name: 'script'
        }, {
          data: '<!-- Waah! -- ',
          type: 'comment'
        }]);


    console.log("function1",wrapper(toJson(parseHtml(
          `<div onPress={this.inputDigit(0)}></div>`
        ))));

    console.log("function2",wrapper(toJson(parseHtml(
          `<div onPress={> this.inputDigit(0)}></div>`
        ))));
    console.log("function2",wrapper(toJson(parseHtml(
          `<div onPress={= this.inputDigit(0)}></div>`
        ))));
    console.log("function2",wrapper(toJson(parseHtml(
          `<div onPress={) = this.inputDigit(0)}></div>`
        ))));
    console.log("function2",wrapper(toJson(parseHtml(
          `<div onPress={( this.inputDigit(0)}></div>`
        ))));
    console.log("function2",wrapper(toJson(parseHtml(
          `<div onPress={() => this.inputDigit(0)}></div>`
        ))));

        assert.deepEqual(wrapper(toJson(parseHtml(
          `<div onPress={this.inputDigit(0)}></div>`))), [{
          type: 'tag',
          name: 'div',
          attribs: {
            onpress: 'this.inputDigit(0)'
          }
        }]);

        assert.deepEqual(wrapper(toJson(parseHtml(
          `<div onPress={() => this.inputDigit(0)}></div>`))), [{
          type: 'tag',
          name: 'div',
          attribs: {
            onpress: '() => this.inputDigit(0)'
          }
        }]);

      });
    });
  });
  describe('NodeHtmlParser v2.0', function() {
    describe('html', function() {
      it('normal tag', function() {
        assert.deepEqual(toJson(parseHtml(
          `<div></div>`
        )), [{
          'type': 'tag',
          'name': 'div'
        }]);
        assert.deepEqual(toJson(parseHtml(
          `<div>hoge</div>`
        )), [{
          'type': 'tag',
          'name': 'div',
          'children': [{
            'type': 'text',
            'data': 'hoge'
          }]
        }]);
        assert.deepEqual(toJson(parseHtml(
          `<div><div>hoge</div></div>`
        )), [{
          'type': 'tag',
          'name': 'div',
          'children': [{
            'type': 'tag',
            'name': 'div',
            'children': [{
              'type': 'text',
              'data': 'hoge'
            }]
          }]
        }]);
        assert.deepEqual(toJson(parseHtml(
          `<div><div>hoge</div>hoge</div>`
        )), [{
          'type': 'tag',
          'name': 'div',
          'children': [{
            'type': 'tag',
            'name': 'div',
            'children': [{
              'type': 'text',
              'data': 'hoge'
            }]
          }, {
            'type': 'text',
            'data': 'hoge'
          }]
        }]);
        assert.deepEqual(toJson(parseHtml(
          `<font>
                <br>this is the text
<font>`
        )), [{
          type: 'tag',
          name: 'font',
          children: [{
            type: 'tag',
            name: 'br'
          }, {
            data: 'this is the text\n',
            type: 'text'
          }, {
            type: 'tag',
            name: 'font'
          }]
        }]);

        assert.deepEqual(toJson(parseHtml(
          `<select>
<option>A</option>
<option>B</option></select>`
        )), [{
          'type': 'tag',
          'name': 'select',
          'children': [{
            'type': 'tag',
            'name': 'option',
            'children': [{
              'type': 'text',
              'data': 'A'
            }]
          }, {
            'type': 'tag',
            'name': 'option',
            'children': [{
              'type': 'text',
              'data': 'B'
            }]
          }]
        }]);

        assert.deepEqual(toJson(parseHtml(
          `<select>
<option><p>A</p></option>
<option><p>B</p></option></select>`
        )), [{
          'type': 'tag',
          'name': 'select',
          'children': [{
            'type': 'tag',
            'name': 'option',
            'children': [{
              'type': 'tag',
              'name': 'p',
              'children': [{
                'type': 'text',
                'data': 'A'
              }]
            }]
          }, {
            'type': 'tag',
            'name': 'option',
            'children': [{
              'type': 'tag',
              'name': 'p',
              'children': [{
                'type': 'text',
                'data': 'B'
              }]
            }]
          }]
        }]);

        assert.deepEqual(toJson(parseHtml(
          `<select>
<option><p>A</p></option>
<option><input ></option></select>`
        )), [{
          'type': 'tag',
          'name': 'select',
          'children': [{
            'type': 'tag',
            'name': 'option',
            'children': [{
              'type': 'tag',
              'name': 'p',
              'children': [{
                'type': 'text',
                'data': 'A'
              }]
            }]
          }, {
            'type': 'tag',
            'name': 'option',
            'children': [{
              'type': 'tag',
              'name': 'input'
            }]
          }]
        }]);

      });

      it('not container', function() {
        assert.deepEqual(toJson(parseHtml(
          `<div />`
        )), [{
          'type': 'tag',
          'name': 'div'
        }]);
      });
      it('img tag', function() {
        assert.deepEqual(toJson(parseHtml(
          `<img src='hoge'>`
        )), [{
          'type': 'tag',
          'name': 'img',
          attributes: {
            src: [{
              data: 'hoge',
              type: 'text'
            }]
          },
        }]);
      });
      it('text', function() {
        assert.deepEqual(toJson(parseHtml(`Xyz `)), [{
          type: 'text',
          data: 'Xyz '
        }]);
      });
      it('script tag', function() {
        assert.deepEqual(toJson(parseHtml(
          `<script language= javascript>var foo = '<<bar>>';</ script>`
        )), [{
          attributes: {
            language: [{
              data: 'javascript',
              type: 'text'
            }]
          },
          children: [{
            data: 'var foo = \'<<bar>>\';',
            type: 'text'
          }],
          name: 'script',
          type: 'tag'
        }]);
        assert.deepEqual(toJson(parseHtml(
          `<script language='html'><div>test</div></ script>`
        )), [{
          attributes: {
            language: [{
              data: 'html',
              type: 'text'
            }]
          },
          children: [{
            data: '<div>test</div>',
            type: 'text'
          }],
          name: 'script',
          type: 'tag'
        }]);
      });
      it('comment tag', function() {
        assert.deepEqual(toJson(parseHtml(`<!-- Waah! -->`)), [{
          data: ' Waah! ',
          type: 'comment'
        }]);
        assert.deepEqual(toJson(parseHtml(`<!----- Waah! ----->`)), [{
          data: '--- Waah! ---',
          type: 'comment'
        }]);
        assert.deepEqual(toJson(parseHtml(`<!--
Waah!
-->`)), [{
          data: '\nWaah!\n',
          type: 'comment'
        }]);
        assert.deepEqual(toJson(parseHtml(`<!--<!-- Waah! -- -->`)), [{
          data: '<!-- Waah! -- ',
          type: 'comment'
        }]);
      });
      it('basic mix', function() {
        assert.deepEqual(toJson(parseHtml(
          `Xyz <script language= javascript>var foo = '<<bar>>';</ script><!--<!-- Waah! -- -->`)), [{
          type: 'text',
          data: 'Xyz '
        }, {
          attributes: {
            language: [{
              data: 'javascript',
              type: 'text'
            }]
          },
          children: [{
            data: 'var foo = \'<<bar>>\';',
            type: 'text'
          }],
          type: 'tag',
          name: 'script'
        }, {
          data: '<!-- Waah! -- ',
          type: 'comment'
        }]);
      });

      it('Thymeleaf Like', function() {
        assert.deepEqual(toJson(parseHtml(
          `<p th:text="{id}"></p>`
        )), [{
          'type': 'tag',
          'name': 'p',
          attributes: {
            'th:text': [{
              data: 'id',
              langName: 'singleMustache',
              type: 'script'
            }]
          }
        }]);
        assert.deepEqual(toJson(parseHtml(
          `<p th:text="'one ' + 'two ' + 'three ' + 'id = ' + {param.id[0]}"></p>`
        )), [{
          'type': 'tag',
          'name': 'p',
          attributes: {
            'th:text': [{
              data: "'one ' + 'two ' + 'three ' + 'id = ' + ",
              type: 'text'
            }, {
              data: "param.id[0]",
              langName: 'singleMustache',
              type: 'script'
            }]
          }
        }]);
      });
    });

    describe('DomUtils', function() {
      var html =
        `<a>text a</a><b id='x'>text b</b>
<c class='y'>text c</c>
<d id='z' class='w'>
  <e>text e</e>
</d>
<g class='g h i'>hhh</g>
<yy>hellow</yy>
<yy id='secondyy'>world</yy>
<font id='id01'>
  <br>this is the text
</font>
<script language="javascript">
  var foo = '<<bar>>';
</script>`;
      it('getElementById', function() {
        var dom = toJson(parseHtml(html));
        var id = htmlparser.DomUtils.getElementById("x", dom);
        assert.deepEqual(id, {
          'type': 'tag',
          'name': 'b',
          'attributes': {
            'id': [{
              'data': 'x',
              'type': 'text'
            }]
          },
          'children': [{
            'type': 'text',
            'data': 'text b'
          }]
        });
      });

      it('getElementsByTagName', function() {
        var dom = toJson(parseHtml(html));
        var name = htmlparser.DomUtils.getElementsByTagName("a", dom);
        assert.deepEqual(name, [{
          'type': 'tag',
          'name': 'a',
          'children': [{
            'type': 'text',
            'data': 'text a'
          }]
        }]);
      });

      it('getElements({ class: "y" })', function() {
        var dom = toJson(parseHtml(html));
        var clazz = htmlparser.DomUtils.getElements({
          class: "y"
        }, dom);
        assert.deepEqual(clazz, [{
          'type': 'tag',
          'name': 'c',
          'attributes': {
            'class': [{
              'data': 'y',
              'type': 'text'
            }]
          },
          'children': [{
            'type': 'text',
            'data': 'text c'
          }]
        }]);
      });

      it('getElements({ class: function (value) {console.log(value); return(value && value.indexOf("h") > -1); } })', function() {
        var dom = toJson(parseHtml(html));
        var multiclass = htmlparser.DomUtils.getElements({
          class: function(value) {
            console.log(value);
            return (value && value.indexOf("h") > -1);
          }
        }, dom);
        assert.deepEqual(multiclass, [{
          'type': 'tag',
          'name': 'g',
          'attributes': {
            'class': [{
              'data': 'g h i',
              'type': 'text'
            }]
          },
          'children': [{
            'type': 'text',
            'data': 'hhh'
          }]
        }]);
      });

      it('getElementsByTagType', function() {
        var dom = toJson(parseHtml(html));
        var text = htmlparser.DomUtils.getElementsByTagType("text", dom);
        assert.deepEqual(text[0], {
          'type': 'text',
          'data': 'text a'
        });
      });

      it('getElements({ tag_name: "d", id: "z", class: "w" })', function() {
        var dom = toJson(parseHtml(html));
        var nested = htmlparser.DomUtils.getElements({
          tag_name: "d",
          id: "z",
          class: "w"
        }, dom);
        nested = htmlparser.DomUtils.getElementsByTagName("e", nested);
        nested = htmlparser.DomUtils.getElementsByTagType("text", nested);
        assert.deepEqual(nested, [{
          'type': 'text',
          'data': 'text e'
        }]);
      });

      it('getElementsByTagType', function() {
        var dom = toJson(parseHtml(html));
        var double = htmlparser.DomUtils.getElementsByTagName("yy", dom);

        assert.deepEqual(double, [{
          'type': 'tag',
          'name': 'yy',
          'children': [{
            'type': 'text',
            'data': 'hellow'
          }]
        }, {
          'type': 'tag',
          'name': 'yy',
          'attributes': {
            'id': [{
              'data': 'secondyy',
              'type': 'text'
            }]
          },
          'children': [{
            'type': 'text',
            'data': 'world'
          }]
        }]);
      });


      it('getElements( { tag_name: "yy", id: "secondyy" })', function() {
        var dom = toJson(parseHtml(html));
        var single = htmlparser.DomUtils.getElements({
          tag_name: "yy",
          id: "secondyy"
        }, dom);

        assert.deepEqual(single, [ {
          'type': 'tag',
          'name': 'yy',
          'attributes': {
            'id': [{
              'data': 'secondyy',
              'type': 'text'
            }]
          },
          'children': [{
            'type': 'text',
            'data': 'world'
          }]
        }]);
      });


    });

  });

  describe('NodeHtmlParser v2.1', function() {
    describe('html', function() {
      it('basic', function() {
        assert.deepEqual(wrapper(toJson(parseHtml2(
          `Xyz <script language= javascript>var foo = '<<bar>>';</ script><!--<!-- Waah! -- -->`).children)), [{
          type: 'text',
          data: 'Xyz '
        }, {
          attribs: {
            language: 'javascript'
          },
          children: [{
            data: 'var foo = \'<<bar>>\';',
            type: 'text'
          }],
          type: 'script',
          name: 'script'
        }, {
          data: '<!-- Waah! -- ',
          type: 'comment'
        }]);
      });
      it('template script ', function() {

        assert.deepEqual(toJson(parseHtml2(
          `{hoge}`
        ).children), [{
          'type': 'script',
          'langName': 'singleMustache',
          'data': 'hoge'
        }]);
        assert.deepEqual(toJson(parseHtml2(
          `{{hoge}}`
        ).children), [{
          'type': 'script',
          'langName': 'mustache',
          'data': 'hoge'
        }]);

        assert.deepEqual(toJson(parseHtml2(
          `{hoge}hoge{{hoge}}`
        ).children), [{
          'type': 'script',
          'langName': 'singleMustache',
          'data': 'hoge'
        }, {
          'type': 'text',
          'data': 'hoge'
        }, {
          'type': 'script',
          'langName': 'mustache',
          'data': 'hoge'
        }]);

        assert.deepEqual(toJson(parseHtml2(
          `{!comment}`
        ).children), [{
          'type': 'comment',
          'name': '!',
          'langName': 'singleMustache',
          'data': 'comment'
        }]);

        assert.deepEqual(toJson(parseHtml2(
          `{{!comment}}`
        ).children), [{
          'type': 'comment',
          'name': '!',
          'langName': 'mustache',
          'data': 'comment'
        }]);

        assert.deepEqual(toJson(parseHtml2(
          `<div>{hoge}</div>`
        ).children), [{
          'type': 'tag',
          'name': 'div',
          'children': [{
            'type': 'script',
            'langName': 'singleMustache',
            'data': 'hoge'
          }]
        }]);
        assert.deepEqual(toJson(parseHtml2(
          `<div>{{hoge}}</div>`
        ).children), [{
          'type': 'tag',
          'name': 'div',
          'children': [{
            'type': 'script',
            'langName': 'mustache',
            'data': 'hoge'
          }]
        }]);

        assert.deepEqual(toJson(parseHtml2(
          `<div onClick={this.props.onPress}></div>`
        ).children), [{
          'type': 'tag',
          'name': 'div',
          'attributes':{
            'onclick' : [{
              'type': 'script',
              'langName': 'singleMustache',
              'data': 'this.props.onPress'
            }
          ]}
        }]);

        assert.deepEqual(toJson(parseHtml2(
          `<div class="test{hoge}"></div>`
        ).children), [{
          'type': 'tag',
          'name': 'div',
          'attributes':{
            'class' : [{
              'type': 'text',
              'data': 'test'
            },{
              'type': 'script',
              'langName': 'singleMustache',
              'data': 'hoge'
            }
        ]}
        }]);

        assert.deepEqual(toJson(parseHtml2(
          `<button className='calculator-key {this.props.className}'/>`
        ).children), [{
          'type': 'tag',
          'name': 'button',
          'attributes':{
            'classname' : [{
              'type': 'text',
              'data': 'calculator-key '
            },{
              'type': 'script',
              'langName': 'singleMustache',
              'data': 'this.props.className'
            }
          ]}
        }]);

        assert.deepEqual(toJson(parseHtml2(
          `{{#if true}}<div>{{hoge}}</div>{{/if}}`
        ).children), [{
          'data': 'true',
          'langName': 'mustache',
          'type': 'script',
          'name': 'if',
          'children': [{
            'type': 'tag',
            'name': 'div',
            'children': [{
              'type': 'script',
              'langName': 'mustache',
              'data': 'hoge'
            }]
          }]
        }]);

        assert.deepEqual(toJson(parseHtml2(
          `{#if this.props.count > 1}<div if='{message}'>hoge</div>{{/if}}`
        ).children), [{
          'data': 'this.props.count > 1',
          'langName': 'singleMustache',
          'type': 'script',
          'name': 'if',
          'children': [{
            'type': 'tag',
            'name': 'div',
            'attributes': {
              'if': [{
                'data': 'message',
                'langName': 'singleMustache',
                'type': 'script'
              }]
            },
            'children': [{
              'type': 'text',
              'data': 'hoge'
            }]
          }]
        }]);

        assert.deepEqual(toJson(parseHtml2(
          `{#if true}<div>{hoge}</div>{/if}`
        ).children), [{
          'data': 'true',
          'langName': 'singleMustache',
          'type': 'script',
          'name': 'if',
          'children': [{
            'type': 'tag',
            'name': 'div',
            'children': [{
              'type': 'script',
              'langName': 'singleMustache',
              'data': 'hoge'
            }]
          }]
        }]);
      });
    });

    ////////////

    describe('DomUtils', function() {
      var html =
        `<div>
<a>text a</a><b id='x'>text b</b>
<c class='y'>text c</c>
<d id='z' class='w'>
  <e>text e</e>
</d>
<g class='g h i'>hhh</g>
<yy>hellow</yy>
<yy id='secondyy'>world</yy>
<font id='id01'>
  <br>this is the text
</font>
<script language="javascript">
  var foo = '<<bar>>';
</script>
</div>`;
      it('dom.getElementById("x")', function() {
        var dom = parseHtml2(html);
        var id = dom.getElementById("x");
        id = toJson(id);
        assert.deepEqual(id, {
          'type': 'tag',
          'name': 'b',
          'attributes': {
            'id': [{
              'data': 'x',
              'type': 'text'
            }]
          },
          'children': [{
            'type': 'text',
            'data': 'text b'
          }]
        });
      });

      it('dom.getElementsByTagName("a")', function() {
        var dom = parseHtml2(html);
        var name = dom.getElementsByTagName("a");
        name = toJson(name);
        assert.deepEqual(name, [{
          'type': 'tag',
          'name': 'a',
          'children': [{
            'type': 'text',
            'data': 'text a'
          }]
        }]);
      });

      it('dom.getElements({ class: "y" })', function() {
        var dom = parseHtml2(html);
        var clazz = dom.getElements({
          class: "y"
        });
        clazz = toJson(clazz);
        assert.deepEqual(clazz, [{
          'type': 'tag',
          'name': 'c',
          'attributes': {
            'class': [{
              'data': 'y',
              'type': 'text'
            }]
          },
          'children': [{
            'type': 'text',
            'data': 'text c'
          }]
        }]);
      });

      it('dom.getElements({ class: function (value) {console.log(value); return(value && value.indexOf("h") > -1); } })', function() {
        var dom = parseHtml2(html);
        var multiclass = dom.getElements({
          class: function(value) {
            console.log(value);
            return (value && value.indexOf("h") > -1);
          }
        });
        multiclass = toJson(multiclass);
        assert.deepEqual(multiclass, [{
          'type': 'tag',
          'name': 'g',
          'attributes': {
            'class': [{
              'data': 'g h i',
              'type': 'text'
            }]
          },
          'children': [{
            'type': 'text',
            'data': 'hhh'
          }]
        }]);
      });

      it('dom.getElementsByTagType("text")', function() {
        var dom = parseHtml2(html);
        var text = dom.getElementsByTagType("text");
        text = toJson(text);
        assert.deepEqual(text[0], {
          'type': 'text',
          'data': 'text a'
        });
      });

      it('dom.getElements({ tag_name: "d", id: "z", class: "w" })', function() {
        var dom = parseHtml2(html);
        var nested = dom.getElements({
          tag_name: "d",
          id: "z",
          class: "w"
        });
        nested = nested[0].getElementsByTagName("e");
        nested = nested[0].getElementsByTagType("text");
        nested = toJson(nested);
        assert.deepEqual(nested, [{
          'type': 'text',
          'data': 'text e'
        }]);
      });

      it('dom.getElementsByTagType("yy")', function() {
        var dom = parseHtml2(html);
        var double = dom.getElementsByTagName("yy");
        double = toJson(double);
        assert.deepEqual(double, [{
          'type': 'tag',
          'name': 'yy',
          'children': [{
            'type': 'text',
            'data': 'hellow'
          }]
        }, {
          'type': 'tag',
          'name': 'yy',
          'attributes': {
            'id': [{
              'data': 'secondyy',
              'type': 'text'
            }]
          },
          'children': [{
            'type': 'text',
            'data': 'world'
          }]
        }]);
      });


      it('dom.getElements( { tag_name: "yy", id: "secondyy" })', function() {
        var dom = parseHtml2(html);
        var single = dom.getElements({
          tag_name: "yy",
          id: "secondyy"
        });
        single = toJson(single);
        assert.deepEqual(single, [ {
          'type': 'tag',
          'name': 'yy',
          'attributes': {
            'id': [{
              'data': 'secondyy',
              'type': 'text'
            }]
          },
          'children': [{
            'type': 'text',
            'data': 'world'
          }]
        }]);
      });

      it('dom.nextSibling ', function() {
        html =
          `<div><div id="x">text a</div><div>text b</div></div>`;
        var dom = parseHtml2(html);
        var one = dom.getElementById("x");
        var two = one.nextSibling;
        two = toJson(two);
        console.log("two",two);
        assert.deepEqual(two,  {
          'type': 'tag',
          'name': 'div',
          'children': [{
            'type': 'text',
            'data': 'text b'
          }]
        });
      });

    });


    //////////
  });

  describe('NodeHtmlParser v2.2', function() {
    describe('html', function() {
      it('style', function() {
        var html =
   `<div style="background: url('data:image/svg+xml;base64,abcdef') 50% 0 no-repeat; height: 450px;">
    </div>
    `;
          var dom = parseHtml2(html);
          dom = toJson(dom.children);
          console.log('style',dom)
          assert.deepEqual(dom, [{
            'type': 'tag',
            'name': 'div',
            'attributes': {
              'style': [{
                'data': "background: url('data:image/svg+xml;base64,abcdef') 50% 0 no-repeat; height: 450px;",
                'type': 'text'
              }]
            }
          }]);
        });

      it('no value attributes', function() {
        var html =
   `<a data-uk-offcanvas></a>
  <div className="uk-navbar-brand"></div>
  `;
        var dom = parseHtml2(html);
        dom = toJson(dom.children);
        console.log('no value attributes',dom)
        assert.deepEqual(dom, [{
          'type': 'tag',
          'name': 'a',
          'attributes': {
            'data-uk-offcanvas': []
          },
        },{
          'type': 'tag',
          'name': 'div',
          'attributes': {
            'classname':[{
              'data': 'uk-navbar-brand',
              'type': 'text'
            }]
          },
        }]);
      });

      it('wbr tag', function() {
        var html =
    `<p>abc<wbr>def</p>`;
        var dom = parseHtml2(html);
        dom = toJson(dom.children);
        console.log('wbr tag',dom)
        assert.deepEqual(dom, [{
          'type': 'tag',
          'name': 'p',
          'children':[{
            'type': 'text',
            'data': 'abc'
          },{
            'type': 'tag',
            'name':"wbr"
          },{
            'type': 'text',
            'data': 'def'
          }]
        }]);
      });

        it('Duplicate attributes', function() {
          var html =
      `<a rel="nofollow" rel="noreferrer"></a>`;
          var dom = parseHtml2(html);
          dom = toJson(dom.children);
          console.log('Duplicate attributes',dom)
          assert.deepEqual(dom, [{
            'type': 'tag',
            'name': 'a',
            'attributes': {
              'rel':[{
                'data': 'noreferrer',
                'type': 'text'
              }],
            },
          }]);
        });

        it('Mixed type values', function() {
          var html =
      `<a className="nofollow {hoge}"></a>`;
          var dom = parseHtml2(html);
          dom = toJson(dom.children);
          console.log('Mixed type values',dom)
          assert.deepEqual(dom, [{
            'type': 'tag',
            'name': 'a',
            'attributes': {
              'rel':[{
                'data': 'noreferrer',
                'type': 'text'
              }],
            },
          }]);
        });
    });

    ////////////
    describe('DomUtils', function() {
      var html =
 `<html>
  <body></body>
  </html>`;
      it('dom.appendChild("x")', function() {
        var dom = parseHtml2(html);
        var nested = dom.getElementsByTagName("html");
        var newElement = nested[0].createElement('head');
        nested[0].appendChild(newElement);
        dom = toJson(dom.children);
        assert.deepEqual(dom, [{
          'children': [{
            'name': 'body',
            'type': 'tag'
          },{
            'name': 'head',
            'type': 'tag'
          }],
          'name': 'html',
          'type': 'tag'
        }]);
      });

      it('dom.removeChildAll()', function() {
        var dom = parseHtml2(html);
        var nested = dom.getElementsByTagName("html");
        nested[0].removeChildAll();
        dom = toJson(dom.children);
        assert.deepEqual(dom, [{
          'children': [],
          'name': 'html',
          'type': 'tag'
        }]);
      });

    });


    //////////
  });
