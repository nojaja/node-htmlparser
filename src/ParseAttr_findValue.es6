export class ParseAttr_findValue {
    constructor(perser) {
      this.perser = perser;
      this.re_parseAttr_findValue = /\s*=\s*(?:'([^']*)'|"([^"]*)"|([^'"\s\/>]+))\s*/g;
      this.re_parseAttr_findValue_last = /\s*=\s*['"]?(.*)$/g;
    }
    _parseAttr_findValue(state) {
      this.re_parseAttr_findValue.lastIndex = state.pos;
      var match = this.re_parseAttr_findValue.exec(state.data);
      if (!match) {
        if (!state.done) {
          return null;
        }
        this.re_parseAttr_findValue_last.lastIndex = state.pos;
        match = this.re_parseAttr_findValue_last.exec(state.data);
        if (!match) {
          return null;
        }
        return {
          match: match[0],
          value: match[1] !== "" ? match[1] : null
        };
      }
      if (
        state.pos + match[0].length !==
        this.re_parseAttr_findValue.lastIndex
      ) {
        return null;
      }
      return {
        match: match[0],
        value: match[1] || match[2] || match[3]
      };
    };
  }