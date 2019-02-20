export class Element {
    //Properties//
    //Methods//
    constructor(_type, _parentNode) {
      this.type = _type;
      this.parentNode = _parentNode;
    }
    get nextSibling() {
      if (!this.parentNode || !this.parentNode.children) return null;
      var i = this.parentNode.children.indexOf(this);
      if (i == -1 || this.parentNode.children.lenght <= i) return null;
      return this.parentNode.children[i + 1];
    };
    get attribs() {
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

    getElementById(id, recurse) {
      return DomUtils.getElementById(id, this, recurse);
    };
    getElementsByTagName(id, recurse, limit) {
      return DomUtils.getElementsByTagName(id, this, recurse, limit);
    };
    getElementsByTagType(type, recurse, limit) {
      return DomUtils.getElementsByTagType(type, this, recurse, limit);
    };
    getElements(options, recurse, limit) {
      return DomUtils.getElements(options, this, recurse, limit);
    };
    removeChildAll() {
      return DomUtils.removeChildAll(this);
    };
    removeChild(element) {
      return DomUtils.removeChild(element, this);
    };
    createNode(type, parentNode) {
      return new Element(type, parentNode || null);
    };
    createElement(tagName, parentNode) {
      var newElement = new Element("tag", parentNode || null);
      newElement.name = tagName;
      return newElement;
    };
    createTextNode(text, parentNode) {
      var newElement = new Element("text", parentNode || null);
      newElement.data = text;
      return newElement;
    };

    appendChild(element) {
      this.children = this.children || [];
      element.parentNode = this;
      this.children.push(element);
    };

    insertBefore(newNode, referenceNode) {
      this.children = this.children || [];
      var index = this.children.indexOf(referenceNode);
      this.children.splice(index, 0, newNode);
    };

    getAttribute(name) {
      this.attributes[name];
    };

    cloneElement(parentNode) {
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
            if (attributeElement.langName)
              _attributeElement.langName = attributeElement.langName;
            _attribute.push(_attributeElement);
          }
          newAttributes[key] = _attribute;
        }
        return newAttributes;
      }
      var newElement = this.createNode(this.type, parentNode || {});
      if (this.name) newElement.name = this.name;
      if (this.raw) newElement.raw = this.raw;
      if (this.location)
        newElement.location = {
          line: this.location.line,
          col: this.location.col
        };
      if (this.langName) newElement.langName = this.langName;
      if (this.data) newElement.data = this.data;

      if (this.attributes)
        newElement.attributes = cloneAttributes(this.attributes);
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
    };
    //getElementsByClassName
    //getAttribute
    //setAttribute
    //removeAttribute

  }