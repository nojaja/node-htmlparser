export class ParseComment {
    constructor(perser) {
      this.perser = perser;
      this.re_parseComment_findEnding = /\-{1,2}$/;
    }
    _parseComment(state) {
      var foundPos = state.data.indexOf("--" + state.commentTagType, state.pos);
      if (foundPos < 0 && state.done) {
        foundPos = state.data.length;
      }
      if (foundPos < 0) {
        this.re_parseComment_findEnding.lastIndex = state.pos;
        var matchPartialCommentEnd = this.re_parseComment_findEnding.exec(
          state.data
        );
        if (matchPartialCommentEnd) {
          state.needData = true;
          return;
        }
        if (!state.pendingText) {
          state.pendingText = [];
        }
        state.pendingText.push(state.data.substr(state.pos, state.data.length));
        state.pos = state.data.length;
        state.needData = true;
      } else {
        var text;
        if (state.pendingText) {
          state.pendingText.push(state.data.substring(state.pos, foundPos));
          text = state.pendingText.join("");
          state.pendingText = null;
        } else {
          text = state.data.substring(state.pos, foundPos);
        }
        this.perser._write({ type: Mode.Comment, data: text });
        state.mode = Mode.Text;
        state.pos = foundPos + 3;
      }
    };

  }