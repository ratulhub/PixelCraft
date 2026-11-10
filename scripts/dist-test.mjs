// node_modules/fflate/esm/index.mjs
import { createRequire } from "module";
var require2 = createRequire("/");
var _a;
var Worker;
var isMarkedAsUntransferable;
try {
  _a = require2("worker_threads"), Worker = _a.Worker, isMarkedAsUntransferable = _a.isMarkedAsUntransferable;
} catch (e) {
}
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = (function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
      }
    }
  }
  return co;
});
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flm = /* @__PURE__ */ hMap(flt, 9, 0);
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function(a) {
  var m = a[0];
  for (var i = 1; i < a.length; ++i) {
    if (a[i] > m)
      m = a[i];
  }
  return m;
};
var bits = function(d, p, m) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
};
var bits16 = function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var inflt = function(dat, st, buf, dict) {
  var sl = dat.length, dl = dict ? dict.length : 0;
  if (!sl || st.f && !st.l)
    return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st.i != 2;
  var noSt = st.i;
  if (noBuf)
    buf = new u8(sl * 3);
  var cbuf = function(l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        st.b = bt += l, st.p = pos = t * 8, st.f = final;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i = 0; i < hcLen; ++i) {
          clt[clim[i]] = bits(dat, pos + i * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i = 0; i < tl; ) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >> 4;
          if (s < 16) {
            ldt[i++] = s;
          } else {
            var c = 0, n = 0;
            if (s == 16)
              n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
            else if (s == 17)
              n = 3 + bits(dat, pos, 7), pos += 3;
            else if (s == 18)
              n = 11 + bits(dat, pos, 127), pos += 7;
            while (n--)
              ldt[i++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (resize)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i = sym - 257, b = fleb[i];
          add = bits(dat, pos, (1 << b) - 1) + fl[i];
          pos += b;
        }
        var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
        if (!d)
          err(3);
        pos += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
        }
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + 131072);
        var end = bt + add;
        if (bt < dt) {
          var shift = dl - dt, dend = Math.min(dt, end);
          if (shift + bt < 0)
            err(3);
          for (; bt < dend; ++bt)
            buf[bt] = dict[shift + bt];
        }
        for (; bt < end; ++bt)
          buf[bt] = buf[bt - dt];
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var wbits = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
};
var wbits16 = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
  d[o + 2] |= v >> 16;
};
var hTree = function(d, mb) {
  var t = [];
  for (var i = 0; i < d.length; ++i) {
    if (d[i])
      t.push({ s: i, f: d[i] });
  }
  var s = t.length;
  var t2 = t.slice();
  if (!s)
    return { t: et, l: 0 };
  if (s == 1) {
    var v = new u8(t[0].s + 1);
    v[t[0].s] = 1;
    return { t: v, l: 1 };
  }
  t.sort(function(a, b) {
    return a.f - b.f;
  });
  t.push({ s: -1, f: 25001 });
  var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
  t[0] = { s: -1, f: l.f + r.f, l, r };
  while (i1 != s - 1) {
    l = t[t[i0].f < t[i2].f ? i0++ : i2++];
    r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
    t[i1++] = { s: -1, f: l.f + r.f, l, r };
  }
  var maxSym = t2[0].s;
  for (var i = 1; i < s; ++i) {
    if (t2[i].s > maxSym)
      maxSym = t2[i].s;
  }
  var tr = new u16(maxSym + 1);
  var mbt = ln(t[i1 - 1], tr, 0);
  if (mbt > mb) {
    var i = 0, dt = 0;
    var lft = mbt - mb, cst = 1 << lft;
    t2.sort(function(a, b) {
      return tr[b.s] - tr[a.s] || a.f - b.f;
    });
    for (; i < s; ++i) {
      var i2_1 = t2[i].s;
      if (tr[i2_1] > mb) {
        dt += cst - (1 << mbt - tr[i2_1]);
        tr[i2_1] = mb;
      } else
        break;
    }
    dt >>= lft;
    while (dt > 0) {
      var i2_2 = t2[i].s;
      if (tr[i2_2] < mb)
        dt -= 1 << mb - tr[i2_2]++ - 1;
      else
        ++i;
    }
    for (; i >= 0 && dt; --i) {
      var i2_3 = t2[i].s;
      if (tr[i2_3] == mb) {
        --tr[i2_3];
        ++dt;
      }
    }
    mbt = mb;
  }
  return { t: new u8(tr), l: mbt };
};
var ln = function(n, l, d) {
  return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
};
var lc = function(c) {
  var s = c.length;
  while (s && !c[--s])
    ;
  var cl = new u16(++s);
  var cli = 0, cln = c[0], cls = 1;
  var w = function(v) {
    cl[cli++] = v;
  };
  for (var i = 1; i <= s; ++i) {
    if (c[i] == cln && i != s)
      ++cls;
    else {
      if (!cln && cls > 2) {
        for (; cls > 138; cls -= 138)
          w(32754);
        if (cls > 2) {
          w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
          cls = 0;
        }
      } else if (cls > 3) {
        w(cln), --cls;
        for (; cls > 6; cls -= 6)
          w(8304);
        if (cls > 2)
          w(cls - 3 << 5 | 8208), cls = 0;
      }
      while (cls--)
        w(cln);
      cls = 1;
      cln = c[i];
    }
  }
  return { c: cl.subarray(0, cli), n: s };
};
var clen = function(cf, cl) {
  var l = 0;
  for (var i = 0; i < cl.length; ++i)
    l += cf[i] * cl[i];
  return l;
};
var wfblk = function(out, pos, dat) {
  var s = dat.length;
  var o = shft(pos + 2);
  out[o] = s & 255;
  out[o + 1] = s >> 8;
  out[o + 2] = out[o] ^ 255;
  out[o + 3] = out[o + 1] ^ 255;
  for (var i = 0; i < s; ++i)
    out[o + i + 4] = dat[i];
  return (o + 4 + s) * 8;
};
var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
  wbits(out, p++, final);
  ++lf[256];
  var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
  var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
  var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
  var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
  var lcfreq = new u16(19);
  for (var i = 0; i < lclt.length; ++i)
    ++lcfreq[lclt[i] & 31];
  for (var i = 0; i < lcdt.length; ++i)
    ++lcfreq[lcdt[i] & 31];
  var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
  var nlcc = 19;
  for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
    ;
  var flen = bl + 5 << 3;
  var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
  var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
  if (bs >= 0 && flen <= ftlen && flen <= dtlen)
    return wfblk(out, p, dat.subarray(bs, bs + bl));
  var lm, ll, dm, dl;
  wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
  if (dtlen < ftlen) {
    lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
    var llm = hMap(lct, mlcb, 0);
    wbits(out, p, nlc - 257);
    wbits(out, p + 5, ndc - 1);
    wbits(out, p + 10, nlcc - 4);
    p += 14;
    for (var i = 0; i < nlcc; ++i)
      wbits(out, p + 3 * i, lct[clim[i]]);
    p += 3 * nlcc;
    var lcts = [lclt, lcdt];
    for (var it = 0; it < 2; ++it) {
      var clct = lcts[it];
      for (var i = 0; i < clct.length; ++i) {
        var len = clct[i] & 31;
        wbits(out, p, llm[len]), p += lct[len];
        if (len > 15)
          wbits(out, p, clct[i] >> 5 & 127), p += clct[i] >> 12;
      }
    }
  } else {
    lm = flm, ll = flt, dm = fdm, dl = fdt;
  }
  for (var i = 0; i < li; ++i) {
    var sym = syms[i];
    if (sym > 255) {
      var len = sym >> 18 & 31;
      wbits16(out, p, lm[len + 257]), p += ll[len + 257];
      if (len > 7)
        wbits(out, p, sym >> 23 & 31), p += fleb[len];
      var dst = sym & 31;
      wbits16(out, p, dm[dst]), p += dl[dst];
      if (dst > 3)
        wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
    } else {
      wbits16(out, p, lm[sym]), p += ll[sym];
    }
  }
  wbits16(out, p, lm[256]);
  return p + ll[256];
};
var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
var et = /* @__PURE__ */ new u8(0);
var dflt = function(dat, lvl, plvl, pre, post, st) {
  var s = st.z || dat.length;
  var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
  var w = o.subarray(pre, o.length - post);
  var lst = st.l;
  var pos = (st.r || 0) & 7;
  if (lvl) {
    if (pos)
      w[0] = st.r >> 3;
    var opt = deo[lvl - 1];
    var n = opt >> 13, c = opt & 8191;
    var msk_1 = (1 << plvl) - 1;
    var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
    var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
    var hsh = function(i2) {
      return (dat[i2] ^ dat[i2 + 1] << bs1_1 ^ dat[i2 + 2] << bs2_1) & msk_1;
    };
    var syms = new i32(25e3);
    var lf = new u16(288), df = new u16(32);
    var lc_1 = 0, eb = 0, i = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
    for (; i + 2 < s; ++i) {
      var hv = hsh(i);
      var imod = i & 32767, pimod = head[hv];
      prev[imod] = pimod;
      head[hv] = imod;
      if (wi <= i) {
        var rem = s - i;
        if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
          pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
          li = lc_1 = eb = 0, bs = i;
          for (var j = 0; j < 286; ++j)
            lf[j] = 0;
          for (var j = 0; j < 30; ++j)
            df[j] = 0;
        }
        var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
        if (rem > 2 && hv == hsh(i - dif)) {
          var maxn = Math.min(n, rem) - 1;
          var maxd = Math.min(32767, i);
          var ml = Math.min(258, rem);
          while (dif <= maxd && --ch_1 && imod != pimod) {
            if (dat[i + l] == dat[i + l - dif]) {
              var nl = 0;
              for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl)
                ;
              if (nl > l) {
                l = nl, d = dif;
                if (nl > maxn)
                  break;
                var mmd = Math.min(dif, nl - 2);
                var md = 0;
                for (var j = 0; j < mmd; ++j) {
                  var ti = i - dif + j & 32767;
                  var pti = prev[ti];
                  var cd = ti - pti & 32767;
                  if (cd > md)
                    md = cd, pimod = ti;
                }
              }
            }
            imod = pimod, pimod = prev[imod];
            dif += imod - pimod & 32767;
          }
        }
        if (d) {
          syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
          var lin = revfl[l] & 31, din = revfd[d] & 31;
          eb += fleb[lin] + fdeb[din];
          ++lf[257 + lin];
          ++df[din];
          wi = i + l;
          ++lc_1;
        } else {
          syms[li++] = dat[i];
          ++lf[dat[i]];
        }
      }
    }
    for (i = Math.max(i, wi); i < s; ++i) {
      syms[li++] = dat[i];
      ++lf[dat[i]];
    }
    pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
    if (!lst) {
      st.r = pos & 7 | w[pos / 8 | 0] << 3;
      pos -= 7;
      st.h = head, st.p = prev, st.i = i, st.w = wi;
    }
  } else {
    for (var i = st.w || 0; i < s + lst; i += 65535) {
      var e = i + 65535;
      if (e >= s) {
        w[pos / 8 | 0] = lst;
        e = s;
      }
      pos = wfblk(w, pos + 1, dat.subarray(i, e));
    }
    st.i = s;
  }
  return slc(o, 0, pre + shft(pos) + post);
};
var adler = function() {
  var a = 1, b = 0;
  return {
    p: function(d) {
      var n = a, m = b;
      var l = d.length | 0;
      for (var i = 0; i != l; ) {
        var e = Math.min(i + 2655, l);
        for (; i < e; ++i)
          m += n += d[i];
        n = (n & 65535) + 15 * (n >> 16), m = (m & 65535) + 15 * (m >> 16);
      }
      a = n, b = m;
    },
    d: function() {
      a %= 65521, b %= 65521;
      return (a & 255) << 24 | (a & 65280) << 8 | (b & 255) << 8 | b >> 8;
    }
  };
};
var dopt = function(dat, opt, pre, post, st) {
  if (!st) {
    st = { l: 1 };
    if (opt.dictionary) {
      var dict = opt.dictionary.subarray(-32768);
      var newDat = new u8(dict.length + dat.length);
      newDat.set(dict);
      newDat.set(dat, dict.length);
      dat = newDat;
      st.w = dict.length;
    }
  }
  return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
};
var wbytes = function(d, b, v) {
  for (; v; ++b)
    d[b] = v, v >>>= 8;
};
var zlh = function(c, o) {
  var lv = o.level, fl2 = lv == 0 ? 0 : lv < 6 ? 1 : lv == 9 ? 3 : 2;
  c[0] = 120, c[1] = fl2 << 6 | (o.dictionary && 32);
  c[1] |= 31 - (c[0] << 8 | c[1]) % 31;
  if (o.dictionary) {
    var h = adler();
    h.p(o.dictionary);
    wbytes(c, 2, h.d());
  }
};
var zls = function(d, dict) {
  if ((d[0] & 15) != 8 || d[0] >> 4 > 7 || (d[0] << 8 | d[1]) % 31)
    err(6, "invalid zlib data");
  if ((d[1] >> 5 & 1) == +!dict)
    err(6, "invalid zlib data: " + (d[1] & 32 ? "need" : "unexpected") + " dictionary");
  return (d[1] >> 3 & 4) + 2;
};
function inflateSync(data, opts) {
  return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
function zlibSync(data, opts) {
  if (!opts)
    opts = {};
  var a = adler();
  a.p(data);
  var d = dopt(data, opts, opts.dictionary ? 6 : 2, 4);
  return zlh(d, opts), wbytes(d, d.length - 4, a.d()), d;
}
function unzlibSync(data, opts) {
  return inflt(data.subarray(zls(data, opts && opts.dictionary), -4), { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}

// src/core/tests/fixtures.ts
function createPhotoshopJpegFixture() {
  const soi = Buffer.from([255, 216]);
  const app0 = Buffer.from([
    255,
    224,
    0,
    16,
    74,
    70,
    73,
    70,
    0,
    1,
    1,
    1,
    0,
    72,
    0,
    72,
    0,
    0
  ]);
  const exifHeader = Buffer.from("Exif\0\0", "ascii");
  const tiffHeader = Buffer.from([73, 73, 42, 0, 8, 0, 0, 0]);
  const numIfd0 = 5;
  const ifd0 = Buffer.alloc(2 + numIfd0 * 12 + 4);
  ifd0.writeUInt16LE(numIfd0, 0);
  const valStart = 8 + ifd0.length + 2 + 3 * 12 + 4 + 2 + 4 * 12 + 4;
  let offset = 2;
  function writeTag(buf, off, tag, type, count, val) {
    buf.writeUInt16LE(tag, off);
    buf.writeUInt16LE(type, off + 2);
    buf.writeUInt32LE(count, off + 4);
    buf.writeUInt32LE(val, off + 8);
  }
  const makeStr = Buffer.from("Hasselblad X2D 100C\0", "ascii");
  const modelStr = Buffer.from("XCD 2,5/38V\0", "ascii");
  const artistStr = Buffer.from("Editorial Photographer\0", "ascii");
  const dateStr = Buffer.from("2026:08:12 14:15:30\0", "ascii");
  const subIfdOffset = 8 + ifd0.length;
  const gpsIfdOffset = subIfdOffset + 2 + 3 * 12 + 4;
  let dataPointer = gpsIfdOffset + 2 + 4 * 12 + 4;
  writeTag(ifd0, 2, 271, 2, makeStr.length, dataPointer);
  dataPointer += makeStr.length;
  writeTag(ifd0, 14, 272, 2, modelStr.length, dataPointer);
  dataPointer += modelStr.length;
  writeTag(ifd0, 26, 315, 2, artistStr.length, dataPointer);
  dataPointer += artistStr.length;
  writeTag(ifd0, 38, 34665, 4, 1, subIfdOffset);
  writeTag(ifd0, 50, 34853, 4, 1, gpsIfdOffset);
  const subIfd = Buffer.alloc(2 + 3 * 12 + 4);
  subIfd.writeUInt16LE(3, 0);
  writeTag(subIfd, 2, 36867, 2, dateStr.length, dataPointer);
  dataPointer += dateStr.length;
  writeTag(subIfd, 14, 34855, 3, 1, 100);
  writeTag(subIfd, 26, 42036, 2, modelStr.length, 8 + ifd0.length + 30);
  const gpsIfd = Buffer.alloc(2 + 4 * 12 + 4);
  gpsIfd.writeUInt16LE(4, 0);
  writeTag(gpsIfd, 2, 1, 2, 2, 78);
  writeTag(gpsIfd, 14, 3, 2, 2, 69);
  writeTag(gpsIfd, 26, 2, 5, 3, dataPointer);
  dataPointer += 24;
  writeTag(gpsIfd, 38, 4, 5, 3, dataPointer);
  dataPointer += 24;
  const gpsCoords = Buffer.alloc(48);
  gpsCoords.writeUInt32LE(48, 0);
  gpsCoords.writeUInt32LE(1, 4);
  gpsCoords.writeUInt32LE(51, 8);
  gpsCoords.writeUInt32LE(1, 12);
  gpsCoords.writeUInt32LE(24, 16);
  gpsCoords.writeUInt32LE(1, 20);
  gpsCoords.writeUInt32LE(2, 24);
  gpsCoords.writeUInt32LE(1, 28);
  gpsCoords.writeUInt32LE(21, 32);
  gpsCoords.writeUInt32LE(1, 36);
  gpsCoords.writeUInt32LE(7, 40);
  gpsCoords.writeUInt32LE(1, 44);
  const tiffBody = Buffer.concat([
    tiffHeader,
    ifd0,
    subIfd,
    gpsIfd,
    makeStr,
    modelStr,
    artistStr,
    dateStr,
    gpsCoords
  ]);
  const app1ExifLen = 2 + exifHeader.length + tiffBody.length;
  const app1ExifLenBuf = Buffer.alloc(2);
  app1ExifLenBuf.writeUInt16BE(app1ExifLen, 0);
  const app1Exif = Buffer.concat([Buffer.from([255, 225]), app1ExifLenBuf, exifHeader, tiffBody]);
  const xmpHeader = Buffer.from("http://ns.adobe.com/xap/1.0/\0", "ascii");
  const xmpXml = Buffer.from(
    `<x:xmpmeta xmlns:x="adobe:ns:meta/">
      <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
        <rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/">
          <dc:creator><rdf:Seq><rdf:li>Senior Editorial Lead</rdf:li></rdf:Seq></dc:creator>
          <dc:rights><rdf:Alt><rdf:li xml:lang="x-default">\xA9 2026 Studio Archival</rdf:li></rdf:Alt></dc:rights>
          <photoshop:City>Paris</photoshop:City>
          <photoshop:Credit>Magnum Photos</photoshop:Credit>
        </rdf:Description>
      </rdf:RDF>
    </x:xmpmeta>`,
    "utf8"
  );
  const app1XmpLen = 2 + xmpHeader.length + xmpXml.length;
  const app1XmpLenBuf = Buffer.alloc(2);
  app1XmpLenBuf.writeUInt16BE(app1XmpLen, 0);
  const app1Xmp = Buffer.concat([Buffer.from([255, 225]), app1XmpLenBuf, xmpHeader, xmpXml]);
  const iccHeader = Buffer.from("ICC_PROFILE\0", "ascii");
  const iccPayload = Buffer.from("Display P3 Wide Gamut Matrix sRGB Embedded Profile", "ascii");
  const app2Len = 2 + iccHeader.length + iccPayload.length;
  const app2LenBuf = Buffer.alloc(2);
  app2LenBuf.writeUInt16BE(app2Len, 0);
  const app2Icc = Buffer.concat([Buffer.from([255, 226]), app2LenBuf, iccHeader, iccPayload]);
  const irbHeader = Buffer.from("Photoshop 3.0\0", "ascii");
  const iptcRecord = Buffer.concat([
    Buffer.from([28, 2, 80]),
    // 2:80 By-line
    Buffer.from([0, 13]),
    Buffer.from("Master Artist", "ascii"),
    Buffer.from([28, 2, 116]),
    // 2:116 Copyright Notice
    Buffer.from([0, 15]),
    Buffer.from("\xA9 Studio Paris", "ascii")
  ]);
  const irbBlockHeader = Buffer.from("8BIM\0", "ascii");
  const irbBlockLen = Buffer.alloc(4);
  irbBlockLen.writeUInt32BE(iptcRecord.length, 0);
  const app13Payload = Buffer.concat([irbHeader, irbBlockHeader, irbBlockLen, iptcRecord]);
  const app13Len = 2 + app13Payload.length;
  const app13LenBuf = Buffer.alloc(2);
  app13LenBuf.writeUInt16BE(app13Len, 0);
  const app13 = Buffer.concat([Buffer.from([255, 237]), app13LenBuf, app13Payload]);
  const comText = Buffer.from("Exported from Adobe Photoshop 2026.4 via PixelCraft Test Suite", "ascii");
  const comLen = 2 + comText.length;
  const comLenBuf = Buffer.alloc(2);
  comLenBuf.writeUInt16BE(comLen, 0);
  const com = Buffer.concat([Buffer.from([255, 254]), comLenBuf, comText]);
  const dqt = Buffer.from([
    255,
    219,
    0,
    67,
    0,
    8,
    6,
    6,
    7,
    6,
    5,
    8,
    7,
    7,
    7,
    9,
    9,
    8,
    10,
    12,
    20,
    13,
    12,
    11,
    11,
    12,
    25,
    18,
    19,
    15,
    20,
    29,
    26,
    31,
    30,
    29,
    26,
    28,
    28,
    32,
    36,
    46,
    39,
    32,
    34,
    44,
    35,
    28,
    28,
    40,
    55,
    41,
    44,
    48,
    49,
    52,
    52,
    52,
    31,
    39,
    57,
    61,
    56,
    50,
    60,
    46,
    51,
    52,
    50
  ]);
  const sof0 = Buffer.from([
    255,
    192,
    0,
    11,
    8,
    0,
    80,
    0,
    100,
    1,
    1,
    17,
    0
  ]);
  const dht = Buffer.from([
    255,
    196,
    0,
    31,
    0,
    0,
    1,
    5,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11
  ]);
  const sos = Buffer.from([255, 218, 0, 8, 1, 1, 0, 0, 63, 0]);
  const scanData = Buffer.from([253, 252, 160, 0, 0, 0, 0, 0, 0, 0, 0]);
  const eoi = Buffer.from([255, 217]);
  const trailing = Buffer.from("---STEGANOGRAPHY_TRAILING_PAYLOAD---", "ascii");
  const full = Buffer.concat([
    soi,
    app0,
    app1Exif,
    app1Xmp,
    app2Icc,
    app13,
    com,
    dqt,
    sof0,
    dht,
    sos,
    scanData,
    eoi,
    trailing
  ]);
  return full.buffer.slice(full.byteOffset, full.byteOffset + full.byteLength);
}
function createStableDiffusionPngFixture() {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crc = Buffer.alloc(4);
    let c = 4294967295;
    const combined = Buffer.concat([typeBuf, Buffer.from(data)]);
    for (let i = 0; i < combined.length; i++) {
      c = c >>> 8 ^ CRC_TABLE[(c ^ combined[i]) & 255];
    }
    crc.writeUInt32BE((c ^ 4294967295) >>> 0, 0);
    return Buffer.concat([len, typeBuf, Buffer.from(data), crc]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(120, 0);
  ihdr.writeUInt32BE(90, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const paramText = "editorial medium format photograph of brutalist architecture in morning fog, warm tones, natural light, 50mm lens\nNegative prompt: blurry, deformed, lowres, text, watermark, logo\nSteps: 30, Sampler: DPM++ 2M Karras, CFG scale: 6.5, Seed: 92837410, Size: 120x90, Model hash: d9e02c5f11, Model: SDXL_v1.0_Editorial";
  const compressedParams = zlibSync(Buffer.from(paramText, "latin1"));
  const ztxtPayload = Buffer.concat([
    Buffer.from("parameters\0\0", "latin1"),
    // keyword + null + compression method 0
    Buffer.from(compressedParams)
  ]);
  const textSoftware = Buffer.from("Software\0Automatic1111 WebUI v1.10.0", "latin1");
  const rawRows = [];
  for (let y = 0; y < 90; y++) {
    const row = Buffer.alloc(1 + 120 * 3);
    row[0] = 0;
    for (let x = 0; x < 120; x++) {
      row[1 + x * 3] = 66;
      row[1 + x * 3 + 1] = 107;
      row[1 + x * 3 + 2] = 84;
    }
    rawRows.push(row);
  }
  const compressedIdat = zlibSync(Buffer.concat(rawRows));
  const png = Buffer.concat([
    sig,
    makeChunk("IHDR", ihdr),
    makeChunk("zTXt", ztxtPayload),
    makeChunk("tEXt", textSoftware),
    makeChunk("IDAT", compressedIdat),
    makeChunk("IEND", new Uint8Array(0))
  ]);
  return png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength);
}
function createComfyUiPngFixture() {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crc = Buffer.alloc(4);
    let c = 4294967295;
    const combined = Buffer.concat([typeBuf, Buffer.from(data)]);
    for (let i = 0; i < combined.length; i++) {
      c = c >>> 8 ^ CRC_TABLE[(c ^ combined[i]) & 255];
    }
    crc.writeUInt32BE((c ^ 4294967295) >>> 0, 0);
    return Buffer.concat([len, typeBuf, Buffer.from(data), crc]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(100, 0);
  ihdr.writeUInt32BE(100, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const comfyPrompt = JSON.stringify({
    3: { class_type: "KSampler", inputs: { seed: 44291823, steps: 25, cfg: 7, sampler_name: "euler" } },
    4: { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "v1-5-pruned-emaonly.safetensors" } },
    6: { class_type: "CLIPTextEncode", inputs: { text: "A clean studio interior photograph with morning sunlight" } }
  });
  const itxtPayload = Buffer.concat([
    Buffer.from("prompt\0\0\0\0\0", "latin1"),
    // keyword + null + compFlag 0 + compMethod 0 + lang null + trans null
    Buffer.from(comfyPrompt, "utf8")
  ]);
  const rawRows = [];
  for (let y = 0; y < 100; y++) {
    const row = Buffer.alloc(1 + 100 * 3);
    row[0] = 0;
    rawRows.push(row);
  }
  const compressedIdat = zlibSync(Buffer.concat(rawRows));
  const png = Buffer.concat([
    sig,
    makeChunk("IHDR", ihdr),
    makeChunk("iTXt", itxtPayload),
    makeChunk("IDAT", compressedIdat),
    makeChunk("IEND", new Uint8Array(0))
  ]);
  return png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength);
}
var CRC_TABLE = (() => {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    table[n] = c;
  }
  return table;
})();

// src/core/metadata/binary/reader.ts
var SafeBinaryReader = class _SafeBinaryReader {
  view;
  buffer;
  pos = 0;
  byteLength;
  isLittleEndian = false;
  constructor(buffer, offset = 0, length) {
    if (buffer instanceof Uint8Array) {
      const sliced = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );
      this.buffer = sliced;
    } else {
      this.buffer = buffer;
    }
    const available = this.buffer.byteLength - offset;
    this.byteLength = length !== void 0 ? Math.min(length, available) : available;
    this.view = new DataView(this.buffer, offset, this.byteLength);
    this.pos = 0;
  }
  get position() {
    return this.pos;
  }
  get length() {
    return this.byteLength;
  }
  get remaining() {
    return Math.max(0, this.byteLength - this.pos);
  }
  get eof() {
    return this.pos >= this.byteLength;
  }
  seek(position) {
    if (position >= 0 && position <= this.byteLength) {
      this.pos = position;
      return true;
    }
    return false;
  }
  skip(bytes) {
    return this.seek(this.pos + bytes);
  }
  canRead(bytes) {
    return this.pos + bytes <= this.byteLength;
  }
  readUint8() {
    if (!this.canRead(1)) return 0;
    const val = this.view.getUint8(this.pos);
    this.pos += 1;
    return val;
  }
  readUint16(littleEndian = this.isLittleEndian) {
    if (!this.canRead(2)) return 0;
    const val = this.view.getUint16(this.pos, littleEndian);
    this.pos += 2;
    return val;
  }
  readUint32(littleEndian = this.isLittleEndian) {
    if (!this.canRead(4)) return 0;
    const val = this.view.getUint32(this.pos, littleEndian);
    this.pos += 4;
    return val;
  }
  readInt32(littleEndian = this.isLittleEndian) {
    if (!this.canRead(4)) return 0;
    const val = this.view.getInt32(this.pos, littleEndian);
    this.pos += 4;
    return val;
  }
  readFloat32(littleEndian = this.isLittleEndian) {
    if (!this.canRead(4)) return 0;
    const val = this.view.getFloat32(this.pos, littleEndian);
    this.pos += 4;
    return val;
  }
  readFloat64(littleEndian = this.isLittleEndian) {
    if (!this.canRead(8)) return 0;
    const val = this.view.getFloat64(this.pos, littleEndian);
    this.pos += 8;
    return val;
  }
  peekUint8(offset = this.pos) {
    if (offset < 0 || offset >= this.byteLength) return 0;
    return this.view.getUint8(offset);
  }
  peekUint16(offset = this.pos, littleEndian = this.isLittleEndian) {
    if (offset < 0 || offset + 2 > this.byteLength) return 0;
    return this.view.getUint16(offset, littleEndian);
  }
  peekUint32(offset = this.pos, littleEndian = this.isLittleEndian) {
    if (offset < 0 || offset + 4 > this.byteLength) return 0;
    return this.view.getUint32(offset, littleEndian);
  }
  readBytes(count) {
    const toRead = Math.min(count, this.remaining);
    const slice = new Uint8Array(this.buffer, this.view.byteOffset + this.pos, toRead);
    this.pos += toRead;
    return slice;
  }
  readString(length, encoding = "utf-8") {
    const bytes = this.readBytes(length);
    try {
      if (encoding === "latin1") {
        let str = "";
        for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
        return str;
      }
      return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    } catch {
      return "";
    }
  }
  readNullTerminatedString(maxLen = 4096, encoding = "utf-8") {
    const start = this.pos;
    let end = start;
    while (end < this.byteLength && end - start < maxLen && this.view.getUint8(end) !== 0) {
      end++;
    }
    const len = end - start;
    const str = this.readString(len, encoding);
    if (this.pos < this.byteLength && this.view.getUint8(this.pos) === 0) {
      this.pos++;
    }
    return str;
  }
  createSubReader(offset, length) {
    const subOffset = this.view.byteOffset + offset;
    const reader = new _SafeBinaryReader(this.buffer, subOffset, length);
    reader.isLittleEndian = this.isLittleEndian;
    return reader;
  }
};

// src/core/metadata/binary/tiff.ts
var TIFF_TAG_NAMES = {
  // IFD0 Baseline & Extended
  256: "ImageWidth",
  257: "ImageLength",
  258: "BitsPerSample",
  259: "Compression",
  262: "PhotometricInterpretation",
  270: "ImageDescription",
  271: "Make",
  272: "Model",
  273: "StripOffsets",
  274: "Orientation",
  277: "SamplesPerPixel",
  278: "RowsPerStrip",
  279: "StripByteCounts",
  282: "XResolution",
  283: "YResolution",
  284: "PlanarConfiguration",
  296: "ResolutionUnit",
  305: "Software",
  306: "ModifyDate",
  315: "Artist",
  318: "WhitePoint",
  319: "PrimaryChromaticities",
  529: "YCbCrCoefficients",
  530: "YCbCrSubSampling",
  531: "YCbCrPositioning",
  532: "ReferenceBlackWhite",
  33432: "Copyright",
  34665: "ExifOffset",
  34853: "GPSInfoOffset",
  // Exif SubIFD
  33434: "ExposureTime",
  33437: "FNumber",
  34850: "ExposureProgram",
  34855: "ISO",
  36864: "ExifVersion",
  36867: "DateTimeOriginal",
  36868: "CreateDate",
  37121: "ComponentsConfiguration",
  37122: "CompressedBitsPerPixel",
  37377: "ShutterSpeedValue",
  37378: "ApertureValue",
  37379: "BrightnessValue",
  37380: "ExposureCompensation",
  37381: "MaxApertureValue",
  37382: "SubjectDistance",
  37383: "MeteringMode",
  37384: "LightSource",
  37385: "Flash",
  37386: "FocalLength",
  37500: "MakerNote",
  37510: "UserComment",
  37520: "SubSecTime",
  37521: "SubSecTimeOriginal",
  37522: "SubSecTimeDigitized",
  40960: "FlashpixVersion",
  40961: "ColorSpace",
  40962: "ExifImageWidth",
  40963: "ExifImageHeight",
  40964: "RelatedSoundFile",
  40965: "InteropOffset",
  41486: "FocalPlaneXResolution",
  41487: "FocalPlaneYResolution",
  41488: "FocalPlaneResolutionUnit",
  41495: "SensingMethod",
  41728: "FileSource",
  41729: "SceneType",
  41730: "CFAPattern",
  41985: "CustomRendered",
  41986: "ExposureMode",
  41987: "WhiteBalance",
  41988: "DigitalZoomRatio",
  41989: "FocalLengthIn35mmFormat",
  41990: "SceneCaptureType",
  41991: "GainControl",
  41992: "Contrast",
  41993: "Saturation",
  41994: "Sharpness",
  41996: "SubjectDistanceRange",
  42016: "ImageUniqueID",
  42032: "OwnerName",
  42033: "SerialNumber",
  42034: "LensInfo",
  42035: "LensMake",
  42036: "LensModel",
  42037: "LensSerialNumber",
  // GPS IFD
  0: "GPSVersionID",
  1: "GPSLatitudeRef",
  2: "GPSLatitude",
  3: "GPSLongitudeRef",
  4: "GPSLongitude",
  5: "GPSAltitudeRef",
  6: "GPSAltitude",
  7: "GPSTimeStamp",
  8: "GPSSatellites",
  9: "GPSStatus",
  10: "GPSMeasureMode",
  11: "GPSDOP",
  12: "GPSSpeedRef",
  13: "GPSSpeed",
  14: "GPSTrackRef",
  15: "GPSTrack",
  16: "GPSImgDirectionRef",
  17: "GPSImgDirection",
  18: "GPSMapDatum",
  19: "GPSDestLatitudeRef",
  20: "GPSDestLatitude",
  21: "GPSDestLongitudeRef",
  22: "GPSDestLongitude",
  23: "GPSDestBearingRef",
  24: "GPSDestBearing",
  25: "GPSDestDistanceRef",
  26: "GPSDestDistance",
  27: "GPSProcessingMethod",
  28: "GPSAreaInformation",
  29: "GPSDateStamp",
  30: "GPSDifferential",
  // DNG & RAW Specific Tags
  50706: "DNGVersion",
  50707: "DNGBackwardVersion",
  50708: "UniqueCameraModel",
  50709: "LocalizedCameraModel",
  50721: "ColorMatrix1",
  50722: "ColorMatrix2",
  50728: "DefaultCropOrigin",
  50729: "DefaultCropSize",
  50740: "OriginalRawFileName",
  50784: "MakerNoteSafety",
  50827: "OriginalDefaultFinalSize",
  50931: "CameraCalibrationSignature",
  50932: "ProfileCalibrationSignature",
  50934: "AsShotProfileName"
};
var TIFF_TYPE_NAMES = {
  1: "BYTE",
  2: "ASCII",
  3: "SHORT",
  4: "LONG",
  5: "RATIONAL",
  6: "SBYTE",
  7: "UNDEFINED",
  8: "SSHORT",
  9: "SLONG",
  10: "SRATIONAL",
  11: "FLOAT",
  12: "DOUBLE"
};
var TYPE_SIZES = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  6: 1,
  7: 1,
  8: 2,
  9: 4,
  10: 8,
  11: 4,
  12: 8
};
var RecursiveTiffParser = class {
  constructor(reader) {
    this.reader = reader;
  }
  visitedOffsets = /* @__PURE__ */ new Set();
  maxDepth = 16;
  tags = [];
  parse(baseTiffOffset = 0) {
    this.tags = [];
    this.visitedOffsets.clear();
    if (!this.reader.seek(baseTiffOffset) || this.reader.remaining < 8) {
      return this.tags;
    }
    const byteOrder = this.reader.readUint16(false);
    if (byteOrder === 18761) {
      this.reader.isLittleEndian = true;
    } else if (byteOrder === 19789) {
      this.reader.isLittleEndian = false;
    } else {
      return this.tags;
    }
    const tiffMagic = this.reader.readUint16();
    if (tiffMagic !== 42 && tiffMagic !== 85 && tiffMagic !== 20306) {
      return this.tags;
    }
    const firstIfdOffset = this.reader.readUint32();
    if (firstIfdOffset >= 8) {
      this.parseIfd(baseTiffOffset, baseTiffOffset + firstIfdOffset, "TIFF:IFD0", 0);
    }
    return this.tags;
  }
  parseIfd(baseOffset, ifdOffset, path, depth) {
    if (depth >= this.maxDepth) return;
    if (this.visitedOffsets.has(ifdOffset)) return;
    this.visitedOffsets.add(ifdOffset);
    if (!this.reader.seek(ifdOffset) || this.reader.remaining < 2) return;
    const entryCount = this.reader.readUint16();
    if (entryCount === 0 || entryCount > 2048) return;
    const subIfdQueues = [];
    for (let i = 0; i < entryCount; i++) {
      if (this.reader.remaining < 12) break;
      const tag = this.reader.readUint16();
      const type = this.reader.readUint16();
      const count = this.reader.readUint32();
      const valOrOffset = this.reader.readUint32();
      const typeSize = TYPE_SIZES[type] || 1;
      const totalSize = count * typeSize;
      const isInline = totalSize <= 4;
      const valueAbsoluteOffset = isInline ? this.reader.position - 4 : baseOffset + valOrOffset;
      const tagName = TIFF_TAG_NAMES[tag] || `Tag_0x${tag.toString(16).padStart(4, "0")}`;
      const typeName = TIFF_TYPE_NAMES[type] || `Type_${type}`;
      const value = this.readTagValue(valueAbsoluteOffset, type, count);
      const formattedValue = this.formatTagValue(tag, value);
      this.tags.push({
        tag,
        tagName,
        type,
        typeName,
        count,
        value,
        formattedValue,
        ifdPath: path
      });
      if (tag === 34665 && typeof value === "number") {
        subIfdQueues.push({ path: `${path}/ExifSubIFD`, offset: baseOffset + value });
      } else if (tag === 34853 && typeof value === "number") {
        subIfdQueues.push({ path: `${path}/GPSInfo`, offset: baseOffset + value });
      } else if (tag === 40965 && typeof value === "number") {
        subIfdQueues.push({ path: `${path}/Interop`, offset: baseOffset + value });
      } else if (tag === 330) {
        if (Array.isArray(value)) {
          value.forEach((off, idx) => {
            if (typeof off === "number") {
              subIfdQueues.push({ path: `${path}/SubIFD[${idx}]`, offset: baseOffset + off });
            }
          });
        } else if (typeof value === "number") {
          subIfdQueues.push({ path: `${path}/SubIFD[0]`, offset: baseOffset + value });
        }
      }
    }
    if (this.reader.canRead(4)) {
      const nextIfdOffset = this.reader.readUint32();
      if (nextIfdOffset > 0 && nextIfdOffset < this.reader.length) {
        const nextIndex = path.match(/IFD(\d+)/);
        const idx = nextIndex ? parseInt(nextIndex[1], 10) + 1 : 1;
        this.parseIfd(baseOffset, baseOffset + nextIfdOffset, `TIFF:IFD${idx}`, depth + 1);
      }
    }
    for (const sub of subIfdQueues) {
      this.parseIfd(baseOffset, sub.offset, sub.path, depth + 1);
    }
  }
  readTagValue(offset, type, count) {
    const savedPos = this.reader.position;
    if (!this.reader.seek(offset)) {
      this.reader.seek(savedPos);
      return null;
    }
    try {
      if (type === 2) {
        const str = this.reader.readString(count);
        return str.replace(/\0+$/, "").trim();
      }
      if (type === 1 || type === 6 || type === 7) {
        if (count === 1) return this.reader.readUint8();
        const bytes = this.reader.readBytes(Math.min(count, 128));
        return bytes;
      }
      if (type === 3) {
        if (count === 1) return this.reader.readUint16();
        const arr = [];
        for (let i = 0; i < Math.min(count, 32); i++) arr.push(this.reader.readUint16());
        return arr;
      }
      if (type === 4) {
        if (count === 1) return this.reader.readUint32();
        const arr = [];
        for (let i = 0; i < Math.min(count, 32); i++) arr.push(this.reader.readUint32());
        return arr;
      }
      if (type === 5 || type === 10) {
        const parseOne = () => {
          const num = type === 5 ? this.reader.readUint32() : this.reader.readInt32();
          const den = type === 5 ? this.reader.readUint32() : this.reader.readInt32();
          return den === 0 ? 0 : num / den;
        };
        if (count === 1) return parseOne();
        const arr = [];
        for (let i = 0; i < Math.min(count, 8); i++) arr.push(parseOne());
        return arr;
      }
      return null;
    } finally {
      this.reader.seek(savedPos);
    }
  }
  formatTagValue(tag, val) {
    if (val === null || val === void 0) return "";
    if ((tag === 2 || tag === 4) && Array.isArray(val) && val.length === 3) {
      const [deg, min, sec] = val;
      return `${deg}\xB0 ${min}' ${Number(sec).toFixed(2)}"`;
    }
    if (tag === 274 && typeof val === "number") {
      const MAP = {
        1: "Horizontal (Normal)",
        2: "Mirror horizontal",
        3: "Rotate 180\xB0",
        4: "Mirror vertical",
        5: "Mirror horizontal and rotate 270\xB0 CW",
        6: "Rotate 90\xB0 CW",
        7: "Mirror horizontal and rotate 90\xB0 CW",
        8: "Rotate 270\xB0 CW"
      };
      return MAP[val] || String(val);
    }
    if (val instanceof Uint8Array) {
      if (tag === 37500) return `[MakerNote Binary Blob: ${val.length} bytes]`;
      if (tag === 37510) {
        if (val.length > 8) {
          const text = new TextDecoder("utf-8", { fatal: false }).decode(val.slice(8));
          return text.replace(/\0+$/, "").trim() || `[${val.length} bytes binary comment]`;
        }
      }
      return `[Binary Data: ${val.length} bytes]`;
    }
    if (Array.isArray(val)) {
      return val.map((v) => typeof v === "number" ? Number(v.toFixed(4)) : v).join(", ");
    }
    return String(val);
  }
};

// src/core/metadata/binary/xmp.ts
var RecursiveXmpParser = class {
  entries = [];
  parse(xmpStringOrBytes, locationPrefix = "XMP") {
    this.entries = [];
    let xmlText = "";
    if (xmpStringOrBytes instanceof Uint8Array) {
      xmlText = new TextDecoder("utf-8", { fatal: false }).decode(xmpStringOrBytes);
    } else {
      xmlText = xmpStringOrBytes;
    }
    const startIdx = xmlText.indexOf("<x:xmpmeta");
    const altStart = xmlText.indexOf("<rdf:RDF");
    const packetStart = startIdx !== -1 ? startIdx : altStart !== -1 ? altStart : 0;
    const cleanXml = xmlText.substring(packetStart);
    try {
      this.extractTagsWithRegex(cleanXml, locationPrefix);
    } catch (err2) {
      console.warn("[XMP Parser] XML inspection warning:", err2);
    }
    return this.entries;
  }
  extractTagsWithRegex(xml, prefix) {
    const tagRegex = /<([a-zA-Z0-9_-]+):([a-zA-Z0-9_.-]+)([^>]*)>([\s\S]*?)<\/\1:\2>/g;
    let match;
    while ((match = tagRegex.exec(xml)) !== null) {
      const ns = match[1];
      const tag = match[2];
      const attrs = match[3];
      const content = match[4].trim();
      if (ns === "rdf" && (tag === "RDF" || tag === "Description" || tag === "Seq" || tag === "Bag" || tag === "Alt")) {
        continue;
      }
      if (ns === "x" && tag === "xmpmeta") continue;
      if (content.includes("<rdf:li")) {
        const liRegex = /<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/g;
        let liMatch;
        const items = [];
        while ((liMatch = liRegex.exec(content)) !== null) {
          const val = this.cleanXmlValue(liMatch[1]);
          if (val) items.push(val);
        }
        if (items.length > 0) {
          this.entries.push({
            tag: `${ns}:${tag}`,
            namespace: ns,
            name: this.humanizeTag(tag),
            value: items.join(", "),
            location: `${prefix}/${ns}:${tag}`
          });
        }
      } else if (!content.startsWith("<")) {
        const cleanVal = this.cleanXmlValue(content);
        if (cleanVal) {
          this.entries.push({
            tag: `${ns}:${tag}`,
            namespace: ns,
            name: this.humanizeTag(tag),
            value: cleanVal,
            location: `${prefix}/${ns}:${tag}`
          });
        }
      }
      this.extractAttributes(attrs, prefix);
    }
    const descRegex = /<rdf:Description\s+([^>]+?)\/?>/g;
    while ((match = descRegex.exec(xml)) !== null) {
      this.extractAttributes(match[1], prefix);
    }
  }
  extractAttributes(attrBlock, prefix) {
    if (!attrBlock) return;
    const attrRegex = /([a-zA-Z0-9_-]+):([a-zA-Z0-9_.-]+)=["']([^"']+)["']/g;
    let match;
    while ((match = attrRegex.exec(attrBlock)) !== null) {
      const ns = match[1];
      const tag = match[2];
      const val = this.cleanXmlValue(match[3]);
      if (ns === "xmlns" || ns === "xml" || tag === "about") continue;
      if (val) {
        this.entries.push({
          tag: `${ns}:${tag}`,
          namespace: ns,
          name: this.humanizeTag(tag),
          value: val,
          location: `${prefix}/${ns}:${tag}`
        });
      }
    }
  }
  cleanXmlValue(val) {
    return val.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").trim();
  }
  humanizeTag(tag) {
    return tag.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
  }
};

// src/core/metadata/binary/iptc.ts
var IPTC_DATASET_NAMES = {
  0: "ModelVersion",
  5: "ObjectName",
  // Document Title
  7: "EditStatus",
  10: "Urgency",
  15: "Category",
  20: "SupplementalCategories",
  25: "Keywords",
  40: "SpecialInstructions",
  55: "DateCreated",
  60: "TimeCreated",
  62: "DigitalCreationDate",
  63: "DigitalCreationTime",
  65: "OriginatingProgram",
  70: "ProgramVersion",
  80: "By-line",
  // Author
  85: "By-lineTitle",
  90: "City",
  92: "Sublocation",
  95: "ProvinceState",
  100: "CountryCode",
  101: "CountryName",
  103: "OriginalTransmissionReference",
  105: "Headline",
  110: "Credit",
  115: "Source",
  116: "CopyrightNotice",
  118: "Contact",
  120: "CaptionAbstract",
  122: "WriterEditor",
  135: "DigitalSourceType"
  // Modern AI provenance tag in IPTC!
};
var IptcAndPhotoshopParser = class {
  irbBlocks = [];
  iptcEntries = [];
  /**
   * Parses Photoshop 8BIM Image Resource Blocks (e.g. from JPEG APP13 or TIFF tag 0x8649)
   */
  parsePhotoshopIrb(reader, locationPrefix = "JPEG:APP13/IRB") {
    this.irbBlocks = [];
    this.iptcEntries = [];
    const headerStr = reader.readString(14);
    if (headerStr.startsWith("Photoshop 3.0")) {
    } else {
      reader.seek(0);
    }
    while (reader.remaining >= 12) {
      const sig = reader.readString(4);
      if (sig !== "8BIM" && sig !== "MeSa") {
        break;
      }
      const resourceId = reader.readUint16(false);
      const nameLen = reader.readUint8();
      let name = "";
      if (nameLen > 0) {
        name = reader.readString(nameLen);
      }
      if ((nameLen + 1) % 2 !== 0 && reader.remaining > 0) {
        reader.skip(1);
      }
      const dataSize = reader.readUint32(false);
      if (dataSize > reader.remaining) break;
      const data = reader.readBytes(dataSize);
      if (dataSize % 2 !== 0 && reader.remaining > 0) {
        reader.skip(1);
      }
      const blockLocation = `${locationPrefix}[0x${resourceId.toString(16).padStart(4, "0")}]`;
      this.irbBlocks.push({
        resourceId,
        resourceName: name,
        data,
        location: blockLocation
      });
      if (resourceId === 1028) {
        this.parseIptcIimStream(new SafeBinaryReader(data), `${blockLocation}/IPTC`);
      }
    }
  }
  /**
   * Parses raw IPTC IIM dataset stream (tag marker 0x1C)
   */
  parseIptcIimStream(reader, locationPrefix = "IPTC") {
    const entries = [];
    while (reader.remaining >= 5) {
      const tagMarker = reader.readUint8();
      if (tagMarker !== 28) {
        break;
      }
      const recordNum = reader.readUint8();
      const datasetNum = reader.readUint8();
      let dataLen = reader.readUint16(false);
      if ((dataLen & 32768) !== 0) {
        const countBytes = dataLen & 32767;
        if (countBytes === 4 && reader.canRead(4)) {
          dataLen = reader.readUint32(false);
        }
      }
      if (dataLen > reader.remaining) break;
      const valBytes = reader.readBytes(dataLen);
      const textVal = new TextDecoder("utf-8", { fatal: false }).decode(valBytes).trim();
      const name = recordNum === 2 ? IPTC_DATASET_NAMES[datasetNum] || `Record2:Tag_${datasetNum}` : `Record${recordNum}:Tag_${datasetNum}`;
      const entry = {
        record: recordNum,
        dataset: datasetNum,
        name,
        value: textVal,
        location: `${locationPrefix}/2:${datasetNum}[${name}]`
      };
      entries.push(entry);
      this.iptcEntries.push(entry);
    }
    return entries;
  }
};

// src/core/metadata/binary/jpeg.ts
var JPEG_MARKER_NAMES = {
  216: "SOI",
  217: "EOI",
  218: "SOS",
  192: "SOF0 (Baseline)",
  194: "SOF2 (Progressive)",
  196: "DHT (Huffman)",
  219: "DQT (Quantization)",
  221: "DRI (Restart Interval)",
  224: "APP0 (JFIF)",
  225: "APP1 (EXIF/XMP)",
  226: "APP2 (ICC/MPF)",
  227: "APP3",
  228: "APP4",
  229: "APP5",
  230: "APP6",
  231: "APP7",
  232: "APP8",
  233: "APP9",
  234: "APP10",
  235: "APP11 (JUMBF/C2PA)",
  236: "APP12 (Picture Info)",
  237: "APP13 (Photoshop/IPTC)",
  238: "APP14 (Adobe)",
  239: "APP15",
  254: "COM (Comment)"
};
var JpegContainerScanner = class {
  scan(buffer) {
    const reader = new SafeBinaryReader(buffer);
    const result = {
      segments: [],
      tiffTags: [],
      xmpEntries: [],
      iptcEntries: [],
      irbBlocks: [],
      comments: [],
      hasIccProfile: false,
      hasC2paJumbf: false,
      hasTrailingBytes: false,
      trailingBytesLength: 0
    };
    if (reader.length < 4 || reader.readUint8() !== 255 || reader.readUint8() !== 216) {
      return result;
    }
    let eoiFoundOffset = -1;
    while (reader.remaining >= 2) {
      const b1 = reader.readUint8();
      if (b1 !== 255) continue;
      let marker = reader.readUint8();
      while (marker === 255 && reader.remaining > 0) {
        marker = reader.readUint8();
      }
      if (marker === 216 || marker >= 208 && marker <= 215 || marker === 1) {
        continue;
      }
      if (marker === 217) {
        eoiFoundOffset = reader.position;
        break;
      }
      if (marker === 218) {
        const sosLen = reader.readUint16(false);
        reader.skip(sosLen - 2);
        while (reader.remaining >= 2) {
          if (reader.readUint8() === 255) {
            const next = reader.readUint8();
            if (next === 217) {
              eoiFoundOffset = reader.position;
              break;
            }
          }
        }
        break;
      }
      if (reader.remaining < 2) break;
      const segOffset = reader.position - 2;
      const segLen = reader.readUint16(false);
      if (segLen < 2 || segLen - 2 > reader.remaining) break;
      const payload = reader.readBytes(segLen - 2);
      const markerName = JPEG_MARKER_NAMES[marker] || `APP_0x${marker.toString(16)}`;
      result.segments.push({
        marker,
        markerName,
        offset: segOffset,
        length: segLen + 2,
        data: payload
      });
      this.inspectSegmentPayload(marker, payload, result);
    }
    if (eoiFoundOffset > 0 && eoiFoundOffset < buffer.byteLength) {
      result.hasTrailingBytes = true;
      result.trailingBytesLength = buffer.byteLength - eoiFoundOffset;
    }
    return result;
  }
  inspectSegmentPayload(marker, payload, result) {
    const payloadReader = new SafeBinaryReader(payload);
    if (marker === 225) {
      const header = payloadReader.readString(6);
      if (header.startsWith("Exif\0\0")) {
        const tiffParser = new RecursiveTiffParser(payloadReader.createSubReader(6));
        const tags = tiffParser.parse(0);
        result.tiffTags.push(...tags);
        const orientTag = tags.find((t) => t.tagName === "Orientation");
        if (orientTag && typeof orientTag.value === "number") {
          result.orientation = orientTag.value;
        }
      } else if (payload.length > 29) {
        payloadReader.seek(0);
        const str = payloadReader.readString(29);
        if (str.startsWith("http://ns.adobe.com/xap/1.0/")) {
          const xmpParser = new RecursiveXmpParser();
          const xmpText = payload.slice(29);
          const entries = xmpParser.parse(xmpText, "JPEG:APP1/XMP");
          result.xmpEntries.push(...entries);
        }
      }
    }
    if (marker === 226) {
      const header = payloadReader.readString(12);
      if (header.startsWith("ICC_PROFILE\0")) {
        result.hasIccProfile = true;
        result.iccProfileBytes = payload.slice(14);
      }
    }
    if (marker === 235) {
      const header = payloadReader.readString(16);
      if (header.includes("JP") || header.includes("jumb") || header.includes("c2pa")) {
        result.hasC2paJumbf = true;
      }
    }
    if (marker === 237) {
      const iptcParser = new IptcAndPhotoshopParser();
      iptcParser.parsePhotoshopIrb(payloadReader, "JPEG:APP13/IRB");
      result.irbBlocks.push(...iptcParser.irbBlocks);
      result.iptcEntries.push(...iptcParser.iptcEntries);
    }
    if (marker === 254) {
      const comment = new TextDecoder("utf-8", { fatal: false }).decode(payload).trim();
      if (comment) result.comments.push(comment);
    }
    if (marker === 192 || marker === 194) {
      if (payload.length >= 5) {
        const height = payload[1] << 8 | payload[2];
        const width = payload[3] << 8 | payload[4];
        result.width = width;
        result.height = height;
      }
    }
  }
  /**
   * Whitelist-based container reconstruction:
   * Reconstructs a clean JPEG with byte-identical compressed image data,
   * retaining only essential headers and strictly requested color profiles.
   */
  reconstructClean(buffer, options) {
    const bytes = new Uint8Array(buffer);
    const out = [255, 216];
    let i = 2;
    while (i < bytes.length - 1) {
      if (bytes[i] !== 255) {
        for (let j = i; j < bytes.length; j++) out.push(bytes[j]);
        break;
      }
      const marker = bytes[i + 1];
      if (marker >= 208 && marker <= 215) {
        out.push(bytes[i], bytes[i + 1]);
        i += 2;
        continue;
      }
      if (marker === 217) {
        out.push(255, 217);
        break;
      }
      if (marker === 218) {
        for (let j = i; j < bytes.length; j++) {
          if (bytes[j] === 255 && j + 1 < bytes.length && bytes[j + 1] === 217) {
            out.push(255, 217);
            break;
          }
          out.push(bytes[j]);
        }
        break;
      }
      if (i + 3 >= bytes.length) break;
      const length = bytes[i + 2] << 8 | bytes[i + 3];
      const segmentTotalLen = 2 + length;
      const isEssentialFrameData = marker >= 192 && marker <= 207 && marker !== 196 && marker !== 200 && marker !== 204 || marker === 196 || marker === 219 || marker === 221;
      const isApp0 = marker === 224;
      let isPreservedIcc = false;
      if (marker === 226 && options.preserveColorProfile) {
        const segData = bytes.slice(i + 4, i + 4 + 11);
        const str = String.fromCharCode(...segData);
        if (str.startsWith("ICC_PROFILE")) {
          isPreservedIcc = true;
        }
      }
      let isPreservedProvenance = false;
      if (marker === 235 && options.preserveProvenance) {
        isPreservedProvenance = true;
      }
      if (isEssentialFrameData || isApp0 || isPreservedIcc || isPreservedProvenance) {
        for (let j = i; j < i + segmentTotalLen; j++) {
          out.push(bytes[j]);
        }
      }
      i += segmentTotalLen;
    }
    return new Blob([new Uint8Array(out)], { type: "image/jpeg" });
  }
};

// src/core/metadata/binary/png.ts
var CRC_TABLE2 = (() => {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();
var PngContainerScanner = class {
  scan(buffer) {
    const reader = new SafeBinaryReader(buffer);
    const result = {
      chunks: [],
      textEntries: [],
      tiffTags: [],
      xmpEntries: [],
      hasIccProfile: false,
      hasC2pa: false,
      hasTransparency: false
    };
    if (reader.length < 8) return result;
    const sig = reader.readBytes(8);
    if (sig[0] !== 137 || sig[1] !== 80 || sig[2] !== 78 || sig[3] !== 71 || sig[4] !== 13 || sig[5] !== 10 || sig[6] !== 26 || sig[7] !== 10) {
      return result;
    }
    while (reader.remaining >= 12) {
      const chunkOffset = reader.position;
      const dataLen = reader.readUint32(false);
      if (dataLen > reader.remaining) break;
      const typeBytes = reader.readBytes(4);
      const chunkType = String.fromCharCode(...typeBytes);
      const data = reader.readBytes(dataLen);
      const crc = reader.readUint32(false);
      result.chunks.push({
        type: chunkType,
        offset: chunkOffset,
        length: 12 + dataLen,
        crc,
        data
      });
      this.inspectChunk(chunkType, data, result);
      if (chunkType === "IEND") break;
    }
    this.extractAiWorkflows(result);
    return result;
  }
  inspectChunk(type, data, result) {
    if (type === "IHDR" && data.length >= 13) {
      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      result.width = view.getUint32(0, false);
      result.height = view.getUint32(4, false);
      result.bitDepth = data[8];
      result.colorType = data[9];
      if (result.colorType === 4 || result.colorType === 6) {
        result.hasTransparency = true;
      }
    }
    if (type === "tRNS") {
      result.hasTransparency = true;
    }
    if (type === "iCCP" && data.length > 2) {
      result.hasIccProfile = true;
      let nullIdx = -1;
      for (let i = 0; i < data.length; i++) {
        if (data[i] === 0) {
          nullIdx = i;
          break;
        }
      }
      if (nullIdx !== -1) {
        result.iccProfileName = new TextDecoder("latin1").decode(data.slice(0, nullIdx));
      }
    }
    if (type === "tEXt" && data.length > 1) {
      let nullIdx = -1;
      for (let i = 0; i < data.length; i++) {
        if (data[i] === 0) {
          nullIdx = i;
          break;
        }
      }
      if (nullIdx !== -1) {
        const keyword = new TextDecoder("latin1").decode(data.slice(0, nullIdx));
        const text = new TextDecoder("latin1").decode(data.slice(nullIdx + 1));
        result.textEntries.push({
          type: "tEXt",
          keyword,
          text,
          compressed: false,
          location: `PNG:tEXt[${keyword}]`
        });
      }
    }
    if (type === "zTXt" && data.length > 2) {
      let nullIdx = -1;
      for (let i = 0; i < data.length; i++) {
        if (data[i] === 0) {
          nullIdx = i;
          break;
        }
      }
      if (nullIdx !== -1 && nullIdx + 2 < data.length) {
        const keyword = new TextDecoder("latin1").decode(data.slice(0, nullIdx));
        const compressedData = data.slice(nullIdx + 2);
        try {
          let decompressed;
          try {
            decompressed = unzlibSync(compressedData);
          } catch {
            decompressed = inflateSync(compressedData);
          }
          const text = new TextDecoder("latin1").decode(decompressed);
          result.textEntries.push({
            type: "zTXt",
            keyword,
            text,
            compressed: true,
            location: `PNG:zTXt[${keyword}]`
          });
        } catch {
        }
      }
    }
    if (type === "iTXt" && data.length > 5) {
      let nullIdx = -1;
      for (let i = 0; i < data.length; i++) {
        if (data[i] === 0) {
          nullIdx = i;
          break;
        }
      }
      if (nullIdx !== -1 && nullIdx + 4 < data.length) {
        const keyword = new TextDecoder("utf-8", { fatal: false }).decode(data.slice(0, nullIdx));
        const compressionFlag = data[nullIdx + 1];
        let pos = nullIdx + 3;
        let langNull = -1;
        for (let i = pos; i < data.length; i++) {
          if (data[i] === 0) {
            langNull = i;
            break;
          }
        }
        let transNull = -1;
        if (langNull !== -1) {
          for (let i = langNull + 1; i < data.length; i++) {
            if (data[i] === 0) {
              transNull = i;
              break;
            }
          }
        }
        const textStart = transNull !== -1 ? transNull + 1 : pos;
        const textPayload = data.slice(textStart);
        try {
          let rawBytes;
          if (compressionFlag === 1) {
            try {
              rawBytes = unzlibSync(textPayload);
            } catch {
              rawBytes = inflateSync(textPayload);
            }
          } else {
            rawBytes = textPayload;
          }
          const text = new TextDecoder("utf-8", { fatal: false }).decode(rawBytes);
          result.textEntries.push({
            type: "iTXt",
            keyword,
            text,
            compressed: compressionFlag === 1,
            location: `PNG:iTXt[${keyword}]`
          });
          if (keyword === "XML:com.adobe.xmp") {
            const xmpParser = new RecursiveXmpParser();
            result.xmpEntries.push(...xmpParser.parse(text, "PNG:iTXt[XMP]"));
          }
        } catch {
        }
      }
    }
    if (type === "eXIf" && data.length >= 8) {
      const tiffParser = new RecursiveTiffParser(new SafeBinaryReader(data));
      result.tiffTags.push(...tiffParser.parse(0));
    }
    if (type.toLowerCase() === "c2pa" || type === "jumb") {
      result.hasC2pa = true;
    }
  }
  extractAiWorkflows(result) {
    for (const entry of result.textEntries) {
      if (entry.keyword.toLowerCase() === "parameters") {
        const lines = entry.text.split("\n");
        const prompt = lines[0]?.trim();
        let negativePrompt = "";
        let paramsLine = "";
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith("Negative prompt:")) {
            negativePrompt = line.replace("Negative prompt:", "").trim();
          } else if (line.includes("Steps:") || line.includes("Sampler:") || line.includes("Seed:")) {
            paramsLine = line;
          }
        }
        const seedMatch = paramsLine.match(/Seed:\s*(\d+)/i);
        const stepsMatch = paramsLine.match(/Steps:\s*(\d+)/i);
        const samplerMatch = paramsLine.match(/Sampler:\s*([^,]+)/i);
        const cfgMatch = paramsLine.match(/CFG scale:\s*([\d.]+)/i);
        const modelMatch = paramsLine.match(/Model:\s*([^,]+)/i);
        result.aiWorkflow = {
          tool: "Stable Diffusion (A1111/Forge)",
          prompt,
          negativePrompt,
          seed: seedMatch ? seedMatch[1] : void 0,
          steps: stepsMatch ? parseInt(stepsMatch[1], 10) : void 0,
          sampler: samplerMatch ? samplerMatch[1].trim() : void 0,
          cfgScale: cfgMatch ? parseFloat(cfgMatch[1]) : void 0,
          model: modelMatch ? modelMatch[1].trim() : void 0
        };
        return;
      }
      if (entry.keyword === "prompt" || entry.keyword === "workflow") {
        try {
          const parsed = JSON.parse(entry.text);
          if (parsed && typeof parsed === "object") {
            result.aiWorkflow = {
              tool: "ComfyUI",
              workflowJson: parsed,
              prompt: `ComfyUI Graph (${Object.keys(parsed).length} nodes)`
            };
            return;
          }
        } catch {
        }
      }
      if (entry.keyword.toLowerCase().includes("prompt") || entry.text.includes("DALL\xB7E")) {
        result.aiWorkflow = {
          tool: "DALL-E",
          prompt: entry.text
        };
        return;
      }
    }
  }
  /**
   * Whitelist-based PNG container reconstructor:
   * Reconstructs PNG with exact same IDAT image data, stripping all text, EXIF, C2PA, and private chunks.
   */
  reconstructClean(buffer, options) {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const chunks = [];
    chunks.push(bytes.slice(0, 8));
    let offset = 8;
    const WHITELIST = /* @__PURE__ */ new Set(["IHDR", "PLTE", "IDAT", "IEND", "tRNS", "pHYs"]);
    if (options.preserveColorProfile) {
      WHITELIST.add("iCCP");
      WHITELIST.add("sRGB");
      WHITELIST.add("gAMA");
      WHITELIST.add("cHRM");
    }
    if (options.preserveProvenance) {
      WHITELIST.add("c2pa");
      WHITELIST.add("jumb");
    }
    while (offset < bytes.length - 8) {
      const dataLen = view.getUint32(offset, false);
      const chunkTotalLen = 12 + dataLen;
      if (offset + chunkTotalLen > bytes.length) break;
      const type = String.fromCharCode(
        bytes[offset + 4],
        bytes[offset + 5],
        bytes[offset + 6],
        bytes[offset + 7]
      );
      if (WHITELIST.has(type)) {
        chunks.push(bytes.slice(offset, offset + chunkTotalLen));
      }
      offset += chunkTotalLen;
      if (type === "IEND") break;
    }
    return new Blob(chunks, { type: "image/png" });
  }
};

// src/core/metadata/binary/webp.ts
var WebpContainerScanner = class {
  scan(buffer) {
    const reader = new SafeBinaryReader(buffer);
    const result = {
      chunks: [],
      tiffTags: [],
      xmpEntries: [],
      hasIccProfile: false,
      hasAnimation: false,
      hasAlpha: false
    };
    if (reader.length < 12) return result;
    const riff = reader.readString(4);
    const fileSize = reader.readUint32(true);
    const webp = reader.readString(4);
    if (riff !== "RIFF" || webp !== "WEBP") return result;
    while (reader.remaining >= 8) {
      const chunkOffset = reader.position;
      const chunkType = reader.readString(4);
      const chunkSize = reader.readUint32(true);
      const paddedSize = chunkSize + chunkSize % 2;
      if (chunkSize > reader.remaining) break;
      const data = reader.readBytes(chunkSize);
      if (chunkSize % 2 !== 0 && reader.remaining > 0) {
        reader.skip(1);
      }
      result.chunks.push({
        type: chunkType,
        offset: chunkOffset,
        length: 8 + paddedSize,
        data
      });
      if (chunkType === "VP8X" && data.length >= 10) {
        const flags = data[0];
        result.hasIccProfile = (flags & 32) !== 0;
        result.hasAlpha = (flags & 16) !== 0;
        result.hasAnimation = (flags & 2) !== 0;
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        result.width = 1 + (view.getUint8(4) | view.getUint8(5) << 8 | view.getUint8(6) << 16);
        result.height = 1 + (view.getUint8(7) | view.getUint8(8) << 8 | view.getUint8(9) << 16);
      } else if (chunkType === "EXIF") {
        const exifReader = new SafeBinaryReader(data);
        let tiffStart = 0;
        if (data.length > 6 && data[0] === 69 && data[1] === 120 && data[2] === 105 && data[3] === 102) {
          tiffStart = 6;
        }
        const tiffParser = new RecursiveTiffParser(exifReader.createSubReader(tiffStart));
        result.tiffTags.push(...tiffParser.parse(0));
      } else if (chunkType === "XMP ") {
        const xmpParser = new RecursiveXmpParser();
        result.xmpEntries.push(...xmpParser.parse(data, "WebP:XMP"));
      } else if (chunkType === "ANIM" || chunkType === "ANMF") {
        result.hasAnimation = true;
      } else if (chunkType === "ALPH") {
        result.hasAlpha = true;
      }
    }
    return result;
  }
  /**
   * Whitelist-based WebP reconstructor:
   * Strips EXIF and XMP chunks, recalculates VP8X flags and RIFF length.
   */
  reconstructClean(buffer, options) {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    if (bytes.length < 12 || view.getUint32(0, false) !== 1380533830 || view.getUint32(8, false) !== 1464156752) {
      return new Blob([buffer], { type: "image/webp" });
    }
    const retainedChunks = [];
    let offset = 12;
    while (offset < bytes.length - 8) {
      const type = String.fromCharCode(
        bytes[offset],
        bytes[offset + 1],
        bytes[offset + 2],
        bytes[offset + 3]
      );
      const len = view.getUint32(offset + 4, true);
      const paddedLen = len + len % 2;
      const totalLen = 8 + paddedLen;
      if (offset + totalLen > bytes.length) break;
      let keep = false;
      if (type === "VP8 " || type === "VP8L" || type === "ALPH" || type === "ANIM" || type === "ANMF") {
        keep = true;
      } else if (type === "ICCP" && options.preserveColorProfile) {
        keep = true;
      } else if (type === "VP8X") {
        keep = true;
      }
      if (keep) {
        const chunkData = bytes.slice(offset, offset + totalLen);
        if (type === "VP8X") {
          let flags = chunkData[8];
          flags &= ~8;
          flags &= ~4;
          if (!options.preserveColorProfile) {
            flags &= ~32;
          }
          chunkData[8] = flags;
        }
        retainedChunks.push({ type, data: chunkData });
      }
      offset += totalLen;
    }
    let payloadSize = 4;
    for (const c of retainedChunks) {
      payloadSize += c.data.length;
    }
    const out = new Uint8Array(8 + payloadSize);
    const outView = new DataView(out.buffer);
    out.set([82, 73, 70, 70], 0);
    outView.setUint32(4, payloadSize, true);
    out.set([87, 69, 66, 80], 8);
    let writePos = 12;
    for (const c of retainedChunks) {
      out.set(c.data, writePos);
      writePos += c.data.length;
    }
    return new Blob([out], { type: "image/webp" });
  }
};

// src/core/metadata/binary/isobmff.ts
var IsoBmffScanner = class {
  scan(buffer) {
    const reader = new SafeBinaryReader(buffer);
    const result = {
      boxes: [],
      majorBrand: "",
      compatibleBrands: [],
      tiffTags: [],
      xmpEntries: [],
      hasIccProfile: false,
      itemTypes: /* @__PURE__ */ new Map()
    };
    this.scanBoxes(reader, 0, reader.length, "", 0, result);
    return result;
  }
  scanBoxes(reader, startOffset, endOffset, pathPrefix, depth, result) {
    if (depth > 12) return;
    reader.seek(startOffset);
    while (reader.position < endOffset && reader.remaining >= 8) {
      const boxOffset = reader.position;
      let boxSize = reader.readUint32(false);
      const boxType = reader.readString(4);
      let headerSize = 8;
      if (boxSize === 1) {
        if (reader.remaining < 8) break;
        boxSize = Number(reader.readFloat64(false));
        headerSize = 16;
      } else if (boxSize === 0) {
        boxSize = endOffset - boxOffset;
      }
      if (boxSize < headerSize || boxOffset + boxSize > endOffset) {
        break;
      }
      const boxPath = pathPrefix ? `${pathPrefix}/${boxType}` : boxType;
      result.boxes.push({
        type: boxType,
        offset: boxOffset,
        length: boxSize,
        headerSize
      });
      if (boxType === "ftyp" && boxSize >= 16) {
        result.majorBrand = reader.readString(4);
        reader.skip(4);
        const brandCount = (boxSize - 16) / 4;
        for (let b = 0; b < brandCount; b++) {
          result.compatibleBrands.push(reader.readString(4));
        }
      } else if (boxType === "meta") {
        reader.skip(4);
        const metaPayloadEnd = boxOffset + boxSize;
        this.scanBoxes(reader, reader.position, metaPayloadEnd, boxPath, depth + 1, result);
      } else if (["iprp", "ipco", "moov", "trak", "mdia", "minf", "dinf"].includes(boxType)) {
        this.scanBoxes(reader, reader.position, boxOffset + boxSize, boxPath, depth + 1, result);
      } else if (boxType === "infe") {
        reader.skip(4);
        const itemId = reader.readUint16(false);
        reader.skip(2);
        const itemType = reader.readString(4);
        result.itemTypes.set(itemId, itemType);
      } else if (boxType === "colr") {
        const colorType = reader.readString(4);
        if (colorType === "prof" || colorType === "rICC") {
          result.hasIccProfile = true;
        }
      } else if (boxType === "ispe") {
        reader.skip(4);
        result.width = reader.readUint32(false);
        result.height = reader.readUint32(false);
      } else if (boxType === "irot") {
        const rot = reader.readUint8() & 3;
        result.rotation = rot * 90;
      } else if (boxType === "uuid" && boxSize > 24) {
        const uuidBytes = reader.readBytes(16);
        const isXmpUuid = uuidBytes[0] === 190 && uuidBytes[1] === 124 && uuidBytes[2] === 12 && uuidBytes[3] === 251;
        if (isXmpUuid) {
          const xmpParser = new RecursiveXmpParser();
          const xmpData = reader.readBytes(boxSize - headerSize - 16);
          result.xmpEntries.push(...xmpParser.parse(xmpData, `${boxPath}/XMP`));
        }
      }
      reader.seek(boxOffset + boxSize);
    }
  }
};

// src/core/metadata/classify.ts
var CLASSIFICATION_RULES = [
  // 3. Location information
  { pattern: /^GPS/i, category: "location", name: "GPS Location", removable: true, impactsIntegrity: false },
  { pattern: /Location|Latitude|Longitude|Altitude|DestLatitude|DestLongitude|GPSMapDatum|City|Sublocation|ProvinceState|CountryName|CountryCode/i, category: "location", name: "Geographic Location", removable: true, impactsIntegrity: false },
  // 1. Personal information
  { pattern: /^Artist$|^Author$|^Creator$|^By-line$|^WriterEditor$/i, category: "personal", name: "Author / Creator", removable: true, impactsIntegrity: false },
  { pattern: /^Copyright|^Rights|^CopyrightNotice$/i, category: "personal", name: "Copyright & Rights", removable: true, impactsIntegrity: false },
  { pattern: /^OwnerName$|^CameraOwnerName$/i, category: "personal", name: "Camera Owner", removable: true, impactsIntegrity: false },
  { pattern: /^Contact$|^Credit$|^Source$/i, category: "personal", name: "Contact & Credit", removable: true, impactsIntegrity: false },
  { pattern: /^UserComment$/i, category: "personal", name: "User Comment", removable: true, impactsIntegrity: false },
  // 2. Device information
  { pattern: /^Make$|^LensMake$/i, category: "device", name: "Device Manufacturer", removable: true, impactsIntegrity: false },
  { pattern: /^Model$|^UniqueCameraModel$|^LocalizedCameraModel$/i, category: "device", name: "Device Model", removable: true, impactsIntegrity: false },
  { pattern: /^Lens$|^LensModel$|^LensInfo$/i, category: "device", name: "Lens Specification", removable: true, impactsIntegrity: false },
  { pattern: /SerialNumber|BodySerialNumber|LensSerialNumber|InternalSerialNumber/i, category: "device", name: "Hardware Serial Number", removable: true, impactsIntegrity: false },
  { pattern: /^CameraCalibration|^ProfileCalibration/i, category: "device", name: "Camera Sensor Calibration", removable: true, impactsIntegrity: false },
  // 4. Software information
  { pattern: /^Software$|^CreatorTool$|^OriginatingProgram$|^ProgramVersion$/i, category: "software", name: "Software / Editing Application", removable: true, impactsIntegrity: false },
  { pattern: /DALL·E|DALL-E|Midjourney|Stable Diffusion|ComfyUI|Photoshop|Firefly|Canva/i, category: "software", name: "Generator / Processing Application", removable: true, impactsIntegrity: false },
  // 5. Editing history
  { pattern: /DocumentID|InstanceID|OriginalDocumentID/i, category: "editing", name: "Document Tracking ID", removable: true, impactsIntegrity: false },
  { pattern: /History|DerivedFrom|VersionHistory|EditStatus|ModifyDate/i, category: "editing", name: "Revision / Edit History", removable: true, impactsIntegrity: false },
  // 6. Descriptive metadata
  { pattern: /^ImageDescription$|^Description$|^Caption$|^Headline$|^Title$|^ObjectName$/i, category: "descriptive", name: "Title & Description", removable: true, impactsIntegrity: false },
  { pattern: /^Keywords$|^Subject$|^Category$|^SupplementalCategories$/i, category: "descriptive", name: "Tags & Keywords", removable: true, impactsIntegrity: false },
  { pattern: /^Prompt$|^NegativePrompt$|^Parameters$|^Seed$/i, category: "descriptive", name: "Generation Prompt & Parameters", removable: true, impactsIntegrity: false },
  { pattern: /^DateTimeOriginal$|^CreateDate$|^DateCreated$|^TimeCreated$/i, category: "descriptive", name: "Original Creation Timestamp", removable: true, impactsIntegrity: false },
  // 8. Color profile information
  { pattern: /^ICC|^ColorSpace$|^ProfileDescription$|^MatrixCoefficients$|^PrimaryChromaticities$|^WhitePoint$/i, category: "color", name: "Color Space & ICC Profile", removable: true, impactsIntegrity: true },
  // 9. Provenance and authenticity information
  { pattern: /C2PA|JUMBF|DigitalSourceType|ContentCredentials|ClaimSignature|Manifest/i, category: "provenance", name: "Cryptographic Provenance Manifest", removable: true, impactsIntegrity: false },
  // 7. Technical image information
  { pattern: /^ImageWidth$|^ImageHeight$|^ImageLength$|^ExifImageWidth$|^ExifImageHeight$/i, category: "technical", name: "Dimensions", removable: false, impactsIntegrity: true },
  { pattern: /^BitsPerSample$|^BitDepth$|^Compression$|^PhotometricInterpretation$|^SamplesPerPixel$/i, category: "technical", name: "Pixel Format & Compression", removable: false, impactsIntegrity: true },
  { pattern: /^Orientation$/i, category: "technical", name: "Sensor Orientation", removable: true, impactsIntegrity: true },
  { pattern: /^XResolution$|^YResolution$|^ResolutionUnit$/i, category: "technical", name: "Print Resolution", removable: true, impactsIntegrity: false },
  { pattern: /^ExposureTime$|^FNumber$|^ISO$|^ShutterSpeedValue$|^ApertureValue$|^FocalLength$/i, category: "technical", name: "Camera Exposure Settings", removable: true, impactsIntegrity: false },
  { pattern: /^Flash$|^MeteringMode$|^WhiteBalance$|^ExposureMode$|^ExposureProgram$/i, category: "technical", name: "Shooting Conditions", removable: true, impactsIntegrity: false },
  // 10. Unknown or proprietary metadata
  { pattern: /^MakerNote/i, category: "unknown", name: "Camera Proprietary MakerNote", removable: true, impactsIntegrity: false }
];
function classifyField(tag, value, location, layer, options) {
  const cleanTag = tag.trim();
  let matchedRule;
  for (const rule of CLASSIFICATION_RULES) {
    if (rule.pattern.test(cleanTag) || rule.pattern.test(location)) {
      matchedRule = rule;
      break;
    }
  }
  const category = matchedRule ? matchedRule.category : "unknown";
  const name = matchedRule ? matchedRule.name : cleanTag;
  const removable = matchedRule ? matchedRule.removable : true;
  const impactsIntegrity = matchedRule ? matchedRule.impactsIntegrity : false;
  let action = "keep";
  if (!removable) {
    action = "keep";
  } else if (category === "personal" && (options?.stripPersonalMetadata ?? true)) {
    action = "remove";
  } else if (category === "location" && (options?.stripGPS ?? true)) {
    action = "remove";
  } else if (category === "device" && (options?.stripDeviceSoftware ?? true)) {
    action = "remove";
  } else if (category === "software" && (options?.stripDeviceSoftware ?? true)) {
    action = "remove";
  } else if (category === "editing" && (options?.stripPersonalMetadata ?? true)) {
    action = "remove";
  } else if (category === "descriptive" && (options?.stripCommentsDescriptions ?? true)) {
    action = "remove";
  } else if (category === "provenance") {
    action = options?.stripC2PA ? "remove" : "keep";
  } else if (category === "color") {
    action = options?.preserveColorProfile ?? true ? "keep" : "remove";
  } else if (category === "technical") {
    action = "keep";
  } else if (category === "unknown") {
    action = "remove";
  }
  const id = `${location}-${cleanTag}-${Math.random().toString(36).substr(2, 6)}`;
  return {
    id,
    tag: cleanTag,
    name,
    value,
    location,
    category,
    layer,
    action,
    removable,
    impactsIntegrity,
    status: "detected"
  };
}

// src/core/metadata/scanner.ts
var DeepMetadataScanner = class {
  async scan(fileOrBuffer, options) {
    let buffer;
    if (fileOrBuffer instanceof ArrayBuffer) {
      buffer = fileOrBuffer;
    } else {
      buffer = await fileOrBuffer.arrayBuffer();
    }
    const reader = new SafeBinaryReader(buffer);
    const entries = [];
    let detectedFormat = "UNKNOWN";
    let width = 0;
    let height = 0;
    let orientation;
    let colorProfile;
    let hasTransparency = false;
    let hasAnimation = false;
    let aiTraces;
    if (reader.length >= 4 && reader.peekUint8(0) === 255 && reader.peekUint8(1) === 216) {
      detectedFormat = "JPEG";
      const jpegScanner = new JpegContainerScanner();
      const res = jpegScanner.scan(buffer);
      width = res.width || 0;
      height = res.height || 0;
      orientation = res.orientation;
      if (res.hasIccProfile) colorProfile = "Embedded ICC";
      for (const t of res.tiffTags) {
        entries.push(
          classifyField(t.tagName, t.formattedValue, `JPEG:APP1/${t.ifdPath}/${t.tagName}`, "A", options)
        );
      }
      for (const x of res.xmpEntries) {
        entries.push(
          classifyField(x.tag, x.value, x.location, "A", options)
        );
      }
      for (const ip of res.iptcEntries) {
        entries.push(
          classifyField(ip.name, ip.value, ip.location, "A", options)
        );
      }
      for (const seg of res.segments) {
        if (seg.marker === 254) {
          entries.push(
            classifyField("Comment", new TextDecoder().decode(seg.data), `JPEG:COM[0x${seg.offset.toString(16)}]`, "B", options)
          );
        } else if (seg.marker === 235) {
          entries.push(
            classifyField("C2PA JUMBF Manifest", "Cryptographically signed provenance manifest", `JPEG:APP11[0x${seg.offset.toString(16)}]`, "B", options)
          );
        }
      }
      if (res.hasTrailingBytes) {
        entries.push(
          classifyField("Trailing Data (Post-EOI)", `${res.trailingBytesLength} unreferenced bytes appended after EOI marker`, "JPEG:Trailer", "B", options)
        );
      }
    } else if (reader.length >= 8 && reader.peekUint8(0) === 137 && reader.peekUint8(1) === 80) {
      detectedFormat = "PNG";
      const pngScanner = new PngContainerScanner();
      const res = pngScanner.scan(buffer);
      width = res.width || 0;
      height = res.height || 0;
      hasTransparency = res.hasTransparency;
      if (res.hasIccProfile) colorProfile = res.iccProfileName || "Embedded ICC";
      for (const txt of res.textEntries) {
        const isAiPrompt = /prompt|workflow|parameters|negative/i.test(txt.keyword);
        entries.push(
          classifyField(
            txt.keyword,
            txt.text,
            txt.location,
            isAiPrompt ? "C" : "B",
            options
          )
        );
      }
      for (const t of res.tiffTags) {
        entries.push(
          classifyField(t.tagName, t.formattedValue, `PNG:eXIf/${t.ifdPath}/${t.tagName}`, "A", options)
        );
      }
      for (const x of res.xmpEntries) {
        entries.push(classifyField(x.tag, x.value, x.location, "A", options));
      }
      if (res.hasC2pa) {
        entries.push(
          classifyField("C2PA Chunk", "Embedded Content Credentials chunk", "PNG:c2pa", "B", options)
        );
      }
      if (res.aiWorkflow) {
        aiTraces = {
          tool: res.aiWorkflow.tool,
          prompt: res.aiWorkflow.prompt,
          negativePrompt: res.aiWorkflow.negativePrompt,
          seed: res.aiWorkflow.seed,
          sampler: res.aiWorkflow.sampler,
          steps: res.aiWorkflow.steps,
          model: res.aiWorkflow.model
        };
      }
    } else if (reader.length >= 12 && reader.peekUint32(0, false) === 1380533830 && reader.peekUint32(8, false) === 1464156752) {
      detectedFormat = "WEBP";
      const webpScanner = new WebpContainerScanner();
      const res = webpScanner.scan(buffer);
      width = res.width || 0;
      height = res.height || 0;
      hasTransparency = res.hasAlpha;
      hasAnimation = res.hasAnimation;
      if (res.hasIccProfile) colorProfile = "Embedded ICC";
      for (const t of res.tiffTags) {
        entries.push(
          classifyField(t.tagName, t.formattedValue, `WebP:EXIF/${t.ifdPath}/${t.tagName}`, "A", options)
        );
      }
      for (const x of res.xmpEntries) {
        entries.push(classifyField(x.tag, x.value, x.location, "A", options));
      }
    } else if (reader.length >= 12 && (reader.peekUint32(4, false) === 1718909296 || reader.peekUint32(4, false) === 1835365473)) {
      detectedFormat = "HEIC/AVIF";
      const isobmff = new IsoBmffScanner();
      const res = isobmff.scan(buffer);
      width = res.width || 0;
      height = res.height || 0;
      orientation = res.rotation;
      if (res.hasIccProfile) colorProfile = "Embedded ICC";
      detectedFormat = res.majorBrand.toUpperCase() || "HEIC";
      for (const t of res.tiffTags) {
        entries.push(
          classifyField(t.tagName, t.formattedValue, `ISOBMFF:Exif/${t.ifdPath}/${t.tagName}`, "A", options)
        );
      }
      for (const x of res.xmpEntries) {
        entries.push(classifyField(x.tag, x.value, x.location, "A", options));
      }
    } else if (reader.length >= 4 && (reader.peekUint16(0, false) === 18761 || reader.peekUint16(0, false) === 19789)) {
      detectedFormat = "RAW/TIFF";
      const tiffParser = new RecursiveTiffParser(reader);
      const tags = tiffParser.parse(0);
      for (const t of tags) {
        if (t.tagName === "ImageWidth" && typeof t.value === "number") width = t.value;
        if (t.tagName === "ImageLength" && typeof t.value === "number") height = t.value;
        if (t.tagName === "Orientation" && typeof t.value === "number") orientation = t.value;
        entries.push(
          classifyField(t.tagName, t.formattedValue, t.ifdPath + "/" + t.tagName, "A", options)
        );
      }
    }
    const summary = {
      totalFields: entries.length,
      personalCount: entries.filter((e) => e.category === "personal").length,
      deviceCount: entries.filter((e) => e.category === "device").length,
      locationCount: entries.filter((e) => e.category === "location").length,
      softwareCount: entries.filter((e) => e.category === "software").length,
      editingCount: entries.filter((e) => e.category === "editing").length,
      descriptiveCount: entries.filter((e) => e.category === "descriptive").length,
      technicalCount: entries.filter((e) => e.category === "technical").length,
      colorCount: entries.filter((e) => e.category === "color").length,
      provenanceCount: entries.filter((e) => e.category === "provenance").length,
      unknownCount: entries.filter((e) => e.category === "unknown").length
    };
    return {
      format: detectedFormat,
      width,
      height,
      orientation,
      colorProfile,
      hasTransparency,
      hasAnimation,
      entries,
      summary,
      aiTraces
    };
  }
};

// src/core/metadata/sanitizer.ts
var SafeDeepSanitizer = class {
  /**
   * Sanitizes binary container by reconstructing it from scratch using whitelist-based chunk/segment filter.
   * Mode 1: Metadata-Only, zero pixel re-encoding.
   */
  async sanitizeContainer(buffer, options) {
    const reader = new SafeBinaryReader(buffer);
    if (reader.length >= 4 && reader.peekUint8(0) === 255 && reader.peekUint8(1) === 216) {
      const jpegScanner = new JpegContainerScanner();
      const sanitizedBlob = jpegScanner.reconstructClean(buffer, {
        preserveColorProfile: options.preserveColorProfile,
        preserveProvenance: !options.stripC2PA,
        keepOrientationOnly: options.preserveOrientation
      });
      return {
        sanitizedBlob,
        method: "JPEG Container Whitelist Reconstruction (Zero Generational Loss)"
      };
    }
    if (reader.length >= 8 && reader.peekUint8(0) === 137 && reader.peekUint8(1) === 80) {
      const pngScanner = new PngContainerScanner();
      const sanitizedBlob = pngScanner.reconstructClean(buffer, {
        preserveColorProfile: options.preserveColorProfile,
        preserveProvenance: !options.stripC2PA
      });
      return {
        sanitizedBlob,
        method: "PNG Whitelist Chunk Stream Reconstruction (Pixel Scanlines Preserved)"
      };
    }
    if (reader.length >= 12 && reader.peekUint32(0, false) === 1380533830 && reader.peekUint32(8, false) === 1464156752) {
      const webpScanner = new WebpContainerScanner();
      const sanitizedBlob = webpScanner.reconstructClean(buffer, {
        preserveColorProfile: options.preserveColorProfile
      });
      return {
        sanitizedBlob,
        method: "WebP RIFF Container Re-framing (VP8/VP8L Intact, EXIF/XMP Stripped)"
      };
    }
    return {
      sanitizedBlob: new Blob([buffer]),
      method: "Pass-through Container"
    };
  }
};

// src/core/codecs/native.ts
async function decodeWithNative(blobOrFile) {
  if (typeof createImageBitmap !== "undefined") {
    try {
      const bitmap = await createImageBitmap(blobOrFile);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Could not get 2D context");
      ctx.drawImage(bitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
      bitmap.close();
      return imageData;
    } catch {
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blobOrFile);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("Could not get canvas 2d context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      } catch (err2) {
        reject(err2);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image in browser"));
    };
    img.src = url;
  });
}

// src/core/metadata/verifier.ts
var IndependentVerificationEngine = class {
  scanner = new DeepMetadataScanner();
  async verify(originalBuffer, sanitizedBlob, options) {
    const checks = [];
    const sanitizedBuffer = await sanitizedBlob.arrayBuffer();
    const origScan = await this.scanner.scan(originalBuffer, options);
    const postScan = await this.scanner.scan(sanitizedBuffer, options);
    const isValidContainer = postScan.format !== "UNKNOWN";
    checks.push({
      id: "container_valid",
      name: "Container Structure Validity",
      passed: isValidContainer,
      category: "structure",
      details: isValidContainer ? `Valid ${postScan.format} binary container headers verified.` : "Output file failed container signature validation."
    });
    let canDecode = false;
    let decodedWidth = 0;
    let decodedHeight = 0;
    try {
      if (typeof window !== "undefined" && typeof document !== "undefined") {
        const decodedImg = await decodeWithNative(sanitizedBlob);
        canDecode = decodedImg.width > 0 && decodedImg.height > 0;
        decodedWidth = decodedImg.width;
        decodedHeight = decodedImg.height;
      } else {
        canDecode = postScan.width > 0 && postScan.height > 0;
        decodedWidth = postScan.width;
        decodedHeight = postScan.height;
      }
    } catch {
      canDecode = postScan.width > 0;
    }
    checks.push({
      id: "image_decodable",
      name: "Pixel Stream Decodability",
      passed: canDecode,
      category: "decodability",
      details: canDecode ? `Output stream successfully decoded into ${decodedWidth}\xD7${decodedHeight} raster image.` : "Sanitized image failed binary decoding test."
    });
    const dimensionsMatch = origScan.width === 0 || postScan.width === 0 || origScan.width === postScan.width;
    checks.push({
      id: "dimensions_preserved",
      name: "Dimensional Geometry",
      passed: dimensionsMatch,
      category: "fidelity",
      details: dimensionsMatch ? `Original dimensions (${origScan.width}\xD7${origScan.height}) preserved identically.` : `Dimension mismatch: Original was ${origScan.width}\xD7${origScan.height}, output is ${postScan.width}\xD7${postScan.height}.`
    });
    const personalRemaining = postScan.summary.personalCount;
    const locationRemaining = postScan.summary.locationCount;
    const privacySuccess = personalRemaining === 0 && locationRemaining === 0;
    checks.push({
      id: "personal_metadata_cleared",
      name: "Personal & GPS Sanitization",
      passed: privacySuccess,
      category: "privacy",
      details: privacySuccess ? "Zero personal identities, authors, copyrights, or GPS coordinates detected." : `Residual personal/GPS metadata detected: ${personalRemaining} personal tags, ${locationRemaining} location coordinates.`
    });
    if (options.stripAIWorkflowParameters) {
      const softwareRemaining = postScan.summary.softwareCount;
      const descriptiveRemaining = postScan.summary.descriptiveCount;
      const hasAiTraces = !!postScan.aiTraces;
      checks.push({
        id: "ai_workflow_sanitized",
        name: "AI Generator Traces Sanitization",
        passed: !hasAiTraces && softwareRemaining === 0,
        category: "privacy",
        details: !hasAiTraces && softwareRemaining === 0 ? "Zero ComfyUI graphs, Stable Diffusion prompts, or generator params remaining." : `Residual AI parameters detected: ${postScan.aiTraces?.tool || "AI workflow data present"}`
      });
    }
    if (options.preserveColorProfile && origScan.colorProfile) {
      const colorPreserved = !!postScan.colorProfile;
      checks.push({
        id: "color_profile_preserved",
        name: "ICC Color Profile Preservation",
        passed: colorPreserved,
        category: "fidelity",
        details: colorPreserved ? `Embedded ICC color profile (${postScan.colorProfile}) preserved intact.` : "Warning: Original color profile was not detected in sanitized container."
      });
    }
    if (origScan.hasTransparency) {
      checks.push({
        id: "transparency_preserved",
        name: "Alpha Channel Preservation",
        passed: postScan.hasTransparency,
        category: "fidelity",
        details: postScan.hasTransparency ? "Alpha channel and transparency layers preserved." : "Alpha transparency not detected in output container."
      });
    }
    if (origScan.hasAnimation) {
      checks.push({
        id: "animation_preserved",
        name: "Animation Track Preservation",
        passed: postScan.hasAnimation,
        category: "fidelity",
        details: postScan.hasAnimation ? "Multi-frame animation sequence preserved." : "Animation frames missing in output."
      });
    }
    const passedCount = checks.filter((c) => c.passed).length;
    const totalCount = checks.length;
    let status = "VERIFIED";
    const hasFailedPrivacyOrDecodability = checks.some(
      (c) => !c.passed && (c.category === "privacy" || c.category === "decodability")
    );
    if (hasFailedPrivacyOrDecodability) {
      status = "FAILED";
    } else if (passedCount < totalCount) {
      status = "PARTIALLY_VERIFIED";
    }
    return {
      status,
      checksPassed: passedCount,
      checksTotal: totalCount,
      checks,
      timestamp: Date.now(),
      residualFieldsCount: postScan.entries.length,
      originalSize: originalBuffer.byteLength,
      sanitizedSize: sanitizedBuffer.byteLength
    };
  }
};

// src/core/perturbation/disrupt.ts
function applyPixelDisruption(imageData, strength = 0.35) {
  const width = imageData.width;
  const height = imageData.height;
  const data = new Uint8ClampedArray(imageData.data);
  let seed = 1337;
  function random() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }
  function gaussianNoise() {
    const u1 = Math.max(1e-6, random());
    const u2 = random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
  const factor = Math.max(0.1, Math.min(1, strength));
  const noiseScale = factor * 1.8;
  for (let i = 0; i < data.length; i += 4) {
    const noiseR = gaussianNoise() * noiseScale;
    const noiseG = gaussianNoise() * noiseScale;
    const noiseB = gaussianNoise() * noiseScale;
    data[i] = Math.min(255, Math.max(0, Math.round(data[i] + noiseR)));
    data[i + 1] = Math.min(255, Math.max(0, Math.round(data[i + 1] + noiseG)));
    data[i + 2] = Math.min(255, Math.max(0, Math.round(data[i + 2] + noiseB)));
  }
  return new ImageData(data, width, height);
}

// src/core/tests/engine.test.ts
async function runAllTests() {
  const results = [];
  const scanner = new DeepMetadataScanner();
  const sanitizer = new SafeDeepSanitizer();
  const verifier = new IndependentVerificationEngine();
  const defaultOptions = {
    mode: "safe",
    outputFormat: "JPG",
    quality: 100,
    lossless: false,
    stripPersonalMetadata: true,
    stripGPS: true,
    stripDeviceSoftware: true,
    stripCommentsDescriptions: true,
    stripAIWorkflowParameters: true,
    stripC2PA: true,
    preserveColorProfile: true,
    preserveOrientation: true,
    preserveTransparency: true,
    preserveAnimation: true
  };
  {
    const start = performance.now();
    const details = [];
    let passed = true;
    const jpegBuffer = createPhotoshopJpegFixture();
    const scanReport = await scanner.scan(jpegBuffer, defaultOptions);
    details.push(`Detected ${scanReport.entries.length} fields across Layer A & B.`);
    details.push(`GPS Coordinates: ${scanReport.summary.locationCount} detected.`);
    details.push(`Personal Tags: ${scanReport.summary.personalCount} detected.`);
    if (scanReport.summary.locationCount === 0) {
      passed = false;
      details.push("FAIL: Did not detect GPS coordinates in IFD0 GPSInfo sub-tree.");
    }
    if (scanReport.summary.personalCount === 0) {
      passed = false;
      details.push("FAIL: Did not detect personal artist/copyright in IFD0 or IPTC.");
    }
    const { sanitizedBlob } = await sanitizer.sanitizeContainer(jpegBuffer, defaultOptions);
    const verification = await verifier.verify(jpegBuffer, sanitizedBlob, defaultOptions);
    details.push(`Verification Status: ${verification.status} (${verification.checksPassed}/${verification.checksTotal} checks passed).`);
    if (verification.status !== "VERIFIED") {
      passed = false;
      details.push("FAIL: Verification status was not VERIFIED.");
    }
    results.push({
      suiteName: "JPEG Deep Multi-Layer Scanner & Reconstructor",
      passed,
      durationMs: Math.round(performance.now() - start),
      details
    });
  }
  {
    const start = performance.now();
    const details = [];
    let passed = true;
    const sdBuffer = createStableDiffusionPngFixture();
    const scanReport = await scanner.scan(sdBuffer, defaultOptions);
    details.push(`Detected AI Tool: ${scanReport.aiTraces?.tool || "None"}`);
    details.push(`Extracted Prompt: "${scanReport.aiTraces?.prompt?.substring(0, 40)}..."`);
    details.push(`Sampler: ${scanReport.aiTraces?.sampler}, Seed: ${scanReport.aiTraces?.seed}`);
    if (scanReport.aiTraces?.tool !== "Stable Diffusion (A1111/Forge)") {
      passed = false;
      details.push("FAIL: Did not decompress and detect Stable Diffusion parameters from zTXt.");
    }
    const pngOptions = { ...defaultOptions, outputFormat: "PNG" };
    const { sanitizedBlob } = await sanitizer.sanitizeContainer(sdBuffer, pngOptions);
    const verification = await verifier.verify(sdBuffer, sanitizedBlob, pngOptions);
    details.push(`Sanitized PNG Verification: ${verification.status}`);
    if (verification.status !== "VERIFIED") {
      passed = false;
      details.push("FAIL: PNG verification failed.");
    }
    results.push({
      suiteName: "PNG zTXt Compressed AI Workflow Scanner (Stable Diffusion)",
      passed,
      durationMs: Math.round(performance.now() - start),
      details
    });
  }
  {
    const start = performance.now();
    const details = [];
    let passed = true;
    const comfyBuffer = createComfyUiPngFixture();
    const scanReport = await scanner.scan(comfyBuffer, defaultOptions);
    details.push(`Detected AI Tool: ${scanReport.aiTraces?.tool}`);
    if (scanReport.aiTraces?.tool !== "ComfyUI") {
      passed = false;
      details.push("FAIL: Did not parse ComfyUI graph from iTXt chunk.");
    }
    const pngOptions = { ...defaultOptions, outputFormat: "PNG" };
    const { sanitizedBlob } = await sanitizer.sanitizeContainer(comfyBuffer, pngOptions);
    const postScan = await scanner.scan(await sanitizedBlob.arrayBuffer(), pngOptions);
    if (postScan.aiTraces) {
      passed = false;
      details.push("FAIL: ComfyUI node graph was not sanitized from PNG.");
    } else {
      details.push("PASS: ComfyUI workflow graph completely removed from PNG.");
    }
    results.push({
      suiteName: "PNG iTXt ComfyUI Node Graph Scanner & Cleaner",
      passed,
      durationMs: Math.round(performance.now() - start),
      details
    });
  }
  {
    const start = performance.now();
    const details = [];
    let passed = true;
    const truncated = new Uint8Array([255, 216, 255, 225, 0, 80, 69, 120]).buffer;
    try {
      const scan = await scanner.scan(truncated, defaultOptions);
      details.push(`Gracefully handled truncated JPEG without throwing: ${scan.entries.length} entries.`);
    } catch (e) {
      passed = false;
      details.push(`FAIL: Threw uncaught exception on truncated stream: ${e.message}`);
    }
    results.push({
      suiteName: "Safe Boundary & Truncated Container Handling",
      passed,
      durationMs: Math.round(performance.now() - start),
      details
    });
  }
  {
    const start = performance.now();
    const details = [];
    let passed = true;
    const rawData = new Uint8ClampedArray(10 * 10 * 4);
    for (let i = 0; i < rawData.length; i += 4) {
      rawData[i] = 120;
      rawData[i + 1] = 130;
      rawData[i + 2] = 140;
      rawData[i + 3] = 255;
    }
    const mockImage = new ImageData(rawData, 10, 10);
    const perturbed = applyPixelDisruption(mockImage, 0.35);
    let alphaIntact = true;
    let maxDiff = 0;
    for (let i = 0; i < rawData.length; i += 4) {
      if (perturbed.data[i + 3] !== 255) alphaIntact = false;
      const diffR = Math.abs(perturbed.data[i] - rawData[i]);
      if (diffR > maxDiff) maxDiff = diffR;
    }
    details.push(`Alpha channel intact: ${alphaIntact}`);
    details.push(`Max RGB channel perturbation: \xB1${maxDiff} units (guaranteed imperceptible).`);
    if (!alphaIntact || maxDiff === 0 || maxDiff > 10) {
      passed = false;
      details.push("FAIL: Pixel perturbation was outside quality-gated bounds.");
    }
    results.push({
      suiteName: "Mode 2: Quality-Gated Watermark Perturbation Engine",
      passed,
      durationMs: Math.round(performance.now() - start),
      details
    });
  }
  const allPassed = results.every((r) => r.passed);
  return { passed: allPassed, results };
}
export {
  runAllTests
};
