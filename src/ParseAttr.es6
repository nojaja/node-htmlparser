export class ParseAttr {
    constructor(perser) {
      this.perser = perser;
      this.re_parseAttr_splitValue = /^\s*=\s*['"]?/g;
      this.re_parseAttr_selfClose = /(\s*\/\s*)(>?)/g;
      this.parseAttr_findName = new ParseAttr_findName(perser);
      this.parseAttr_findValue = new ParseAttr_findValue(perser);
    }
    _parseAttr(state) {
      var name_data = this.parseAttr_findName._parseAttr_findName(state);
      if (!name_data || name_data.name === "?") {
        this.re_parseAttr_selfClose.lastIndex = state.pos;
        var matchTrailingSlash = this.re_parseAttr_selfClose.exec(state.data);
        if (matchTrailingSlash && matchTrailingSlash.index === state.pos) {
          if (
            !state.done &&
            !matchTrailingSlash[2] &&
            state.pos + matchTrailingSlash[0].length === state.data.length
          ) {
            state.needData = true;
            return;
          }
          state.lastTag.raw += matchTrailingSlash[1];
          // state.output.push({ type: Mode.Tag, name: '/' + state.lastTag.name, raw: null });
          this.perser._write({
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
      if (
        !state.done &&
        state.pos + name_data.match.length === state.data.length
      ) {
        state.needData = true;
        return null;
      }
      state.pos += name_data.match.length;
      var value_data = this.parseAttr_findValue._parseAttr_findValue(state);
      if (value_data) {
        if (
          !state.done &&
          state.pos + value_data.match.length === state.data.length
        ) {
          state.needData = true;
          state.pos -= name_data.match.length;
          return;
        }
        state.pos += value_data.match.length;
      } else {
        this.re_parseAttr_splitValue.lastIndex = state.pos;
        if (this.re_parseAttr_splitValue.exec(state.data)) {
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
        var handler = new HtmlBuilder(function (err, dom) { },
          this.perser._builder._options);
        var parser = new Parser(handler);
        parser.parseComplete(value_data.value);
        data = handler.dom;
      }

      this.perser._writePending({ type: Mode.Attr, name: name_data.name, data: data });
    };

  }