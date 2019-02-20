export class ParseTag {
    constructor(perser) {
      this.perser = perser;
      this.re_parseTag = /\s*(\/?)\s*([^\s>\/]+)(\s*)\??(>?)/g;
    }
    _parseTag(state) {
      this.re_parseTag.lastIndex = state.pos;
      var match = this.re_parseTag.exec(state.data);
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
          this.perser._writePending(tag);
        } else {
          this.perser._write(tag);
        }
      } else {
        //TODO: end of tag?
        //TODO: push to pending?
        state.needData = true;
      }
    };

  }