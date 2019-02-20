export class ParseAttr_findName {
    constructor(perser) {
      this.perser = perser;
      this.re_parseAttr_findName = /\s*([^=<>\s'"\/]+)\s*/g;
    }
    _parseAttr_findName(state) {
      this.re_parseAttr_findName.lastIndex = state.pos;
      var match = this.re_parseAttr_findName.exec(state.data);
      if (!match) {
        return null;
      }
      if (
        state.pos + match[0].length !==
        this.re_parseAttr_findName.lastIndex
      ) {
        return null;
      }
      return {
        match: match[0],
        name: match[1]
      };
    };

  }