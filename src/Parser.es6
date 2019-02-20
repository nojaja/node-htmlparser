export class Parser {
    constructor(builder, options) {
      //Properties//
      this.writable = true;

      this._options = options ? options : {};
      // if (this._options.includeLocation === undefined) {
      //     this._options.includeLocation = false; //Include position of element (row, col) on nodes
      // }
      
      this._validateBuilder = function(builder) {
        if (typeof builder != "object") {
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
      };
      
      this._validateBuilder(builder);
      var self = this;
      this._builder = builder;
      
      
      this.reset=function() {
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
      
      this.reset();

      let parseText = new ParseText(this);
      this._parseText = (state) => parseText._parseText(state);
      let parseScript = new ParseScript(this);
      this._parseScript = (state) => parseScript._parseScript(state);
      let parseTag = new ParseTag(this);
      this._parseTag = (state) => parseTag._parseTag(state);
      let parseAttr = new ParseAttr(this);
      this._parseAttr = (state) => parseAttr._parseAttr(state);
      let parseCData = new ParseCData(this);
      this._parseCData = (state) => parseCData._parseCData(state);
      let parseDoctype = new ParseDoctype(this);
      this._parseDoctype = (state) => parseDoctype._parseDoctype(state);
      let parseComment = new ParseComment(this);
      this._parseComment = (state) => parseComment._parseComment(state);
   
    }
    //**Public**//
    write(data) {
      if (data instanceof Buffer) {
        data = data.toString();
      }
      this.parseChunk(data);
    }
    end(data) {
      if (arguments.length) {
        this.write(data);
      }
      this.writable = false;
      this.done();
    }
    destroy() {
      this.writable = false;
    }
    
    parseChunk(chunk) {
      this._state.needData = false;
      this._state.data =
        this._state.data !== null
          ? this._state.data.substr(this.pos) + chunk
          : chunk;
      while (
        this._state.pos < this._state.data.length &&
        !this._state.needData
      ) {
        this._parse(this._state);
      }
    }
    parseComplete(data) {
      if (!data) return;
      this.reset();
      TagType.forEach(function(tagtype) {
        data = data
          .replace(new RegExp(tagtype.open, "g"), tagtype.openCode)
          .replace(new RegExp(tagtype.close, "g"), tagtype.closeCode);
      }, this);
      this.parseChunk(data);
      this.done();
    }
    done() {
      this._state.done = true;
      this._parse(this._state);
      this._flushWrite();
      this._builder.done();
    }

    //**Private**//
    _parse() {
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
    _writePending(node) {
      if (!this._state.pendingWrite) {
        this._state.pendingWrite = [];
      }
      this._state.pendingWrite.push(node);
    }
    _flushWrite() {
      if (this._state.pendingWrite) {
        for (var i = 0, len = this._state.pendingWrite.length; i < len; i++) {
          var node = this._state.pendingWrite[i];
          this._builder.write(node);
        }
        this._state.pendingWrite = null;
      }
    }
    _write(node) {
      this._flushWrite();
      this._builder.write(node);
    }
  }
