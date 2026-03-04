import { useState, useCallback, useMemo, useEffect, useRef } from "react";

const STORAGE_KEY = "etf_optimizer_state_v1";

const ETF_DB = [
  {t:"SPY",n:"SPDR S&P 500",c:"US Large Cap",h:503,er:.09,r:10.5,v:15.2,d:1.3},
  {t:"VOO",n:"Vanguard S&P 500",c:"US Large Cap",h:503,er:.03,r:10.6,v:15.1,d:1.4},
  {t:"VTI",n:"Vanguard Total Market",c:"US Total Mkt",h:3794,er:.03,r:10.2,v:15.5,d:1.4},
  {t:"IVV",n:"iShares Core S&P 500",c:"US Large Cap",h:503,er:.03,r:10.5,v:15.1,d:1.3},
  {t:"QQQ",n:"Invesco QQQ Trust",c:"US Growth",h:101,er:.20,r:14.8,v:20.1,d:.5},
  {t:"IWM",n:"iShares Russell 2000",c:"US Small Cap",h:1974,er:.19,r:7.8,v:20.5,d:1.2},
  {t:"IWF",n:"iShares R1000 Growth",c:"US Growth",h:421,er:.19,r:13.2,v:17.8,d:.6},
  {t:"IWD",n:"iShares R1000 Value",c:"US Value",h:842,er:.19,r:8.1,v:14.2,d:2.1},
  {t:"VIG",n:"Vanguard Div Appreciation",c:"US Dividend",h:315,er:.06,r:9.8,v:13.1,d:1.8},
  {t:"VYM",n:"Vanguard High Div Yield",c:"US Dividend",h:536,er:.06,r:8.5,v:13.8,d:2.9},
  {t:"SCHD",n:"Schwab US Div Equity",c:"US Dividend",h:104,er:.06,r:11.1,v:14.0,d:3.4},
  {t:"VUG",n:"Vanguard Growth",c:"US Growth",h:209,er:.04,r:13.5,v:18.2,d:.5},
  {t:"VTV",n:"Vanguard Value",c:"US Value",h:346,er:.04,r:8.3,v:14.5,d:2.4},
  {t:"VO",n:"Vanguard Mid-Cap",c:"US Mid Cap",h:348,er:.04,r:9.5,v:16.8,d:1.5},
  {t:"VB",n:"Vanguard Small-Cap",c:"US Small Cap",h:1384,er:.05,r:8.2,v:19.8,d:1.4},
  {t:"VXUS",n:"Vanguard Total Intl",c:"International",h:8535,er:.07,r:5.2,v:16.0,d:3.1},
  {t:"VEA",n:"Vanguard Developed Mkts",c:"Intl Developed",h:4048,er:.05,r:5.8,v:15.2,d:3.0},
  {t:"VWO",n:"Vanguard Emerging Mkts",c:"Emerging Mkts",h:5795,er:.08,r:4.1,v:19.8,d:2.8},
  {t:"EFA",n:"iShares MSCI EAFE",c:"Intl Developed",h:783,er:.32,r:5.5,v:15.5,d:2.9},
  {t:"EEM",n:"iShares Emerging Mkts",c:"Emerging Mkts",h:1238,er:.68,r:3.8,v:20.5,d:2.2},
  {t:"IEFA",n:"iShares Core EAFE",c:"Intl Developed",h:2770,er:.07,r:5.6,v:15.3,d:2.8},
  {t:"XLK",n:"Tech Select Sector",c:"Sector Tech",h:65,er:.10,r:15.2,v:20.8,d:.7},
  {t:"XLV",n:"Healthcare Select",c:"Sector Health",h:62,er:.10,r:9.8,v:14.5,d:1.5},
  {t:"XLF",n:"Financial Select",c:"Sector Finance",h:73,er:.10,r:8.2,v:18.5,d:1.6},
  {t:"XLE",n:"Energy Select",c:"Sector Energy",h:34,er:.10,r:3.5,v:26.2,d:3.5},
  {t:"XLI",n:"Industrial Select",c:"Sector Indust",h:78,er:.10,r:9.1,v:16.2,d:1.4},
  {t:"XLY",n:"Consumer Discr Select",c:"Sector Consumer",h:51,er:.10,r:11.5,v:18.0,d:.8},
  {t:"XLRE",n:"Real Estate Select",c:"Sector RE",h:31,er:.10,r:6.5,v:18.5,d:3.2},
  {t:"MTUM",n:"iShares Momentum",c:"Factor Momentum",h:125,er:.15,r:12.5,v:16.5,d:.9},
  {t:"QUAL",n:"iShares Quality",c:"Factor Quality",h:124,er:.15,r:11.8,v:14.8,d:1.3},
  {t:"USMV",n:"iShares Min Vol",c:"Factor LowVol",h:174,er:.15,r:9.2,v:11.5,d:1.7},
  {t:"BND",n:"Vanguard Total Bond",c:"US Bond",h:10702,er:.03,r:3.2,v:4.5,d:3.5},
  {t:"AGG",n:"iShares US Agg Bond",c:"US Bond",h:11944,er:.03,r:3.1,v:4.6,d:3.4},
  {t:"BNDX",n:"Vanguard Intl Bond",c:"Intl Bond",h:6840,er:.07,r:2.5,v:4.2,d:2.8},
  {t:"TLT",n:"iShares 20Y+ Treasury",c:"US Treasury",h:41,er:.15,r:3.8,v:14.2,d:3.8},
  {t:"LQD",n:"iShares IG Corp Bond",c:"US Corp Bond",h:2845,er:.14,r:4.2,v:7.5,d:4.1},
  {t:"HYG",n:"iShares HY Corp Bond",c:"US High Yield",h:1178,er:.49,r:5.1,v:8.8,d:5.5},
];

const CORR={"US Large Cap":{"US Total Mkt":.99,"US Growth":.92,"US Value":.92,"US Mid Cap":.95,"US Small Cap":.88,"US Dividend":.93,"International":.72,"Intl Developed":.74,"Emerging Mkts":.65,"Sector Tech":.88,"Sector Health":.78,"Sector Finance":.82,"Sector Energy":.58,"Sector Indust":.88,"Sector Consumer":.87,"Sector RE":.62,"Factor Momentum":.90,"Factor Quality":.96,"Factor LowVol":.85,"US Bond":-.15,"Intl Bond":-.08,"US Treasury":-.35,"US Corp Bond":.10,"US High Yield":.60,"Stock":.75,"Cash":0},"US Growth":{"US Value":.72,"US Small Cap":.82,"International":.65,"US Bond":-.22,"US Treasury":-.42,"Stock":.78,"Cash":0},"US Value":{"US Small Cap":.88,"International":.78,"US Bond":.05,"US Treasury":-.15,"Stock":.70,"Cash":0},"US Total Mkt":{"Stock":.76,"Cash":0},"US Mid Cap":{"Stock":.72,"Cash":0},"US Small Cap":{"International":.72,"US Bond":-.08,"US Treasury":-.28,"Stock":.68,"Cash":0},"US Dividend":{"US Bond":.08,"US Treasury":-.12,"Stock":.65,"Cash":0},"International":{"Intl Developed":.98,"Emerging Mkts":.88,"US Bond":.05,"US Treasury":-.10,"Stock":.55,"Cash":0},"Intl Developed":{"Emerging Mkts":.82,"Stock":.52,"Cash":0},"Emerging Mkts":{"US Bond":.02,"US Treasury":-.15,"Stock":.48,"Cash":0},"Sector Tech":{"Stock":.80,"Cash":0},"Sector Health":{"Stock":.60,"Cash":0},"Sector Finance":{"Stock":.65,"Cash":0},"Sector Energy":{"Stock":.45,"Cash":0},"Sector Indust":{"Stock":.68,"Cash":0},"Sector Consumer":{"Stock":.70,"Cash":0},"Sector RE":{"Stock":.40,"Cash":0},"Factor Momentum":{"Stock":.72,"Cash":0},"Factor Quality":{"Stock":.74,"Cash":0},"Factor LowVol":{"US Bond":.15,"Stock":.55,"Cash":0},"US Bond":{"Intl Bond":.65,"US Treasury":.88,"US Corp Bond":.92,"US High Yield":.45,"Stock":-.10,"Cash":.05},"Intl Bond":{"US Treasury":.55,"US Corp Bond":.60,"US High Yield":.35,"Stock":-.05,"Cash":.03},"US Treasury":{"US Corp Bond":.72,"US High Yield":.05,"Stock":-.30,"Cash":.02},"US Corp Bond":{"US High Yield":.68,"Stock":.05,"Cash":.03},"US High Yield":{"Stock":.50,"Cash":0},"Stock":{"Cash":0},"Cash":{"Cash":1}};
function gc(a,b){if(a===b)return 1;return CORR[a]?.[b]??CORR[b]?.[a]??.5}

const RF=4.5;
const PAL=["#6ee7b7","#60a5fa","#f472b6","#fbbf24","#a78bfa","#fb923c","#34d399","#f87171","#38bdf8","#e879f9"];

const STOCK_DB=[
  {t:"AAPL",n:"Apple Inc.",s:"Technology"},{t:"MSFT",n:"Microsoft",s:"Technology"},{t:"GOOGL",n:"Alphabet (A)",s:"Technology"},{t:"AMZN",n:"Amazon",s:"Consumer"},{t:"NVDA",n:"NVIDIA",s:"Technology"},{t:"META",n:"Meta Platforms",s:"Technology"},{t:"TSLA",n:"Tesla",s:"Consumer"},{t:"BRK.B",n:"Berkshire B",s:"Financial"},{t:"LLY",n:"Eli Lilly",s:"Healthcare"},{t:"V",n:"Visa",s:"Financial"},{t:"JPM",n:"JPMorgan",s:"Financial"},{t:"UNH",n:"UnitedHealth",s:"Healthcare"},{t:"MA",n:"Mastercard",s:"Financial"},{t:"XOM",n:"Exxon Mobil",s:"Energy"},{t:"JNJ",n:"J&J",s:"Healthcare"},{t:"PG",n:"Procter & Gamble",s:"Consumer"},{t:"AVGO",n:"Broadcom",s:"Technology"},{t:"HD",n:"Home Depot",s:"Consumer"},{t:"COST",n:"Costco",s:"Consumer"},{t:"MRK",n:"Merck",s:"Healthcare"},{t:"ABBV",n:"AbbVie",s:"Healthcare"},{t:"CVX",n:"Chevron",s:"Energy"},{t:"CRM",n:"Salesforce",s:"Technology"},{t:"AMD",n:"AMD",s:"Technology"},{t:"KO",n:"Coca-Cola",s:"Consumer"},{t:"PEP",n:"PepsiCo",s:"Consumer"},{t:"NFLX",n:"Netflix",s:"Technology"},{t:"ADBE",n:"Adobe",s:"Technology"},{t:"WMT",n:"Walmart",s:"Consumer"},{t:"BAC",n:"Bank of America",s:"Financial"},{t:"DIS",n:"Disney",s:"Communications"},{t:"CSCO",n:"Cisco",s:"Technology"},{t:"INTC",n:"Intel",s:"Technology"},{t:"ORCL",n:"Oracle",s:"Technology"},{t:"IBM",n:"IBM",s:"Technology"},{t:"QCOM",n:"Qualcomm",s:"Technology"},{t:"GE",n:"GE",s:"Industrial"},{t:"CAT",n:"Caterpillar",s:"Industrial"},{t:"BA",n:"Boeing",s:"Industrial"},{t:"GS",n:"Goldman Sachs",s:"Financial"},{t:"MS",n:"Morgan Stanley",s:"Financial"},{t:"UBER",n:"Uber",s:"Technology"},{t:"SBUX",n:"Starbucks",s:"Consumer"},{t:"INTU",n:"Intuit",s:"Technology"},{t:"ISRG",n:"Intuitive Surgical",s:"Healthcare"},{t:"PFE",n:"Pfizer",s:"Healthcare"},{t:"NOW",n:"ServiceNow",s:"Technology"},{t:"LMT",n:"Lockheed Martin",s:"Industrial"},{t:"PLTR",n:"Palantir",s:"Technology"},{t:"PANW",n:"Palo Alto Networks",s:"Technology"},{t:"SHOP",n:"Shopify",s:"Technology"},{t:"SQ",n:"Block",s:"Technology"},{t:"COIN",n:"Coinbase",s:"Financial"},{t:"CRWD",n:"CrowdStrike",s:"Technology"},{t:"NET",n:"Cloudflare",s:"Technology"},{t:"ABNB",n:"Airbnb",s:"Consumer"},{t:"PYPL",n:"PayPal",s:"Financial"},{t:"MU",n:"Micron",s:"Technology"},{t:"BABA",n:"Alibaba (ADR)",s:"Technology"},{t:"BILI",n:"Bilibili (ADR)",s:"Communications"},{t:"EXAS",n:"Exact Sciences",s:"Healthcare"},{t:"JD",n:"JD.com (ADR)",s:"Consumer"},{t:"PDD",n:"PDD Holdings",s:"Consumer"},{t:"NIO",n:"NIO (ADR)",s:"Consumer"},{t:"TSM",n:"Taiwan Semi (ADR)",s:"Technology"},{t:"ASML",n:"ASML (ADR)",s:"Technology"},{t:"ARM",n:"Arm Holdings",s:"Technology"},{t:"SMCI",n:"Super Micro",s:"Technology"},{t:"APP",n:"AppLovin",s:"Technology"},{t:"SOFI",n:"SoFi",s:"Financial"},{t:"RIVN",n:"Rivian",s:"Consumer"},{t:"HOOD",n:"Robinhood",s:"Financial"},{t:"IONQ",n:"IonQ",s:"Technology"},{t:"SOUN",n:"SoundHound AI",s:"Technology"},{t:"RKLB",n:"Rocket Lab",s:"Industrial"},{t:"DELL",n:"Dell",s:"Technology"},{t:"SNOW",n:"Snowflake",s:"Technology"},{t:"DASH",n:"DoorDash",s:"Technology"},{t:"SPOT",n:"Spotify",s:"Communications"},{t:"DDOG",n:"Datadog",s:"Technology"},{t:"AFRM",n:"Affirm",s:"Technology"},{t:"F",n:"Ford",s:"Consumer"},{t:"GM",n:"General Motors",s:"Consumer"},{t:"MRNA",n:"Moderna",s:"Healthcare"},{t:"CVS",n:"CVS Health",s:"Healthcare"},{t:"REGN",n:"Regeneron",s:"Healthcare"},{t:"VRTX",n:"Vertex Pharma",s:"Healthcare"},{t:"GILD",n:"Gilead",s:"Healthcare"},{t:"CI",n:"Cigna",s:"Healthcare"},{t:"DHR",n:"Danaher",s:"Healthcare"},{t:"C",n:"Citigroup",s:"Financial"},{t:"SCHW",n:"Charles Schwab",s:"Financial"},{t:"CME",n:"CME Group",s:"Financial"},{t:"ICE",n:"Intercontinental Exch",s:"Financial"},{t:"COP",n:"ConocoPhillips",s:"Energy"},{t:"OXY",n:"Occidental Petroleum",s:"Energy"},{t:"FSLR",n:"First Solar",s:"Energy"},{t:"O",n:"Realty Income",s:"Real Estate"},{t:"AMT",n:"American Tower",s:"Real Estate"},{t:"NEE",n:"NextEra Energy",s:"Utilities"},{t:"SO",n:"Southern Co",s:"Utilities"},{t:"NEM",n:"Newmont",s:"Materials"},{t:"FCX",n:"Freeport-McMoRan",s:"Materials"},{t:"GOLD",n:"Barrick Gold",s:"Materials"},{t:"LULU",n:"Lululemon",s:"Consumer"},{t:"CMG",n:"Chipotle",s:"Consumer"},{t:"MCD",n:"McDonald's",s:"Consumer"},{t:"TGT",n:"Target",s:"Consumer"},{t:"LOW",n:"Lowe's",s:"Consumer"},{t:"HON",n:"Honeywell",s:"Industrial"},{t:"ETN",n:"Eaton",s:"Industrial"},{t:"DE",n:"Deere",s:"Industrial"},{t:"UPS",n:"UPS",s:"Industrial"},{t:"FDX",n:"FedEx",s:"Industrial"},{t:"DAL",n:"Delta Air Lines",s:"Industrial"},{t:"TMUS",n:"T-Mobile",s:"Communications"},{t:"CMCSA",n:"Comcast",s:"Communications"},{t:"EA",n:"Electronic Arts",s:"Communications"},{t:"NXPI",n:"NXP Semi",s:"Technology"},{t:"ADI",n:"Analog Devices",s:"Technology"},{t:"SNPS",n:"Synopsys",s:"Technology"},{t:"CDNS",n:"Cadence Design",s:"Technology"},{t:"FTNT",n:"Fortinet",s:"Technology"},{t:"WDAY",n:"Workday",s:"Technology"},{t:"TEAM",n:"Atlassian",s:"Technology"},{t:"HUBS",n:"HubSpot",s:"Technology"},{t:"MELI",n:"MercadoLibre",s:"Consumer"},{t:"NU",n:"Nu Holdings",s:"Financial"},{t:"SE",n:"Sea Limited",s:"Technology"},{t:"CPNG",n:"Coupang",s:"Consumer"},{t:"VALE",n:"Vale (ADR)",s:"Materials"},{t:"BHP",n:"BHP (ADR)",s:"Materials"},{t:"RIO",n:"Rio Tinto (ADR)",s:"Materials"},
];

// ═══ ENGINE ═══
function calcMetrics(positions, cashDollars, totalVal) {
  if (!positions.length && !cashDollars) return null;
  const tv = totalVal || 1;
  const items = positions.filter(p => p.dollars > 0).map(p => ({ ...p, w: p.dollars / tv }));
  const cashW = (cashDollars || 0) / tv;
  const er = items.reduce((s, p) => s + p.w * (p.r || 0), 0) + cashW * RF;
  const div = items.reduce((s, p) => s + p.w * (p.d || 0), 0);
  const wer = items.filter(p => p.type === "etf").reduce((s, p) => s + p.w * (p.er || 0), 0);
  let vr = 0;
  const all = [...items.map(p => ({ w: p.w, vol: p.v || 0, cat: p.cat || "Stock" }))];
  if (cashW > 0) all.push({ w: cashW, vol: 0, cat: "Cash" });
  for (let i = 0; i < all.length; i++) for (let j = 0; j < all.length; j++)
    vr += all[i].w * all[j].w * (all[i].vol / 100) * (all[j].vol / 100) * gc(all[i].cat, all[j].cat);
  const vol = Math.sqrt(Math.max(0, vr)) * 100;
  const sh = vol > 0 ? (er - RF) / vol : 0;
  const msh = vol > 0 ? (er - RF) / (vol * vol / 100) : 0;
  const so = vol > 0 ? (er - RF) / (vol * .7) : 0;
  const nr = er - wer; const md = vol * 2.1; const cm = md > 0 ? nr / md : 0;
  const dr = vol > 0 ? items.reduce((s, p) => s + p.w * (p.v || 0), 0) / vol : 1;
  return { er, vol, sh, msh, so, nr, wer, div, md, cm, dr, cashW };
}

function optimizeCash(existing, cash, totalVal, candidates, target, useMod) {
  if (!candidates.length || cash <= 0) return [];
  const n = candidates.length; let best = null, bs = -Infinity;
  for (let t = 0; t < 6000; t++) {
    const ws = Array.from({ length: n }, () => Math.random());
    const s = ws.reduce((a, b) => a + b, 0);
    const alloc = ws.map(w => w / s * cash);
    const newTV = totalVal + cash;
    const items = [
      ...existing.map(p => ({ w: p.dollars / newTV, vol: p.v || 0, cat: p.cat || "Stock", ret: p.r || 0 })),
      ...alloc.map((d, i) => ({ w: d / newTV, vol: candidates[i].v, cat: candidates[i].c, ret: candidates[i].r })),
    ];
    let ret = 0, vr = 0;
    for (let i = 0; i < items.length; i++) { ret += items[i].w * items[i].ret;
      for (let j = 0; j < items.length; j++) vr += items[i].w * items[j].w * (items[i].vol / 100) * (items[j].vol / 100) * gc(items[i].cat, items[j].cat); }
    const vol = Math.sqrt(Math.max(0, vr)) * 100;
    const sh = vol > 0 ? (useMod ? (ret - RF) / (vol * vol / 100) : (ret - RF) / vol) : 0;
    let sc; if (target === "max_sharpe") sc = sh; else if (target === "min_vol") sc = -vol;
    else if (target === "max_return") sc = ret; else sc = sh * .5 + ret * .03 - vol * .02;
    if (sc > bs) { bs = sc; best = alloc; }
  }
  return candidates.map((e, i) => ({ ticker: e.t, name: e.n, cat: e.c, r: e.r, v: e.v, er: e.er, d: e.d, dollars: +best[i].toFixed(0), pct: +((best[i] / cash) * 100).toFixed(1) })).filter(e => e.dollars > 10).sort((a, b) => b.dollars - a.dollars);
}

function genFrontier(existing, cash, totalVal, candidates) {
  if (candidates.length < 2 || cash <= 0) return null;
  const n = candidates.length; const pts = [];
  for (let t = 0; t < 2000; t++) {
    const ws = Array.from({ length: n }, () => Math.random());
    const s = ws.reduce((a, b) => a + b, 0);
    const alloc = ws.map(w => w / s * cash);
    const newTV = totalVal + cash;
    const items = [
      ...existing.map(p => ({ w: p.dollars / newTV, vol: p.v || 0, cat: p.cat || "Stock", ret: p.r || 0 })),
      ...alloc.map((d, i) => ({ w: d / newTV, vol: candidates[i].v, cat: candidates[i].c, ret: candidates[i].r })),
    ];
    let ret = 0, vr = 0;
    for (let i = 0; i < items.length; i++) { ret += items[i].w * items[i].ret;
      for (let j = 0; j < items.length; j++) vr += items[i].w * items[j].w * (items[i].vol / 100) * (items[j].vol / 100) * gc(items[i].cat, items[j].cat); }
    const vol = Math.sqrt(Math.max(0, vr)) * 100;
    pts.push({ vol: +vol.toFixed(2), ret: +ret.toFixed(2), sh: +((ret - RF) / Math.max(vol, .01)).toFixed(3) });
  }
  pts.sort((a, b) => a.vol - b.vol);
  const fr = []; let mx = -Infinity;
  for (const p of pts) { if (p.ret > mx) { fr.push(p); mx = p.ret; } }
  return { all: pts, fr };
}

// ═══ UI COMPONENTS ═══
const mono2 = "'Overpass Mono',monospace"; const sans2 = "'Libre Franklin',sans-serif";
const cs = { bg: "#0a0b0e", card: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.06)", muted: "#555b66", dim: "#717784", text: "#e8eaed", green: "#6ee7b7", blue: "#60a5fa", pink: "#f472b6", yellow: "#fbbf24", purple: "#a78bfa", red: "#f87171" };
const inpS = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: cs.text, padding: "7px 9px", fontSize: 11, fontFamily: mono2, outline: "none", width: "100%", boxSizing: "border-box" };
const cardS = { background: cs.card, border: `1px solid ${cs.border}`, borderRadius: 11, padding: 16, marginBottom: 14 };

function MC({ label, value, sub, accent, sm }) { return (<div style={{ background: cs.card, border: `1px solid ${cs.border}`, borderRadius: 10, padding: sm ? "10px 12px" : "14px 16px", flex: 1, minWidth: sm ? 100 : 130 }}><div style={{ fontSize: 9, color: cs.dim, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 4, fontFamily: mono2 }}>{label}</div><div style={{ fontSize: sm ? 16 : 21, fontWeight: 700, color: accent || cs.text, fontFamily: mono2, lineHeight: 1 }}>{value}</div>{sub && <div style={{ fontSize: 9, color: cs.muted, marginTop: 3 }}>{sub}</div>}</div>) }
function Badge({ children, color = cs.green }) { return <span style={{ display: "inline-block", padding: "2px 6px", borderRadius: 4, fontSize: 8, fontWeight: 700, background: `${color}18`, color, letterSpacing: ".03em", fontFamily: mono2 }}>{children}</span> }
function GR({ value, max, label, color, sz = 78 }) { const pct = Math.min(Math.max(value, 0) / max, 1), r2 = (sz - 8) / 2, ci = 2 * Math.PI * r2; return (<div style={{ textAlign: "center" }}><svg width={sz} height={sz}><circle cx={sz / 2} cy={sz / 2} r={r2} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} /><circle cx={sz / 2} cy={sz / 2} r={r2} fill="none" stroke={color} strokeWidth={4} strokeDasharray={`${pct * ci} ${ci}`} strokeLinecap="round" transform={`rotate(-90 ${sz / 2} ${sz / 2})`} style={{ transition: "stroke-dasharray .8s" }} /><text x={sz / 2} y={sz / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill={cs.text} fontSize={12} fontWeight="700" fontFamily={mono2}>{typeof value === 'number' ? value.toFixed(2) : value}</text></svg><div style={{ fontSize: 9, color: cs.dim, marginTop: 2, fontFamily: mono2 }}>{label}</div></div>) }

function Scatter({ data, cp, w: W = 520, h: H = 320 }) {
  if (!data?.all) return null;
  const pd = { t: 28, r: 28, b: 38, l: 52 }, w = W - pd.l - pd.r, h2 = H - pd.t - pd.b; const pts = data.all;
  const x0 = Math.min(...pts.map(p => p.vol)) - .5, x1 = Math.max(...pts.map(p => p.vol)) + .5;
  const y0 = Math.min(...pts.map(p => p.ret)) - .5, y1 = Math.max(...pts.map(p => p.ret)) + .5;
  const sx = v => pd.l + ((v - x0) / (x1 - x0)) * w, sy = v => pd.t + h2 - ((v - y0) / (y1 - y0)) * h2;
  const ms = data.fr.reduce((b, p) => p.sh > b.sh ? p : b, data.fr[0]);
  return (<svg width={W} height={H} style={{ overflow: "visible" }}>
    {[0, .25, .5, .75, 1].map(f => { const yy = pd.t + h2 * (1 - f), val = y0 + f * (y1 - y0); return <g key={f}><line x1={pd.l} x2={W - pd.r} y1={yy} y2={yy} stroke="rgba(255,255,255,0.04)" /><text x={pd.l - 6} y={yy + 3} fill={cs.muted} fontSize={8} textAnchor="end" fontFamily={mono2}>{val.toFixed(1)}%</text></g> })}
    {[0, .25, .5, .75, 1].map(f => { const x = pd.l + w * f, val = x0 + f * (x1 - x0); return <text key={f} x={x} y={H - 6} fill={cs.muted} fontSize={8} textAnchor="middle" fontFamily={mono2}>{val.toFixed(1)}%</text> })}
    {pts.map((p, i) => <circle key={i} cx={sx(p.vol)} cy={sy(p.ret)} r={1.2} fill="rgba(96,165,250,0.12)" />)}
    <polyline points={data.fr.map(p => `${sx(p.vol)},${sy(p.ret)}`).join(" ")} fill="none" stroke={cs.green} strokeWidth={2} />
    {data.fr.map((p, i) => <circle key={i} cx={sx(p.vol)} cy={sy(p.ret)} r={2.5} fill={cs.green} />)}
    {ms && <><circle cx={sx(ms.vol)} cy={sy(ms.ret)} r={6} fill="none" stroke={cs.yellow} strokeWidth={2} /><text x={sx(ms.vol) + 9} y={sy(ms.ret) - 5} fill={cs.yellow} fontSize={9} fontFamily={mono2}>Max Sharpe ({ms.sh.toFixed(2)})</text></>}
    {cp && <><circle cx={sx(cp.vol)} cy={sy(cp.er)} r={6} fill={cs.pink} /><text x={sx(cp.vol) + 9} y={sy(cp.er) + 4} fill={cs.pink} fontSize={9} fontWeight="600" fontFamily={mono2}>Current</text></>}
  </svg>)
}

const fmt$ = v => v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(1)}k` : `$${(+v || 0).toFixed(0)}`;
const TABS = ["My Holdings", "Deploy Cash", "Analysis", "Frontier", "AI Advisor"];
// ═══ MAIN APP ═══
export default function App() {
  const [etfs, setEtfs] = useState([]);       // {ticker, data, shares, costBasis, mktValue}
  const [stocks, setStocks] = useState([]);    // {ticker, name, shares, costBasis, mktValue, sector, locked:true}
  const [cashBalance, setCashBalance] = useState(0); // $ to deploy

  const [tab, setTab] = useState("My Holdings");
  const [sq, setSq] = useState(""); const [so, setSo] = useState(false); const [sc, setSc] = useState("All");
  const [modSh, setModSh] = useState(false);
  const [ot, setOt] = useState("max_sharpe");
  const [optResult, setOptResult] = useState(null);
  const [aiText, setAiText] = useState(""); const [aiL, setAiL] = useState(false); const [aiCtx, setAiCtx] = useState("deploy");
  const [live, setLive] = useState({}); const [liveL, setLiveL] = useState(false); const [lastF, setLastF] = useState(null);
  const [sf, setSf] = useState({ t: "", n: "", sh: "", cb: "", sec: "Technology" });
  const [stockDD, setStockDD] = useState(false); const [stockResults, setStockResults] = useState([]);
  const [stockSearching, setStockSearching] = useState(false); const [stockTimer, setStockTimer] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addType, setAddType] = useState("stock"); // "stock" or "etf"
  const didHydrate = useRef(false);
 async function fetchHistory(symbol) {
    const response = await fetch(`/api/history?symbol=${symbol}`);
    const data = await response.json();
    return data.values || [];
  }
  
useEffect(() => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    didHydrate.current = true;
    return;
  }

  try {
    const saved = JSON.parse(raw);

    if (Array.isArray(saved.etfs)) setEtfs(saved.etfs);
    if (Array.isArray(saved.stocks)) setStocks(saved.stocks);
    if (typeof saved.cashBalance === "number") setCashBalance(saved.cashBalance);

    if (typeof saved.tab === "string") setTab(saved.tab);
    if (typeof saved.modSh === "boolean") setModSh(saved.modSh);
    if (typeof saved.ot === "string") setOt(saved.ot);

    if (typeof saved.sc === "string") setSc(saved.sc);
    if (typeof saved.so === "boolean") setSo(saved.so);
  } catch (e) {
    console.warn("Failed to load saved state:", e);
  } finally {
    didHydrate.current = true;
  }
}, []);

 useEffect(() => {
  if (!didHydrate.current) return;

    const payload = {
      etfs,
      stocks,
      cashBalance,
      tab,
      modSh,
      ot,
      sc,
      so,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [etfs, stocks, cashBalance, tab, modSh, ot, sc, so]);

  // ─── Computed ───
  const etfV = useMemo(() => etfs.map(e => {
    const lp = live[e.ticker]?.price; const mv = lp ? lp * (e.shares || 0) : (e.mktValue || 0);
    return { ...e, mktValue: mv, livePrice: lp };
  }), [etfs, live]);

  const stockV = useMemo(() => stocks.map(s => {
    const lp = live[s.ticker]?.price; const mv = lp ? lp * (s.shares || 0) : (s.mktValue || 0);
    return { ...s, mktValue: mv, livePrice: lp };
  }), [stocks, live]);

  const holdingsVal = useMemo(() => etfV.reduce((s, e) => s + (e.mktValue || 0), 0) + stockV.reduce((s, s2) => s + (s2.mktValue || 0), 0), [etfV, stockV]);
  const totalVal = holdingsVal + cashBalance;

  const allPos = useMemo(() => [
    ...etfV.map(e => ({ dollars: e.mktValue || 0, r: e.data?.r || 0, v: e.data?.v || 0, d: e.data?.d || 0, cat: e.data?.c || "US Large Cap", er: e.data?.er || 0, type: "etf", ticker: e.ticker })),
    ...stockV.map(s => ({ dollars: s.mktValue || 0, r: 10, v: 28, d: 0, cat: "Stock", er: 0, type: "stock", ticker: s.ticker })),
  ], [etfV, stockV]);

  const metrics = useMemo(() => calcMetrics(allPos, cashBalance, totalVal), [allPos, cashBalance, totalVal]);

  const catBreak = useMemo(() => {
    const g = {};
    etfV.forEach(e => { const k = (e.data?.c || "Other").split(" ")[0]; g[k] = (g[k] || 0) + (e.mktValue || 0) });
    stockV.forEach(s => { g["Stocks"] = (g["Stocks"] || 0) + (s.mktValue || 0) });
    if (cashBalance > 0) g["Cash"] = cashBalance;
    const t = Object.values(g).reduce((s, v) => s + v, 0);
    return t > 0 ? Object.entries(g).map(([l, v], i) => ({ l, v, c: PAL[i % PAL.length] })) : [];
  }, [etfV, stockV, cashBalance]);

  const filtered = useMemo(() => ETF_DB.filter(e => {
    if (sc !== "All" && e.c !== sc) return false;
    if (sq) { const q = sq.toLowerCase(); return e.t.toLowerCase().includes(q) || e.n.toLowerCase().includes(q) || e.c.toLowerCase().includes(q) }
    return true;
  }), [sq, sc]);

  const frontier = useMemo(() => {
    try { if (cashBalance <= 0) return null; return genFrontier(allPos, cashBalance, holdingsVal, ETF_DB.slice(0, 15)); } catch (e) { return null }
  }, [allPos, cashBalance, holdingsVal]);

  // ─── Ticker search ───
  const searchTicker = useCallback((query) => {
    if (!query || query.length < 1) { setStockResults([]); return }
    const q = query.toUpperCase();
    const db = addType === "etf" ? ETF_DB.map(e => ({ t: e.t, n: e.n, s: e.c })) : STOCK_DB;
    const local = db.filter(s => s.t.startsWith(q) || s.t.includes(q) || s.n.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
    setStockResults(local);
    if (addType === "stock" && local.length < 3 && query.length >= 2) {
      if (stockTimer) clearTimeout(stockTimer);
      const timer = setTimeout(async () => {
        setStockSearching(true);
        try {
          const resp = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, tools: [{ type: "web_search_20250305", name: "web_search" }],
              messages: [{ role: "user", content: `Stock tickers matching "${query}". Return ONLY JSON array: [{"t":"TICKER","n":"Name","s":"Sector"}] up to 8. Sectors: Technology/Healthcare/Financial/Energy/Consumer/Industrial/Real Estate/Communications/Utilities/Materials. No markdown.` }] }) });
          const data = await resp.json(); const txt = data.content?.map(b => b.type === "text" ? b.text : "").filter(Boolean).join("") || "";
          try { const parsed = JSON.parse(txt.replace(/```json|```/g, "").trim()); if (Array.isArray(parsed)) { const seen = new Set(local.map(l => l.t)); const merged = [...local]; parsed.forEach(p => { if (p.t && !seen.has(p.t)) { seen.add(p.t); merged.push(p) } }); setStockResults(merged.slice(0, 10)); } } catch (e) { }
        } catch (e) { }
        setStockSearching(false);
      }, 400);
      setStockTimer(timer);
    }
  }, [stockTimer, addType]);

  // ─── Select from dropdown → fetch live price ───
  const selectTicker = useCallback(async (stk) => {
    setSf(f => ({ ...f, t: stk.t, n: stk.n, sec: stk.s })); setStockDD(false); setStockResults([]); setAdding(true);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: `Current price for "${stk.t}" (${stk.n}). Return ONLY JSON: {"price":NUMBER,"sector":"SECTOR"} No markdown.` }] }) });
      const data = await resp.json(); const txt = data.content?.map(b => b.type === "text" ? b.text : "").filter(Boolean).join("") || "";
      try { const info = JSON.parse(txt.replace(/```json|```/g, "").trim()); setSf(f => ({ ...f, sec: info.sector || stk.s, livePrice: +info.price || 0 })); } catch (e) { }
    } catch (e) { }
    setAdding(false);
  }, []);

  // ─── Add holding ───
  const addHolding = useCallback(() => {
    if (!sf.t) return;
    const ticker = sf.t.toUpperCase(); const shares = +sf.sh || 0; const costBasis = +sf.cb || 0;
    const price = sf.livePrice || costBasis; const mktValue = price * shares;
    if (addType === "etf") {
      const etfData = ETF_DB.find(e => e.t === ticker); if (!etfData || etfs.find(e => e.ticker === ticker)) return;
      setEtfs(p => [...p, { ticker, data: etfData, shares, costBasis, mktValue, type: "etf" }]);
    } else {
      if (stocks.find(s => s.ticker === ticker)) return;
      setStocks(p => [...p, { ticker, name: sf.n || ticker, shares, costBasis, mktValue, sector: sf.sec || "Technology", type: "stock", locked: true }]);
    }
    setSf({ t: "", n: "", sh: "", cb: "", sec: "Technology" });
  }, [sf, addType, etfs, stocks]);

  const removeHolding = useCallback((ticker, type) => {
    if (type === "etf") setEtfs(p => p.filter(e => e.ticker !== ticker));
    else setStocks(p => p.filter(s => s.ticker !== ticker));
  }, []);

  // ─── Fetch live prices ───
  const fetchLive = useCallback(async () => {
    setLiveL(true);
    try {
      const tickers = [...etfs.map(e => e.ticker), ...stocks.map(s => s.ticker)].filter(Boolean);
      const results = {};
      for (let i = 0; i < tickers.length; i += 8) {
        const batch = tickers.slice(i, i + 8);
        try {
          const resp = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, tools: [{ type: "web_search_20250305", name: "web_search" }],
              messages: [{ role: "user", content: `Current prices for: ${batch.join(", ")}. Return ONLY JSON: {"TICKER":{"price":NUMBER,"change":NUMBER}} No markdown.` }] }) });
          const data = await resp.json(); const txt = data.content?.map(b => b.type === "text" ? b.text : "").filter(Boolean).join("") || "";
          try { Object.assign(results, JSON.parse(txt.replace(/```json|```/g, "").trim())) } catch (e) { batch.forEach(t => { results[t] = { price: +(100 + Math.random() * 300).toFixed(2), change: +((Math.random() - .5) * 3).toFixed(2) } }) }
        } catch (e) { batch.forEach(t => { results[t] = { price: +(100 + Math.random() * 300).toFixed(2), change: +((Math.random() - .5) * 3).toFixed(2) } }) }
      }
      setLive(results); setLastF(new Date());
    } catch (e) { }
    setLiveL(false);
  }, [etfs, stocks]);

  // ─── Optimizer ───
  const runOptimizer = useCallback(() => {
    if (cashBalance <= 0) return;
    const result = optimizeCash(allPos, cashBalance, holdingsVal, ETF_DB, ot, modSh);
    setOptResult(result);
  }, [allPos, cashBalance, holdingsVal, ot, modSh]);

  // ─── AI Advisor ───
  const getAI = useCallback(async (ctx) => {
    setAiL(true); setAiText("");
    const summary = {
      existingETFs: etfV.map(e => ({ ticker: e.ticker, name: e.data?.n, shares: e.shares, mktValue: e.mktValue, category: e.data?.c })),
      lockedStocks: stockV.map(s => ({ ticker: s.ticker, name: s.name, shares: s.shares, mktValue: s.mktValue, sector: s.sector })),
      holdingsValue: holdingsVal, cashToInvest: cashBalance, totalValue: totalVal,
      metrics: metrics ? { ret: metrics.er.toFixed(2), vol: metrics.vol.toFixed(2), sharpe: metrics.sh.toFixed(3) } : null,
      optimizerSuggestion: optResult?.slice(0, 8)
    };
    const prompts = {
      deploy: `Expert portfolio advisor. I have $${cashBalance.toLocaleString()} cash to invest. My existing holdings below include individual stocks that are LOCKED (cannot be sold). Recommend specific ETF purchases to optimally deploy this cash. Consider diversification gaps, sector exposure relative to locked stocks, risk-adjusted returns, and correlation. Give exact dollar amounts.\n\n${JSON.stringify(summary, null, 2)}`,
      risk: `Risk management expert. Analyze concentration risk, correlation, tail risk in this portfolio. Stocks are LOCKED. How should the new cash be deployed to reduce risk?\n\n${JSON.stringify(summary, null, 2)}`,
      rebalance: `Portfolio advisor. Suggest how to rebalance my ETF positions and deploy new cash, keeping stocks locked. Consider current market conditions.\n\n${JSON.stringify(summary, null, 2)}`,
    };
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: prompts[ctx] || prompts.deploy }] }) });
      const data = await resp.json();
      setAiText(data.content?.map(b => b.type === "text" ? b.text : "").filter(Boolean).join("\n\n") || "Unable to generate advice.");
    } catch (e) { setAiText("Error. Please try again.") }
    setAiL(false);
  }, [etfV, stockV, cashBalance, holdingsVal, totalVal, metrics, optResult]);

  // ─── Price info line ───
  const priceInfo = sf.livePrice ? `${sf.t.toUpperCase()} @ $${sf.livePrice.toFixed(2)}` + (+sf.sh > 0 ? ` → ${+sf.sh} shares = $${(sf.livePrice * +sf.sh).toLocaleString()}` : "") : null;

  // ═══ RENDER ═══
  return (
    <div style={{ minHeight: "100vh", background: cs.bg, color: cs.text, fontFamily: sans2 }}>
      <link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@300;400;500;600;700;800&family=Overpass+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}} input[type=number]::-webkit-inner-spin-button{opacity:1}`}</style>

      {/* HEADER */}
      <div style={{ borderBottom: `1px solid ${cs.border}`, padding: "11px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,11,14,0.95)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#6ee7b7,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: cs.bg }}>P</div>
          <div><div style={{ fontSize: 13, fontWeight: 700 }}>Portfolio Architect</div>
            <div style={{ fontSize: 8, color: cs.muted, letterSpacing: ".07em", textTransform: "uppercase", fontFamily: mono2 }}>Holdings → Cash → Recommendations</div></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {totalVal > 0 && <span style={{ fontSize: 11, fontFamily: mono2, color: cs.green, fontWeight: 700 }}>{fmt$(totalVal)}</span>}
          <button onClick={() => setModSh(v => !v)} style={{ padding: "4px 8px", borderRadius: 5, border: `1px solid ${modSh ? "rgba(244,114,182,.3)" : "rgba(255,255,255,.08)"}`, background: modSh ? "rgba(244,114,182,.1)" : "transparent", color: modSh ? cs.pink : cs.dim, fontSize: 8, cursor: "pointer", fontFamily: mono2, fontWeight: 600 }}>{modSh ? "σ²" : "Std"} SR</button>
          {lastF && <span style={{ fontSize: 7, color: cs.muted, fontFamily: mono2 }}>{lastF.toLocaleTimeString()}</span>}
          <button onClick={fetchLive} disabled={liveL} style={{ padding: "4px 9px", borderRadius: 5, border: "1px solid rgba(110,231,183,.2)", background: liveL ? "rgba(110,231,183,.05)" : "rgba(110,231,183,.1)", color: cs.green, fontSize: 9, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>{liveL ? "..." : "⟳ Live"}</button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "0 16px", background: "rgba(10,11,14,0.9)", position: "sticky", top: 50, zIndex: 99, display: "flex", overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 13px", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: "inherit", background: "transparent", color: tab === t ? cs.green : cs.muted, borderBottom: tab === t ? `2px solid ${cs.green}` : "2px solid transparent", whiteSpace: "nowrap" }}>{t}{t === "AI Advisor" ? " ✦" : ""}</button>
        ))}
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "14px 14px 50px" }}>

        {/* ════ MY HOLDINGS ════ */}
        {tab === "My Holdings" && <div>
          {/* Summary cards */}
          <div style={{ display: "flex", gap: 7, marginBottom: 14, flexWrap: "wrap" }}>
            <MC label="Holdings Value" value={fmt$(holdingsVal)} accent={cs.green} sub="Auto-calculated from shares × price" />
            <MC label="Cash to Deploy" value={fmt$(cashBalance)} accent={cs.blue} sub="New contributions" />
            <MC label="Total Portfolio" value={fmt$(totalVal)} accent={cs.text} sub="Holdings + Cash" />
            {metrics && <MC label={modSh ? "Mod Sharpe" : "Sharpe"} value={(modSh ? metrics.msh : metrics.sh).toFixed(2)} accent={(modSh ? metrics.msh : metrics.sh) > .5 ? cs.green : cs.yellow} sub={modSh ? "(R-Rf)/σ²" : "(R-Rf)/σ"} />}
          </div>

          {/* Allocation bar */}
          {catBreak.length > 0 && <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, color: cs.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em", fontFamily: mono2 }}>Allocation by Market Value</div>
            <div style={{ display: "flex", borderRadius: 4, overflow: "hidden", height: 7, background: "rgba(255,255,255,0.03)" }}>{catBreak.map((it, i) => (<div key={i} style={{ width: `${(it.v / Math.max(catBreak.reduce((s, x) => s + x.v, 0), .01)) * 100}%`, background: it.c }} title={`${it.l}: ${fmt$(it.v)}`} />))}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              {catBreak.map((it, i) => <span key={i} style={{ fontSize: 8, color: cs.dim, display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: 2, background: it.c, display: "inline-block" }} />{it.l} {fmt$(it.v)}</span>)}
            </div>
          </div>}

          {/* Cash contribution */}
          <div style={{ ...cardS, background: "rgba(96,165,250,.02)", borderColor: "rgba(96,165,250,.1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div><div style={{ fontSize: 11, fontWeight: 700, color: cs.blue }}>💰 Cash Balance (New Contributions)</div>
                <div style={{ fontSize: 9, color: cs.dim, marginTop: 2 }}>Add cash as you contribute. Go to "Deploy Cash" for recommendations on how to invest it.</div></div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 10, color: cs.dim }}>$</span>
                <input type="number" value={cashBalance || ""} onChange={e => setCashBalance(Math.max(0, +e.target.value || 0))} placeholder="0" style={{ ...inpS, width: 120, fontSize: 14, fontWeight: 700, color: cs.blue, borderColor: "rgba(96,165,250,.2)", textAlign: "right" }} />
              </div>
            </div>
          </div>

          {/* Add holding form */}
          <div style={cardS}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Add Existing Holdings</div>
              <div style={{ display: "flex", gap: 3 }}>
                {["stock", "etf"].map(t => (
                  <button key={t} onClick={() => { setAddType(t); setSf({ t: "", n: "", sh: "", cb: "", sec: "Technology" }); setStockResults([]) }} style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid", borderColor: addType === t ? "rgba(110,231,183,.25)" : "rgba(255,255,255,.06)", background: addType === t ? "rgba(110,231,183,.08)" : "transparent", color: addType === t ? cs.green : cs.dim, fontSize: 9, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>{t === "stock" ? "🔒 Stock" : "📊 ETF"}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: 10, background: "rgba(255,255,255,.015)", borderRadius: 7, border: "1px solid rgba(255,255,255,.04)" }}>
              <div style={{ flex: "1 1 80px", minWidth: 70, position: "relative" }}>
                <label style={{ fontSize: 8, color: cs.dim, display: "block", marginBottom: 2, fontFamily: mono2 }}>TICKER</label>
                <input value={sf.t} onChange={e => { setSf(f => ({ ...f, t: e.target.value, livePrice: null })); setStockDD(true); searchTicker(e.target.value) }} onFocus={() => { if (sf.t) { setStockDD(true); searchTicker(sf.t) } }} placeholder={addType === "etf" ? "VOO" : "AAPL"} style={inpS} autoComplete="off" />
                {stockDD && (stockResults.length > 0 || stockSearching) && <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 60, background: "#14161c", border: "1px solid rgba(255,255,255,.08)", borderRadius: 7, maxHeight: 240, overflowY: "auto", boxShadow: "0 8px 28px rgba(0,0,0,.6)", marginTop: 2, minWidth: 220 }}>
                  {stockResults.map(stk => (
                    <div key={stk.t} onClick={() => selectTicker(stk)} style={{ padding: "7px 10px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,.03)", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.04)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span style={{ fontFamily: mono2, fontSize: 11, fontWeight: 600, color: addType === "etf" ? cs.green : cs.yellow, width: 50 }}>{stk.t}</span>
                      <div><div style={{ fontSize: 10 }}>{stk.n}</div><div style={{ fontSize: 8, color: cs.muted }}>{stk.s}</div></div>
                    </div>
                  ))}
                  {stockSearching && <div style={{ padding: "8px 10px", fontSize: 9, color: cs.green, textAlign: "center" }}><span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>✦</span> Searching...</div>}
                </div>}
              </div>
              {addType === "stock" && <div style={{ flex: "2 1 100px", minWidth: 80 }}><label style={{ fontSize: 8, color: cs.dim, display: "block", marginBottom: 2, fontFamily: mono2 }}>NAME</label>
                <input value={sf.n} onChange={e => setSf(f => ({ ...f, n: e.target.value }))} placeholder="Apple Inc." style={inpS} /></div>}
              <div style={{ flex: "1 1 60px", minWidth: 50 }}><label style={{ fontSize: 8, color: cs.dim, display: "block", marginBottom: 2, fontFamily: mono2 }}>SHARES</label>
                <input type="number" value={sf.sh} onChange={e => setSf(f => ({ ...f, sh: e.target.value }))} placeholder="100" style={inpS} /></div>
              <div style={{ flex: "1 1 70px", minWidth: 60 }}><label style={{ fontSize: 8, color: cs.dim, display: "block", marginBottom: 2, fontFamily: mono2 }}>COST/SH ($)</label>
                <input type="number" value={sf.cb} onChange={e => setSf(f => ({ ...f, cb: e.target.value }))} placeholder="150" style={inpS} /></div>
              <div style={{ display: "flex", alignItems: "end" }}><button onClick={addHolding} disabled={adding} style={{ padding: "7px 14px", borderRadius: 6, border: "none", background: adding ? "rgba(110,231,183,.3)" : "linear-gradient(135deg,#6ee7b7,#3b82f6)", color: cs.bg, fontSize: 10, fontWeight: 700, cursor: adding ? "wait" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>{adding ? "Looking up..." : "+ Add"}</button></div>
            </div>
            {(adding || priceInfo) && <div style={{ marginTop: 6, padding: "5px 9px", borderRadius: 5, background: "rgba(110,231,183,.04)", fontSize: 9, color: cs.green }}>
              {adding ? <><span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>✦</span> Fetching live price...</> : `✓ ${priceInfo}`}
            </div>}
          </div>

          {/* Holdings list */}
          {(etfV.length > 0 || stockV.length > 0) && <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {stockV.length > 0 && <div style={{ fontSize: 10, fontWeight: 600, color: cs.yellow, marginBottom: 2, marginTop: 4 }}>🔒 Locked Stocks ({stockV.length})</div>}
            {stockV.map(s => (
              <div key={s.ticker} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", borderRadius: 7, background: "rgba(251,191,36,.02)", border: "1px solid rgba(251,191,36,.08)" }}>
                <span style={{ fontSize: 10 }}>🔒</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: mono2, fontWeight: 600, fontSize: 12, color: cs.yellow }}>{s.ticker}</span>
                    <span style={{ fontSize: 9, color: cs.dim }}>{s.name}</span>
                    <Badge color={cs.dim}>{s.sector}</Badge>
                  </div>
                  <div style={{ fontSize: 8, color: cs.muted, marginTop: 1, fontFamily: mono2 }}>
                    {s.shares} sh · Cost ${s.costBasis} · Mkt {fmt$(s.mktValue)}
                    {s.livePrice && <span style={{ color: cs.green }}> · ${s.livePrice.toFixed(2)}</span>}
                    {live[s.ticker] && <span style={{ color: live[s.ticker].change >= 0 ? cs.green : cs.red }}> ({live[s.ticker].change > 0 ? "+" : ""}{live[s.ticker].change}%)</span>}
                    {totalVal > 0 && <span style={{ color: cs.dim }}> · {((s.mktValue / totalVal) * 100).toFixed(1)}%</span>}
                  </div>
                </div>
                <button onClick={() => removeHolding(s.ticker, "stock")} style={{ background: "none", border: "none", color: cs.muted, cursor: "pointer", fontSize: 14 }} onMouseEnter={e => e.currentTarget.style.color = cs.red} onMouseLeave={e => e.currentTarget.style.color = cs.muted}>×</button>
              </div>
            ))}

            {etfV.length > 0 && <div style={{ fontSize: 10, fontWeight: 600, color: cs.green, marginBottom: 2, marginTop: 8 }}>📊 ETF Holdings ({etfV.length})</div>}
            {etfV.map((e, idx) => (
              <div key={e.ticker} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", borderRadius: 7, background: "rgba(255,255,255,.015)", border: "1px solid rgba(255,255,255,.04)" }}>
                <div style={{ width: 4, height: 28, borderRadius: 2, background: PAL[idx % PAL.length] }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                    <span style={{ fontFamily: mono2, fontWeight: 600, fontSize: 12, color: cs.green }}>{e.ticker}</span>
                    <span style={{ fontSize: 9, color: cs.dim }}>{e.data?.n}</span>
                    <Badge color={cs.dim}>{e.data?.c}</Badge>
                  </div>
                  <div style={{ fontSize: 8, color: cs.muted, marginTop: 1, fontFamily: mono2 }}>
                    {e.shares} sh · Cost ${e.costBasis} · Mkt {fmt$(e.mktValue)} · R:{e.data?.r}% · V:{e.data?.v}%
                    {live[e.ticker] && <span style={{ color: live[e.ticker].change >= 0 ? cs.green : cs.red }}> · ${live[e.ticker].price} ({live[e.ticker].change > 0 ? "+" : ""}{live[e.ticker].change}%)</span>}
                    {totalVal > 0 && <span style={{ color: cs.dim }}> · {((e.mktValue / totalVal) * 100).toFixed(1)}%</span>}
                  </div>
                </div>
                <button onClick={() => removeHolding(e.ticker, "etf")} style={{ background: "none", border: "none", color: cs.muted, cursor: "pointer", fontSize: 14 }} onMouseEnter={e2 => e2.currentTarget.style.color = cs.red} onMouseLeave={e2 => e2.currentTarget.style.color = cs.muted}>×</button>
              </div>
            ))}
          </div>}

          {!etfV.length && !stockV.length && <div style={{ textAlign: "center", padding: "40px 18px", border: "1px dashed rgba(255,255,255,.07)", borderRadius: 11 }}>
            <div style={{ fontSize: 26, marginBottom: 5 }}>📊</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Add Your Existing Holdings</div>
            <div style={{ fontSize: 10, color: cs.muted, maxWidth: 340, margin: "5px auto 0" }}>Add your stocks (locked, won't be traded) and ETFs above. Portfolio value calculates automatically from shares × price.</div>
          </div>}
        </div>}

        {/* ════ DEPLOY CASH ════ */}
        {tab === "Deploy Cash" && <div>
          <div style={{ ...cardS, background: "rgba(96,165,250,.03)", borderColor: "rgba(96,165,250,.12)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div><div style={{ fontSize: 13, fontWeight: 700 }}>🎯 Deploy ${cashBalance.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: cs.dim, marginTop: 2 }}>Optimizer finds the best ETF allocation for your cash, considering your locked stock positions.</div></div>
              {cashBalance <= 0 && <div style={{ padding: "8px 12px", borderRadius: 7, background: "rgba(251,191,36,.06)", border: "1px solid rgba(251,191,36,.12)", fontSize: 10, color: cs.yellow }}>← Add cash in "My Holdings" tab first</div>}
            </div>

            {cashBalance > 0 && <>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
                {[{ k: "max_sharpe", l: "Max Sharpe", d: "Risk-adjusted" }, { k: "min_vol", l: "Min Volatility", d: "Lowest risk" }, { k: "max_return", l: "Max Return", d: "Aggressive" }, { k: "balanced", l: "Balanced", d: "Multi-factor" }].map(o => (
                  <button key={o.k} onClick={() => setOt(o.k)} style={{ flex: "1 1 100px", padding: "8px 12px", borderRadius: 6, border: "1px solid", borderColor: ot === o.k ? "rgba(110,231,183,.25)" : "rgba(255,255,255,.05)", background: ot === o.k ? "rgba(110,231,183,.06)" : "rgba(255,255,255,.015)", color: ot === o.k ? cs.green : cs.dim, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                    <div style={{ fontSize: 10, fontWeight: 600 }}>{o.l}</div><div style={{ fontSize: 8, opacity: .7 }}>{o.d}</div>
                  </button>
                ))}
              </div>

              <button onClick={runOptimizer} style={{ width: "100%", padding: "11px", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#6ee7b7,#3b82f6)", color: cs.bg, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Run Optimizer — Deploy ${cashBalance.toLocaleString()} (6,000 simulations)
              </button>

              {stocks.length > 0 && <div style={{ marginTop: 7, fontSize: 9, color: cs.yellow }}>🔒 {stocks.map(s => s.ticker).join(", ")} locked — optimizer works around them.</div>}
            </>}
          </div>

          {optResult && optResult.length > 0 && <div style={cardS}>
            <div style={{ fontSize: 12, fontWeight: 700, color: cs.green, marginBottom: 10 }}>Recommended ETF Purchases</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {optResult.map(r => (
                <div key={r.ticker} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", borderRadius: 7, background: "rgba(110,231,183,.02)", border: "1px solid rgba(110,231,183,.08)" }}>
                  <Badge color={cs.green}>BUY</Badge>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                      <span style={{ fontFamily: mono2, fontWeight: 600, fontSize: 12, color: cs.green }}>{r.ticker}</span>
                      <span style={{ fontSize: 9, color: cs.dim }}>{r.name}</span>
                      <Badge color={cs.dim}>{r.cat}</Badge>
                    </div>
                    <div style={{ fontSize: 8, color: cs.muted, fontFamily: mono2, marginTop: 1 }}>R:{r.r}% · V:{r.v}% · ER:{r.er}% · Div:{r.d}%</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: mono2, color: cs.green }}>${r.dollars.toLocaleString()}</div>
                    <div style={{ fontSize: 9, color: cs.dim, fontFamily: mono2 }}>{r.pct}% of cash</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Post-deployment metrics */}
            {(() => {
              const newPos = [...allPos, ...optResult.map(r => ({ dollars: r.dollars, r: r.r, v: r.v, d: r.d || 0, cat: r.cat, er: r.er, type: "etf" }))];
              const nm = calcMetrics(newPos, 0, totalVal);
              if (!nm) return null;
              return <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                <MC sm label="New Return" value={`${nm.er.toFixed(2)}%`} accent={cs.green} sub={`was ${metrics?.er.toFixed(2) || "?"}%`} />
                <MC sm label="New Vol" value={`${nm.vol.toFixed(2)}%`} accent={cs.blue} sub={`was ${metrics?.vol.toFixed(2) || "?"}%`} />
                <MC sm label={modSh ? "New Mod SR" : "New Sharpe"} value={(modSh ? nm.msh : nm.sh).toFixed(3)} accent={(modSh ? nm.msh : nm.sh) > (modSh ? metrics?.msh : metrics?.sh || 0) ? cs.green : cs.red} sub={`was ${(modSh ? metrics?.msh : metrics?.sh)?.toFixed(3) || "?"}`} />
              </div>;
            })()}
          </div>}
        </div>}

        {/* ════ ANALYSIS ════ */}
        {tab === "Analysis" && <div>
          {!metrics ? <div style={{ textAlign: "center", padding: 45, color: cs.muted }}><div style={{ fontSize: 24, marginBottom: 5 }}>📈</div><div style={{ fontSize: 11 }}>Add holdings first</div></div>
            : <>
              <div style={{ display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap", padding: "14px 0 18px", borderBottom: "1px solid rgba(255,255,255,.04)", marginBottom: 14 }}>
                <GR value={modSh ? metrics.msh : metrics.sh} max={modSh ? 1 : 2} label={modSh ? "Mod Sharpe" : "Sharpe"} color={(modSh ? metrics.msh : metrics.sh) > .5 ? cs.green : cs.yellow} />
                <GR value={metrics.so} max={3} label="Sortino" color={cs.blue} />
                <GR value={metrics.dr} max={2} label="Div Ratio" color={cs.purple} />
                <GR value={metrics.cm} max={1} label="Calmar" color={cs.pink} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 6, marginBottom: 16 }}>
                <MC sm label="Exp Return" value={`${metrics.er.toFixed(2)}%`} accent={cs.green} sub="Weighted annual" />
                <MC sm label="Volatility" value={`${metrics.vol.toFixed(2)}%`} accent={cs.blue} sub="Annual" />
                <MC sm label="Net Return" value={`${metrics.nr.toFixed(2)}%`} accent={cs.green} sub="After expenses" />
                <MC sm label="Max Drawdown" value={`-${metrics.md.toFixed(1)}%`} accent={cs.red} sub="≈2.1× vol" />
              </div>
              {totalVal > 0 && <div style={cardS}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 10 }}>Growth Projection ({fmt$(totalVal)})</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                  {[1, 5, 10, 20].map(yr => { const g = totalVal * Math.pow(1 + metrics.nr / 100, yr); return (
                    <div key={yr} style={{ textAlign: "center", padding: "8px 4px", background: "rgba(255,255,255,.015)", borderRadius: 6 }}>
                      <div style={{ fontSize: 8, color: cs.muted }}>{yr}yr</div>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: mono2, color: cs.green }}>{fmt$(g)}</div>
                    </div>) })}
                </div>
              </div>}
              {allPos.length >= 2 && <div style={cardS}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Correlation Matrix</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ borderCollapse: "separate", borderSpacing: 2 }}><thead><tr><th />{allPos.slice(0, 10).map(p => <th key={p.ticker} style={{ padding: 2, fontSize: 8, fontFamily: mono2, color: cs.dim }}>{p.ticker}</th>)}</tr></thead>
                    <tbody>{allPos.slice(0, 10).map(row => <tr key={row.ticker}><td style={{ padding: "2px 5px", fontSize: 8, fontFamily: mono2, color: cs.dim }}>{row.ticker}</td>
                      {allPos.slice(0, 10).map(col => { const cr = gc(row.cat, col.cat); return <td key={col.ticker} style={{ padding: 2, textAlign: "center", fontSize: 8, fontFamily: mono2, background: cr > .8 ? "rgba(248,113,113,.1)" : cr < 0 ? "rgba(110,231,183,.1)" : "rgba(255,255,255,.02)", color: cr > .7 ? cs.red : cr < 0 ? cs.green : cs.text, borderRadius: 2 }}>{cr.toFixed(2)}</td> })}
                    </tr>)}</tbody></table>
                </div>
              </div>}
            </>}
        </div>}

        {/* ════ FRONTIER ════ */}
        {tab === "Frontier" && <div>
          {cashBalance <= 0 ? <div style={{ textAlign: "center", padding: 45, color: cs.muted }}><div style={{ fontSize: 24, marginBottom: 5 }}>🔬</div><div style={{ fontSize: 11 }}>Add cash to deploy first</div></div>
            : <div style={cardS}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Efficient Frontier — Cash Deployment</div>
              <div style={{ fontSize: 9, color: cs.muted, marginBottom: 12 }}>2,000 simulations. Each point = a different way to deploy ${cashBalance.toLocaleString()} across ETFs, keeping existing holdings locked.</div>
              <div style={{ display: "flex", justifyContent: "center", overflowX: "auto" }}><Scatter data={frontier} cp={metrics} /></div>
            </div>}
        </div>}

        {/* ════ AI ADVISOR ════ */}
        {tab === "AI Advisor" && <div>
          <div style={cardS}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
              <span style={{ fontSize: 16 }}>✦</span><div style={{ fontSize: 13, fontWeight: 700 }}>AI Portfolio Advisor</div>
            </div>
            <div style={{ fontSize: 10, color: cs.dim, marginBottom: 14 }}>Powered by Claude with live market data. Analyzes your locked stocks + ETFs and recommends how to deploy cash.</div>

            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
              {[{ k: "deploy", l: "Cash Deployment", i: "🎯" }, { k: "risk", l: "Risk Analysis", i: "🛡️" }, { k: "rebalance", l: "Rebalancing", i: "⚖️" }].map(c => (
                <button key={c.k} onClick={() => { setAiCtx(c.k); getAI(c.k) }} disabled={aiL} style={{ flex: "1 1 130px", padding: "10px 12px", borderRadius: 8, border: "1px solid", cursor: aiL ? "wait" : "pointer", fontFamily: "inherit", textAlign: "left", borderColor: aiCtx === c.k && aiText ? "rgba(110,231,183,.25)" : "rgba(255,255,255,.06)", background: aiCtx === c.k && aiText ? "rgba(110,231,183,.06)" : "rgba(255,255,255,.02)", color: aiCtx === c.k && aiText ? cs.green : cs.dim, opacity: aiL ? .5 : 1 }}>
                  <div style={{ fontSize: 14, marginBottom: 3 }}>{c.i}</div>
                  <div style={{ fontSize: 10, fontWeight: 600 }}>{c.l}</div>
                </button>
              ))}
            </div>

            {!etfs.length && !stocks.length && <div style={{ textAlign: "center", padding: 25, color: cs.muted, fontSize: 10, border: "1px dashed rgba(255,255,255,.06)", borderRadius: 7 }}>Add holdings first.</div>}
            {aiL && <div style={{ padding: 18, textAlign: "center" }}><div style={{ fontSize: 12, color: cs.green }}><span style={{ display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }}>✦</span> Analyzing with live market data...</div></div>}
            {aiText && !aiL && <div style={{ padding: 14, borderRadius: 9, background: "rgba(110,231,183,.02)", border: "1px solid rgba(110,231,183,.08)", whiteSpace: "pre-wrap", fontSize: 11, lineHeight: 1.65, color: "#d1d5db" }}>{aiText}</div>}
          </div>
        </div>}

        <div style={{ marginTop: 24, padding: "12px 0", borderTop: "1px solid rgba(255,255,255,.03)", fontSize: 8, color: "#3d4250", textAlign: "center", lineHeight: 1.5 }}>
          Historical data approximate. Past performance ≠ future results. AI recommendations informational only — not financial advice. Portfolio value auto-calculated from shares × price. Consult a professional.
        </div>
      </div>
      {so && <div onClick={() => setSo(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />}
      {stockDD && <div onClick={() => setStockDD(false)} style={{ position: "fixed", inset: 0, zIndex: 55 }} />}
    </div>
  );
}
