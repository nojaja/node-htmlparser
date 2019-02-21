const fs = require('fs');
const util = require('util');
const htmlparser = require('../../lib/htmlparser');

console.log("-------------------");
console.log(htmlparser);
console.log("-------------------");


var handler = new htmlparser.DefaultHandler(function () { }, {
    ignoreWhitespace: true,
    includeLocation: false,
    verbose: false
});
var parser = new htmlparser.Parser(handler, {});
var parseHtml = function (rawHtml) {
    parser.parseComplete(rawHtml);
    // parseしたオブジェクトを返却
    //return toJson(handler.dom);
    return handler.dom;
};

var wrapper = function (parseData) {
    for (var key in parseData) {
        if (key == 'attributes') {
            parseData['attribs'] = {};
            for (var _key in parseData[key]) {
                var content = "";
                parseData[key][_key].forEach(function (_row) {
                    content = _row.data || '';
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
        if (key == 'name' && parseData[key] == 'script') {
            parseData['type'] = 'script';
        }
        if (typeof parseData[key] === 'object' && parseData[key] !== null) {
            parseData[key] = wrapper(parseData[key]);
        }
    };
    return parseData;
}
var toJson = function (parseData) {
    var cache = [];
    var tmp = JSON.stringify(parseData, function (key, value) {
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
console.log("function1", wrapper(toJson(
    parseHtml(
        `<div onPress={this.inputDigit(0)}></div>`
    ))));


describe('NodeHtmlParser v1.7.6', () => {
    describe('htmlのパース', () => {

        console.log("Basic test", wrapper(toJson(
            parseHtml(
                `<html><title>The Title</title><body>Hello world</body></html>`
            ))));

        it('Basic test', () => {
            expect(
                wrapper(toJson(parseHtml(
                    `<html><title>The Title</title><body>Hello world</body></html>`
                )))).toEqual([{
                    type: 'tag'
                    , name: 'html'
                    , children:
                        [{
                            type: 'tag'
                            , name: 'title'
                            , children: [{ data: 'The Title', type: 'text' }]
                        }
                            , {
                            type: 'tag'
                            , name: 'body'
                            , children: [{ data: 'Hello world', type: 'text' }]
                        }
                        ]
                }]
                );
        });

        it('script tag', () => {
            expect(wrapper(toJson(parseHtml(
                `<script language= javascript>var foo = '<<bar>>';</ script>`
            )))).toEqual([{
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

        });

    });
});