export class ParseText {
    constructor(perser) {
      this.perser = perser;
      this._re_parseText_tagOpen = new RegExp("([\\<" + opentags.join("") + "])", "g");
      this._re_parseText_scriptClose = /<\s*\/\s*(x\-)?script/gi;
    }

    _parseText(state){
      var nextMode = Mode.Tag;
      var foundPos;
      if (state.isScript) {
        this._re_parseText_scriptClose.lastIndex = state.pos;
        foundPos = this._re_parseText_scriptClose.exec(state.data);
        foundPos = foundPos ? foundPos.index : -1;
      } else {
        this._re_parseText_tagOpen.lastIndex = state.pos;
        var match = this._re_parseText_tagOpen.exec(state.data);
        if (match) {
          if (match[0] == "<") {
            nextMode = Mode.Tag;
            foundPos = match.index;
          } else {
            TagType.forEach(function(tagtype) {
              if (match[0] == tagtype.openCode) {
                nextMode = Mode.Script;
                state.lastMode = Mode.Text;
                foundPos = match.index;
                state.scriptTagType = tagtype;
              }
            }, this.perser);
          }
        } else {
          nextMode = Mode.Tag;
          foundPos = -1;
        }
      }
      var text =
        foundPos === -1
          ? state.data.substring(state.pos, state.data.length)
          : state.data.substring(state.pos, foundPos);
      if (foundPos < 0 && state.done) {
        foundPos = state.data.length;
      }
      if (foundPos < 0) {
        if (state.isScript) {
          state.needData = true;
          return;
        }
        if (!state.pendingText) {
          state.pendingText = [];
        }
        state.pendingText.push(
          state.data.substring(state.pos, state.data.length)
        );
        state.pos = state.data.length;
      } else {
        if (state.pendingText) {
          state.pendingText.push(state.data.substring(state.pos, foundPos));
          text = state.pendingText.join("");
          state.pendingText = null;
        } else {
          text = state.data.substring(state.pos, foundPos);
        }
        if (text !== "") {
          this.perser._write({ type: Mode.Text, data: text });
        }
        state.pos = foundPos + 1;
        state.mode = nextMode;
      }
    }
  }