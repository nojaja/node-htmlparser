# NodeHtmlParser
A forgiving HTML/XML/RSS parser written in JS for both the browser and NodeJS (yes, despite the name it works just fine in any modern browser). The parser can handle streams (chunked data) and supports custom handlers for writing custom DOMs/output.

## Installing

	npm install htmlparser


## development

	npm install -g babel-cli
	npm install -g grunt-cli
	npm install -g browserify
	npm install
	grunt


## migration
  ### v1.7.6 -> v2.1
  * DefaultHandler -> HtmlBuilder
  
  * result field
    - attribs -> attributes
    - attribs:'data' -> attributes.data:'data'
    - script.type='sctipt' -> script.type='tag'
 
ex.
```json
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
```

## Running Tests

### Run tests under node:
	node runtests.js

### Run tests in browser:
View runtests.html in any browser

## Usage In Node

```javascript
var htmlparser = require("htmlparser");
var rawHtml = "Xyz <script language= javascript>var foo = '<<bar>>';< /  script><!--<!-- Waah! -- -->";
var handler = new htmlparser.HtmlBuilder(function (error, dom) {
	if (error)
		[...do something for errors...]
	else
		[...parsing done, do something...]
});
var parser = new htmlparser.Parser(handler);
parser.parseComplete(rawHtml);
sys.puts(sys.inspect(handler.dom, false, null));
```

## Usage In Browser

```javascript
var handler = new Tautologistics.NodeHtmlParser.HtmlBuilder(function (error, dom) {
	if (error)
		[...do something for errors...]
	else
		[...parsing done, do something...]
});
var parser = new Tautologistics.NodeHtmlParser.Parser(handler);
parser.parseComplete(document.body.innerHTML);
alert(JSON.stringify(handler.dom, null, 2));
```

## Example output

```javascript
[ { raw: 'Xyz ', data: 'Xyz ', type: 'text' }
  , { raw: 'script language= javascript'
  , data: 'script language= javascript'
  , type: 'tag'
  , name: 'script'
  , attributes: { language: [{
              data: 'javascript',
              type: 'text'
              }]
	    }
  , children: 
     [ { raw: 'var foo = \'<bar>\';<'
       , data: 'var foo = \'<bar>\';<'
       , type: 'text'
       }
     ]
  }
, { raw: '<!-- Waah! -- '
  , data: '<!-- Waah! -- '
  , type: 'comment'
  }
]
```

## Example output
### normal tag
```html
<div></div>
```
```javascript
[{'type': 'tag','name': 'div'}]
```
### text
```html
Xyz 
```
```javascript
[{type: 'text',data: 'Xyz '}]
```
### script tag
```html
<script language= javascript>var foo = '<<bar>>';</ script> 
```
```javascript
[{
  type: 'tag',
  name: 'script',
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
}]
```
### Tag in tag
```html
<div><div>hoge</div></div>
```
```javascript
[{
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
}]
```

### comment tag
```html
<!-- Waah! --> 
```
```javascript
[{data: ' Waah! ',type: 'comment'}]
```

### img tag
```html
<img src='hoge'>
```
```javascript
[{
  'type': 'tag',
  'name': 'img',
  attributes: {
    src: [{
      data: 'hoge',
      type: 'text'
    }]
  }
}]
```

### not container
```html
<div />
```
```javascript
[{'type': 'tag', 'name': 'div'}]
```

## Example output v2.1

### normal tag
```html
<div></div>
```
```javascript
[{'type': 'tag','name': 'div',
  'parentNode': parent object,
  getElementById: function(id,recurse),
  getElementsByTagName: function(id,recurse,limit),
  getElementsByTagType: function(type,recurse,limit),
  getElements: function(options, recurse, limit),
  removeChild: function(element),
  createElement: function(type),
  appendChild: function(element),
  getAttribute: function(name),
  cloneElement: function(parentNode),
}]
```

### mustache script tag
```html
{{#if true}}<div>{{hoge}}</div>{{/if}}
```

```javascript
[{
  'type': 'script',
  'langName': 'mustache',
  'name': 'if',
  'data': 'true',
  'children': [{
    'type': 'tag',
    'name': 'div',
    'children': [{
      'type': 'script',
      'langName': 'mustache',
      'data': 'hoge'
    }]
  }]
}]
```

### singleMustache script tag
```html
{#if true}<div>{hoge}</div>{/if}
```

```javascript
[{
  'type': 'script',
  'langName': 'singleMustache',
  'name': 'if',
  'data': 'true',
  'children': [{
    'type': 'tag',
    'name': 'div',
    'children': [{
      'type': 'script',
      'langName': 'singleMustache',
      'data': 'hoge'
    }]
  }]
}]
```

## Streaming To Parser

```javascript
while (...) {
	...
	parser.parseChunk(chunk);
}
parser.done();	
```

## Streaming To Parser in Node

```javascript
fs.createReadStream('./path_to_file.html').pipe(parser);
```

## Parsing RSS/Atom Feeds

```javascript
new htmlparser.RssHandler(function (error, dom) {
	...
});
```

## DefaultHandler Options

### Usage

```javascript
var handler = new htmlparser.HtmlBuilder(
	  function (error) { ... }
	, { verbose: false, ignoreWhitespace: true }
	);
```

### Option: ignoreWhitespace
Indicates whether the DOM should exclude text nodes that consists solely of whitespace. The default value is "false".

#### Example: true

The following HTML:

```html
<font>
	<br>this is the text
<font>
```

becomes:

```javascript
[ { raw: 'font'
  , data: 'font'
  , type: 'tag'
  , name: 'font'
  , children: 
     [ { raw: 'br', data: 'br', type: 'tag', name: 'br' }
     , { raw: 'this is the text\n'
       , data: 'this is the text\n'
       , type: 'text'
       }
     , { raw: 'font', data: 'font', type: 'tag', name: 'font' }
     ]
  }
]
```

#### Example: false

The following HTML:

```html
<font>
	<br>this is the text
<font>
```

becomes:

```javascript
[ { raw: 'font'
  , data: 'font'
  , type: 'tag'
  , name: 'font'
  , children: 
     [ { raw: '\n\t', data: '\n\t', type: 'text' }
     , { raw: 'br', data: 'br', type: 'tag', name: 'br' }
     , { raw: 'this is the text\n'
       , data: 'this is the text\n'
       , type: 'text'
       }
     , { raw: 'font', data: 'font', type: 'tag', name: 'font' }
     ]
  }
]
```

### Option: verbose
Indicates whether to include extra information on each node in the DOM. This information consists of the "raw" attribute (original, unparsed text found between "<" and ">") and the "data" attribute on "tag", "script", and "comment" nodes. The default value is "true". 

#### Example: true
The following HTML:

```html
<a href="test.html">xxx</a>
```

becomes:

```javascript
[ { raw: 'a href="test.html"'
  , data: 'a href="test.html"'
  , type: 'tag'
  , name: 'a'
  , attribs: { href: 'test.html' }
  , children: [ { raw: 'xxx', data: 'xxx', type: 'text' } ]
  }
]
```

#### Example: false
The following HTML:

```javascript
<a href="test.html">xxx</a>
```

becomes:

```javascript
[ { type: 'tag'
  , name: 'a'
  , attribs: { href: 'test.html' }
  , children: [ { data: 'xxx', type: 'text' } ]
  }
]
```

### Option: enforceEmptyTags
Indicates whether the DOM should prevent children on tags marked as empty in the HTML spec. Typically this should be set to "true" HTML parsing and "false" for XML parsing. The default value is "true".

#### Example: true
The following HTML:

```html
<link>text</link>
```

becomes:

```javascript
[ { raw: 'link', data: 'link', type: 'tag', name: 'link' }
, { raw: 'text', data: 'text', type: 'text' }
]
```

#### Example: false
The following HTML:

```html
<link>text</link>
```

becomes:

```javascript
[ { raw: 'link'
  , data: 'link'
  , type: 'tag'
  , name: 'link'
  , children: [ { raw: 'text', data: 'text', type: 'text' } ]
  }
]
```

## DomUtils
### TBD (see utils_example.js for now)
### getElementById
```javascript
var id = htmlparser.DomUtils.getElementById("x", dom);
```
### getElementsByTagName
```javascript
var name = htmlparser.DomUtils.getElementsByTagName("a", dom);
```
### getElements
```javascript
var clazz = htmlparser.DomUtils.getElements({class: "y" }, dom);
```
```javascript
var multiclass = htmlparser.DomUtils.getElements({
          class: function(value) {
            console.log(value);
            return (value && value.indexOf("h") > -1);
          }
        }, dom);
```
### getElementsByTagType
```javascript
var nested = htmlparser.DomUtils.getElements({
          tag_name: "d",
          id: "z",
          class: "w"
        }, dom);
```

## DomUtils v2.1
### getElementById
```javascript
var id = dom.getElementById("x");
```
### getElementsByTagName
```javascript
var name = dom.getElementsByTagName("a");
```
### getElements
```javascript
var clazz = dom.getElements({class: "y"});
```
### getElementsByTagType
```javascript
var nested = dom.getElements({ tag_name: "d", id: "z", class: "w" });
```


## Related Projects

Loo
king for CSS selectors to search the DOM? Try Node-SoupSelect, a port of SoupSelect to NodeJS: http://github.com/harryf/node-soupselect

There's also a port of hpricot to NodeJS that uses HtmlParser for HTML parsing: http://github.com/silentrob/Apricot

