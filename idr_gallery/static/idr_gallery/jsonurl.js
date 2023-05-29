/*!
 * jsonurl.js v1.1.7
 * (c) 2022 David MacCormack
 * Released under the MIT License.
 */
!(function (e, t) {
  "object" == typeof exports && "undefined" != typeof module
    ? (module.exports = t())
    : "function" == typeof define && define.amd
    ? define(t)
    : ((e = "undefined" != typeof globalThis ? globalThis : e || self).JsonURL =
        t());
})(this, function () {
  "use strict";
  const e = "JSON->URL: expected literal value",
    t = "JSON->URL: unexpected character",
    r = "JSON->URL: unexpected end of text inside composite",
    s = "JSON->URL: unexpected text after composite",
    i = "JSON->URL: the empty string is not allowed",
    n = "JSON->URL: invalid escape sequence",
    o = "JSON->URL: invalid percent-encoded sequence",
    a = "JSON->URL: expected object value";
  function p(e, t) {
    return void 0 === t ? e : e + " at position " + t;
  }
  const u = 16,
    c = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 6, 6, 48, 10, 20, 20, 6, 6, 20, 6, 6, 6,
      6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 20, 6, 0, 48, 0, 6, 6, 6, 6, 6, 6, 6, 6, 6,
      6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 0, 0, 0, 6, 0,
      6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
      6, 0, 0, 0, 6, 0,
    ];
  function l(e) {
    return e > 127 ? 0 : c[e];
  }
  class h {
    constructor(e) {
      this.setOrDefault(e, "allowEmptyUnquotedValues"),
        this.setOrDefault(e, "allowEmptyUnquotedKeys"),
        this.setOrDefault(e, "AQF"),
        this.setOrDefault(e, "coerceNullToEmptyString"),
        this.setOrDefault(e, "ignoreNullArrayMembers"),
        this.setOrDefault(e, "ignoreNullObjectMembers"),
        this.setOrDefault(e, "impliedArray"),
        this.setOrDefault(e, "impliedObject"),
        this.setOrDefault(e, "impliedStringLiterals"),
        this.setOrDefault(e, "noEmptyComposite"),
        this.setOrDefault(e, "wwwFormUrlEncoded");
    }
    setOrDefault(e, t, r) {
      void 0 !== e && t in e
        ? t in this || (this[t] = e[t])
        : void 0 === r || t in this || (this[t] = r);
    }
    setOverride(e, t) {
      void 0 !== e && t in e && (this[t] = e[t]);
    }
    setOrDefaultInt(e, t, r) {
      this.setOrDefault(e, t, void 0 === r ? r : parseInt(r));
    }
    isPresentAndTrue(e) {
      return e in this && this[e];
    }
  }
  class d extends h {
    constructor(e, t) {
      super(e),
        this.setOrDefault(e, "emptyValue"),
        this.setOrDefault(t, "emptyValue", {}),
        this.setOverride(e, "getMissingValue"),
        this.setOrDefaultInt(e, "maxParseChars"),
        this.setOrDefaultInt(t, "maxParseChars", 32768),
        this.setOrDefaultInt(e, "maxParseDepth"),
        this.setOrDefaultInt(t, "maxParseDepth", 32),
        this.setOrDefaultInt(e, "maxParseValues"),
        this.setOrDefaultInt(t, "maxParseValues", 4096),
        this.setOrDefault(e, "nullValue"),
        this.setOrDefault(t, "nullValue", null);
    }
    getMissingValue(e, t) {
      throw new SyntaxError(p(a, t));
    }
  }
  class f extends h {
    constructor(e) {
      super(e);
      const t =
        !(
          void 0 === e ||
          !("impliedStringLiterals" in e) ||
          !e.impliedStringLiterals
        ) || void 0;
      this.setOrDefault(e, "allowEmptyUnquotedValues", t),
        this.setOrDefault(e, "allowEmptyUnquotedKeys", t),
        this.setOrDefault(e, "callFunctions"),
        this.setOrDefault(e, "isImplied"),
        this.setOrDefault(e, "ignoreNullArrayMembers", t),
        this.setOrDefault(e, "ignoreNullObjectMembers", t),
        this.setOrDefault(e, "ignoreUndefinedArrayMembers", t),
        this.setOrDefault(e, "ignoreUndefinedObjectMembers", t),
        (this.isImplied =
          this.isImplied || this.impliedArray || this.impliedObject);
    }
  }
  function m(e) {
    for (
      var t = arguments.length, r = new Array(t > 1 ? t - 1 : 0), s = 1;
      s < t;
      s++
    )
      r[s - 1] = arguments[s];
    return e.toJsonURLText.apply(e, r);
  }
  const w = /\+/g,
    y = / /g,
    x = /(![\s\S]?)/g,
    O = /^[-A-Za-z0-9._~!$*;=@?/ ][-A-Za-z0-9._~!$*;=@?/' ]*$/,
    A = /^[-A-Za-z0-9._~!$*,;=@?/(): ]+$/,
    g = /^-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?$/,
    E = /[(),:]|%2[04]|%3B/gi,
    b = {
      "%20": "+",
      "%24": "$",
      "(": "%28",
      ")": "%29",
      ",": "%2C",
      ":": "%3A",
      "%3B": ";",
    },
    S = /[!(),:]|%2[01489C]|%3[AB]/gi,
    v = {
      "%20": "+",
      "%21": "!!",
      "!": "!!",
      "%24": "$",
      "%28": "!(",
      "(": "!(",
      "%29": "!)",
      ")": "!)",
      "+": "!+",
      "%2C": "!,",
      ",": "!,",
      "%3A": "!:",
      ":": "!:",
      "%3B": ";",
    },
    L = 40,
    U = 41,
    V = 44,
    C = 58,
    D = 38,
    j = 48,
    R = 65,
    N = 97,
    P = new Array(111);
  (P[33] = "!"),
    (P[40] = "("),
    (P[41] = ")"),
    (P[43] = "+"),
    (P[44] = ","),
    (P[45] = ","),
    (P[48] = "0"),
    (P[49] = "1"),
    (P[50] = "2"),
    (P[51] = "3"),
    (P[52] = "4"),
    (P[53] = "5"),
    (P[54] = "6"),
    (P[55] = "7"),
    (P[56] = "8"),
    (P[57] = "9"),
    (P[58] = ":"),
    (P[116] = "t"),
    (P[102] = "f"),
    (P[110] = "n");
  const J = "",
    F = " ";
  function T(e, t) {
    const r = t ? S : E,
      s = t ? v : b;
    return encodeURIComponent(e).replace(r, function (e) {
      const t = s[e];
      return void 0 === t ? e : t;
    });
  }
  function I(e, t) {
    switch (t) {
      case j:
        return 0;
      case 49:
        return 1;
      case 50:
        return 2;
      case 51:
        return 3;
      case 52:
        return 4;
      case 53:
        return 5;
      case 54:
        return 6;
      case 55:
        return 7;
      case 56:
        return 8;
      case 57:
        return 9;
      case R:
      case N:
        return 10;
      case 66:
      case 98:
        return 11;
      case 67:
      case 99:
        return 12;
      case 68:
      case 100:
        return 13;
      case 69:
      case 101:
        return 14;
      case 70:
      case 102:
        return 15;
      default:
        throw new SyntaxError(p(o, e));
    }
  }
  function k(e) {
    if (e.coerceNullToEmptyString) return M(e, !1);
    if (e.impliedStringLiterals)
      throw new SyntaxError(
        "JSON->URL: can not represent null with implied strings"
      );
    return "null";
  }
  function M(e, t) {
    if (t ? e.allowEmptyUnquotedKeys : e.allowEmptyUnquotedValues) return J;
    if (e.AQF) return "!e";
    if (e.impliedStringLiterals) throw new SyntaxError(i);
    return "''";
  }
  !(function (e) {
    let {
      toJsonURLText_Array: t,
      toJsonURLText_Boolean: r,
      toJsonURLText_Number: s,
      toJsonURLText_Object: i,
      toJsonURLText_String: n,
    } = e;
    Object.defineProperty(Array.prototype, "toJsonURLText", { value: t }),
      Object.defineProperty(Boolean.prototype, "toJsonURLText", { value: r }),
      Object.defineProperty(Number.prototype, "toJsonURLText", { value: s }),
      Object.defineProperty(Object.prototype, "toJsonURLText", { value: i }),
      Object.defineProperty(String.prototype, "toJsonURLText", { value: n });
  })({
    toJsonURLText_Array: function () {
      let e,
        t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
        r = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0;
      return (
        this.forEach(function (s) {
          if ("function" == typeof s) {
            if (!t.callFunctions) return;
            for (; "function" == typeof s; ) s = s();
          }
          if (void 0 === s) {
            if (t.ignoreUndefinedArrayMembers) return;
            s = k(t);
          } else if (null === s) {
            if (t.ignoreNullArrayMembers) return;
            s = k(t);
          } else s = m(s, t, r + 1);
          void 0 === e
            ? (e = s)
            : !t.wwwFormUrlEncoded || r > 0
            ? (e += "," + s)
            : (e += "&" + s);
        }),
        !t.isImplied || r > 0
          ? void 0 === e
            ? "()"
            : "(" + e + ")"
          : void 0 === e
          ? J
          : e
      );
    },
    toJsonURLText_Boolean: function () {
      return !0 === this ? "true" : "false";
    },
    toJsonURLText_Number: function (e) {
      const t = String(this);
      return e.impliedStringLiterals && -1 !== t.indexOf("+") ? T(t, e) : t;
    },
    toJsonURLText_Object: function () {
      let e,
        t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
        r = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0;
      const s = Object.keys(this),
        i = this;
      return (
        s.forEach(function (s) {
          if (null == s) return;
          let n = i[s];
          if ("function" == typeof n) {
            if (!t.callFunctions) return;
            for (; "function" == typeof n; ) n = n();
          }
          if (void 0 === n) {
            if (t.ignoreUndefinedObjectMembers) return;
            n = k(t);
          } else if (null === n) {
            if (t.ignoreNullObjectMembers) return;
            n = k(t);
          } else n = m(n, t, r + 1);
          const o = m(s, t, r, !0);
          void 0 === e
            ? (e = !t.wwwFormUrlEncoded || r > 0 ? o + ":" + n : o + "=" + n)
            : !t.wwwFormUrlEncoded || r > 0
            ? (e += "," + o + ":" + n)
            : (e += "&" + o + "=" + n);
        }),
        !t.isImplied || r > 0
          ? (t.noEmptyComposite && void 0 === e && (e = ":"),
            void 0 === e ? "()" : "(" + e + ")")
          : void 0 === e
          ? J
          : e
      );
    },
    toJsonURLText_String: function (e, t, r) {
      if (0 === this.length) return M(e, r);
      if (e.impliedStringLiterals) return T(this, e.AQF);
      if ("true" === (s = this) || "false" === s || "null" === s || g.test(s))
        return !0 === r
          ? this
          : e.AQF
          ? -1 == this.indexOf("+")
            ? "!" + this
            : this.replace("+", "!+")
          : -1 == this.indexOf("+")
          ? "'" + this + "'"
          : encodeURIComponent(this);
      var s;
      if (e.AQF) return T(this, !0);
      if (O.test(this))
        return -1 == this.indexOf(F) ? this : this.replace(y, "+");
      if (A.test(this))
        return -1 == this.indexOf(F)
          ? "'" + this + "'"
          : "'" + this.replace(y, "+") + "'";
      let i = T(this);
      return 39 == i.charCodeAt(0) ? "%27" + i.substring(1) : i;
    },
  });
  class _ {
    constructor(e, t, r, s) {
      (this.text = e),
        (this.pos = this.markPos = t),
        (this.end = r),
        (this.options = s);
    }
    skipAmps() {
      let e = arguments.length > 0 && void 0 !== arguments[0] && arguments[0];
      const t = this.text,
        r = this.end;
      let s = this.pos;
      if (e) for (; s < r && t.charCodeAt(s) === D; ) s++;
      else if (s < r && t.charCodeAt(s) === D) {
        for (s++; s < r && t.charCodeAt(s) === D; s++);
        s !== r && s--;
      }
      this.pos = s;
    }
    structChar() {
      let e = arguments.length > 0 && void 0 !== arguments[0] && arguments[0];
      if (this.options.wwwFormUrlEncoded) {
        const t = this.text.charCodeAt(this.pos);
        switch (t) {
          case D:
          case 61:
            if (e) return;
            return this.pos++, t;
        }
      }
      const t = this.pos,
        r = this.ordinal();
      switch (r) {
        case V:
        case C:
          if (e) return void (this.pos = t);
        case L:
        case U:
          return r;
        default:
          return void (this.pos = t);
      }
    }
    ordinal(e) {
      return void 0 !== e
        ? this.text.charCodeAt(e)
        : this.text.charCodeAt(this.pos++);
    }
    accept(e) {
      const t = this.pos;
      return this.ordinal() === e || ((this.pos = t), !1);
    }
    acceptPlus() {
      return 43 == this.text.charCodeAt(this.pos) && (this.pos++, !0);
    }
    done() {
      return this.end <= this.pos;
    }
    validateLiteral(e, r) {
      const s = this.text,
        i = this.end;
      for (; e < i; e++) {
        switch (l(s.charCodeAt(e)) & r) {
          case 0:
            throw new SyntaxError(p(t, e));
          case u:
            return e;
          case 8:
            return e + 1;
          default:
            continue;
        }
      }
    }
    findLiteralEnd() {
      const e = this.text,
        t = this.end;
      let r = this.pos;
      const s = 39 === e.charCodeAt(r);
      s && r++;
      const i = s ? 28 : 18;
      if (((r = this.validateLiteral(r, i)), void 0 !== r)) return r;
      if (s) throw new SyntaxError(p("JSON->URL: quoted string still open", r));
      return t;
    }
    isEmptyObject() {
      if (this.options.noEmptyComposite) {
        const e = this.pos;
        if (!this.accept(C)) return !1;
        const t = this.pos,
          r = this.accept(U);
        return (this.pos = r ? t : e), r;
      }
      return !1;
    }
    parseLiteral(e) {
      const t = this.pos,
        r = this.options,
        s = this.findLiteralEnd();
      if ((void 0 === e && (e = this.ordinal(s) == C), s <= t)) {
        return (function (e, t) {
          if (t) return J;
          throw new SyntaxError(p(i, e));
        })(
          t,
          e
            ? this.options.allowEmptyUnquotedKeys
            : this.options.allowEmptyUnquotedValues
        );
      }
      if (!0 === r.impliedStringLiterals) return this.parseStringLiteral(s, !0);
      const n = this.parseTrueFalseNull(s, e);
      if (void 0 !== n) return n;
      const o = this.parseNumberLiteral(s, e);
      return void 0 !== o ? o : this.parseStringLiteral(s, !1);
    }
    parseDigits(e) {
      let t,
        r = !1;
      for (; this.pos < e; )
        switch (this.ordinal()) {
          case j:
          case 49:
          case 50:
          case 51:
          case 52:
          case 53:
          case 54:
          case 55:
          case 56:
          case 57:
            (t = this.pos), (r = !0);
            continue;
          default:
            return (this.pos = t), r;
        }
      return (this.pos = t), r;
    }
    parseExponentValue(e) {
      return (
        !(e <= this.pos) &&
        (this.acceptPlus() || this.accept(45), this.parseDigits(e))
      );
    }
    parseExponent(e) {
      const t = this.pos;
      switch (this.ordinal()) {
        case 69:
        case 101:
          if (this.parseExponentValue(e)) return !0;
      }
      return (this.pos = t), !1;
    }
    parseFraction(e) {
      const t = this.pos;
      return (
        !(e <= t) &&
        (!(!this.accept(46) || !this.parseDigits(e)) || ((this.pos = t), !1))
      );
    }
    parseInteger(e) {
      return !(e <= this.pos) && (!!this.accept(j) || this.parseDigits(e));
    }
    parseNumberLiteral(e, t) {
      const r = this.text,
        s = this.pos;
      if (
        (this.accept(45),
        this.parseInteger(e) &&
          (this.parseFraction(e), this.parseExponent(e), this.pos === e))
      ) {
        const i = decodeURIComponent(r.substring(s, e));
        return t ? i : Number(i);
      }
      this.pos = s;
    }
    parseStringLiteral(e, t) {
      const r = this.text,
        s = this.pos;
      let i =
        t || 39 !== r.charCodeAt(s)
          ? r.substring(s, e)
          : r.substring(s + 1, e - 1);
      return (i = decodeURIComponent(i.replace(w, F))), (this.pos = e), i;
    }
    parseTrueFalseNull(e, t) {
      const r = this.text,
        s = this.pos;
      let i, n, o, a, p;
      switch (e - s) {
        case 4:
          if (
            ((i = r.charCodeAt(s)),
            (n = r.charCodeAt(s + 1)),
            (o = r.charCodeAt(s + 2)),
            (a = r.charCodeAt(s + 3)),
            116 === i && 114 === n && 117 === o && 101 === a)
          )
            return (this.pos = e), !t || "true";
          if (110 === i && 117 === n && 108 === o && 108 === a)
            return (this.pos = e), t ? "null" : this.newNullValue();
          break;
        case 5:
          if (
            ((i = r.charCodeAt(s)),
            (n = r.charCodeAt(s + 1)),
            (o = r.charCodeAt(s + 2)),
            (a = r.charCodeAt(s + 3)),
            (p = r.charCodeAt(s + 4)),
            102 === i && n === N && 108 === o && 115 === a && 101 === p)
          )
            return (this.pos = e), !!t && "false";
      }
    }
    newEmptyValue() {
      const e = this.options;
      if (e.noEmptyComposite) return [];
      const t = e.emptyValue;
      return "function" == typeof t ? t() : t;
    }
    newNullValue() {
      const e = this.options;
      let t = e.nullValue;
      return (
        "function" == typeof t && (t = t()),
        null == t && e.coerceNullToEmptyString && (t = J),
        t
      );
    }
  }
  class q extends _ {
    constructor(e, t, r, s) {
      super(e, t, r, s);
    }
    ordinal(e) {
      const t = e || this.pos,
        r = this.text.charCodeAt(t);
      let s, i;
      return (
        37 === r
          ? ((s = (function (e, t, r) {
              if (r <= t + 1) throw new SyntaxError(p(o, t));
              return (I(t, e.charCodeAt(t)) << 4) | I(t, e.charCodeAt(t + 1));
            })(this.text, t + 1, this.end)),
            (i = 3))
          : ((s = r), (i = 1)),
        void 0 === e && (this.pos += i),
        s
      );
    }
    acceptPlus() {
      return this.accept(43);
    }
    findLiteralEnd() {
      const e = this.end,
        r = this.pos,
        s = this.text;
      let i = r;
      for (;;) {
        if (e <= this.pos) return (this.pos = r), e;
        switch (50 & l(s.charCodeAt(this.pos))) {
          case 48:
            if (this.options.wwwFormUrlEncoded)
              return (i = this.pos), (this.pos = r), i;
          case 0:
            throw new SyntaxError(p(t, i));
        }
        switch (this.ordinal()) {
          case L:
          case U:
          case C:
          case V:
            return (this.pos = r), i;
          case 33:
            if (this.pos === e) throw new SyntaxError(p(n, i));
            this.ordinal(), (i = this.pos);
            break;
          default:
            i = this.pos;
        }
      }
    }
    parseStringLiteral(e) {
      const t = this.text,
        r = this.pos,
        s = decodeURIComponent(t.substring(r, e).replace(w, F));
      return (
        (this.pos = e),
        "!e" === s
          ? J
          : s.replace(x, function (e, t, s) {
              if (2 === e.length) {
                const t = e.charCodeAt(1),
                  r = P[t];
                if (void 0 !== r) return r;
              }
              throw new SyntaxError(p(n, r + s));
            })
      );
    }
  }
  class $ extends Array {
    constructor(e) {
      super(), (this.limits = e), (this.parseDepth = 0);
    }
    replaceAndPush(e, t, r) {
      if (
        ((this[this.parseDepth] = t),
        ++this.parseDepth >= this.limits.maxParseDepth)
      )
        throw new Error(p("JSON->URL: MaxParseDepth exceeded", e));
      this.push(r);
    }
    replace(e) {
      this[this.parseDepth] = e;
    }
    depth() {
      return (
        arguments.length > 0 &&
          void 0 !== arguments[0] &&
          arguments[0] &&
          (this.parseDepth--, this.pop()),
        this.parseDepth
      );
    }
  }
  class B extends Array {
    constructor(e) {
      super(), (this.limits = e), (this.numValues = 0);
    }
    popObjectValue(e) {
      let t = this.pop(),
        r = this.pop(),
        s = this[this.length - 1];
      return (
        (null === t && e.isPresentAndTrue("ignoreNullObjectMembers")) ||
          (s[r] = t),
        s
      );
    }
    popArrayValue(e) {
      let t = this.pop(),
        r = this[this.length - 1];
      return (
        (null === t && e.isPresentAndTrue("ignoreNullArrayMembers")) ||
          r.push(t),
        r
      );
    }
    checkValueLimit(e) {
      let t =
        arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 1;
      if (
        ((this.numValues += t), this.numValues > this.limits.maxParseValues + 1)
      )
        throw new Error(p("JSON->URL: MaxParseValues exceeded", e));
    }
    appendArrayValue(e, t) {
      let r =
        arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 1;
      this.checkValueLimit(e, r), this.push(t);
    }
  }
  function Q(e) {
    for (; "function" == typeof e; ) e = e();
    return e;
  }
  function K(e, t, r, s) {
    return (
      "number" == typeof e ? "number" != typeof t && (r = t) : (r = e),
      (r = Q(r)) instanceof d || (r = new d(r, s)),
      r
    );
  }
  function z(e, t, r, s) {
    return s.AQF ? new q(e, t, r, s) : new _(e, t, r, s);
  }
  function Z(e, t) {
    return "number" == typeof e ? e : t;
  }
  function G(i, n, o, u, c) {
    if (void 0 === i) return;
    (u = K(n, o, u, c)), (i = String(i));
    const l = Z(n, 0),
      h = Z(o, i.length);
    if (h <= l) {
      if (void 0 !== u.impliedArray) return u.impliedArray;
      if (void 0 !== u.impliedObject) return u.impliedObject;
      throw new SyntaxError(p("JSON->URL: expected value", 0));
    }
    if (h > u.maxParseChars)
      throw new Error("JSON->URL: MaxParseChars exceeded");
    const d = u.wwwFormUrlEncoded && (u.impliedObject || u.impliedArray),
      f = new B(u),
      m = new $(u),
      w = z(i, l, h, u);
    if (void 0 !== u.impliedObject) f.push(u.impliedObject), m.push(6);
    else if (void 0 !== u.impliedArray) f.push(u.impliedArray), m.push(2);
    else {
      if (w.structChar(!0) !== L) {
        const t = w.parseLiteral(!1);
        if (w.done()) return t;
        throw new SyntaxError(p(e, 0));
      }
      m.push(1);
    }
    for (d && w.skipAmps(!0); ; ) {
      if (w.done()) throw new SyntaxError(p(r, w.pos));
      let i, n, o;
      switch (m[m.depth()]) {
        case 1:
          switch (w.structChar(!0)) {
            case L:
              f.appendArrayValue(w.pos, []), m.replaceAndPush(w.pos, 3, 1);
              continue;
            case U:
              if (-1 === m.depth(!0)) {
                if (w.done()) return w.newEmptyValue();
                throw new SyntaxError(p(s, w.pos));
              }
              if (
                (f.appendArrayValue(w.pos, w.newEmptyValue()),
                0 === m.depth() && (d && w.skipAmps(), w.done()))
              ) {
                if (u.impliedArray) return f.popArrayValue(u);
                if (u.impliedObject) return f.popObjectValue(u);
                throw new SyntaxError(p(r, w.pos));
              }
              continue;
          }
          switch (
            (f.checkValueLimit(w.pos),
            (n = w.isEmptyObject()),
            (i = n ? {} : w.parseLiteral()),
            (o = w.pos),
            w.structChar())
          ) {
            case D:
              if (!u.wwwFormUrlEncoded || m.depth() > 0)
                throw new SyntaxError(p(t, o));
            case V:
              m.replace(2),
                f.appendArrayValue(o, []),
                f.push(i),
                f.popArrayValue(u);
              continue;
            case U:
              switch (
                (n ? f.push({}) : f.appendArrayValue(o, [i]), m.depth(!0))
              ) {
                case -1:
                  if (w.pos === h) return f[0];
                  throw new SyntaxError(p(s, o));
                case 0:
                  if ((d && w.skipAmps(), w.done())) {
                    if (u.impliedArray) return f.popArrayValue(u);
                    if (u.impliedObject) return f.popObjectValue(u);
                    throw new SyntaxError(p(r, o));
                  }
              }
              continue;
            case 61:
              if (!u.wwwFormUrlEncoded || m.depth() > 0)
                throw new SyntaxError(p(t, o));
            case C:
              m.replace(4), f.push({}, i);
              continue;
            default:
              throw new SyntaxError(p(e, o));
          }
        case 2:
          if (w.accept(L)) {
            m.replaceAndPush(w.pos, 3, 1);
            continue;
          }
          if (
            (f.checkValueLimit(w.pos),
            (i = w.parseLiteral(!1)),
            d && w.skipAmps(),
            w.done())
          ) {
            if (0 === m.depth() && u.impliedArray)
              return f.push(i), f.popArrayValue(u);
            throw new SyntaxError(p(r, h));
          }
          m.replace(3), f.push(i);
          continue;
        case 3:
          switch ((f.popArrayValue(u), w.structChar())) {
            case D:
              if (!u.wwwFormUrlEncoded || m.depth() > 0)
                throw new SyntaxError(p(t, w.pos));
            case V:
              m.replace(2);
              continue;
            case U:
              switch (m.depth(!0)) {
                case -1:
                  if (w.done() && !u.impliedArray) return f[0];
                  throw new SyntaxError(p(s, w.pos));
                case 0:
                  if ((d && w.skipAmps(), w.done())) {
                    if (u.impliedArray) return f.popArrayValue(u);
                    if (u.impliedObject) return f.popObjectValue(u);
                    throw new SyntaxError(p(r, w.pos));
                  }
              }
              continue;
          }
          throw new SyntaxError(
            p("JSON->URL: expected comma or close paren", w.pos)
          );
        case 4:
          if (w.accept(L)) {
            m.replaceAndPush(w.pos, 5, 1);
            continue;
          }
          if (
            (f.checkValueLimit(w.pos),
            (i = w.parseLiteral(!1)),
            d && w.skipAmps(),
            w.done())
          ) {
            if (0 === m.depth() && u.impliedObject)
              return f.push(i), f.popObjectValue(u);
            throw new SyntaxError(p(r, h));
          }
          m.replace(5), f.push(i);
          continue;
        case 5:
          switch ((f.popObjectValue(u), (o = w.pos), w.structChar())) {
            case D:
              if (!u.wwwFormUrlEncoded || m.depth() > 0)
                throw new SyntaxError(p(t, o));
            case V:
              m.replace(6);
              continue;
            case U:
              switch (m.depth(!0)) {
                case -1:
                  if (w.done() && !u.impliedObject) return f[0];
                  throw new SyntaxError(p(s, w.pos));
                case 0:
                  if ((d && w.skipAmps(), w.done())) {
                    if (u.impliedArray) return f.popArrayValue(u);
                    if (u.impliedObject) return f.popObjectValue(u);
                    throw new SyntaxError(p(s, w.pos));
                  }
              }
              continue;
          }
          throw new SyntaxError(
            p("JSON->URL: expected comma, open paren, or close paren", w.pos)
          );
        case 6:
          if (((i = w.parseLiteral(!0)), d && w.skipAmps(), w.done())) {
            if (u.impliedObject && 0 == m.depth())
              return f.push(i, u.getMissingValue(i)), f.popObjectValue(u);
            throw new SyntaxError(p(r, h));
          }
          switch (w.structChar()) {
            case 61:
              if (!u.wwwFormUrlEncoded || m.depth() > 0)
                throw new SyntaxError(p(t, w.pos));
            case C:
              break;
            case D:
              if (!u.wwwFormUrlEncoded || m.depth() > 0)
                throw new SyntaxError(p(t, w.pos));
            case V:
              if (u.impliedObject && 0 == m.depth()) {
                f.push(i, u.getMissingValue(i)), f.popObjectValue(u);
                continue;
              }
            default:
              throw new SyntaxError(p(a, w.pos));
          }
          m.replace(4), f.push(i);
          continue;
        default:
          throw new SyntaxError(p("JSON->URL: internal error", w.pos));
      }
    }
  }
  return class {
    constructor(e) {
      for (; "function" == typeof e; ) e = e();
      void 0 === e && (e = {}),
        (this.maxParseDepth =
          "number" == typeof e.maxParseDepth ? parseInt(e.maxParseDepth) : 32),
        (this.maxParseValues =
          "number" == typeof e.maxParseValues
            ? parseInt(e.maxParseValues)
            : 4096),
        (this.maxParseChars =
          "number" == typeof e.maxParseChars
            ? parseInt(e.maxParseChars)
            : 32768),
        (this.emptyValue = void 0 === e.emptyValue ? {} : e.emptyValue),
        (this.nullValue = void 0 === e.nullValue ? null : e.nullValue);
    }
    parseLiteral(e) {
      let t =
          arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0,
        r =
          arguments.length > 2 && void 0 !== arguments[2]
            ? arguments[2]
            : void 0,
        s = arguments.length > 3 && void 0 !== arguments[3] && arguments[3],
        i = arguments.length > 4 ? arguments[4] : void 0;
      void 0 !== e && (e = String(e)), void 0 === r && (r = e.length);
      return z(e, t, r, K(i)).parseLiteral(s);
    }
    static parse(e, t, r, s) {
      return G(e, t, r, s, void 0);
    }
    parse(e, t, r, s) {
      return G(e, t, r, s, this);
    }
    static stringify(e, t) {
      if (void 0 !== e)
        return (t = new f(Q(t))), null === e ? k(t) : m(e, t, 0);
    }
  };
});