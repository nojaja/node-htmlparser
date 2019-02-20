export class HtmlBuilder {
    constructor(callback, options) {
      //Properties//
      this._options = null; //Builder options for how to behave
      this._callback = null; //Callback to respond to when parsing done
      this._done = false; //Flag indicating whether builder has been notified of parsing completed
      this._tagStack = null; //List of parents to the currently element being processed
      this.dom = null; //The hierarchical object containing the parsed HTML

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
    }
    //Methods//
    
    setPrototypeOfDomUtils(array) {}
    //Resets the builder back to starting state
    reset() {
      this.dom = [];
      this.setPrototypeOfDomUtils(this.dom);
      // this._raw = [];
      this._done = false;
      this._tagStack = [];
      this._lastTag = null;
      this._tagStack.last = function HtmlBuilder$_tagStack$last() {
        return this.length ? this[this.length - 1] : null;
      };
      this._line = 1;
      this._col = 1;
    };
    //Signals the builder that parsing is done
    done() {
      this._done = true;
      this.handleCallback(null);
    };

    error(error) {
      this.handleCallback(error);
    };

    handleCallback(error) {
      if (typeof this._callback != "function") {
        if (error) {
          throw error;
        } else {
          return;
        }
      }
      this._callback(error, this.dom);
    };

    isEmptyTag(element) {
      var name = element.name.toLowerCase();
      if (name.charAt(0) == "?") {
        return true;
      }
      if (name.charAt(0) == "/") {
        name = name.substring(1);
      }
      return this._options.enforceEmptyTags && !!this._emptyTags[name];
    };

    _getLocation() {
      return { line: this._line, col: this._col };
    };

    // HtmlBuilder.reLineSplit = /(\r\n|\r|\n)/g;
    _updateLocation(node) {
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
    };

    _copyElement(element, parentNode) {
      //var newElement = { type: element.type, parentNode: parentNode};
      var newElement = new Element(element.type, parentNode);

      if (this._options.verbose && element["raw"] !== undefined) {
        newElement.raw = element.raw;
      }
      if (element["name"] !== undefined) {
        switch (element.type) {
          case Mode.Tag:
            newElement.name = this._options.caseSensitiveTags
              ? element.name
              : element.name.toLowerCase();
            break;

          case Mode.Attr:
            newElement.name = this._options.caseSensitiveAttr
              ? element.name
              : element.name.toLowerCase();
            break;

          default:
            newElement.name = this._options.caseSensitiveTags
              ? element.name
              : element.name.toLowerCase();
            break;
        }
      }
      if (element["data"] !== undefined) {
        TagType.forEach(function (tagtype) {
          element.data = element.data
            .replace(new RegExp(tagtype.openCode, "g"), tagtype.open)
            .replace(new RegExp(tagtype.closeCode, "g"), tagtype.close);
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
    };

    write(element) {
      if (this._done) {
        this.handleCallback(
          new Error(
            "Writing to the builder after done() called is not allowed without a reset()"
          )
        );
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
          this._lastTag.attributes[
            this._options.caseSensitiveAttr
              ? element.name
              : element.name.toLowerCase()
          ] =
            element.data;
        } else if (element.type === Mode.Script) {
          if (element.name && element.name.charAt(0) == "/") {
            return;
          } else if (element.name && element.name.charAt(0) == "!") {
            element.name = this._options.caseSensitiveTags
              ? element.name.substring(1)
              : element.name.substring(1).toLowerCase();
            node = this._copyElement(element);
            this.dom.push(node);
            this._lastTag = node;
          } else if (element.name) {
            if (element.name)
              element.name = this._options.caseSensitiveTags
                ? element.name.substring(1)
                : element.name.substring(1).toLowerCase();
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
            var baseName = this._options.caseSensitiveTags
              ? element.name.substring(1)
              : element.name.substring(1).toLowerCase();
            if (!this.isEmptyTag(element)) {
              var pos = this._tagStack.length - 1;
              while (pos > -1 && this._tagStack[pos--].name != baseName) { }
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
              parent.attributes[
                this._options.caseSensitiveAttr
                  ? element.name
                  : element.name.toLowerCase()
              ] =
                element.data;
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
            var baseName = this._options.caseSensitiveTags
              ? element.name.substring(1)
              : element.name.substring(1).toLowerCase();
            if (!this.isEmptyTag(element)) {
              var pos = this._tagStack.length - 1;
              while (pos > -1 && this._tagStack[pos--].name != baseName) { }
              if (pos > -1 || this._tagStack[0].name == baseName) {
                while (pos < this._tagStack.length - 1) {
                  this._tagStack.pop();
                }
              }
            }
          } else if (element.name && element.name.charAt(0) == "!") {
            parent = this._tagStack.last();
            if (element.name)
              element.name = this._options.caseSensitiveTags
                ? element.name.substring(1)
                : element.name.substring(1).toLowerCase();
            node = this._copyElement(element, parent);
            if (!parent.children) {
              parent.children = [];
            }
            parent.children.push(node);
            this._lastTag = node;
          } else {
            //This is not a closing tag
            parent = this._tagStack.last();
            if (element.name)
              element.name = this._options.caseSensitiveTags
                ? element.name.substring(1)
                : element.name.substring(1).toLowerCase();
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
            this._lastTag.attributes[
              this._options.caseSensitiveAttr
                ? element.name
                : element.name.toLowerCase()
            ] =
              element.data;
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
    };

    //**Private**//
    //Methods//

  }
export { HtmlBuilder as DefaultHandler };