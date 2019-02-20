export class ParseDoctype {
    constructor(perser) {
      this.perser = perser;
    }
    _parseDoctype(state) {
      var foundPos = state.data.indexOf(">", state.pos);
      if (foundPos < 0 && state.done) {
        foundPos = state.data.length;
      }
      if (foundPos < 0) {
        this.re_parseCData_findEnding.lastIndex = state.pos;
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
        this.perser._write({ type: Mode.Doctype, data: text });
        state.mode = Mode.Text;
        state.pos = foundPos + 1;
      }
    };
  }