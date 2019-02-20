export class ParseScript {
    constructor(perser) {
      this.perser = perser;
      this.re_parseScript = /\s*([\/\#][^\s\}]+)?(\!\-*)?\s*([^\}]*?)\}/g;
    }
    _parseScript(state){
      var re_parseScript =
        "\\s*([\\/\\#][^\\s" +
        state.scriptTagType.closeCode +
        "]+)?(\\!\\-*)?\\s*([^" +
        state.scriptTagType.closeCode +
        "]*?)" +
        state.scriptTagType.closeCode;
      this.re_parseScript = new RegExp(re_parseScript, "g");

      this.re_parseScript.lastIndex = state.pos;
      var match = this.re_parseScript.exec(state.data);
      if (match) {
        state.mode = Mode.Script;
        if (match[2] && match[2].substr(0, 3) === "!--") {
          state.mode = Mode.Comment;
          state.commentTagType = state.scriptTagType.closeCode;
          state.pos += 3;
          return;
        }
        if (match[2] && match[2].charAt(0) == "!") {
          state.mode = Mode.Comment;
          state.commentTagType = state.scriptTagType.closeCode;
          state.pos += 1;
        }
        var text = match[3];
        if (state.pendingText) {
          state.pendingText.push(text);
          text = state.pendingText.join("");
          state.pendingText = null;
        }
        if (text !== "") {
          this.perser._write({
            type: state.mode,
            name: match[1] || match[2],
            data: text,
            langName: state.scriptTagType.langName
          });
        }
        state.pos += match[0].length;
        state.mode = state.lastMode;
      } else {
        //TODO: end of tag?
        //TODO: push to pending?
        state.needData = true;
      }
  };
}