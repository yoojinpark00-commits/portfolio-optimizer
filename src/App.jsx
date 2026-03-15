import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";

const STORAGE_KEY = "etf_optimizer_state_v1";

const ETF_DB = [
  // ── US Broad Market ──
  {t:"SPY",n:"SPDR S&P 500",c:"US Large Cap",h:503,er:.09,r:10.5,v:15.2,d:1.3},
  {t:"VOO",n:"Vanguard S&P 500",c:"US Large Cap",h:503,er:.03,r:10.6,v:15.1,d:1.4},
  {t:"VTI",n:"Vanguard Total Market",c:"US Total Mkt",h:3794,er:.03,r:10.2,v:15.5,d:1.4},
  {t:"IVV",n:"iShares Core S&P 500",c:"US Large Cap",h:503,er:.03,r:10.5,v:15.1,d:1.3},
  {t:"ITOT",n:"iShares Core Total US",c:"US Total Mkt",h:3700,er:.03,r:10.1,v:15.4,d:1.3},
  {t:"SPTM",n:"SPDR Total Market",c:"US Total Mkt",h:3600,er:.03,r:10.0,v:15.5,d:1.3},
  {t:"SCHB",n:"Schwab Broad Market",c:"US Total Mkt",h:2500,er:.03,r:10.1,v:15.5,d:1.4},
  {t:"SCHX",n:"Schwab Large Cap",c:"US Large Cap",h:750,er:.03,r:10.4,v:15.1,d:1.4},
  {t:"SPLG",n:"SPDR S&P 500 Low Cost",c:"US Large Cap",h:503,er:.02,r:10.5,v:15.2,d:1.3},
  {t:"RSP",n:"Invesco Equal Weight S&P",c:"US Large Cap",h:503,er:.20,r:9.5,v:16.0,d:1.5},
  // ── US Growth ──
  {t:"QQQ",n:"Invesco QQQ Trust",c:"US Growth",h:101,er:.20,r:14.8,v:20.1,d:.5},
  {t:"QQQM",n:"Invesco QQQ Mini",c:"US Growth",h:101,er:.15,r:14.8,v:20.1,d:.5},
  {t:"VUG",n:"Vanguard Growth",c:"US Growth",h:209,er:.04,r:13.5,v:18.2,d:.5},
  {t:"IWF",n:"iShares R1000 Growth",c:"US Growth",h:421,er:.19,r:13.2,v:17.8,d:.6},
  {t:"SCHG",n:"Schwab US Large Growth",c:"US Growth",h:250,er:.04,r:13.8,v:18.5,d:.4},
  {t:"MGK",n:"Vanguard Mega Cap Growth",c:"US Growth",h:70,er:.07,r:14.2,v:19.0,d:.4},
  {t:"SPYG",n:"SPDR S&P 500 Growth",c:"US Growth",h:230,er:.04,r:13.0,v:17.5,d:.6},
  {t:"VONG",n:"Vanguard Russell 1000 Growth",c:"US Growth",h:420,er:.08,r:13.3,v:17.9,d:.5},
  // ── US Value ──
  {t:"VTV",n:"Vanguard Value",c:"US Value",h:346,er:.04,r:8.3,v:14.5,d:2.4},
  {t:"IWD",n:"iShares R1000 Value",c:"US Value",h:842,er:.19,r:8.1,v:14.2,d:2.1},
  {t:"SCHV",n:"Schwab US Large Value",c:"US Value",h:350,er:.04,r:8.2,v:14.3,d:2.3},
  {t:"SPYV",n:"SPDR S&P 500 Value",c:"US Value",h:430,er:.04,r:7.9,v:14.0,d:2.2},
  {t:"VONV",n:"Vanguard Russell 1000 Value",c:"US Value",h:840,er:.08,r:8.0,v:14.1,d:2.2},
  {t:"RPV",n:"Invesco S&P 500 Pure Value",c:"US Value",h:120,er:.35,r:7.5,v:17.5,d:2.5},
  // ── US Mid Cap ──
  {t:"VO",n:"Vanguard Mid-Cap",c:"US Mid Cap",h:348,er:.04,r:9.5,v:16.8,d:1.5},
  {t:"IJH",n:"iShares Core Mid-Cap",c:"US Mid Cap",h:400,er:.05,r:9.2,v:16.5,d:1.4},
  {t:"MDY",n:"SPDR S&P MidCap 400",c:"US Mid Cap",h:400,er:.23,r:9.1,v:16.6,d:1.3},
  {t:"SCHM",n:"Schwab Mid-Cap",c:"US Mid Cap",h:500,er:.04,r:9.3,v:16.7,d:1.4},
  // ── US Small Cap ──
  {t:"IWM",n:"iShares Russell 2000",c:"US Small Cap",h:1974,er:.19,r:7.8,v:20.5,d:1.2},
  {t:"VB",n:"Vanguard Small-Cap",c:"US Small Cap",h:1384,er:.05,r:8.2,v:19.8,d:1.4},
  {t:"SCHA",n:"Schwab US Small Cap",c:"US Small Cap",h:1750,er:.04,r:8.0,v:20.0,d:1.3},
  {t:"IJR",n:"iShares Core Small-Cap",c:"US Small Cap",h:600,er:.06,r:8.5,v:19.5,d:1.5},
  {t:"VBK",n:"Vanguard Small Growth",c:"US Small Cap",h:620,er:.07,r:8.8,v:22.0,d:.4},
  {t:"VBR",n:"Vanguard Small Value",c:"US Small Cap",h:860,er:.07,r:7.5,v:19.0,d:2.0},
  // ── Dividend / Income ──
  {t:"VIG",n:"Vanguard Div Appreciation",c:"US Dividend",h:315,er:.06,r:9.8,v:13.1,d:1.8},
  {t:"VYM",n:"Vanguard High Div Yield",c:"US Dividend",h:536,er:.06,r:8.5,v:13.8,d:2.9},
  {t:"SCHD",n:"Schwab US Div Equity",c:"US Dividend",h:104,er:.06,r:11.1,v:14.0,d:3.4},
  {t:"DVY",n:"iShares Select Dividend",c:"US Dividend",h:100,er:.38,r:7.5,v:14.5,d:3.5},
  {t:"HDV",n:"iShares Core High Div",c:"US Dividend",h:75,er:.08,r:8.0,v:13.5,d:3.8},
  {t:"DGRO",n:"iShares Div Growth",c:"US Dividend",h:400,er:.08,r:9.5,v:13.5,d:2.2},
  {t:"NOBL",n:"ProShares Div Aristocrats",c:"US Dividend",h:67,er:.35,r:8.8,v:13.8,d:2.1},
  {t:"SPHD",n:"Invesco High Div Low Vol",c:"US Dividend",h:51,er:.30,r:7.0,v:12.5,d:4.0},
  {t:"JEPI",n:"JPMorgan Equity Premium",c:"US Dividend",h:120,er:.35,r:7.5,v:10.5,d:7.5},
  {t:"JEPQ",n:"JPMorgan Nasdaq Premium",c:"US Dividend",h:80,er:.35,r:9.0,v:14.0,d:9.0},
  // ── International ──
  {t:"VXUS",n:"Vanguard Total Intl",c:"International",h:8535,er:.07,r:5.2,v:16.0,d:3.1},
  {t:"IXUS",n:"iShares Core Total Intl",c:"International",h:4200,er:.07,r:5.1,v:16.0,d:2.9},
  {t:"VEA",n:"Vanguard Developed Mkts",c:"Intl Developed",h:4048,er:.05,r:5.8,v:15.2,d:3.0},
  {t:"VWO",n:"Vanguard Emerging Mkts",c:"Emerging Mkts",h:5795,er:.08,r:4.1,v:19.8,d:2.8},
  {t:"EFA",n:"iShares MSCI EAFE",c:"Intl Developed",h:783,er:.32,r:5.5,v:15.5,d:2.9},
  {t:"EEM",n:"iShares Emerging Mkts",c:"Emerging Mkts",h:1238,er:.68,r:3.8,v:20.5,d:2.2},
  {t:"IEFA",n:"iShares Core EAFE",c:"Intl Developed",h:2770,er:.07,r:5.6,v:15.3,d:2.8},
  {t:"IEMG",n:"iShares Core Emerging",c:"Emerging Mkts",h:2800,er:.09,r:4.0,v:19.5,d:2.5},
  {t:"SCHF",n:"Schwab Intl Equity",c:"Intl Developed",h:1500,er:.06,r:5.5,v:15.0,d:2.8},
  {t:"SCHE",n:"Schwab Emerging Mkts",c:"Emerging Mkts",h:1800,er:.11,r:4.0,v:19.8,d:2.5},
  {t:"VGK",n:"Vanguard FTSE Europe",c:"Intl Developed",h:1300,er:.08,r:5.0,v:16.5,d:3.2},
  {t:"VPL",n:"Vanguard FTSE Pacific",c:"Intl Developed",h:2400,er:.08,r:4.5,v:14.5,d:2.5},
  {t:"EWJ",n:"iShares MSCI Japan",c:"Intl Developed",h:225,er:.50,r:4.8,v:16.0,d:1.8},
  {t:"MCHI",n:"iShares MSCI China",c:"Emerging Mkts",h:600,er:.59,r:2.5,v:26.0,d:1.5},
  {t:"INDA",n:"iShares MSCI India",c:"Emerging Mkts",h:130,er:.65,r:8.0,v:20.0,d:1.0},
  {t:"EWZ",n:"iShares MSCI Brazil",c:"Emerging Mkts",h:50,er:.59,r:3.0,v:32.0,d:5.0},
  {t:"KWEB",n:"KraneShares China Internet",c:"Emerging Mkts",h:40,er:.69,r:1.0,v:35.0,d:.2},
  // ── Sector ──
  {t:"XLK",n:"Tech Select Sector",c:"Sector Tech",h:65,er:.10,r:15.2,v:20.8,d:.7},
  {t:"XLV",n:"Healthcare Select",c:"Sector Health",h:62,er:.10,r:9.8,v:14.5,d:1.5},
  {t:"XLF",n:"Financial Select",c:"Sector Finance",h:73,er:.10,r:8.2,v:18.5,d:1.6},
  {t:"XLE",n:"Energy Select",c:"Sector Energy",h:34,er:.10,r:3.5,v:26.2,d:3.5},
  {t:"XLI",n:"Industrial Select",c:"Sector Indust",h:78,er:.10,r:9.1,v:16.2,d:1.4},
  {t:"XLY",n:"Consumer Discr Select",c:"Sector Consumer",h:51,er:.10,r:11.5,v:18.0,d:.8},
  {t:"XLP",n:"Consumer Staples Select",c:"Sector Consumer",h:35,er:.10,r:7.5,v:11.5,d:2.5},
  {t:"XLU",n:"Utilities Select",c:"Sector Utilities",h:31,er:.10,r:6.0,v:14.0,d:3.0},
  {t:"XLB",n:"Materials Select",c:"Sector Materials",h:28,er:.10,r:7.8,v:18.0,d:1.8},
  {t:"XLC",n:"Communication Svcs Select",c:"Sector Comms",h:25,er:.10,r:11.0,v:19.5,d:.7},
  {t:"XLRE",n:"Real Estate Select",c:"Sector RE",h:31,er:.10,r:6.5,v:18.5,d:3.2},
  {t:"VGT",n:"Vanguard Info Tech",c:"Sector Tech",h:380,er:.10,r:15.5,v:21.0,d:.6},
  {t:"VHT",n:"Vanguard Health Care",c:"Sector Health",h:440,er:.10,r:9.5,v:14.2,d:1.3},
  {t:"VFH",n:"Vanguard Financials",c:"Sector Finance",h:400,er:.10,r:8.0,v:18.0,d:1.8},
  {t:"VDE",n:"Vanguard Energy",c:"Sector Energy",h:110,er:.10,r:3.0,v:27.0,d:3.2},
  {t:"VIS",n:"Vanguard Industrials",c:"Sector Indust",h:350,er:.10,r:9.0,v:16.5,d:1.3},
  {t:"VCR",n:"Vanguard Consumer Discr",c:"Sector Consumer",h:290,er:.10,r:10.5,v:18.5,d:.7},
  {t:"VNQ",n:"Vanguard Real Estate",c:"Sector RE",h:160,er:.12,r:6.2,v:19.0,d:3.5},
  {t:"IYR",n:"iShares US Real Estate",c:"Sector RE",h:75,er:.39,r:6.0,v:19.5,d:2.8},
  // ── ARK Innovation ──
  {t:"ARKK",n:"ARK Innovation ETF",c:"US Growth",h:35,er:.75,r:15.0,v:38.0,d:0},
  {t:"ARKW",n:"ARK Next Gen Internet",c:"US Growth",h:35,er:.75,r:14.5,v:36.0,d:0},
  {t:"ARKG",n:"ARK Genomic Revolution",c:"Sector Health",h:35,er:.75,r:8.0,v:35.0,d:0},
  {t:"ARKF",n:"ARK Fintech Innovation",c:"Sector Finance",h:35,er:.75,r:10.0,v:32.0,d:0},
  {t:"ARKQ",n:"ARK Autonomous Tech",c:"Sector Tech",h:35,er:.75,r:12.0,v:34.0,d:0},
  {t:"ARKX",n:"ARK Space Exploration",c:"Sector Indust",h:35,er:.75,r:6.0,v:28.0,d:0},
  // ── Thematic / Innovation ──
  {t:"BOTZ",n:"Global X Robotics & AI",c:"Sector Tech",h:40,er:.68,r:11.0,v:25.0,d:.3},
  {t:"DRIV",n:"Global X Autonomous & EV",c:"Sector Tech",h:75,er:.68,r:10.0,v:26.0,d:.5},
  {t:"LIT",n:"Global X Lithium & Battery",c:"Sector Materials",h:40,er:.75,r:5.0,v:30.0,d:.8},
  {t:"ICLN",n:"iShares Global Clean Energy",c:"Sector Energy",h:100,er:.40,r:3.0,v:28.0,d:1.2},
  {t:"TAN",n:"Invesco Solar ETF",c:"Sector Energy",h:30,er:.69,r:2.0,v:35.0,d:.5},
  {t:"HACK",n:"ETFMG Prime Cybersecurity",c:"Sector Tech",h:60,er:.60,r:12.0,v:22.0,d:.2},
  {t:"SKYY",n:"First Trust Cloud Computing",c:"Sector Tech",h:60,er:.60,r:12.5,v:24.0,d:.3},
  {t:"SOXX",n:"iShares Semiconductor",c:"Sector Tech",h:30,er:.35,r:18.0,v:28.0,d:.6},
  {t:"SMH",n:"VanEck Semiconductor",c:"Sector Tech",h:25,er:.35,r:19.0,v:29.0,d:.5},
  {t:"XBI",n:"SPDR S&P Biotech",c:"Sector Health",h:140,er:.35,r:5.0,v:30.0,d:0},
  {t:"IBB",n:"iShares Biotech",c:"Sector Health",h:270,er:.44,r:6.0,v:25.0,d:.2},
  {t:"IGV",n:"iShares Software",c:"Sector Tech",h:120,er:.40,r:14.0,v:24.0,d:.1},
  {t:"CIBR",n:"First Trust Cybersecurity",c:"Sector Tech",h:35,er:.60,r:13.0,v:21.0,d:.2},
  {t:"AIQ",n:"Global X AI & Tech",c:"Sector Tech",h:85,er:.68,r:13.5,v:22.0,d:.4},
  {t:"ROBO",n:"ROBO Global Robotics",c:"Sector Tech",h:80,er:.95,r:9.0,v:23.0,d:.2},
  {t:"QCLN",n:"First Trust NASDAQ Clean Edge",c:"Sector Energy",h:50,er:.58,r:4.0,v:30.0,d:.4},
  {t:"BLOK",n:"Amplify Blockchain",c:"Sector Tech",h:45,er:.71,r:8.0,v:35.0,d:1.5},
  // ── Factor / Smart Beta ──
  {t:"MTUM",n:"iShares Momentum",c:"Factor Momentum",h:125,er:.15,r:12.5,v:16.5,d:.9},
  {t:"QUAL",n:"iShares Quality",c:"Factor Quality",h:124,er:.15,r:11.8,v:14.8,d:1.3},
  {t:"USMV",n:"iShares Min Vol",c:"Factor LowVol",h:174,er:.15,r:9.2,v:11.5,d:1.7},
  {t:"VLUE",n:"iShares Value Factor",c:"US Value",h:380,er:.15,r:7.5,v:16.0,d:2.2},
  {t:"SIZE",n:"iShares Size Factor",c:"US Mid Cap",h:600,er:.15,r:8.5,v:15.5,d:1.5},
  {t:"DSTL",n:"Distillate US Fundamental",c:"Factor Quality",h:500,er:.39,r:11.0,v:14.5,d:1.1},
  // ── Fixed Income ──
  {t:"BND",n:"Vanguard Total Bond",c:"US Bond",h:10702,er:.03,r:3.2,v:4.5,d:3.5},
  {t:"AGG",n:"iShares US Agg Bond",c:"US Bond",h:11944,er:.03,r:3.1,v:4.6,d:3.4},
  {t:"BNDX",n:"Vanguard Intl Bond",c:"Intl Bond",h:6840,er:.07,r:2.5,v:4.2,d:2.8},
  {t:"TLT",n:"iShares 20Y+ Treasury",c:"US Treasury",h:41,er:.15,r:3.8,v:14.2,d:3.8},
  {t:"LQD",n:"iShares IG Corp Bond",c:"US Corp Bond",h:2845,er:.14,r:4.2,v:7.5,d:4.1},
  {t:"HYG",n:"iShares HY Corp Bond",c:"US High Yield",h:1178,er:.49,r:5.1,v:8.8,d:5.5},
  {t:"SCHZ",n:"Schwab US Agg Bond",c:"US Bond",h:8000,er:.03,r:3.0,v:4.5,d:3.3},
  {t:"VCIT",n:"Vanguard Interm Corp Bond",c:"US Corp Bond",h:1900,er:.04,r:4.0,v:6.5,d:3.8},
  {t:"VCSH",n:"Vanguard Short Corp Bond",c:"US Corp Bond",h:2300,er:.04,r:3.5,v:3.0,d:3.2},
  {t:"BSV",n:"Vanguard Short-Term Bond",c:"US Bond",h:2500,er:.04,r:2.8,v:2.5,d:2.8},
  {t:"BIV",n:"Vanguard Interm Bond",c:"US Bond",h:2000,er:.04,r:3.3,v:5.5,d:3.3},
  {t:"IEF",n:"iShares 7-10Y Treasury",c:"US Treasury",h:12,er:.15,r:3.2,v:7.5,d:3.5},
  {t:"SHY",n:"iShares 1-3Y Treasury",c:"US Treasury",h:90,er:.15,r:2.5,v:1.8,d:3.0},
  {t:"TIP",n:"iShares TIPS Bond",c:"US Bond",h:50,er:.19,r:3.0,v:5.0,d:5.5},
  {t:"EMB",n:"iShares EM Bond",c:"Intl Bond",h:300,er:.39,r:4.5,v:10.0,d:5.0},
  {t:"JNK",n:"SPDR High Yield Bond",c:"US High Yield",h:1000,er:.40,r:4.8,v:8.5,d:5.8},
  // ── Commodity / Alternatives ──
  {t:"GLD",n:"SPDR Gold Shares",c:"Commodity",h:1,er:.40,r:5.5,v:15.0,d:0},
  {t:"IAU",n:"iShares Gold Trust",c:"Commodity",h:1,er:.25,r:5.5,v:15.0,d:0},
  {t:"SLV",n:"iShares Silver Trust",c:"Commodity",h:1,er:.50,r:4.0,v:25.0,d:0},
  {t:"GDX",n:"VanEck Gold Miners",c:"Commodity",h:50,er:.51,r:4.0,v:32.0,d:1.5},
  {t:"PDBC",n:"Invesco Optimum Yield Diversified Commodity",c:"Commodity",h:1,er:.59,r:3.0,v:14.0,d:2.0},
  {t:"DBC",n:"Invesco DB Commodity",c:"Commodity",h:14,er:.87,r:2.5,v:15.0,d:0},
  {t:"USO",n:"United States Oil Fund",c:"Commodity",h:1,er:.60,r:1.0,v:30.0,d:0},
  // ── Leveraged / Inverse (popular on Schwab) ──
  // lev: leverage factor. Optimizer applies volatility decay penalty + allocation cap
  {t:"TQQQ",n:"ProShares 3x QQQ",c:"US Growth",h:101,er:.86,r:35.0,v:55.0,d:0,lev:3},
  {t:"SQQQ",n:"ProShares -3x QQQ",c:"US Growth",h:101,er:.86,r:-25.0,v:55.0,d:0,lev:-3},
  {t:"SPXL",n:"Direxion 3x S&P 500",c:"US Large Cap",h:503,er:.90,r:25.0,v:45.0,d:0,lev:3},
  {t:"UPRO",n:"ProShares 3x S&P 500",c:"US Large Cap",h:503,er:.91,r:25.0,v:45.0,d:0,lev:3},
  {t:"SOXL",n:"Direxion 3x Semiconductor",c:"Sector Tech",h:30,er:.76,r:40.0,v:70.0,d:0,lev:3},
  {t:"QLD",n:"ProShares 2x QQQ",c:"US Growth",h:101,er:.95,r:25.0,v:40.0,d:0,lev:2},
  {t:"SSO",n:"ProShares 2x S&P 500",c:"US Large Cap",h:503,er:.89,r:18.0,v:30.0,d:0,lev:2},
];

const CORR={"US Large Cap":{"US Total Mkt":.99,"US Growth":.92,"US Value":.92,"US Mid Cap":.95,"US Small Cap":.88,"US Dividend":.93,"International":.72,"Intl Developed":.74,"Emerging Mkts":.65,"Sector Tech":.88,"Sector Health":.78,"Sector Finance":.82,"Sector Energy":.58,"Sector Indust":.88,"Sector Consumer":.87,"Sector RE":.62,"Sector Utilities":.55,"Sector Materials":.72,"Sector Comms":.82,"Factor Momentum":.90,"Factor Quality":.96,"Factor LowVol":.85,"US Bond":-.15,"Intl Bond":-.08,"US Treasury":-.35,"US Corp Bond":.10,"US High Yield":.60,"Commodity":.25,"Stock":.75,"Cash":0},"US Growth":{"US Value":.72,"US Small Cap":.82,"International":.65,"US Bond":-.22,"US Treasury":-.42,"Commodity":.15,"Stock":.78,"Cash":0},"US Value":{"US Small Cap":.88,"International":.78,"US Bond":.05,"US Treasury":-.15,"Commodity":.35,"Stock":.70,"Cash":0},"US Total Mkt":{"Commodity":.22,"Stock":.76,"Cash":0},"US Mid Cap":{"Commodity":.28,"Stock":.72,"Cash":0},"US Small Cap":{"International":.72,"US Bond":-.08,"US Treasury":-.28,"Commodity":.25,"Stock":.68,"Cash":0},"US Dividend":{"US Bond":.08,"US Treasury":-.12,"Commodity":.30,"Stock":.65,"Cash":0},"International":{"Intl Developed":.98,"Emerging Mkts":.88,"US Bond":.05,"US Treasury":-.10,"Commodity":.35,"Stock":.55,"Cash":0},"Intl Developed":{"Emerging Mkts":.82,"Commodity":.30,"Stock":.52,"Cash":0},"Emerging Mkts":{"US Bond":.02,"US Treasury":-.15,"Commodity":.40,"Stock":.48,"Cash":0},"Sector Tech":{"Commodity":.10,"Stock":.80,"Cash":0},"Sector Health":{"Commodity":.15,"Stock":.60,"Cash":0},"Sector Finance":{"Commodity":.25,"Stock":.65,"Cash":0},"Sector Energy":{"Commodity":.65,"Stock":.45,"Cash":0},"Sector Indust":{"Commodity":.35,"Stock":.68,"Cash":0},"Sector Consumer":{"Commodity":.20,"Stock":.70,"Cash":0},"Sector RE":{"Commodity":.15,"Stock":.40,"Cash":0},"Sector Utilities":{"Commodity":.18,"US Bond":.25,"Stock":.35,"Cash":0},"Sector Materials":{"Commodity":.60,"Stock":.55,"Cash":0},"Sector Comms":{"Commodity":.12,"Stock":.72,"Cash":0},"Factor Momentum":{"Commodity":.18,"Stock":.72,"Cash":0},"Factor Quality":{"Commodity":.20,"Stock":.74,"Cash":0},"Factor LowVol":{"US Bond":.15,"Commodity":.12,"Stock":.55,"Cash":0},"US Bond":{"Intl Bond":.65,"US Treasury":.88,"US Corp Bond":.92,"US High Yield":.45,"Commodity":-.05,"Stock":-.10,"Cash":.05},"Intl Bond":{"US Treasury":.55,"US Corp Bond":.60,"US High Yield":.35,"Commodity":.05,"Stock":-.05,"Cash":.03},"US Treasury":{"US Corp Bond":.72,"US High Yield":.05,"Commodity":-.10,"Stock":-.30,"Cash":.02},"US Corp Bond":{"US High Yield":.68,"Commodity":.00,"Stock":.05,"Cash":.03},"US High Yield":{"Commodity":.20,"Stock":.50,"Cash":0},"Commodity":{"Stock":.20,"Cash":0},"Stock":{"Cash":0},"Cash":{"Cash":1}};
function gc(a,b){if(a===b)return 1;return CORR[a]?.[b]??CORR[b]?.[a]??.5}

const RF=4.5;
const PAL=["#6ee7b7","#60a5fa","#f472b6","#fbbf24","#a78bfa","#fb923c","#34d399","#f87171","#38bdf8","#e879f9"];

const STOCK_DB=[
  {t:"AAPL",n:"Apple Inc.",s:"Technology"},{t:"MSFT",n:"Microsoft",s:"Technology"},{t:"GOOGL",n:"Alphabet (A)",s:"Technology"},{t:"AMZN",n:"Amazon",s:"Consumer"},{t:"NVDA",n:"NVIDIA",s:"Technology"},{t:"META",n:"Meta Platforms",s:"Technology"},{t:"TSLA",n:"Tesla",s:"Consumer"},{t:"BRK.B",n:"Berkshire B",s:"Financial"},{t:"LLY",n:"Eli Lilly",s:"Healthcare"},{t:"V",n:"Visa",s:"Financial"},{t:"JPM",n:"JPMorgan",s:"Financial"},{t:"UNH",n:"UnitedHealth",s:"Healthcare"},{t:"MA",n:"Mastercard",s:"Financial"},{t:"XOM",n:"Exxon Mobil",s:"Energy"},{t:"JNJ",n:"J&J",s:"Healthcare"},{t:"PG",n:"Procter & Gamble",s:"Consumer"},{t:"AVGO",n:"Broadcom",s:"Technology"},{t:"HD",n:"Home Depot",s:"Consumer"},{t:"COST",n:"Costco",s:"Consumer"},{t:"MRK",n:"Merck",s:"Healthcare"},{t:"ABBV",n:"AbbVie",s:"Healthcare"},{t:"CVX",n:"Chevron",s:"Energy"},{t:"CRM",n:"Salesforce",s:"Technology"},{t:"AMD",n:"AMD",s:"Technology"},{t:"KO",n:"Coca-Cola",s:"Consumer"},{t:"PEP",n:"PepsiCo",s:"Consumer"},{t:"NFLX",n:"Netflix",s:"Technology"},{t:"ADBE",n:"Adobe",s:"Technology"},{t:"WMT",n:"Walmart",s:"Consumer"},{t:"BAC",n:"Bank of America",s:"Financial"},{t:"DIS",n:"Disney",s:"Communications"},{t:"CSCO",n:"Cisco",s:"Technology"},{t:"INTC",n:"Intel",s:"Technology"},{t:"ORCL",n:"Oracle",s:"Technology"},{t:"IBM",n:"IBM",s:"Technology"},{t:"QCOM",n:"Qualcomm",s:"Technology"},{t:"GE",n:"GE",s:"Industrial"},{t:"CAT",n:"Caterpillar",s:"Industrial"},{t:"BA",n:"Boeing",s:"Industrial"},{t:"GS",n:"Goldman Sachs",s:"Financial"},{t:"MS",n:"Morgan Stanley",s:"Financial"},{t:"UBER",n:"Uber",s:"Technology"},{t:"SBUX",n:"Starbucks",s:"Consumer"},{t:"INTU",n:"Intuit",s:"Technology"},{t:"ISRG",n:"Intuitive Surgical",s:"Healthcare"},{t:"PFE",n:"Pfizer",s:"Healthcare"},{t:"NOW",n:"ServiceNow",s:"Technology"},{t:"LMT",n:"Lockheed Martin",s:"Industrial"},{t:"PLTR",n:"Palantir",s:"Technology"},{t:"PANW",n:"Palo Alto Networks",s:"Technology"},{t:"SHOP",n:"Shopify",s:"Technology"},{t:"SQ",n:"Block",s:"Technology"},{t:"COIN",n:"Coinbase",s:"Financial"},{t:"CRWD",n:"CrowdStrike",s:"Technology"},{t:"NET",n:"Cloudflare",s:"Technology"},{t:"ABNB",n:"Airbnb",s:"Consumer"},{t:"PYPL",n:"PayPal",s:"Financial"},{t:"MU",n:"Micron",s:"Technology"},{t:"BABA",n:"Alibaba (ADR)",s:"Technology"},{t:"BILI",n:"Bilibili (ADR)",s:"Communications"},{t:"EXAS",n:"Exact Sciences",s:"Healthcare"},{t:"JD",n:"JD.com (ADR)",s:"Consumer"},{t:"PDD",n:"PDD Holdings",s:"Consumer"},{t:"NIO",n:"NIO (ADR)",s:"Consumer"},{t:"TSM",n:"Taiwan Semi (ADR)",s:"Technology"},{t:"ASML",n:"ASML (ADR)",s:"Technology"},{t:"ARM",n:"Arm Holdings",s:"Technology"},{t:"SMCI",n:"Super Micro",s:"Technology"},{t:"APP",n:"AppLovin",s:"Technology"},{t:"SOFI",n:"SoFi",s:"Financial"},{t:"RIVN",n:"Rivian",s:"Consumer"},{t:"HOOD",n:"Robinhood",s:"Financial"},{t:"IONQ",n:"IonQ",s:"Technology"},{t:"SOUN",n:"SoundHound AI",s:"Technology"},{t:"RKLB",n:"Rocket Lab",s:"Industrial"},{t:"DELL",n:"Dell",s:"Technology"},{t:"SNOW",n:"Snowflake",s:"Technology"},{t:"DASH",n:"DoorDash",s:"Technology"},{t:"SPOT",n:"Spotify",s:"Communications"},{t:"DDOG",n:"Datadog",s:"Technology"},{t:"AFRM",n:"Affirm",s:"Technology"},{t:"F",n:"Ford",s:"Consumer"},{t:"GM",n:"General Motors",s:"Consumer"},{t:"MRNA",n:"Moderna",s:"Healthcare"},{t:"CVS",n:"CVS Health",s:"Healthcare"},{t:"REGN",n:"Regeneron",s:"Healthcare"},{t:"VRTX",n:"Vertex Pharma",s:"Healthcare"},{t:"GILD",n:"Gilead",s:"Healthcare"},{t:"CI",n:"Cigna",s:"Healthcare"},{t:"DHR",n:"Danaher",s:"Healthcare"},{t:"C",n:"Citigroup",s:"Financial"},{t:"SCHW",n:"Charles Schwab",s:"Financial"},{t:"CME",n:"CME Group",s:"Financial"},{t:"ICE",n:"Intercontinental Exch",s:"Financial"},{t:"COP",n:"ConocoPhillips",s:"Energy"},{t:"OXY",n:"Occidental Petroleum",s:"Energy"},{t:"FSLR",n:"First Solar",s:"Energy"},{t:"O",n:"Realty Income",s:"Real Estate"},{t:"AMT",n:"American Tower",s:"Real Estate"},{t:"NEE",n:"NextEra Energy",s:"Utilities"},{t:"SO",n:"Southern Co",s:"Utilities"},{t:"NEM",n:"Newmont",s:"Materials"},{t:"FCX",n:"Freeport-McMoRan",s:"Materials"},{t:"GOLD",n:"Barrick Gold",s:"Materials"},{t:"LULU",n:"Lululemon",s:"Consumer"},{t:"CMG",n:"Chipotle",s:"Consumer"},{t:"MCD",n:"McDonald's",s:"Consumer"},{t:"TGT",n:"Target",s:"Consumer"},{t:"LOW",n:"Lowe's",s:"Consumer"},{t:"HON",n:"Honeywell",s:"Industrial"},{t:"ETN",n:"Eaton",s:"Industrial"},{t:"DE",n:"Deere",s:"Industrial"},{t:"UPS",n:"UPS",s:"Industrial"},{t:"FDX",n:"FedEx",s:"Industrial"},{t:"DAL",n:"Delta Air Lines",s:"Industrial"},{t:"TMUS",n:"T-Mobile",s:"Communications"},{t:"CMCSA",n:"Comcast",s:"Communications"},{t:"EA",n:"Electronic Arts",s:"Communications"},{t:"NXPI",n:"NXP Semi",s:"Technology"},{t:"ADI",n:"Analog Devices",s:"Technology"},{t:"SNPS",n:"Synopsys",s:"Technology"},{t:"CDNS",n:"Cadence Design",s:"Technology"},{t:"FTNT",n:"Fortinet",s:"Technology"},{t:"WDAY",n:"Workday",s:"Technology"},{t:"TEAM",n:"Atlassian",s:"Technology"},{t:"HUBS",n:"HubSpot",s:"Technology"},{t:"MELI",n:"MercadoLibre",s:"Consumer"},{t:"NU",n:"Nu Holdings",s:"Financial"},{t:"SE",n:"Sea Limited",s:"Technology"},{t:"CPNG",n:"Coupang",s:"Consumer"},{t:"VALE",n:"Vale (ADR)",s:"Materials"},{t:"BHP",n:"BHP (ADR)",s:"Materials"},{t:"RIO",n:"Rio Tinto (ADR)",s:"Materials"},
];

// ═══ ENGINE ═══
// VaR at 95% confidence (parametric): VaR = σ × 1.645
// mSR (VaR Sharpe) = (Rp - Rf) / VaR
// Half Kelly: f* = 0.5 × (R - Rf) / σ²
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
  // VaR-based Sharpe: mSR = (Rp - Rf) / VaR_95
  const var95 = vol * 1.645;  // 95% parametric VaR (annual %)
  const varSh = var95 > 0 ? (er - RF) / var95 : 0;
  // Vol-squared Sharpe: (Rp - Rf) / σ²
  const vol2Sh = vol > 0 ? (er - RF) / (vol * vol / 100) : 0;
  const so = vol > 0 ? (er - RF) / (vol * .7) : 0;
  const nr = er - wer; const md = vol * 2.1; const cm = md > 0 ? nr / md : 0;
  const dr = vol > 0 ? items.reduce((s, p) => s + p.w * (p.v || 0), 0) / vol : 1;
  // Half Kelly fraction for the overall portfolio: f* = 0.5 × (R - Rf) / σ²
  const hk = vol > 0 ? 0.5 * (er - RF) / ((vol / 100) * (vol / 100)) / 100 : 0;  // as fraction of capital
  return { er, vol, sh, varSh, vol2Sh, so, nr, wer, div, md, cm, dr, cashW, var95, hk };
}

// ── Category risk classification for regime-adaptive optimization ──
const DEFENSIVE_CATS = new Set(["US Bond","US Treasury","US Corp Bond","Intl Bond","Commodity","Factor LowVol","Sector Utilities","US Dividend","US Value"]);
const AGGRESSIVE_CATS = new Set(["US Growth","US Small Cap","US Mid Cap","Emerging Mkts","Sector Tech","Sector Consumer","Sector Comms","Sector Finance","Factor Momentum"]);

// ── US State Capital Gains Tax Rates (2024/2025) ──
// Most states tax capital gains as ordinary income; these are the top marginal rates
const STATE_TAX_RATES = {
  "None":0,"AL":5.0,"AK":0,"AZ":2.5,"AR":4.4,"CA":13.3,"CO":4.4,"CT":6.99,"DE":6.6,"FL":0,
  "GA":5.49,"HI":11.0,"ID":5.8,"IL":4.95,"IN":3.05,"IA":5.7,"KS":5.7,"KY":4.0,"LA":4.25,
  "ME":7.15,"MD":5.75,"MA":9.0,"MI":4.25,"MN":9.85,"MS":5.0,"MO":4.95,"MT":5.9,"NE":5.84,
  "NV":0,"NH":0,"NJ":10.75,"NM":5.9,"NY":10.9,"NC":4.5,"ND":2.5,"OH":3.5,"OK":4.75,
  "OR":9.9,"PA":3.07,"RI":5.99,"SC":6.4,"SD":0,"TN":0,"TX":0,"UT":4.65,"VT":8.75,
  "VA":5.75,"WA":7.0,"WV":5.12,"WI":7.65,"WY":0,"DC":10.75,
};
const STATE_NAMES = {
  "None":"No State Tax","AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California",
  "CO":"Colorado","CT":"Connecticut","DE":"Delaware","FL":"Florida","GA":"Georgia","HI":"Hawaii",
  "ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky","LA":"Louisiana",
  "ME":"Maine","MD":"Maryland","MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi",
  "MO":"Missouri","MT":"Montana","NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey",
  "NM":"New Mexico","NY":"New York","NC":"North Carolina","ND":"North Dakota","OH":"Ohio","OK":"Oklahoma",
  "OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island","SC":"South Carolina","SD":"South Dakota",
  "TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont","VA":"Virginia","WA":"Washington",
  "WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming","DC":"Washington DC",
};
// Federal rates: 37% ST (ordinary income top bracket), 20% LT + 3.8% NIIT = 23.8%
const FED_ST_RATE = 37; const FED_LT_RATE = 20; const NIIT_RATE = 3.8;
function getTaxRates(stateCode) {
  const stateRate = STATE_TAX_RATES[stateCode] || 0;
  return {
    st: FED_ST_RATE + stateRate,            // Short-term total rate %
    lt: FED_LT_RATE + NIIT_RATE + stateRate, // Long-term total rate %
    state: stateRate,
    fedST: FED_ST_RATE, fedLT: FED_LT_RATE + NIIT_RATE,
  };
}

// ── Leveraged ETF risk model ──
// Volatility decay: annual drag ≈ -0.5 × leverage² × σ² (continuous approximation)
// For SOXL (3x, 70% vol): decay ≈ -0.5 × 9 × 0.49 = -2.205 = -220.5% annual drag
// For TQQQ (3x, 55% vol): decay ≈ -0.5 × 9 × 0.3025 = -1.36 = -136% annual drag
// This is the mathematical cost of daily rebalancing that compounds against you
const LEVERAGED_TICKERS = new Set(["TQQQ","SQQQ","SPXL","UPRO","SOXL","QLD","SSO"]);

function getLevDecay(vol, leverage) {
  // vol as decimal (0.55 for 55%), leverage as integer (3 for 3x)
  // Returns annual decay as percentage (negative)
  const sigma = vol / 100;
  return -0.5 * (leverage * leverage - Math.abs(leverage)) * sigma * sigma * 100;
}

function getAdjustedReturn(r, v, leverage) {
  // Adjust stated return for volatility decay
  // Also cap unrealistically high returns
  if (!leverage || Math.abs(leverage) <= 1) return r;
  const decay = getLevDecay(v, leverage);
  return r + decay; // decay is negative, so this reduces the return
}

// 5-state tilt table: [defensive_bonus, aggressive_bonus, kelly_mult]
const REGIME_TILTS = {
  strong_risk_on: [-0.12, +0.15, 1.0],
  mild_risk_on:   [-0.06, +0.08, 1.0],
  neutral:        [0, 0, 1.0],
  mild_risk_off:  [+0.08, -0.06, 0.8],
  strong_risk_off: [+0.15, -0.12, 0.5],
};

// regimeCtx: { state5, acceleration, duration, transition } or just a string for backward compat
// prevBest: optional previous allocation weights to warm-start from
function optimizeCash(existing, cash, totalVal, candidates, target, srMode, volTarget, useKelly, regimeCtx, iterations, prevBest) {
  if (!candidates.length || cash <= 0) return [];
  const n = candidates.length; let best = null, bs = -Infinity;
  const numIterations = iterations || 6000;

  // Parse regimeCtx
  let state5 = "neutral", acceleration = 0, duration = 1, transition = null;
  if (typeof regimeCtx === "string") {
    if (regimeCtx === "bull") state5 = "mild_risk_on";
    else if (regimeCtx === "bear") state5 = "mild_risk_off";
    else if (REGIME_TILTS[regimeCtx]) state5 = regimeCtx;
  } else if (regimeCtx && typeof regimeCtx === "object") {
    state5 = regimeCtx.state5 || "neutral";
    acceleration = regimeCtx.acceleration || 0;
    duration = regimeCtx.duration || 1;
    transition = regimeCtx.transition || null;
  }

  const [baseDefBonus, baseAggBonus, baseKellyMult] = REGIME_TILTS[state5] || [0, 0, 1.0];
  const durationScale = Math.min(2.0, 0.5 + (duration / 12) * 1.5);
  let accelMod = 1.0;
  if (state5.includes("risk_off")) accelMod = acceleration < -0.15 ? 0.6 : acceleration > 0.15 ? 1.3 : 1.0;
  else if (state5.includes("risk_on")) accelMod = acceleration > 0.15 ? 0.6 : acceleration < -0.15 ? 1.2 : 1.0;

  let entryBonus = 0;
  if (transition) {
    const [from, to] = transition.includes("→") ? transition.split("→") : [null, null];
    if (from === "bear" && (to === "bull" || to === "neutral") && duration >= 2 && duration <= 8) entryBonus = 0.08;
    else if (from === "neutral" && to === "bull" && duration >= 1 && duration <= 4) entryBonus = 0.04;
  }

  const defBonus = baseDefBonus * durationScale * accelMod;
  const aggBonus = baseAggBonus * durationScale * accelMod + (state5.includes("risk_on") ? entryBonus : 0);
  const kellyMult = baseKellyMult;
  const regimeTilt = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const c = candidates[i];
    if (state5 === "neutral" && entryBonus === 0) { regimeTilt[i] = 0; continue; }
    if (DEFENSIVE_CATS.has(c.c)) regimeTilt[i] = defBonus - (entryBonus > 0 ? entryBonus * 0.5 : 0);
    else if (AGGRESSIVE_CATS.has(c.c)) regimeTilt[i] = aggBonus;
    else regimeTilt[i] = entryBonus > 0 ? entryBonus * 0.3 : 0;
  }

  // Pre-compute adjusted returns, vols as typed arrays
  const adjRet = new Float64Array(n), volArr = new Float64Array(n), isLev = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const c = candidates[i];
    adjRet[i] = (c.lev && Math.abs(c.lev) > 1) ? getAdjustedReturn(c.r, c.v, c.lev) : c.r;
    volArr[i] = c.v / 100;
    isLev[i] = (c.lev && Math.abs(c.lev) > 1) ? 1 : 0;
  }

  // Leverage caps + Kelly caps
  const maxPct = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const c = candidates[i];
    let levCap = 1.0;
    if (c.lev && Math.abs(c.lev) > 1) { levCap = c.lev < 0 ? 0.05 : Math.abs(c.lev) >= 3 ? 0.10 : 0.15; }
    if (!useKelly) { maxPct[i] = levCap; continue; }
    const sigSq = volArr[i] * volArr[i];
    if (sigSq <= 0) { maxPct[i] = levCap; continue; }
    const fStar = 0.5 * ((adjRet[i] - RF) / 100) / sigSq;
    const adj = AGGRESSIVE_CATS.has(c.c) ? kellyMult : 1.0;
    maxPct[i] = Math.max(0.01, Math.min(fStar * adj, levCap));
  }

  // ── Pre-compute flat correlation matrix (n×n) — eliminates gc() calls in hot loop ──
  const nEx = existing.length;
  const totalItems = nEx + n;
  const corrMatrix = new Float64Array(totalItems * totalItems);
  const itemCats = [];
  for (const p of existing) itemCats.push(p.cat || "Stock");
  for (const c of candidates) itemCats.push(c.c);
  for (let i = 0; i < totalItems; i++) {
    for (let j = i; j < totalItems; j++) {
      const v = gc(itemCats[i], itemCats[j]);
      corrMatrix[i * totalItems + j] = v;
      corrMatrix[j * totalItems + i] = v;
    }
  }

  // Pre-compute existing portfolio weights and properties
  const newTV = totalVal + cash;
  const exW = new Float64Array(nEx), exVol = new Float64Array(nEx), exRet = new Float64Array(nEx);
  for (let i = 0; i < nEx; i++) {
    exW[i] = existing[i].dollars / newTV;
    exVol[i] = (existing[i].v || 0) / 100;
    exRet[i] = existing[i].r || 0;
  }

  // Reusable arrays — zero allocation in hot loop
  const ws = new Float64Array(n);
  const alloc = new Float64Array(n);
  const itemW = new Float64Array(totalItems);
  const itemVol = new Float64Array(totalItems);
  const hasRegimeTilt = state5 !== "neutral" || entryBonus > 0;

  // Warm-start: build initial best from prevBest if available
  if (prevBest && prevBest.length === n) {
    best = new Float64Array(prevBest);
  }

  for (let t = 0; t < numIterations; t++) {
    const numActive = Math.min(n, 3 + Math.floor(Math.random() * Math.min(8, Math.max(1, n - 2))));

    // Warm-start: 70% of iterations mutate the best-so-far, 30% random exploration
    const warmStart = best && t > 10 && Math.random() < 0.7;

    // Generate weights
    let wSum = 0;
    for (let i = 0; i < n; i++) ws[i] = 0;
    if (warmStart) {
      for (let i = 0; i < n; i++) {
        ws[i] = Math.max(0, best[i] + (Math.random() - 0.5) * 0.6 * best[i]);
        wSum += ws[i];
      }
      if (Math.random() < 0.3) {
        const idx = Math.floor(Math.random() * n);
        if (ws[idx] > 0) { wSum -= ws[idx]; ws[idx] = 0; }
        else { ws[idx] = Math.random() * 0.3; wSum += ws[idx]; }
      }
    } else {
      // Safe selection: Fisher-Yates partial shuffle on index array
      const idxArr = new Uint16Array(n);
      for (let i = 0; i < n; i++) idxArr[i] = i;
      for (let i = 0; i < numActive; i++) {
        const j = i + Math.floor(Math.random() * (n - i));
        const tmp = idxArr[i]; idxArr[i] = idxArr[j]; idxArr[j] = tmp;
      }
      for (let i = 0; i < numActive; i++) {
        const idx = idxArr[i];
        ws[idx] = Math.random();
        wSum += ws[idx];
      }
    }

    if (wSum <= 0) continue;
    const deployPct = 0.9 + Math.random() * 0.1;
    const deployAmt = cash * deployPct;

    // Normalize + apply Kelly/leverage caps
    let allocSum2 = 0;
    for (let i = 0; i < n; i++) {
      let pct = ws[i] / wSum;
      if (pct > 0) pct = Math.min(pct, maxPct[i]);
      alloc[i] = pct;
      allocSum2 += pct;
    }
    if (allocSum2 <= 0) continue;
    for (let i = 0; i < n; i++) alloc[i] = (alloc[i] / allocSum2) * deployAmt;

    // Build item arrays (existing + new alloc)
    for (let i = 0; i < nEx; i++) { itemW[i] = exW[i]; itemVol[i] = exVol[i]; }
    for (let i = 0; i < n; i++) { itemW[nEx + i] = alloc[i] / newTV; itemVol[nEx + i] = volArr[i]; }

    // Compute return + variance (fully inlined, no gc() calls)
    let ret = 0, vr = 0;
    for (let i = 0; i < nEx; i++) ret += exW[i] * exRet[i];
    for (let i = 0; i < n; i++) ret += itemW[nEx + i] * adjRet[i];
    for (let i = 0; i < totalItems; i++) {
      const wi = itemW[i] * itemVol[i];
      if (wi === 0) continue;
      for (let j = i; j < totalItems; j++) {
        const wj = itemW[j] * itemVol[j];
        if (wj === 0) continue;
        const c = corrMatrix[i * totalItems + j];
        vr += (i === j ? 1 : 2) * wi * wj * c;
      }
    }
    const vol = Math.sqrt(Math.max(0, vr)) * 100;

    // Score
    const var95 = vol * 1.645;
    const sh = srMode === "var" ? (var95 > 0 ? (ret - RF) / var95 : 0) : srMode === "vol2" ? (vol > 0 ? (ret - RF) / (vol * vol / 100) : 0) : (vol > 0 ? (ret - RF) / vol : 0);
    const volPenalty = volTarget > 0 ? -0.15 * Math.abs(vol - volTarget) : 0;

    let levPenalty = 0, levExposure = 0;
    for (let i = 0; i < n; i++) if (isLev[i]) levExposure += alloc[i] / deployAmt;
    levPenalty = -levExposure * levExposure * 0.5;

    let regimeBonus = 0;
    if (hasRegimeTilt) for (let i = 0; i < n; i++) regimeBonus += (alloc[i] / deployAmt) * regimeTilt[i];

    let activeCount = 0;
    for (let i = 0; i < n; i++) if (alloc[i] > deployAmt * 0.03) activeCount++;
    const concBonus = activeCount <= 3 ? 0.06 : activeCount <= 5 ? 0.04 : activeCount <= 7 ? 0.02 : 0;

    let sc;
    if (target === "max_sharpe") sc = sh + volPenalty + regimeBonus + concBonus + levPenalty;
    else if (target === "min_vol") sc = -vol + regimeBonus + concBonus + levPenalty;
    else if (target === "max_return") sc = ret + volPenalty + regimeBonus + concBonus + levPenalty;
    else sc = sh * .5 + ret * .03 - vol * .02 + volPenalty + regimeBonus + concBonus + levPenalty;
    if (sc > bs) { bs = sc; best = new Float64Array(alloc); }
  }
  const minAlloc = cash * 0.03;
  if (!best) return [];
  const raw = candidates.map((e, i) => {
    const hk = useKelly ? maxPct[i] : null;
    const lev = e.lev && Math.abs(e.lev) > 1 ? e.lev : null;
    const decay = lev ? getLevDecay(e.v, lev) : null;
    const ar = adjRet[i];
    return { ticker: e.t, name: e.n, cat: e.c, r: e.r, v: e.v, er: e.er, d: e.d, dollars: +best[i].toFixed(0), pct: +((best[i] / cash) * 100).toFixed(1), hk: hk != null ? +(hk * 100).toFixed(1) : null, lev, decay: decay != null ? +decay.toFixed(1) : null, adjR: lev ? +ar.toFixed(1) : null };
  }).filter(e => e.dollars >= minAlloc).sort((a, b) => b.dollars - a.dollars);
  // Ensure total deployment is at least 90% of cash
  const deployed = raw.reduce((s, r) => s + r.dollars, 0);
  const minDeploy = cash * 0.9;
  if (deployed < minDeploy && raw.length > 0) {
    const shortfall = minDeploy - deployed;
    const totalRaw = raw.reduce((s, r) => s + r.dollars, 0) || 1;
    raw.forEach(r => {
      const extra = Math.round(shortfall * (r.dollars / totalRaw));
      r.dollars += extra;
      r.pct = +((r.dollars / cash) * 100).toFixed(1);
    });
  }
  return raw;
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

// ─── Lightweight Markdown renderer for AI Advisor ───
function AiMarkdown({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  // Inline formatting: **bold**, *italic*, `code`, $amounts
  const fmt = (str) => {
    const parts = [];
    const rx = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|(\$[\d,.]+[kKmMbB]?%?))/g;
    let last = 0, m;
    while ((m = rx.exec(str)) !== null) {
      if (m.index > last) parts.push(str.slice(last, m.index));
      if (m[2]) parts.push(<strong key={m.index} style={{ color: cs.text, fontWeight: 700 }}>{m[2]}</strong>);
      else if (m[3]) parts.push(<em key={m.index} style={{ color: cs.dim }}>{m[3]}</em>);
      else if (m[4]) parts.push(<code key={m.index} style={{ background: "rgba(110,231,183,.08)", color: cs.green, padding: "1px 5px", borderRadius: 3, fontSize: 10, fontFamily: mono2 }}>{m[4]}</code>);
      else if (m[5]) parts.push(<span key={m.index} style={{ color: cs.blue, fontWeight: 600, fontFamily: mono2 }}>{m[5]}</span>);
      last = m.index + m[0].length;
    }
    if (last < str.length) parts.push(str.slice(last));
    return parts.length ? parts : str;
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) { i++; continue; }

    // Headers: ### / ## / #
    if (/^#{1,3}\s/.test(trimmed)) {
      const level = trimmed.match(/^(#{1,3})/)[1].length;
      const content = trimmed.replace(/^#{1,3}\s+/, "");
      const sizes = { 1: 15, 2: 13, 3: 12 };
      const colors = { 1: cs.green, 2: cs.blue, 3: cs.text };
      elements.push(<div key={i} style={{ fontSize: sizes[level], fontWeight: 700, color: colors[level], marginTop: elements.length ? 16 : 4, marginBottom: 6, letterSpacing: level === 1 ? ".02em" : 0 }}>{fmt(content)}</div>);
      i++; continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(<hr key={i} style={{ border: "none", borderTop: "1px solid rgba(255,255,255,.06)", margin: "12px 0" }} />);
      i++; continue;
    }

    // Bullet list items: - or • or *
    if (/^[-•*]\s/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\s*[-•*]\s/.test(lines[i]?.trim())) {
        items.push(lines[i].trim().replace(/^[-•*]\s+/, ""));
        i++;
      }
      elements.push(
        <div key={`ul-${i}`} style={{ margin: "6px 0 8px 0" }}>
          {items.map((item, j) => (
            <div key={j} style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
              <span style={{ color: cs.green, fontSize: 8, marginTop: 4, flexShrink: 0 }}>●</span>
              <span style={{ flex: 1 }}>{fmt(item)}</span>
            </div>
          ))}
        </div>
      );
      continue;
    }

    // Numbered list items: 1. 2. etc.
    if (/^\d+[.)]\s/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s/.test(lines[i]?.trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ""));
        i++;
      }
      elements.push(
        <div key={`ol-${i}`} style={{ margin: "6px 0 8px 0" }}>
          {items.map((item, j) => (
            <div key={j} style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
              <span style={{ color: cs.blue, fontSize: 10, fontWeight: 700, fontFamily: mono2, minWidth: 16, textAlign: "right", flexShrink: 0 }}>{j + 1}.</span>
              <span style={{ flex: 1 }}>{fmt(item)}</span>
            </div>
          ))}
        </div>
      );
      continue;
    }

    // Table detection: lines with | separators
    if (trimmed.includes("|") && trimmed.startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i]?.trim().includes("|") && lines[i]?.trim().startsWith("|")) {
        const tl = lines[i].trim();
        // Skip separator rows like |---|---|
        if (!/^[|\s-:]+$/.test(tl)) {
          tableLines.push(tl.split("|").filter(c => c.trim()).map(c => c.trim()));
        }
        i++;
      }
      if (tableLines.length > 0) {
        const header = tableLines[0];
        const rows = tableLines.slice(1);
        elements.push(
          <div key={`tbl-${i}`} style={{ margin: "8px 0", overflowX: "auto", borderRadius: 6, border: "1px solid rgba(255,255,255,.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
              <thead>
                <tr style={{ background: "rgba(110,231,183,.04)" }}>
                  {header.map((h, ci) => <th key={ci} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: cs.green, borderBottom: "1px solid rgba(255,255,255,.08)", fontFamily: mono2, fontSize: 9 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 ? "rgba(255,255,255,.01)" : "transparent" }}>
                    {row.map((cell, ci) => <td key={ci} style={{ padding: "5px 10px", borderBottom: "1px solid rgba(255,255,255,.03)", color: cs.text }}>{fmt(cell)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Regular paragraph
    elements.push(<p key={i} style={{ margin: "4px 0 8px 0", lineHeight: 1.7 }}>{fmt(trimmed)}</p>);
    i++;
  }

  return <div>{elements}</div>;
}

const TABS = ["My Holdings", "Deploy Cash", "Analysis", "Frontier", "AI Advisor", "Backtest"];
// ═══ MAIN APP ═══
export default function App() {
  const [etfs, setEtfs] = useState([]);       // {ticker, data, shares, costBasis, mktValue}
  const [stocks, setStocks] = useState([]);    // {ticker, name, shares, costBasis, mktValue, sector, locked:true}
  const [cashBalance, setCashBalance] = useState(0); // $ to deploy

  const [tab, setTab] = useState("My Holdings");
  const [sq, setSq] = useState(""); const [so, setSo] = useState(false); const [sc, setSc] = useState("All");
  const [srMode, setSrMode] = useState("std"); // "std" | "var" | "vol2"
  const [ot, setOt] = useState("max_sharpe");
  const [volTarget, setVolTarget] = useState(0);  // 0 = off, otherwise target vol %
  const [useKelly, setUseKelly] = useState(true); // Half Kelly toggle
  const [useRegime, setUseRegime] = useState(true); // Regime-adaptive toggle
  const [taxState, setTaxState] = useState("None"); // State for tax calc
  const [optResult, setOptResult] = useState(null);
  const [aiText, setAiText] = useState(""); const [aiL, setAiL] = useState(false); const [aiCtx, setAiCtx] = useState("deploy");
  const [live, setLive] = useState({}); const [liveL, setLiveL] = useState(false); const [lastF, setLastF] = useState(null);
  const [sf, setSf] = useState({ t: "", n: "", sh: "", cb: "", sec: "Technology" });
  const [stockDD, setStockDD] = useState(false); const [stockResults, setStockResults] = useState([]);
  const [stockSearching, setStockSearching] = useState(false); const [stockTimer, setStockTimer] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addType, setAddType] = useState("stock"); // "stock" or "etf"
  const [accepted, setAccepted] = useState(new Set()); // tickers accepted from optimizer

  // ── Backtest state ──
  const [btRunning, setBtRunning] = useState(false);
  const [btProgress, setBtProgress] = useState("");
  const [btResult, setBtResult] = useState(null);
  const [btStartCash, setBtStartCash] = useState(100000);
  const [btExpandedYear, setBtExpandedYear] = useState(null);

  // ── Regime state ──
  const [regimeData, setRegimeData] = useState(null);
  const [regimeLoading, setRegimeLoading] = useState(false);
  const [regimeError, setRegimeError] = useState("");
  const [regimeAnalytics, setRegimeAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchRegime = useCallback(async () => {
    setRegimeLoading(true); setRegimeError("");
    try {
      const resp = await fetch("/api/regime");
      const text = await resp.text();
      let json;
      try { json = JSON.parse(text); } catch (e) { throw new Error("Server returned non-JSON: " + text.slice(0, 100)); }
      if (resp.ok && json.regime) { setRegimeData(json); }
      else { setRegimeError(json.error || "Failed to fetch regime data"); }
    } catch (e) { setRegimeError("Error: " + e.message); }
    setRegimeLoading(false);
  }, []);

  const fetchRegimeAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const resp = await fetch("/api/regime?analytics=true");
      const text = await resp.text();
      let json;
      try { json = JSON.parse(text); } catch (e) { throw new Error("Server returned non-JSON: " + text.slice(0, 100)); }
      if (resp.ok && json.analytics) {
        setRegimeAnalytics(json.analytics);
        if (json.regime) setRegimeData(prev => prev ? { ...prev, regime: json.regime } : { regime: json.regime });
      }
    } catch (e) { console.warn("Analytics fetch failed:", e); }
    setAnalyticsLoading(false);
  }, []);

  const didHydrate = useRef(false);

  // ── Backtest runner ──
  const runBacktest = useCallback(async () => {
    setBtRunning(true); setBtResult(null); setBtProgress("Fetching historical data..."); setBtExpandedYear(null);

    // ── Fetch historical regime data from FRED (if regime enabled) ──
    let historicalRegimes = null;
    if (useRegime) {
      setBtProgress("Fetching historical regime data from FRED (HY OAS, VIX, NFCI)...");
      try {
        const regResp = await fetch("/api/regime?history=true");
        const regJson = await regResp.json();
        if (regJson.monthlyRegimes) {
          historicalRegimes = {};
          regJson.monthlyRegimes.forEach(r => { historicalRegimes[r.date] = r; });
          setBtProgress(`Got ${regJson.monthlyRegimes.length} months of regime data. Now fetching ETF prices...`);
        }
      } catch (e) {
        setBtProgress("Warning: Could not fetch regime data, using proxy. Fetching ETF prices...");
      }
    }

    // Core ETF universe for backtest — focused on uncorrelated categories for better optimization
    // (fewer but more diverse ETFs runs faster AND produces better results than 80+ correlated funds)
    const btETFs = [
      // US Broad
      "SPY","VTI","QQQ","IWM",
      // Schwab
      "SCHD","SCHG","SCHF",
      // International
      "VEA","VWO","EFA","MCHI",
      // Sector
      "XLK","XLF","XLV","XLE","XLU","XLRE",
      // Thematic
      "SOXX","ARKK","ICLN",
      // Factor
      "VIG","MTUM","USMV",
      // Fixed Income
      "BND","AGG","TIP","IEF","HYG",
      // Commodity
      "GLD","SLV","DBC",
      // Dividend
      "SCHD","HDV","DGRO",
    ];
    const benchmarks = ["SPY"];

    const allSymbols = [...new Set([...btETFs, ...benchmarks])];
    setBtProgress(`Fetching ${allSymbols.length} ETFs (2015-2025)...`);

    let histData = {};
    try {
      // Fetch in large batches — Yahoo Finance has no rate limit
      for (let i = 0; i < allSymbols.length; i += 15) {
        const batch = allSymbols.slice(i, i + 15);
        setBtProgress(`Fetching batch ${Math.floor(i/15)+1}/${Math.ceil(allSymbols.length/15)}: ${batch.join(", ")}...`);
        const resp = await fetch(`/api/history?symbols=${batch.join(",")}&start=2015-01-01&end=2025-12-31`);
        const json = await resp.json();
        if (json.data) Object.assign(histData, json.data);
      }
    } catch (e) {
      setBtProgress("Error fetching historical data: " + e.message);
      setBtRunning(false); return;
    }

    const available = Object.keys(histData).filter(k => histData[k]?.length >= 12);
    if (available.length < 3) {
      setBtProgress("Not enough historical data. Only got: " + available.join(", "));
      setBtRunning(false); return;
    }

    setBtProgress(`Processing ${available.length} ETFs...`);

    // Build monthly returns for each symbol
    // Pre-index monthly returns by date key for O(1) lookup
    const monthlyReturns = {};
    const returnsByDateSym = {};
    const allDateKeys = new Set();
    for (const sym of available) {
      const prices = histData[sym];
      monthlyReturns[sym] = [];
      for (let i = 1; i < prices.length; i++) {
        const dateKey = prices[i].date.slice(0, 7);
        const entry = { date: prices[i].date, ret: (prices[i].close - prices[i - 1].close) / prices[i - 1].close, close: prices[i].close };
        monthlyReturns[sym].push(entry);
        if (!returnsByDateSym[dateKey]) returnsByDateSym[dateKey] = {};
        returnsByDateSym[dateKey][sym] = entry;
        allDateKeys.add(dateKey);
      }
    }
    const sortedDates = [...allDateKeys].sort();
    const dateToIdx = {}; sortedDates.forEach((d, i) => { dateToIdx[d] = i; });

    // ═══ MONTHLY MONITORING WITH CONDITIONAL REBALANCING ═══
    const startCash = btStartCash;
    const optCurve = [{ date: "2016-01", value: startCash }];
    const spyCurve = [{ date: "2016-01", value: startCash }];
    const bal60Curve = [{ date: "2016-01", value: startCash }];
    let optValue = startCash, spyValue = startCash, bal60Value = startCash;
    let optAlloc = {};
    let totalTaxPaid = 0, totalRebalances = 0;
    let totalTaxSaved = 0; // tax saved via loss offsets
    let lossCarryover = 0; // unused losses carried forward to future periods
    let lastRebalanceMonth = null;
    let lastBestWeights = null; // for warm-starting optimizer
    const btTaxRates = getTaxRates(taxState);
    const rebalanceEvents = [];
    const etfDbMap = {}; ETF_DB.forEach(e => { etfDbMap[e.t] = e; });
    // Only simulate months where SPY data actually exists
    const spyDates = new Set(Object.keys(returnsByDateSym).filter(k => returnsByDateSym[k]["SPY"]));
    const simDates = sortedDates.filter(d => d >= "2016-01" && d <= "2025-12" && spyDates.has(d));

    for (let mi = 0; mi < simDates.length; mi++) {
      const monthKey = simDates[mi];
      const mIdx = dateToIdx[monthKey];
      const mYear = parseInt(monthKey.slice(0, 4));
      const mMonth = parseInt(monthKey.slice(5, 7)) - 1;
      const monthData = returnsByDateSym[monthKey] || {};
      try {

      // Step 1: Apply returns
      if (Object.keys(optAlloc).length > 0) {
        let optMonthRet = 0;
        for (const [sym, wt] of Object.entries(optAlloc)) {
          const md = monthData[sym];
          if (md) optMonthRet += wt * md.ret;
        }
        optValue *= (1 + optMonthRet);
      }
      const spyMd = monthData["SPY"];
      if (spyMd) spyValue *= (1 + spyMd.ret);
      bal60Value *= (1 + 0.6 * (monthData["VTI"]?.ret || 0) + 0.4 * (monthData["BND"]?.ret || 0));
      optCurve.push({ date: monthKey, value: optValue });
      spyCurve.push({ date: monthKey, value: spyValue });
      bal60Curve.push({ date: monthKey, value: bal60Value });

      // Step 2: Pre-screen
      const prevTickers = Object.keys(optAlloc);
      const isFirstAllocation = prevTickers.length === 0;
      const monthsSinceRebal = lastRebalanceMonth ? (mIdx - dateToIdx[lastRebalanceMonth]) : 999;
      let btRegime = null, btState5 = null, btRegimeScore = null, btAcceleration = null;
      let btDuration = 0, btTransition = null, regimeChanged = false;
      if (useRegime && historicalRegimes) {
        const regData = historicalRegimes[monthKey];
        if (regData) {
          btState5 = regData.state5 || null; btRegimeScore = regData.score; btAcceleration = regData.acceleration || null;
          const regime3 = regData.regime; btDuration = 1;
          for (let lb = 1; lb <= 36 && mIdx - lb >= 0; lb++) {
            const prev = historicalRegimes[sortedDates[mIdx - lb]];
            if (prev && prev.regime === regime3) btDuration++; else { if (prev) btTransition = `${prev.regime}→${regime3}`; break; }
          }
          btRegime = { state5: btState5 || regime3, acceleration: btAcceleration || 0, duration: btDuration, transition: btTransition };
          if (mi > 0) { const prevReg = historicalRegimes[simDates[mi - 1]]; if (prevReg && prevReg.regime !== regime3) regimeChanged = true; }
        }
      }
      if (!(isFirstAllocation || regimeChanged || mMonth % 3 === 0)) { continue; }
      if (!isFirstAllocation && monthsSinceRebal < 2) { continue; }
      // Yield to UI every evaluation to prevent freeze
      setBtProgress(`Evaluating ${monthKey}...`);
      await new Promise(r => setTimeout(r, 0));

      // Step 3: Trailing stats (fast index-based)
      const trailingStats = {};
      const trailStart = Math.max(0, mIdx - 12);
      for (const sym of available) {
        let sumRet = 0, sumRetSq = 0, count = 0;
        for (let ti = trailStart; ti < mIdx; ti++) {
          const entry = returnsByDateSym[sortedDates[ti]]?.[sym];
          if (entry) { sumRet += entry.ret; sumRetSq += entry.ret * entry.ret; count++; }
        }
        if (count < 6) continue;
        const avgMo = sumRet / count;
        const db = etfDbMap[sym];
        trailingStats[sym] = { t: sym, n: db?.n || sym, c: db?.c || "US Large Cap", r: avgMo * 12 * 100, v: Math.max(Math.sqrt(Math.max(0, sumRetSq / count - avgMo * avgMo)) * Math.sqrt(12) * 100, 1), er: db?.er || 0.1, d: db?.d || 0, lev: db?.lev || null };
      }
      const allCandidates = Object.values(trailingStats).filter(s => s.t !== "SPY" && s.v > 0 && s.r > -50);
      // Pre-filter to top 25 by trailing Sharpe — keeps optimizer O(n²) fast
      const candidates = allCandidates.sort((a, b) => ((b.r - 4) / b.v) - ((a.r - 4) / a.v)).slice(0, 15);
      if (candidates.length < 3) continue;

      // Step 4: Optimizer (1000 iterations for speed)
      // Build warm-start weights: map previous best allocation to current candidate indices
      let warmWeights = null;
      if (lastBestWeights) {
        warmWeights = new Float64Array(candidates.length);
        for (let i = 0; i < candidates.length; i++) {
          warmWeights[i] = lastBestWeights[candidates[i].t] || 0;
        }
      }
      const result = optimizeCash([], optValue, 0, candidates, ot, srMode, volTarget, useKelly, btRegime, 300, warmWeights);
      if (!result || result.length === 0) continue;
      // Save best weights for warm-starting next evaluation
      lastBestWeights = {};
      result.forEach(r => { lastBestWeights[r.ticker] = r.dollars / (optValue || 1); });
      const newAlloc = {}; const totalDeployed = result.reduce((s, r) => s + r.dollars, 0) || optValue;
      result.forEach(r => { newAlloc[r.ticker] = r.dollars / totalDeployed; });

      // Step 5: Compare
      const prevAlloc = { ...optAlloc }; const spyExpRet = trailingStats["SPY"]?.r || 10;
      let currExpRet = 0; for (const [sym, wt] of Object.entries(prevAlloc)) currExpRet += wt * (trailingStats[sym]?.r || spyExpRet);
      let propExpRet = 0; for (const [sym, wt] of Object.entries(newAlloc)) if (trailingStats[sym]) propExpRet += wt * trailingStats[sym].r;

      // Step 6: Tax cost with loss offset
      const allTkrs = [...new Set([...prevTickers, ...Object.keys(newAlloc)])];
      const trades = allTkrs.map(ticker => { const ow = prevAlloc[ticker] || 0, nw = newAlloc[ticker] || 0, ch = nw - ow; if (Math.abs(ch) < 0.005) return null; const rc = result.find(r => r.ticker === ticker); return { ticker, name: rc?.name || candidates.find(c => c.t === ticker)?.n || ticker, cat: rc?.cat || candidates.find(c => c.t === ticker)?.c || "", oldWt: +(ow * 100).toFixed(1), newWt: +(nw * 100).toFixed(1), change: +(ch * 100).toFixed(1), action: ch > 0.005 ? "BUY" : "SELL", dollars: Math.abs(ch) * optValue }; }).filter(Boolean).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

      // Compute realized gains AND losses separately
      let grossGains = 0, grossLosses = 0;
      for (const sell of trades.filter(t => t.action === "SELL")) {
        const tr = trailingStats[sell.ticker]?.r / 100 || 0;
        const costBasis = tr > -0.99 ? sell.dollars / (1 + tr) : sell.dollars;
        const gl = sell.dollars - costBasis;
        if (gl > 0) grossGains += gl;
        else grossLosses += Math.abs(gl); // track as positive number
      }

      // Net gains/losses: losses offset gains dollar-for-dollar
      // Plus apply any carried-over losses from prior periods
      const availableLosses = grossLosses + lossCarryover;
      const netGains = Math.max(0, grossGains - availableLosses);
      const excessLosses = Math.max(0, availableLosses - grossGains);

      // Up to $3,000/year of excess losses can offset ordinary income
      // (simplified: we count this as a tax benefit at the ST rate)
      const mYearForCap = parseInt(monthKey.slice(0, 4));
      const ordinaryIncomeOffset = Math.min(excessLosses, 3000);
      const ordinaryTaxSaved = ordinaryIncomeOffset * (btTaxRates.st / 100);

      // Remaining excess losses carry forward
      const newCarryover = excessLosses - ordinaryIncomeOffset;

      const appRate = monthsSinceRebal >= 12 ? btTaxRates.lt : btTaxRates.st;
      const grossTax = grossGains * (appRate / 100); // what tax WOULD be without offsets
      const netTax = netGains * (appRate / 100); // actual tax after loss offset
      const taxSaved = grossTax - netTax + ordinaryTaxSaved;
      const estTC = netTax; // actual tax owed
      const tcPct = optValue > 0 ? (estTC / optValue) * 100 : 0;

      // Step 7: Decision (uses net tax cost, which is lower thanks to loss offsets)
      const retImp = propExpRet - currExpRet; const curAlpha = currExpRet - spyExpRet;
      let hurdle; if (isFirstAllocation) hurdle = -999; else if (btTransition && btTransition.includes("bear") && btTransition.includes("→") && btDuration >= 2 && btDuration <= 8) hurdle = tcPct * 1.0; else if (curAlpha > 3) hurdle = tcPct * 2.5; else if (curAlpha < -2) hurdle = tcPct * 1.2; else hurdle = tcPct * 1.5;

      if (isFirstAllocation || retImp > hurdle) {
        optAlloc = newAlloc; optValue -= estTC; totalTaxPaid += estTC; totalTaxSaved += taxSaved; totalRebalances++; lastRebalanceMonth = monthKey;
        lossCarryover = newCarryover; // update carryover
        rebalanceEvents.push({ date: monthKey, decision: "REBALANCE", holdings: result.map(r => ({ ticker: r.ticker, name: r.name, cat: r.cat, weight: +((newAlloc[r.ticker] || 0) * 100).toFixed(1), dollars: Math.round((newAlloc[r.ticker] || 0) * optValue) })).filter(h => h.weight > 0).sort((a, b) => b.weight - a.weight), trades,
          taxPaid: Math.round(estTC), grossTax: Math.round(grossTax), taxSaved: Math.round(taxSaved),
          grossGains: Math.round(grossGains), grossLosses: Math.round(grossLosses), realizedGains: Math.round(netGains),
          lossOffset: Math.round(Math.min(grossGains, availableLosses)), lossCarryover: Math.round(newCarryover),
          returnImprovement: +retImp.toFixed(1), taxCostPct: +tcPct.toFixed(2), currAlpha: +curAlpha.toFixed(1), taxRate: appRate, taxType: monthsSinceRebal >= 12 ? "LT" : "ST", regime: btState5, regimeScore: btRegimeScore, acceleration: btAcceleration, duration: btDuration, transition: btTransition });
      }

      } catch (e) { console.error(`Backtest error at ${monthKey}:`, e); }
    }

    // ═══ AGGREGATE INTO ANNUAL RESULTS FOR DISPLAY ═══
    const annualResults = [];
    const simYears = [...new Set(simDates.map(d => parseInt(d.slice(0, 4))))].sort();
    for (const year of simYears) {
      // Find year boundaries in curve data
      const yearCurve = optCurve.filter(p => p.date.startsWith(String(year)));
      const spyYearCurve = spyCurve.filter(p => p.date.startsWith(String(year)));
      const bal60YearCurve = bal60Curve.filter(p => p.date.startsWith(String(year)));

      const prevYearEnd = optCurve.filter(p => p.date.startsWith(String(year - 1)));
      const optYearStart = prevYearEnd.length > 0 ? prevYearEnd[prevYearEnd.length - 1].value : startCash;
      const optYearEnd = yearCurve.length > 0 ? yearCurve[yearCurve.length - 1].value : optYearStart;

      const spyPrevEnd = spyCurve.filter(p => p.date.startsWith(String(year - 1)));
      const spyYearStart = spyPrevEnd.length > 0 ? spyPrevEnd[spyPrevEnd.length - 1].value : startCash;
      const spyYearEnd = spyYearCurve.length > 0 ? spyYearCurve[spyYearCurve.length - 1].value : spyYearStart;

      const bal60PrevEnd = bal60Curve.filter(p => p.date.startsWith(String(year - 1)));
      const bal60YearStart = bal60PrevEnd.length > 0 ? bal60PrevEnd[bal60PrevEnd.length - 1].value : startCash;
      const bal60YearEnd = bal60YearCurve.length > 0 ? bal60YearCurve[bal60YearCurve.length - 1].value : bal60YearStart;

      // Rebalance events this year
      const yearEvents = rebalanceEvents.filter(e => e.date.startsWith(String(year)));
      const lastEvent = yearEvents.length > 0 ? yearEvents[yearEvents.length - 1] : null;
      const yearTaxPaid = yearEvents.reduce((s, e) => s + (e.taxPaid || 0), 0);
      const yearRealizedGains = yearEvents.reduce((s, e) => s + (e.realizedGains || 0), 0);
      const yearGrossGains = yearEvents.reduce((s, e) => s + (e.grossGains || 0), 0);
      const yearGrossLosses = yearEvents.reduce((s, e) => s + (e.grossLosses || 0), 0);
      const yearTaxSaved = yearEvents.reduce((s, e) => s + (e.taxSaved || 0), 0);
      const yearLossOffset = yearEvents.reduce((s, e) => s + (e.lossOffset || 0), 0);

      // Get current holdings (from last rebalance event up to this year)
      const allEventsToDate = rebalanceEvents.filter(e => e.date <= `${year}-12`);
      const latestAlloc = allEventsToDate.length > 0 ? allEventsToDate[allEventsToDate.length - 1] : null;

      annualResults.push({
        year,
        optRet: optYearStart > 0 ? ((optYearEnd - optYearStart) / optYearStart * 100) : 0,
        spyRet: spyYearStart > 0 ? ((spyYearEnd - spyYearStart) / spyYearStart * 100) : 0,
        bal60Ret: bal60YearStart > 0 ? ((bal60YearEnd - bal60YearStart) / bal60YearStart * 100) : 0,
        alloc: { ...optAlloc },
        holdings: latestAlloc?.holdings || [],
        trades: yearEvents.flatMap(e => e.trades || []),
        portfolioValue: Math.round(optYearEnd),
        taxPaid: Math.round(yearTaxPaid),
        realizedGains: Math.round(yearRealizedGains),
        grossGains: Math.round(yearGrossGains),
        grossLosses: Math.round(yearGrossLosses),
        taxSaved: Math.round(yearTaxSaved),
        lossOffset: Math.round(yearLossOffset),
        decision: yearEvents.length > 0 ? `${yearEvents.length} REBALANCE${yearEvents.length > 1 ? "S" : ""}` : "HOLD",
        rebalanceCount: yearEvents.length,
        rebalanceEvents: yearEvents,
        returnImprovement: lastEvent?.returnImprovement || 0,
        taxCostPct: lastEvent?.taxCostPct || 0,
        currAlpha: lastEvent?.currAlpha || 0,
        regime: latestAlloc?.regime || null,
        state5: latestAlloc?.regime || null,
        regimeScore: lastEvent?.regimeScore || null,
        probBear: null,
        acceleration: lastEvent?.acceleration || null,
        duration: lastEvent?.duration || 0,
        transition: lastEvent?.transition || null,
      });
    }

    // Compute summary stats
    const optTotal = (optValue / startCash - 1) * 100;
    const spyTotal = (spyValue / startCash - 1) * 100;
    const bal60Total = (bal60Value / startCash - 1) * 100;
    const numYears = simYears.length;
    const optCAGR = (Math.pow(optValue / startCash, 1 / numYears) - 1) * 100;
    const spyCAGR = (Math.pow(spyValue / startCash, 1 / numYears) - 1) * 100;
    const bal60CAGR = (Math.pow(bal60Value / startCash, 1 / numYears) - 1) * 100;

    // Max drawdown
    const calcDD = (curve) => {
      let peak = 0, maxDD = 0;
      for (const pt of curve) { peak = Math.max(peak, pt.value); maxDD = Math.max(maxDD, (peak - pt.value) / peak); }
      return maxDD * 100;
    };

    // Volatility from monthly returns
    const calcVol = (curve) => {
      const rets = [];
      for (let i = 1; i < curve.length; i++) rets.push(curve[i].value / curve[i-1].value - 1);
      if (rets.length < 2) return 0;
      const avg = rets.reduce((s, r) => s + r, 0) / rets.length;
      const v = rets.reduce((s, r) => s + (r - avg) ** 2, 0) / (rets.length - 1);
      return Math.sqrt(v) * Math.sqrt(12) * 100;
    };

    const optVol = calcVol(optCurve);
    const spyVol = calcVol(spyCurve);
    const bal60Vol = calcVol(bal60Curve);

    setBtResult({
      curves: { opt: optCurve, spy: spyCurve, bal60: bal60Curve },
      summary: {
        opt: { final: optValue, total: optTotal, cagr: optCAGR, vol: optVol, dd: calcDD(optCurve), sharpe: optVol > 0 ? (optCAGR - RF) / optVol : 0 },
        spy: { final: spyValue, total: spyTotal, cagr: spyCAGR, vol: spyVol, dd: calcDD(spyCurve), sharpe: spyVol > 0 ? (spyCAGR - RF) / spyVol : 0 },
        bal60: { final: bal60Value, total: bal60Total, cagr: bal60CAGR, vol: bal60Vol, dd: calcDD(bal60Curve), sharpe: bal60Vol > 0 ? (bal60CAGR - RF) / bal60Vol : 0 },
      },
      annual: annualResults,
      startCash,
      etfsUsed: available.length,
      regimeSource: historicalRegimes ? "FRED v2 (7-factor, 5-state, daily EMA)" : "Proxy (SPY momentum/vol)",
      tax: {
        totalPaid: Math.round(totalTaxPaid),
        totalSaved: Math.round(totalTaxSaved),
        finalCarryover: Math.round(lossCarryover),
        rates: btTaxRates,
        state: taxState,
        effectiveDrag: startCash > 0 ? ((totalTaxPaid / startCash) * 100).toFixed(1) : 0,
        rebalances: totalRebalances,
        holds: (simDates.length - totalRebalances),
        rebalanceEvents,
      },
    });
    setBtProgress(""); setBtRunning(false);
  }, [ot, srMode, volTarget, useKelly, useRegime, taxState, btStartCash]);
  
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
    if (typeof saved.srMode === "string") setSrMode(saved.srMode);
    if (typeof saved.ot === "string") setOt(saved.ot);
    if (typeof saved.volTarget === "number") setVolTarget(saved.volTarget);
    if (typeof saved.useKelly === "boolean") setUseKelly(saved.useKelly);
    if (typeof saved.useRegime === "boolean") setUseRegime(saved.useRegime);
    if (typeof saved.taxState === "string") setTaxState(saved.taxState);

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
      srMode,
      ot,
      volTarget,
      useKelly,
      useRegime,
      taxState,
      sc,
      so,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [etfs, stocks, cashBalance, tab, srMode, ot, volTarget, useKelly, useRegime, taxState, sc, so]);

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
    try { if (cashBalance <= 0) return null; return genFrontier(allPos, cashBalance, holdingsVal, ETF_DB.slice(0, 30)); } catch (e) { return null }
  }, [allPos, cashBalance, holdingsVal]);

  // ─── Ticker search ───
  const searchTicker = useCallback((query) => {
    if (!query || query.length < 1) { setStockResults([]); return }
    const q = query.toUpperCase();
    const db = addType === "etf" ? ETF_DB.map(e => ({ t: e.t, n: e.n, s: e.c })) : STOCK_DB;
    const local = db.filter(s => s.t.startsWith(q) || s.t.includes(q) || s.n.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
    setStockResults(local);
    // Live API fallback for both stocks AND ETFs when local results are thin
    if (local.length < 3 && query.length >= 2) {
      if (stockTimer) clearTimeout(stockTimer);
      const timer = setTimeout(async () => {
        setStockSearching(true);
        try {
          const kind = addType === "etf" ? "ETF" : "stock";
          const resp = await fetch("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: `${kind} tickers matching "${query}" tradable on Schwab. Return ONLY JSON array: [{"t":"TICKER","n":"Name","s":"Category"}] up to 8. Categories for ETFs: US Large Cap/US Growth/US Value/US Mid Cap/US Small Cap/US Dividend/International/Intl Developed/Emerging Mkts/Sector Tech/Sector Health/Sector Finance/Sector Energy/Sector Indust/Sector Consumer/Sector RE/Sector Utilities/Sector Materials/Sector Comms/Factor Momentum/Factor Quality/Factor LowVol/US Bond/US Treasury/US Corp Bond/US High Yield/Intl Bond/Commodity. Categories for stocks: Technology/Healthcare/Financial/Energy/Consumer/Industrial/Real Estate/Communications/Utilities/Materials. No markdown.` }),
          });
          const data = await resp.json();
          if (data.text) {
            try { const parsed = JSON.parse(data.text.replace(/```json|```/g, "").trim()); if (Array.isArray(parsed)) { const seen = new Set(local.map(l => l.t)); const merged = [...local]; parsed.forEach(p => { if (p.t && !seen.has(p.t)) { seen.add(p.t); merged.push(p) } }); setStockResults(merged.slice(0, 10)); } } catch (e) { }
          }
        } catch (e) { }
        setStockSearching(false);
      }, 400);
      setStockTimer(timer);
    }
  }, [stockTimer, addType]);

  // ─── Select from dropdown → fetch live price via Twelve Data ───
  const selectTicker = useCallback(async (stk) => {
    setSf(f => ({ ...f, t: stk.t, n: stk.n, sec: stk.s })); setStockDD(false); setStockResults([]); setAdding(true);
    try {
      const resp = await fetch(`/api/prices?tickers=${stk.t}`);
      if (resp.ok) {
        const json = await resp.json();
        const info = json.data?.[stk.t];
        if (info?.price) {
          setSf(f => ({ ...f, livePrice: info.price }));
        }
      }
    } catch (e) { console.warn("Ticker price lookup failed:", e); }
    setAdding(false);
  }, []);

  // ─── Add holding ───
  const addHolding = useCallback(() => {
    if (!sf.t) return;
    const ticker = sf.t.toUpperCase(); const shares = +sf.sh || 0; const costBasis = +sf.cb || 0;
    const price = sf.livePrice || costBasis; const mktValue = price * shares;
    const purchaseDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    if (addType === "etf") {
      if (etfs.find(e => e.ticker === ticker)) return;
      let etfData = ETF_DB.find(e => e.t === ticker);
      if (!etfData) {
        const cat = sf.sec || "US Large Cap";
        etfData = { t: ticker, n: sf.n || ticker, c: cat, h: 50, er: .20, r: 8.0, v: 18.0, d: 1.0 };
      }
      setEtfs(p => [...p, { ticker, data: etfData, shares, costBasis, mktValue, type: "etf", purchaseDate }]);
    } else {
      if (stocks.find(s => s.ticker === ticker)) return;
      setStocks(p => [...p, { ticker, name: sf.n || ticker, shares, costBasis, mktValue, sector: sf.sec || "Technology", type: "stock", locked: true, purchaseDate }]);
    }
    setSf({ t: "", n: "", sh: "", cb: "", sec: "Technology" });
  }, [sf, addType, etfs, stocks]);

  const removeHolding = useCallback((ticker, type) => {
    if (type === "etf") setEtfs(p => p.filter(e => e.ticker !== ticker));
    else setStocks(p => p.filter(s => s.ticker !== ticker));
  }, []);

  // ─── Toggle optimizer recommendation → add or remove ETF holding, adjust cash ───
  const toggleRec = useCallback(async (rec) => {
    const alreadyAdded = accepted.has(rec.ticker);
    if (alreadyAdded) {
      // DESELECT: remove from holdings, refund cash
      const existing = etfs.find(e => e.ticker === rec.ticker);
      const refund = existing ? existing.mktValue || 0 : rec.dollars;
      setEtfs(p => p.filter(e => e.ticker !== rec.ticker));
      setCashBalance(prev => prev + refund);
      setAccepted(prev => { const next = new Set(prev); next.delete(rec.ticker); return next; });
    } else {
      // SELECT: add to holdings, deduct cash
      let price = 0;
      try {
        const resp = await fetch(`/api/prices?tickers=${rec.ticker}`);
        if (resp.ok) { const json = await resp.json(); price = json.data?.[rec.ticker]?.price || 0; }
      } catch (e) { }
      const shares = price > 0 ? Math.floor(rec.dollars / price) : 0;
      const actualCost = price > 0 ? shares * price : rec.dollars;
      let etfData = ETF_DB.find(e => e.t === rec.ticker);
      if (!etfData) {
        etfData = { t: rec.ticker, n: rec.name, c: rec.cat, h: 50, er: rec.er || .20, r: rec.r || 8.0, v: rec.v || 18.0, d: rec.d || 0 };
      }
      setEtfs(p => [...p, { ticker: rec.ticker, data: etfData, shares, costBasis: price || 0, mktValue: actualCost, type: "etf", purchaseDate: new Date().toISOString().slice(0, 10) }]);
      setCashBalance(prev => Math.max(0, prev - actualCost));
      setAccepted(prev => new Set([...prev, rec.ticker]));
    }
  }, [accepted, etfs]);

  // ─── Fetch live prices via Twelve Data (serverless proxy) ───
  const fetchLive = useCallback(async () => {
    setLiveL(true);
    try {
      const tickers = [...etfs.map(e => e.ticker), ...stocks.map(s => s.ticker)].filter(Boolean);
      if (!tickers.length) { setLiveL(false); return; }
      const results = {};
      // Batch up to 50 per request (Twelve Data supports batch via comma)
      for (let i = 0; i < tickers.length; i += 50) {
        const batch = tickers.slice(i, i + 50);
        try {
          const resp = await fetch(`/api/prices?tickers=${batch.join(",")}`);
          if (resp.ok) {
            const json = await resp.json();
            if (json.data) Object.assign(results, json.data);
          }
        } catch (e) { console.warn("Price fetch batch failed:", e); }
      }
      if (Object.keys(results).length > 0) {
        setLive(results); setLastF(new Date());
      }
    } catch (e) { console.warn("Price fetch failed:", e); }
    setLiveL(false);
  }, [etfs, stocks]);

  // ─── Optimizer ───
  const runOptimizer = useCallback(() => {
    if (cashBalance <= 0) return;
    // Build full regime context for the optimizer
    let regimeCtx = null;
    if (useRegime && regimeData?.regime) {
      const r = regimeData.regime;
      regimeCtx = {
        state5: r.state5 || r.regime || "neutral",
        acceleration: r.acceleration || 0,
        duration: 1, // live = current snapshot, duration unknown without analytics
        transition: null,
      };
      // If we have analytics data, use the current position info
      if (regimeAnalytics?.current) {
        regimeCtx.duration = regimeAnalytics.current.runLength || 1;
        regimeCtx.transition = regimeAnalytics.current.transition || null;
      }
    }
    const result = optimizeCash(allPos, cashBalance, holdingsVal, ETF_DB, ot, srMode, volTarget, useKelly, regimeCtx);
    setOptResult(result);
    setAccepted(new Set());
  }, [allPos, cashBalance, holdingsVal, ot, srMode, volTarget, useKelly, useRegime, regimeData, regimeAnalytics]);

  // ─── AI Advisor (via serverless proxy) ───
  const getAI = useCallback(async (ctx) => {
    setAiL(true); setAiText("");
    const summary = {
      existingETFs: etfV.map(e => {
        const hp = holdingPeriod(e.purchaseDate);
        const gl = e.shares > 0 && e.costBasis > 0 ? e.mktValue - (e.shares * e.costBasis) : null;
        return { ticker: e.ticker, name: e.data?.n, shares: e.shares, costBasis: e.costBasis, mktValue: e.mktValue, category: e.data?.c, expenseRatio: e.data?.er, unrealizedGL: gl, holdingPeriod: hp?.label || null, isLongTerm: hp?.isLT || null, daysToLT: hp?.daysToLT || null };
      }),
      lockedStocks: stockV.map(s => {
        const hp = holdingPeriod(s.purchaseDate);
        return { ticker: s.ticker, name: s.name, shares: s.shares, costBasis: s.costBasis, mktValue: s.mktValue, sector: s.sector, unrealizedGL: s.mktValue - (s.costBasis * s.shares), holdingPeriod: hp?.label || null, isLongTerm: hp?.isLT || null, daysToLT: hp?.daysToLT || null };
      }),
      holdingsValue: holdingsVal, cashToInvest: cashBalance, totalValue: totalVal,
      metrics: metrics ? { ret: metrics.er.toFixed(2), vol: metrics.vol.toFixed(2), sharpe: metrics.sh.toFixed(3) } : null,
      optimizerSuggestion: optResult?.slice(0, 8),
      taxRates: { state: taxState, stateName: STATE_NAMES[taxState], shortTerm: taxRates.st, longTerm: taxRates.lt, federal_ST: FED_ST_RATE, federal_LT: FED_LT_RATE + NIIT_RATE, stateRate: taxRates.state },
    };
    const fmtInst = `\n\nFormat your response with clear markdown: use ## headers for sections, bullet points (- ) for lists, **bold** for tickers and key figures, numbered lists for action steps, and | tables | for comparisons when helpful. Be specific with dollar amounts and percentages.`;
    const prompts = {
      deploy: `Expert portfolio advisor. I have $${cashBalance.toLocaleString()} cash to invest. My existing holdings below include individual stocks that are LOCKED (cannot be sold). Recommend specific ETF purchases to optimally deploy this cash. Consider diversification gaps, sector exposure relative to locked stocks, risk-adjusted returns, and correlation. Give exact dollar amounts.${fmtInst}\n\n${JSON.stringify(summary, null, 2)}`,
      risk: `Risk management expert. Analyze concentration risk, correlation, tail risk in this portfolio. Stocks are LOCKED. How should the new cash be deployed to reduce risk?${fmtInst}\n\n${JSON.stringify(summary, null, 2)}`,
      rebalance: `Portfolio rebalancing expert. Analyze my current portfolio allocation vs optimal targets. My stocks are LOCKED and cannot be sold. For my ETF positions, suggest specific rebalancing trades: which ETFs to trim (sell partial shares) and which to add to, with exact dollar amounts and share counts. CRITICAL TAX CONSIDERATIONS: My tax rates are ${taxRates.st.toFixed(1)}% for short-term gains and ${taxRates.lt.toFixed(1)}% for long-term gains (${taxState === "None" ? "Federal only" : STATE_NAMES[taxState] + " + Federal"}). For each sell recommendation: 1) Check whether the position has an unrealized gain or loss 2) Check the holding period — if close to 1 year (daysToLT < 60), strongly recommend WAITING to convert ST to LT gains 3) Calculate the after-tax net benefit of the trade: expected improvement minus tax cost 4) Only recommend selling if the after-tax benefit is positive 5) Prefer selling positions with losses (tax-loss harvesting) or long-term positions over short-term gainers. Also consider using available cash ($${cashBalance.toLocaleString()}) to rebalance rather than selling.${fmtInst}\n\n${JSON.stringify(summary, null, 2)}`,
      taxloss: `Tax-loss harvesting expert. Analyze my portfolio for tax-loss harvesting opportunities. My tax rates are ${taxRates.st.toFixed(1)}% short-term and ${taxRates.lt.toFixed(1)}% long-term (${taxState === "None" ? "Federal only" : STATE_NAMES[taxState] + " + Federal"}). My stocks are LOCKED (cannot sell). For ETF positions, identify: 1) Positions with unrealized losses that could be sold to realize tax losses — use the actual costBasis and mktValue provided 2) Suitable replacement ETFs to maintain similar exposure while avoiding wash sale rules 3) Calculate EXACT tax savings using my rates: loss × ${taxRates.st.toFixed(1)}% if short-term, loss × ${taxRates.lt.toFixed(1)}% if long-term 4) Flag positions approaching 1-year mark (daysToLT shown) where waiting would be beneficial 5) Net benefit after considering tracking error of replacement. Provide specific sell/buy pairs.${fmtInst}\n\n${JSON.stringify(summary, null, 2)}`,
    };
    try {
      const resp = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompts[ctx] || prompts.deploy }),
      });
      const data = await resp.json();
      if (resp.ok && data.text) {
        setAiText(data.text);
      } else {
        setAiText(data.error ? `Error: ${data.error}${data.detail ? ` — ${data.detail}` : ""}` : "Unable to generate advice. Check that ANTHROPIC_API_KEY is set in Vercel.");
      }
    } catch (e) { setAiText("Error connecting to AI advisor. Check your deployment.") }
    setAiL(false);
  }, [etfV, stockV, cashBalance, holdingsVal, totalVal, metrics, optResult]);

  // ─── Price info line ───
  const priceInfo = sf.livePrice ? `${sf.t.toUpperCase()} @ $${sf.livePrice.toFixed(2)}` + (+sf.sh > 0 ? ` → ${+sf.sh} shares = $${(sf.livePrice * +sf.sh).toLocaleString()}` : "") : null;

  // ─── SR mode helpers ───
  const getSR = (m) => m ? (srMode === "var" ? m.varSh : srMode === "vol2" ? m.vol2Sh : m.sh) : 0;
  const srLabel = srMode === "var" ? "VaR Sharpe" : srMode === "vol2" ? "σ² Sharpe" : "Sharpe";
  const srSub = srMode === "var" ? "(R-Rf)/VaR₉₅" : srMode === "vol2" ? "(R-Rf)/σ²" : "(R-Rf)/σ";
  const srMax = srMode === "vol2" ? 1 : srMode === "var" ? 1 : 2;

  // ─── Holding period helper ───
  const holdingPeriod = (purchaseDate) => {
    if (!purchaseDate) return null;
    const now = new Date(), pd = new Date(purchaseDate);
    const days = Math.floor((now - pd) / 86400000);
    const months = Math.floor(days / 30.44);
    const daysToLT = Math.max(0, 366 - days); // days until long-term (>1 year)
    const isLT = days >= 366;
    let label;
    if (months >= 12) { const yrs = Math.floor(months / 12); const mo = months % 12; label = mo > 0 ? `${yrs}y ${mo}m` : `${yrs}y`; }
    else if (months > 0) label = `${months}m ${days % 30}d`;
    else label = `${days}d`;
    return { days, months, daysToLT, isLT, label };
  };

  // ─── Tax rates ───
  const taxRates = useMemo(() => getTaxRates(taxState), [taxState]);

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
          <button onClick={() => setSrMode(m => m === "std" ? "var" : m === "var" ? "vol2" : "std")} style={{ padding: "4px 8px", borderRadius: 5, border: `1px solid ${srMode !== "std" ? "rgba(244,114,182,.3)" : "rgba(255,255,255,.08)"}`, background: srMode !== "std" ? "rgba(244,114,182,.1)" : "transparent", color: srMode !== "std" ? cs.pink : cs.dim, fontSize: 8, cursor: "pointer", fontFamily: mono2, fontWeight: 600 }}>{srMode === "var" ? "VaR" : srMode === "vol2" ? "σ²" : "Std"} SR</button>
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
            {metrics && <MC label={srLabel} value={getSR(metrics).toFixed(2)} accent={getSR(metrics) > .5 ? cs.green : cs.yellow} sub={srSub} />}
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
            <div style={{ fontSize: 11, fontWeight: 700, color: cs.blue, marginBottom: 6 }}>💰 Cash Balance</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: mono2, color: cs.blue }}>{fmt$(cashBalance)}</div>
              <div style={{ fontSize: 9, color: cs.dim }}>available to invest</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", background: "rgba(96,165,250,.03)", borderRadius: 6, border: "1px solid rgba(96,165,250,.08)" }}>
              <span style={{ fontSize: 10, color: cs.dim, whiteSpace: "nowrap" }}>Contribute $</span>
              <input id="cashContribInput" type="number" placeholder="10,000" style={{ ...inpS, flex: 1, fontSize: 13, fontWeight: 600, color: cs.blue, borderColor: "rgba(96,165,250,.15)", textAlign: "right" }} onKeyDown={e => { if (e.key === "Enter") { const v = +e.target.value || 0; if (v > 0) { setCashBalance(prev => prev + v); e.target.value = ""; } } }} />
              <button onClick={() => { const inp = document.getElementById("cashContribInput"); const v = +(inp?.value) || 0; if (v > 0) { setCashBalance(prev => prev + v); inp.value = ""; } }} style={{ padding: "6px 14px", borderRadius: 5, border: "1px solid rgba(96,165,250,.2)", background: "rgba(96,165,250,.1)", color: cs.blue, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>+ Add</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", background: "rgba(248,113,113,.02)", borderRadius: 6, border: "1px solid rgba(248,113,113,.08)", marginTop: 6 }}>
              <span style={{ fontSize: 10, color: cs.red, whiteSpace: "nowrap" }}>Withdraw $</span>
              <input id="cashWithdrawInput" type="number" placeholder="0" style={{ ...inpS, flex: 1, fontSize: 13, fontWeight: 600, color: cs.red, borderColor: "rgba(248,113,113,.15)", textAlign: "right" }} onKeyDown={e => { if (e.key === "Enter") { const v = +e.target.value || 0; if (v > 0) { setCashBalance(prev => Math.max(0, prev - v)); e.target.value = ""; } } }} />
              <button onClick={() => { const inp = document.getElementById("cashWithdrawInput"); const v = +(inp?.value) || 0; if (v > 0) { setCashBalance(prev => Math.max(0, prev - v)); inp.value = ""; } }} style={{ padding: "6px 14px", borderRadius: 5, border: "1px solid rgba(248,113,113,.15)", background: "rgba(248,113,113,.06)", color: cs.red, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>− Withdraw</button>
            </div>
            <div style={{ fontSize: 8, color: cs.dim, marginTop: 4 }}>Contribute or withdraw cash. Balance cannot go below $0.</div>
          </div>

          {/* Tax residency state */}
          <div style={{ ...cardS, background: "rgba(167,139,250,.02)", borderColor: "rgba(167,139,250,.08)", padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: cs.purple }}>🏛 Tax Residency</div>
                <div style={{ fontSize: 8, color: cs.dim, marginTop: 1 }}>Used for rebalancing, tax-loss harvesting, and backtest tax drag</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <select value={taxState} onChange={e => setTaxState(e.target.value)} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(167,139,250,.15)", borderRadius: 5, color: cs.text, padding: "4px 8px", fontSize: 10, fontFamily: "inherit", cursor: "pointer", outline: "none" }}>
                  {Object.entries(STATE_NAMES).sort((a, b) => a[1].localeCompare(b[1])).map(([code, name]) => (
                    <option key={code} value={code} style={{ background: "#1a1b1e", color: "#e8eaed" }}>{name}{STATE_TAX_RATES[code] > 0 ? ` (${STATE_TAX_RATES[code]}%)` : ""}</option>
                  ))}
                </select>
                <div style={{ fontSize: 9, fontFamily: mono2, color: cs.purple }}>
                  ST: {taxRates.st.toFixed(1)}% · LT: {taxRates.lt.toFixed(1)}%
                </div>
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
                    {s.shares > 0 ? `${s.shares} shares` : "—"} · {s.costBasis > 0 ? `Cost $${(+s.costBasis).toFixed(2)}/sh` : "No cost basis"}
                    {s.shares > 0 && s.costBasis > 0 && <span> · Basis {fmt$(s.shares * s.costBasis)}</span>}
                    {s.livePrice && <span style={{ color: cs.green }}> · Live ${s.livePrice.toFixed(2)}</span>}
                    {s.shares > 0 && s.costBasis > 0 && s.mktValue > 0 && (() => {
                      const gl = s.mktValue - (s.shares * s.costBasis);
                      const glPct = ((s.mktValue / (s.shares * s.costBasis)) - 1) * 100;
                      const hp = holdingPeriod(s.purchaseDate);
                      const rate = hp?.isLT ? taxRates.lt : taxRates.st;
                      const estTax = gl > 0 ? gl * rate / 100 : 0;
                      return <span>
                        <span style={{ color: gl >= 0 ? cs.green : cs.red, fontWeight: 600 }}> · {gl >= 0 ? "+" : ""}{fmt$(gl)} ({glPct >= 0 ? "+" : ""}{glPct.toFixed(1)}%)</span>
                        {gl > 0 && <span style={{ color: cs.purple, fontSize: 7 }}> tax ~{fmt$(estTax)} ({rate.toFixed(0)}% {hp?.isLT ? "LT" : "ST"})</span>}
                      </span>;
                    })()}
                    {live[s.ticker] && <span style={{ color: live[s.ticker].change >= 0 ? cs.green : cs.red }}> · Day {live[s.ticker].change > 0 ? "+" : ""}{live[s.ticker].change}%</span>}
                    {totalVal > 0 && <span style={{ color: cs.dim }}> · Wt {((s.mktValue / totalVal) * 100).toFixed(1)}%</span>}
                    {(() => { const hp = holdingPeriod(s.purchaseDate); return hp ? <span style={{ color: hp.isLT ? cs.green : cs.yellow }}> · {hp.label} {hp.isLT ? "LT" : `(${hp.daysToLT}d→LT)`}</span> : null; })()}
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 60 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: mono2, color: cs.yellow }}>{fmt$(s.mktValue)}</div>
                  {s.shares > 0 && <div style={{ fontSize: 8, color: cs.muted, fontFamily: mono2 }}>{s.shares} sh</div>}
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
                    {e.shares > 0 ? `${e.shares} shares` : "—"} · {e.costBasis > 0 ? `Cost $${(+e.costBasis).toFixed(2)}/sh` : "No cost basis"}
                    {e.shares > 0 && e.costBasis > 0 && <span> · Basis {fmt$(e.shares * e.costBasis)}</span>}
                    <span style={{ color: cs.text }}> · Mkt {fmt$(e.mktValue)}</span>
                    {e.shares > 0 && e.costBasis > 0 && e.mktValue > 0 && (() => {
                      const gl = e.mktValue - (e.shares * e.costBasis);
                      const glPct = ((e.mktValue / (e.shares * e.costBasis)) - 1) * 100;
                      const hp = holdingPeriod(e.purchaseDate);
                      const rate = hp?.isLT ? taxRates.lt : taxRates.st;
                      const estTax = gl > 0 ? gl * rate / 100 : 0;
                      return <span>
                        <span style={{ color: gl >= 0 ? cs.green : cs.red, fontWeight: 600 }}> · {gl >= 0 ? "+" : ""}{fmt$(gl)} ({glPct >= 0 ? "+" : ""}{glPct.toFixed(1)}%)</span>
                        {gl > 0 && <span style={{ color: cs.purple, fontSize: 7 }}> tax ~{fmt$(estTax)} ({rate.toFixed(0)}% {hp?.isLT ? "LT" : "ST"})</span>}
                      </span>;
                    })()}
                    {live[e.ticker] && <span style={{ color: live[e.ticker].change >= 0 ? cs.green : cs.red }}> · Live ${live[e.ticker].price} (Day {live[e.ticker].change > 0 ? "+" : ""}{live[e.ticker].change}%)</span>}
                    {totalVal > 0 && <span style={{ color: cs.dim }}> · Wt {((e.mktValue / totalVal) * 100).toFixed(1)}%</span>}
                    {(() => { const hp = holdingPeriod(e.purchaseDate); return hp ? <span style={{ color: hp.isLT ? cs.green : cs.yellow }}> · {hp.label} {hp.isLT ? "LT" : `(${hp.daysToLT}d→LT)`}</span> : null; })()}
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 60 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: mono2, color: cs.green }}>{fmt$(e.mktValue)}</div>
                  {e.shares > 0 && <div style={{ fontSize: 8, color: cs.muted, fontFamily: mono2 }}>{e.shares} sh</div>}
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
                <div style={{ fontSize: 10, color: cs.dim, marginTop: 2 }}>Optimizer finds the highest-performing ETF allocation (up to 10 positions). Concentrated portfolios are preferred when they outperform diversified ones.</div></div>
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

              {/* Advanced: Vol Target + Sharpe mode */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, flex: "1 1 200px", padding: "7px 10px", borderRadius: 6, border: "1px solid rgba(96,165,250,.12)", background: "rgba(96,165,250,.03)" }}>
                  <span style={{ fontSize: 9, color: cs.blue, fontWeight: 600, whiteSpace: "nowrap" }}>🎯 Vol Target</span>
                  <input type="number" value={volTarget || ""} onChange={e => setVolTarget(Math.max(0, +e.target.value || 0))} placeholder="off" step="1" min="0" max="50" style={{ ...inpS, width: 55, fontSize: 11, fontWeight: 600, textAlign: "center", color: cs.blue, borderColor: "rgba(96,165,250,.15)" }} />
                  <span style={{ fontSize: 8, color: cs.dim }}>%</span>
                  {[8, 12, 16, 20].map(v => (
                    <button key={v} onClick={() => setVolTarget(volTarget === v ? 0 : v)} style={{ padding: "3px 6px", borderRadius: 4, border: `1px solid ${volTarget === v ? "rgba(96,165,250,.3)" : "rgba(255,255,255,.06)"}`, background: volTarget === v ? "rgba(96,165,250,.12)" : "transparent", color: volTarget === v ? cs.blue : cs.dim, fontSize: 8, cursor: "pointer", fontFamily: mono2, fontWeight: 600 }}>{v}%</button>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 10px", borderRadius: 6, border: "1px solid rgba(244,114,182,.1)", background: "rgba(244,114,182,.02)" }}>
                  <span style={{ fontSize: 9, color: cs.pink, fontWeight: 600, whiteSpace: "nowrap" }}>SR Mode</span>
                  {[{k:"std",l:"(R-Rf)/σ"},{k:"var",l:"(R-Rf)/VaR"},{k:"vol2",l:"(R-Rf)/σ²"}].map(m => (
                    <button key={m.k} onClick={() => setSrMode(m.k)} style={{ padding: "3px 7px", borderRadius: 4, border: `1px solid ${srMode === m.k ? (m.k === "std" ? "rgba(110,231,183,.3)" : "rgba(244,114,182,.3)") : "rgba(255,255,255,.06)"}`, background: srMode === m.k ? (m.k === "std" ? "rgba(110,231,183,.08)" : "rgba(244,114,182,.1)") : "transparent", color: srMode === m.k ? (m.k === "std" ? cs.green : cs.pink) : cs.dim, fontSize: 8, cursor: "pointer", fontFamily: mono2, fontWeight: 600 }}>{m.l}</button>
                  ))}
                </div>
                <button onClick={() => setUseKelly(v => !v)} style={{ padding: "7px 10px", borderRadius: 6, border: `1px solid ${useKelly ? "rgba(167,139,250,.2)" : "rgba(255,255,255,.06)"}`, background: useKelly ? "rgba(167,139,250,.05)" : "transparent", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontFamily: "inherit" }}>
                  <span style={{ fontSize: 9, color: useKelly ? cs.purple : cs.dim, fontWeight: 600 }}>½K</span>
                  <span style={{ fontSize: 8, color: useKelly ? cs.purple : cs.dim }}>{useKelly ? "ON" : "OFF"}</span>
                </button>
                <button onClick={() => setUseRegime(v => !v)} style={{ padding: "7px 10px", borderRadius: 6, border: `1px solid ${useRegime ? "rgba(251,191,36,.2)" : "rgba(255,255,255,.06)"}`, background: useRegime ? "rgba(251,191,36,.05)" : "transparent", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontFamily: "inherit" }}>
                  <span style={{ fontSize: 9, color: useRegime ? cs.yellow : cs.dim, fontWeight: 600 }}>🌊</span>
                  <span style={{ fontSize: 8, color: useRegime ? cs.yellow : cs.dim }}>{useRegime ? (regimeData?.regime?.state5 ? regimeData.regime.state5.replace(/_/g," ").toUpperCase() : regimeData?.regime?.regime?.toUpperCase() || "ON") : "OFF"}</span>
                </button>
              </div>

              <button onClick={runOptimizer} style={{ width: "100%", padding: "11px", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#6ee7b7,#3b82f6)", color: cs.bg, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Run Optimizer — Deploy ${cashBalance.toLocaleString()}{useRegime && regimeData?.regime?.state5 ? ` (${regimeData.regime.state5.replace(/_/g," ")})` : ""} (6,000 simulations)
              </button>
              {useRegime && !regimeData && <div style={{ marginTop: 5, fontSize: 8, color: cs.yellow }}>⚠ Regime enabled but no data fetched — go to Analysis tab → "Fetch Live Data" first, or optimizer runs without regime tilt.</div>}

              {stocks.length > 0 && <div style={{ marginTop: 7, fontSize: 9, color: cs.yellow }}>🔒 {stocks.map(s => s.ticker).join(", ")} locked — optimizer works around them.</div>}
            </>}
          </div>

          {optResult && optResult.length > 0 && <div style={cardS}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: cs.green }}>Recommended ETF Purchases ({optResult.length} positions)</div>
                <div style={{ fontSize: 8, color: cs.dim, marginTop: 1 }}>Optimizer selected {optResult.length} high-conviction positions · {optResult.reduce((s, r) => s + r.pct, 0).toFixed(0)}% of cash deployed</div>
              </div>
              <div style={{ fontSize: 9, color: cs.dim }}>Click to toggle</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {optResult.map(r => {
                const isAccepted = accepted.has(r.ticker) || etfs.find(e => e.ticker === r.ticker);
                return (
                <div key={r.ticker} onClick={() => toggleRec(r)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", borderRadius: 7,
                    background: isAccepted ? "rgba(110,231,183,.06)" : "rgba(110,231,183,.02)",
                    border: `1px solid ${isAccepted ? "rgba(110,231,183,.25)" : "rgba(110,231,183,.08)"}`,
                    cursor: "pointer", transition: "all .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = isAccepted ? "rgba(248,113,113,.06)" : "rgba(110,231,183,.08)" }}
                  onMouseLeave={e => { e.currentTarget.style.background = isAccepted ? "rgba(110,231,183,.06)" : "rgba(110,231,183,.02)" }}>
                  <Badge color={isAccepted ? cs.green : cs.blue}>{isAccepted ? "✓ ADDED" : "BUY"}</Badge>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: mono2, fontWeight: 600, fontSize: 12, color: isAccepted ? cs.green : cs.text }}>{r.ticker}</span>
                      <span style={{ fontSize: 9, color: cs.dim }}>{r.name}</span>
                      <Badge color={cs.dim}>{r.cat}</Badge>
                      {r.lev && <Badge color={cs.red}>⚠ {r.lev > 0 ? `${r.lev}x LEV` : `${Math.abs(r.lev)}x INV`}</Badge>}
                    </div>
                    <div style={{ fontSize: 8, color: cs.muted, fontFamily: mono2, marginTop: 1 }}>
                      {r.lev ? `Stated R:${r.r}% → Adj R:${r.adjR}% (decay:${r.decay}%)` : `R:${r.r}%`} · V:{r.v}% · ER:{r.er}%{r.hk != null ? ` · ½K:${r.hk}%` : ""}
                      {r.lev && <span style={{ color: cs.red }}> · ⚠ Vol decay drag, path-dependent, not for buy-and-hold</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: mono2, color: isAccepted ? cs.green : cs.text }}>${r.dollars.toLocaleString()}</div>
                    <div style={{ fontSize: 9, color: cs.dim, fontFamily: mono2 }}>{r.pct}% of cash</div>
                  </div>
                </div>
              )})}
            </div>

            {accepted.size > 0 && <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 6, background: "rgba(110,231,183,.04)", fontSize: 9, color: cs.green, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>✓ {accepted.size} of {optResult.length} added · Cash remaining: {fmt$(cashBalance)}</span>
              <span style={{ color: cs.dim }}>Click again to remove</span>
            </div>}

            {/* Accept all / Remove all buttons */}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {accepted.size < optResult.length && <button onClick={() => { optResult.forEach(r => { if (!accepted.has(r.ticker) && !etfs.find(e => e.ticker === r.ticker)) toggleRec(r) }) }}
                style={{ flex: 1, padding: "9px", borderRadius: 7, border: "1px solid rgba(110,231,183,.2)", background: "rgba(110,231,183,.06)", color: cs.green, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Add All {optResult.length - accepted.size} to Holdings
              </button>}
              {accepted.size > 0 && <button onClick={() => { [...accepted].forEach(ticker => { const rec = optResult.find(r => r.ticker === ticker); if (rec) toggleRec(rec) }) }}
                style={{ flex: accepted.size < optResult.length ? "0 0 auto" : 1, padding: "9px 16px", borderRadius: 7, border: "1px solid rgba(248,113,113,.15)", background: "rgba(248,113,113,.04)", color: cs.red, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Remove All
              </button>}
            </div>

            {/* Post-deployment metrics */}
            {(() => {
              const newPos = [...allPos, ...optResult.map(r => ({ dollars: r.dollars, r: r.r, v: r.v, d: r.d || 0, cat: r.cat, er: r.er, type: "etf" }))];
              const nm = calcMetrics(newPos, 0, totalVal);
              if (!nm) return null;
              return <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                <MC sm label="New Return" value={`${nm.er.toFixed(2)}%`} accent={cs.green} sub={`was ${metrics?.er.toFixed(2) || "?"}%`} />
                <MC sm label="New Vol" value={`${nm.vol.toFixed(2)}%`} accent={cs.blue} sub={`was ${metrics?.vol.toFixed(2) || "?"}%`} />
                <MC sm label={`New ${srLabel}`} value={getSR(nm).toFixed(3)} accent={getSR(nm) > getSR(metrics) ? cs.green : cs.red} sub={`was ${getSR(metrics)?.toFixed(3) || "?"}`} />
              </div>;
            })()}
          </div>}
        </div>}

        {/* ════ ANALYSIS ════ */}
        {tab === "Analysis" && <div>
          {!metrics ? <div style={{ textAlign: "center", padding: 45, color: cs.muted }}><div style={{ fontSize: 24, marginBottom: 5 }}>📈</div><div style={{ fontSize: 11 }}>Add holdings first</div></div>
            : <>
              <div style={{ display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap", padding: "14px 0 18px", borderBottom: "1px solid rgba(255,255,255,.04)", marginBottom: 14 }}>
                <GR value={getSR(metrics)} max={srMax} label={srLabel} color={getSR(metrics) > .5 ? cs.green : cs.yellow} />
                <GR value={metrics.so} max={3} label="Sortino" color={cs.blue} />
                <GR value={metrics.dr} max={2} label="Div Ratio" color={cs.purple} />
                <GR value={metrics.cm} max={1} label="Calmar" color={cs.pink} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 6, marginBottom: 16 }}>
                <MC sm label="Exp Return" value={`${metrics.er.toFixed(2)}%`} accent={cs.green} sub="Weighted annual" />
                <MC sm label="Volatility" value={`${metrics.vol.toFixed(2)}%`} accent={cs.blue} sub={volTarget > 0 ? `Target: ${volTarget}%` : "Annual"} />
                <MC sm label="VaR (95%)" value={`${metrics.var95.toFixed(2)}%`} accent={cs.yellow} sub="σ × 1.645" />
                <MC sm label="Half Kelly" value={`${(metrics.hk * 100).toFixed(1)}%`} accent={metrics.hk > 0 ? cs.green : cs.red} sub="0.5×(R-Rf)/σ²" />
                <MC sm label="Net Return" value={`${metrics.nr.toFixed(2)}%`} accent={cs.green} sub="After expenses" />
                <MC sm label="Max Drawdown" value={`-${metrics.md.toFixed(1)}%`} accent={cs.red} sub="≈2.1× vol" />
              </div>
              {/* Tax Summary */}
              {(etfV.length > 0 || stockV.length > 0) && <div style={{ ...cardS, background: "rgba(167,139,250,.02)", borderColor: "rgba(167,139,250,.08)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: cs.purple, marginBottom: 8 }}>🏛 Tax Summary ({taxState === "None" ? "Federal Only" : STATE_NAMES[taxState] + " + Federal"})</div>
                {(() => {
                  let totalUnrealizedGain = 0, totalUnrealizedLoss = 0, stGains = 0, ltGains = 0, stLosses = 0, ltLosses = 0;
                  [...etfV, ...stockV].forEach(p => {
                    const shares = p.shares || 0, cb = p.costBasis || 0, mv = p.mktValue || 0;
                    if (shares <= 0 || cb <= 0) return;
                    const gl = mv - (shares * cb);
                    const hp = holdingPeriod(p.purchaseDate);
                    if (gl >= 0) { totalUnrealizedGain += gl; if (hp?.isLT) ltGains += gl; else stGains += gl; }
                    else { totalUnrealizedLoss += Math.abs(gl); if (hp?.isLT) ltLosses += Math.abs(gl); else stLosses += Math.abs(gl); }
                  });
                  const estTaxOnGains = (stGains * taxRates.st / 100) + (ltGains * taxRates.lt / 100);
                  const potTaxSavings = (stLosses * taxRates.st / 100) + (ltLosses * taxRates.lt / 100);
                  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 6 }}>
                    <div><div style={{ fontSize: 7, color: cs.dim }}>Unrealized Gains</div><div style={{ fontSize: 13, fontWeight: 600, fontFamily: mono2, color: cs.green }}>{fmt$(totalUnrealizedGain)}</div></div>
                    <div><div style={{ fontSize: 7, color: cs.dim }}>Unrealized Losses</div><div style={{ fontSize: 13, fontWeight: 600, fontFamily: mono2, color: cs.red }}>{fmt$(totalUnrealizedLoss)}</div></div>
                    <div><div style={{ fontSize: 7, color: cs.dim }}>ST Gains ({taxRates.st.toFixed(0)}%)</div><div style={{ fontSize: 13, fontWeight: 600, fontFamily: mono2, color: cs.yellow }}>{fmt$(stGains)}</div></div>
                    <div><div style={{ fontSize: 7, color: cs.dim }}>LT Gains ({taxRates.lt.toFixed(0)}%)</div><div style={{ fontSize: 13, fontWeight: 600, fontFamily: mono2, color: cs.green }}>{fmt$(ltGains)}</div></div>
                    <div><div style={{ fontSize: 7, color: cs.dim }}>Est. Tax on Gains</div><div style={{ fontSize: 13, fontWeight: 600, fontFamily: mono2, color: cs.red }}>{fmt$(estTaxOnGains)}</div></div>
                    <div><div style={{ fontSize: 7, color: cs.dim }}>TLH Potential</div><div style={{ fontSize: 13, fontWeight: 600, fontFamily: mono2, color: cs.purple }}>{fmt$(potTaxSavings)}</div></div>
                  </div>;
                })()}
              </div>}
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

              {/* ── Regime Analysis ── */}
              <div style={cardS}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>🌊 Market Regime Analysis</div>
                    <div style={{ fontSize: 9, color: cs.dim, marginTop: 2 }}>3-signal composite: HY Credit Spreads + VIX Term Structure + NFCI Financial Conditions</div>
                  </div>
                  <button onClick={fetchRegime} disabled={regimeLoading} style={{ padding: "6px 12px", borderRadius: 5, border: "1px solid rgba(110,231,183,.2)", background: "rgba(110,231,183,.06)", color: cs.green, fontSize: 9, fontWeight: 600, cursor: regimeLoading ? "wait" : "pointer", fontFamily: "inherit" }}>
                    {regimeLoading ? "Loading..." : regimeData ? "⟳ Refresh" : "Fetch Live Data"}
                  </button>
                </div>

                {regimeError && <div style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(248,113,113,.04)", border: "1px solid rgba(248,113,113,.12)", fontSize: 9, color: cs.red, marginBottom: 10 }}>{regimeError}</div>}

                {!regimeData && !regimeLoading && !regimeError && <div style={{ textAlign: "center", padding: 20, color: cs.muted, fontSize: 10, border: "1px dashed rgba(255,255,255,.06)", borderRadius: 7 }}>
                  Click "Fetch Live Data" to pull macro indicators from FRED.<br/>Requires FRED_API_KEY in Vercel env vars (free at fred.stlouisfed.org).
                </div>}

                {regimeData?.regime && (() => {
                  const r = regimeData.regime;
                  const regimeColor = r.regime === "bull" ? cs.green : r.regime === "bear" ? cs.red : cs.yellow;
                  const state5Colors = { strong_risk_on: "#22c55e", mild_risk_on: "#6ee7b7", neutral: "#fbbf24", mild_risk_off: "#fb923c", strong_risk_off: "#ef4444" };
                  const state5Labels = { strong_risk_on: "STRONG RISK-ON", mild_risk_on: "MILD RISK-ON", neutral: "NEUTRAL", mild_risk_off: "MILD RISK-OFF", strong_risk_off: "STRONG RISK-OFF" };
                  const s5 = r.state5 || "neutral";
                  const s5Color = state5Colors[s5] || cs.yellow;

                  return <div>
                    {/* 5-State Regime Banner */}
                    <div style={{ padding: "14px 16px", borderRadius: 8, background: `${s5Color}0a`, border: `1px solid ${s5Color}30`, marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 28 }}>{s5 === "strong_risk_on" ? "🟢" : s5 === "mild_risk_on" ? "🟩" : s5 === "neutral" ? "🟡" : s5 === "mild_risk_off" ? "🟧" : "🔴"}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: s5Color }}>{state5Labels[s5] || s5}</div>
                          <div style={{ fontSize: 10, color: cs.dim, marginTop: 2 }}>
                            Score: <span style={{ color: s5Color, fontWeight: 600, fontFamily: mono2 }}>{r.score?.toFixed(2)}</span>
                            <span style={{ marginLeft: 8 }}>P(bear): <span style={{ color: r.probBear > 0.6 ? cs.red : r.probBear < 0.4 ? cs.green : cs.yellow, fontWeight: 600, fontFamily: mono2 }}>{(r.probBear * 100).toFixed(0)}%</span></span>
                            {r.acceleration != null && <span style={{ marginLeft: 8 }}>Accel: <span style={{ color: r.acceleration > 0.1 ? cs.red : r.acceleration < -0.1 ? cs.green : cs.dim, fontWeight: 600, fontFamily: mono2 }}>{r.acceleration > 0 ? "+" : ""}{r.acceleration}</span></span>}
                            {r.momentum && <span style={{ marginLeft: 8 }}>Momentum: <span style={{ color: r.momentum === "improving" ? cs.green : r.momentum === "deteriorating" ? cs.red : cs.dim, fontWeight: 600 }}>{r.momentum}</span></span>}
                          </div>
                        </div>
                      </div>
                      {/* 5-state gauge bar */}
                      <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", background: "rgba(255,255,255,.03)" }}>
                        {Object.entries(state5Colors).map(([state, color]) => (
                          <div key={state} style={{ flex: 1, background: s5 === state ? `${color}60` : "transparent", borderRight: "1px solid rgba(0,0,0,.2)", position: "relative" }}>
                            {s5 === state && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 4, height: 4, borderRadius: 2, background: color }} /></div>}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, color: cs.muted, marginTop: 2 }}>
                        <span>Strong Risk-On</span><span>Neutral</span><span>Strong Risk-Off</span>
                      </div>
                      {/* EMA info */}
                      {(r.emaFast != null || r.emaCrossover) && <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 9, color: cs.dim }}>
                        {r.emaFast != null && <span>EMA₁₀: <span style={{ fontFamily: mono2, color: cs.text }}>{r.emaFast}</span></span>}
                        {r.emaSlow != null && <span>EMA₆₀: <span style={{ fontFamily: mono2, color: cs.text }}>{r.emaSlow}</span></span>}
                        {r.emaCrossover && r.emaCrossover !== "none" && <Badge color={r.emaCrossover === "bullish_cross" ? cs.green : cs.red}>{r.emaCrossover === "bullish_cross" ? "BULLISH CROSS ↑" : "BEARISH CROSS ↓"}</Badge>}
                      </div>}
                    </div>

                    {/* 7-Factor Signal Grid */}
                    <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>Factor Signals (7-factor weighted composite)</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 5, marginBottom: 12 }}>
                      {[
                        { key: "hy_oas", label: "HY Credit Spread", icon: "📊", fmt: v => `${v?.toFixed(0)} bps` },
                        { key: "vix_slope", label: "VIX Term Structure", icon: "📈", fmt: v => `${(v * 100)?.toFixed(1)}%` },
                        { key: "nfci", label: "NFCI Conditions", icon: "🏦", fmt: v => v?.toFixed(2) },
                        { key: "t10y3m", label: "10Y-3M Yield Curve", icon: "📉", fmt: v => `${v?.toFixed(2)}%` },
                        { key: "ted", label: "TED Spread", icon: "🏧", fmt: v => `${v?.toFixed(2)}%` },
                        { key: "sahm", label: "Sahm Rule", icon: "🚨", fmt: v => v?.toFixed(2) },
                        { key: "claims", label: "Initial Claims", icon: "📋", fmt: v => v ? `${(v/1000).toFixed(0)}k` : "—" },
                        { key: "cross_asset", label: "Cross-Asset Corr", icon: "🔗", fmt: v => v?.toFixed(2) },
                      ].map(f => {
                        const d = r.details?.[f.key];
                        if (!d) return null;
                        const sig = d.signal || "neutral";
                        const sigColor = sig === "risk-on" ? cs.green : sig === "risk-off" ? cs.red : cs.yellow;
                        return <div key={f.key} style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(255,255,255,.01)", border: `1px solid ${sigColor}12` }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 10 }}>{f.icon}</span>
                            <span style={{ width: 6, height: 6, borderRadius: 3, background: sigColor, display: "inline-block" }} />
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: mono2, color: sigColor }}>{f.fmt(d.value)}</div>
                          <div style={{ fontSize: 7, color: cs.muted, marginTop: 2 }}>{f.label}</div>
                          <div style={{ fontSize: 7, color: cs.dim, fontFamily: mono2 }}>z: {d.zScore?.toFixed(2) || "—"} · w: {(d.weight * 100).toFixed(0)}%</div>
                        </div>;
                      }).filter(Boolean)}
                    </div>

                    {/* Cross-Asset Correlations */}
                    {r.crossAsset && Object.keys(r.crossAsset).length > 0 && <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 7, background: "rgba(255,255,255,.015)" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>Cross-Asset Correlations (60-day rolling)</div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {[
                          { key: "spyGold60d", label: "SPY ↔ Gold", desc: "Negative = flight-to-safety" },
                          { key: "spyBond60d", label: "SPY ↔ Bonds", desc: "More negative = risk-off" },
                          { key: "spyHY60d", label: "SPY ↔ HY OAS", desc: "Negative = stress divergence" },
                        ].map(c => {
                          const v = r.crossAsset[c.key];
                          if (v == null) return null;
                          return <div key={c.key} style={{ flex: "1 1 120px" }}>
                            <div style={{ fontSize: 9, color: cs.dim }}>{c.label}</div>
                            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: mono2, color: Math.abs(v) > 0.3 ? (v > 0 ? cs.green : cs.red) : cs.dim }}>{v > 0 ? "+" : ""}{v.toFixed(2)}</div>
                            <div style={{ fontSize: 7, color: cs.muted }}>{c.desc}</div>
                          </div>;
                        }).filter(Boolean)}
                      </div>
                    </div>}

                    {/* Supplementary Signals */}
                    <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>Supplementary Signals</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 4, marginBottom: 8 }}>
                      {[
                        { label: "VIX Level", data: r.details?.vix_level, main: r.details?.vix_level ? r.details.vix_level.level?.toFixed(1) : "—", threshold: "< 20 bull · > 25 bear" },
                        { label: "S&P 500 vs MA200", data: r.details?.sp500_ma, main: r.details?.sp500_ma?.aboveMa200 ? "Above ✓" : r.details?.sp500_ma ? "Below ✗" : "—", threshold: r.details?.sp500_ma ? `${r.details.sp500_ma.goldenCross ? "Golden" : "Death"} cross` : "" },
                        { label: "Drawdown", data: r.details?.drawdown, main: r.details?.drawdown ? `-${r.details.drawdown.drawdownPct?.toFixed(1)}%` : "—", threshold: "> -10% correction" },
                        { label: "12M Momentum", data: r.details?.momentum, main: r.details?.momentum ? `${r.details.momentum.return12m > 0 ? "+" : ""}${r.details.momentum.return12m?.toFixed(1)}%` : "—", threshold: "> 0% = bullish" },
                      ].map((s, i) => {
                        const sig = s.data?.signal || "neutral";
                        const sigColor = sig === "risk-on" ? cs.green : sig === "risk-off" ? cs.red : cs.yellow;
                        return <div key={i} style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(255,255,255,.01)", border: `1px solid ${sigColor}10` }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 9, color: cs.dim }}>{s.label}</span>
                            <span style={{ width: 6, height: 6, borderRadius: 3, background: sigColor, display: "inline-block" }} />
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: mono2, color: sigColor, marginTop: 2 }}>{s.main}</div>
                          <div style={{ fontSize: 7, color: cs.muted, marginTop: 2 }}>{s.threshold}</div>
                        </div>;
                      })}
                    </div>

                    {/* Signal Summary */}
                    <div style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(255,255,255,.015)", fontSize: 8, color: cs.dim, marginBottom: 8 }}>
                      {(() => {
                        const allSignals = Object.values(r.details || {}).filter(d => d?.signal);
                        const on = allSignals.filter(d => d.signal === "risk-on").length;
                        const off = allSignals.filter(d => d.signal === "risk-off").length;
                        const neut = allSignals.filter(d => d.signal === "neutral").length;
                        return <span>{on} risk-on · {off} risk-off · {neut} neutral of {allSignals.length} factors · 5-state model · Daily EMA(10/60) smoothing · 7 FRED factors + cross-asset correlation</span>;
                      })()}
                    </div>

                    {/* 5-State Optimizer Guidance */}
                    <div style={{ padding: "10px 12px", borderRadius: 7, background: `${s5Color}08`, border: `1px solid ${s5Color}15` }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: s5Color, marginBottom: 4 }}>Optimizer Guidance: {state5Labels[s5]}{r.momentum ? ` / ${r.momentum}` : ""}</div>
                      <div style={{ fontSize: 9, color: cs.dim, lineHeight: 1.6 }}>
                        {s5 === "strong_risk_on" && "Full growth allocation. Max Sharpe or Max Return. Aggressive ETFs (tech, growth, small cap, EM) heavily favored. Kelly at full. This is historically the best time for risk assets."}
                        {s5 === "mild_risk_on" && "Growth-tilted allocation. Max Sharpe recommended. Moderate overweight to aggressive categories. Watch for complacency signals (low VIX + compressed spreads)."}
                        {s5 === "neutral" && "Balanced allocation. Diversification across categories. Vol target ~12-15%. This is a transition period — monitor acceleration for direction."}
                        {s5 === "mild_risk_off" && "Shift toward quality and low-vol. Increase bond, dividend, value, utility exposure. Kelly tightened to 80% for aggressive assets. Consider Min Vol objective."}
                        {s5 === "strong_risk_off" && "Full defensive. Bonds, treasuries, gold, cash favored. Kelly cut to 50% for aggressive positions. Min Volatility objective. Tax-loss harvest aggressively. Historical best entry point is often near the END of this state."}
                        {r.momentum === "improving" && " The regime is IMPROVING — stress indicators declining. Historically the best risk-adjusted entry window."}
                        {r.momentum === "deteriorating" && " The regime is DETERIORATING — stress indicators rising. Consider waiting for stabilization before adding risk."}
                      </div>
                    </div>
                  </div>;
                })()}
              </div>

              {/* ── Regime Duration Analytics ── */}
              <div style={cardS}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>📊 Regime Duration & Entry Signal Analysis</div>
                    <div style={{ fontSize: 9, color: cs.dim, marginTop: 2 }}>Historical regime episodes, transition probabilities, and forward returns by duration. Uses FRED data 2015–2025.</div>
                  </div>
                  <button onClick={fetchRegimeAnalytics} disabled={analyticsLoading} style={{ padding: "6px 12px", borderRadius: 5, border: "1px solid rgba(251,191,36,.2)", background: "rgba(251,191,36,.06)", color: cs.yellow, fontSize: 9, fontWeight: 600, cursor: analyticsLoading ? "wait" : "pointer", fontFamily: "inherit" }}>
                    {analyticsLoading ? "Computing..." : regimeAnalytics ? "⟳ Refresh" : "Run Analysis"}
                  </button>
                </div>

                {!regimeAnalytics && !analyticsLoading && <div style={{ textAlign: "center", padding: 18, color: cs.muted, fontSize: 10, border: "1px dashed rgba(255,255,255,.06)", borderRadius: 7 }}>
                  Click "Run Analysis" to compute regime episodes, transitions, and optimal entry signals from 10 years of FRED data.
                </div>}

                {regimeAnalytics && (() => {
                  const a = regimeAnalytics;
                  const regColors = { bull: cs.green, neutral: cs.yellow, bear: cs.red };

                  return <div>
                    {/* Current Position */}
                    {a.current && <div style={{ padding: "12px 14px", borderRadius: 8, background: `${regColors[a.current.regime]}08`, border: `1px solid ${regColors[a.current.regime]}20`, marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: regColors[a.current.regime], marginBottom: 4 }}>Current Position</div>
                      <div style={{ fontSize: 10, color: cs.dim, lineHeight: 1.7 }}>
                        <span style={{ color: regColors[a.current.regime], fontWeight: 600 }}>{a.current.regime.toUpperCase()}</span> regime for <span style={{ color: cs.text, fontWeight: 600, fontFamily: mono2 }}>{a.current.runLength}</span> months
                        {a.current.transition && <span> · Transition: <span style={{ fontFamily: mono2, color: cs.text }}>{a.current.transition}</span></span>}
                        {a.current.prevDuration && <span> · Previous {a.current.prevRegime} lasted {a.current.prevDuration}m</span>}
                      </div>
                      {a.current.signalMatch && <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 6, background: "rgba(255,255,255,.02)" }}>
                        <div style={{ fontSize: 9, fontWeight: 600, color: cs.blue, marginBottom: 3 }}>📍 Historical Pattern Match ({a.current.signalMatch.historicalMatches} similar episodes)</div>
                        <div style={{ display: "flex", gap: 10, fontSize: 9 }}>
                          {["1m","3m","6m","12m"].map(h => {
                            const v = a.current.signalMatch.avgForwardReturns[h];
                            return v != null ? <span key={h} style={{ fontFamily: mono2 }}>{h}: <span style={{ color: v >= 0 ? cs.green : cs.red, fontWeight: 600 }}>{v > 0 ? "+" : ""}{v}%</span></span> : null;
                          })}
                        </div>
                        <div style={{ fontSize: 8, color: cs.muted, marginTop: 3 }}>Avg SPY forward returns when {a.current.transition} lasted ~{a.current.runLength}m historically</div>
                      </div>}
                    </div>}

                    {/* Regime Timeline */}
                    <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>Regime Timeline ({a.episodes?.length} episodes, {a.totalMonths} months)</div>
                    <div style={{ display: "flex", height: 28, borderRadius: 4, overflow: "hidden", marginBottom: 12, border: "1px solid rgba(255,255,255,.04)" }}>
                      {a.episodes?.map((ep, i) => {
                        const widthPct = (ep.months / a.totalMonths) * 100;
                        return <div key={i} title={`${ep.regime}: ${ep.start} → ${ep.end} (${ep.months}m)`}
                          style={{ width: `${widthPct}%`, minWidth: widthPct > 2 ? 0 : 2, background: `${regColors[ep.regime]}30`, borderRight: "1px solid rgba(0,0,0,.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "default" }}>
                          {widthPct > 5 && <span style={{ fontSize: 7, color: regColors[ep.regime], fontFamily: mono2, fontWeight: 600 }}>{ep.months}m</span>}
                        </div>;
                      })}
                    </div>

                    {/* Duration Statistics */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 12 }}>
                      {["bull","neutral","bear"].map(regime => {
                        const s = a.durationStats?.[regime];
                        if (!s) return null;
                        return <div key={regime} style={{ padding: "10px 12px", borderRadius: 7, background: "rgba(255,255,255,.015)", border: `1px solid ${regColors[regime]}12` }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: regColors[regime], marginBottom: 4 }}>{regime.toUpperCase()}</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, fontSize: 9 }}>
                            <div><span style={{ color: cs.dim }}>Episodes:</span> <span style={{ fontFamily: mono2 }}>{s.count}</span></div>
                            <div><span style={{ color: cs.dim }}>Total:</span> <span style={{ fontFamily: mono2 }}>{s.totalMonths}m</span></div>
                            <div><span style={{ color: cs.dim }}>Avg:</span> <span style={{ fontFamily: mono2 }}>{s.avg}m</span></div>
                            <div><span style={{ color: cs.dim }}>Median:</span> <span style={{ fontFamily: mono2 }}>{s.median}m</span></div>
                            <div><span style={{ color: cs.dim }}>Min:</span> <span style={{ fontFamily: mono2 }}>{s.min}m</span></div>
                            <div><span style={{ color: cs.dim }}>Max:</span> <span style={{ fontFamily: mono2 }}>{s.max}m</span></div>
                          </div>
                        </div>;
                      })}
                    </div>

                    {/* Transition Probability Matrix */}
                    {a.transitionProb && <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>Transition Probability Matrix (monthly)</div>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                          <thead><tr>
                            <th style={{ padding: "5px 8px", textAlign: "left", color: cs.dim, fontSize: 8 }}>From ↓ / To →</th>
                            {["bull","neutral","bear"].map(to => <th key={to} style={{ padding: "5px 8px", textAlign: "center", color: regColors[to], fontSize: 8, fontWeight: 600 }}>{to.toUpperCase()}</th>)}
                          </tr></thead>
                          <tbody>
                            {["bull","neutral","bear"].map(from => <tr key={from} style={{ borderTop: "1px solid rgba(255,255,255,.03)" }}>
                              <td style={{ padding: "5px 8px", color: regColors[from], fontWeight: 600 }}>{from.toUpperCase()}</td>
                              {["bull","neutral","bear"].map(to => {
                                const pct = a.transitionProb[from]?.[to] || 0;
                                const isHigh = pct > 50;
                                return <td key={to} style={{ padding: "5px 8px", textAlign: "center", fontFamily: mono2, fontWeight: isHigh ? 700 : 400, color: isHigh ? cs.text : cs.muted, background: isHigh ? "rgba(255,255,255,.03)" : "transparent" }}>{pct}%</td>;
                              })}
                            </tr>)}
                          </tbody>
                        </table>
                      </div>
                    </div>}

                    {/* Forward Returns by Regime + Duration Heatmap */}
                    {a.durationReturns && <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>Forward SPY Returns by Regime & Duration</div>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                          <thead><tr>
                            <th style={{ padding: "5px 6px", textAlign: "left", color: cs.dim, fontSize: 8 }}>Regime</th>
                            <th style={{ padding: "5px 6px", textAlign: "left", color: cs.dim, fontSize: 8 }}>Duration</th>
                            <th style={{ padding: "5px 6px", textAlign: "center", color: cs.dim, fontSize: 8 }}>N</th>
                            {["1m","3m","6m","12m"].map(h => <th key={h} style={{ padding: "5px 6px", textAlign: "center", color: cs.blue, fontSize: 8 }}>Fwd {h}</th>)}
                          </tr></thead>
                          <tbody>
                            {["bull","neutral","bear"].map(regime =>
                              Object.entries(a.durationReturns[regime] || {}).map(([bucket, d], i) =>
                                <tr key={`${regime}-${bucket}`} style={{ borderTop: i === 0 ? `1px solid ${regColors[regime]}20` : "1px solid rgba(255,255,255,.02)" }}>
                                  {i === 0 && <td rowSpan={Object.keys(a.durationReturns[regime] || {}).length} style={{ padding: "5px 6px", color: regColors[regime], fontWeight: 600, verticalAlign: "top" }}>{regime.toUpperCase()}</td>}
                                  <td style={{ padding: "5px 6px", fontFamily: mono2, color: cs.dim }}>{bucket}</td>
                                  <td style={{ padding: "5px 6px", textAlign: "center", fontFamily: mono2, color: cs.muted }}>{d.n}</td>
                                  {["1m","3m","6m","12m"].map(h => {
                                    const v = d.avg[h];
                                    return <td key={h} style={{ padding: "5px 6px", textAlign: "center", fontFamily: mono2, fontWeight: 600, color: v == null ? cs.muted : v >= 0 ? cs.green : cs.red }}>{v != null ? `${v > 0 ? "+" : ""}${v}%` : "—"}</td>;
                                  })}
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>}

                    {/* Optimal Entry Signals — ranked by 6m forward return */}
                    {a.entrySignals?.length > 0 && <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>🎯 Optimal Entry Signals (ranked by 6m forward return)</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {a.entrySignals.slice(0, 8).map((sig, i) => {
                          const [from, to] = sig.pattern.split("→");
                          const isBest = i === 0;
                          return <div key={sig.pattern} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 6, background: isBest ? "rgba(110,231,183,.04)" : "rgba(255,255,255,.01)", border: `1px solid ${isBest ? "rgba(110,231,183,.15)" : "rgba(255,255,255,.03)"}` }}>
                            <div style={{ fontSize: 12, width: 20, textAlign: "center" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                                <span style={{ fontSize: 10, fontWeight: 600, color: regColors[from] }}>{from.toUpperCase()}</span>
                                <span style={{ fontSize: 8, color: cs.muted }}>→</span>
                                <span style={{ fontSize: 10, fontWeight: 600, color: regColors[to] }}>{to.toUpperCase()}</span>
                                <span style={{ fontSize: 8, color: cs.muted, marginLeft: 4 }}>({sig.count} occurrences, avg {sig.avgDuration}m)</span>
                              </div>
                              <div style={{ display: "flex", gap: 8, fontSize: 9 }}>
                                {["1m","3m","6m","12m"].map(h => {
                                  const v = sig[`fwd${h}`];
                                  return v != null ? <span key={h} style={{ fontFamily: mono2 }}>{h}: <span style={{ color: v >= 0 ? cs.green : cs.red, fontWeight: 600 }}>{v > 0 ? "+" : ""}{v}%</span></span> : null;
                                })}
                              </div>
                            </div>
                          </div>;
                        })}
                      </div>
                      <div style={{ fontSize: 8, color: cs.muted, marginTop: 6 }}>Entry signals show avg SPY forward returns after each regime transition. Best entries historically: switch from bear → bull or bear → neutral with 3+ months persistence.</div>
                    </div>}

                    {/* Transition Patterns Detail */}
                    {a.transitionPatterns && <div>
                      <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>Transition Pattern Forward Returns</div>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                          <thead><tr>
                            <th style={{ padding: "5px 6px", textAlign: "left", color: cs.dim, fontSize: 8 }}>Transition</th>
                            <th style={{ padding: "5px 6px", textAlign: "center", color: cs.dim, fontSize: 8 }}>N</th>
                            <th style={{ padding: "5px 6px", textAlign: "center", color: cs.dim, fontSize: 8 }}>Avg Dur</th>
                            {["1m","3m","6m","12m"].map(h => <th key={h} style={{ padding: "5px 6px", textAlign: "center", color: cs.blue, fontSize: 8 }}>Fwd {h}</th>)}
                          </tr></thead>
                          <tbody>
                            {Object.entries(a.transitionPatterns).sort(([,a2],[,b2]) => (b2.avgFwd["6m"]||0) - (a2.avgFwd["6m"]||0)).map(([pattern, p]) => {
                              const [from, to] = pattern.split("→");
                              const isActive = pattern === a.current?.transition;
                              return <tr key={pattern} style={{ borderTop: "1px solid rgba(255,255,255,.03)", background: isActive ? "rgba(251,191,36,.04)" : "transparent" }}>
                                <td style={{ padding: "5px 6px" }}>
                                  <span style={{ color: regColors[from], fontWeight: 600 }}>{from}</span>
                                  <span style={{ color: cs.muted }}> → </span>
                                  <span style={{ color: regColors[to], fontWeight: 600 }}>{to}</span>
                                  {isActive && <span style={{ fontSize: 7, color: cs.yellow, marginLeft: 4 }}>● NOW</span>}
                                </td>
                                <td style={{ padding: "5px 6px", textAlign: "center", fontFamily: mono2, color: cs.muted }}>{p.count}</td>
                                <td style={{ padding: "5px 6px", textAlign: "center", fontFamily: mono2, color: cs.muted }}>{p.avgDuration}m</td>
                                {["1m","3m","6m","12m"].map(h => {
                                  const v = p.avgFwd[h];
                                  return <td key={h} style={{ padding: "5px 6px", textAlign: "center", fontFamily: mono2, fontWeight: 600, color: v == null ? cs.muted : v >= 0 ? cs.green : cs.red }}>{v != null ? `${v > 0 ? "+" : ""}${v}%` : "—"}</td>;
                                })}
                              </tr>;
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>}
                  </div>;
                })()}
              </div>

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
            <div style={{ fontSize: 10, color: cs.dim, marginBottom: 14 }}>Powered by Claude with live market data. Analyzes your locked stocks + ETFs and provides actionable recommendations.</div>

            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
              {[
                { k: "deploy", l: "Cash Deployment", i: "🎯", d: "Recommend ETF purchases" },
                { k: "risk", l: "Risk Analysis", i: "🛡️", d: "Concentration & tail risk" },
                { k: "rebalance", l: "Rebalancing", i: "⚖️", d: "Trim/add to ETF positions" },
                { k: "taxloss", l: "Tax-Loss Harvesting", i: "📉", d: "Harvest losses & replacements" },
              ].map(c => (
                <button key={c.k} onClick={() => { setAiCtx(c.k); getAI(c.k) }} disabled={aiL} style={{ flex: "1 1 130px", padding: "10px 12px", borderRadius: 8, border: "1px solid", cursor: aiL ? "wait" : "pointer", fontFamily: "inherit", textAlign: "left", borderColor: aiCtx === c.k && aiText ? "rgba(110,231,183,.25)" : "rgba(255,255,255,.06)", background: aiCtx === c.k && aiText ? "rgba(110,231,183,.06)" : "rgba(255,255,255,.02)", color: aiCtx === c.k && aiText ? cs.green : cs.dim, opacity: aiL ? .5 : 1 }}>
                  <div style={{ fontSize: 14, marginBottom: 3 }}>{c.i}</div>
                  <div style={{ fontSize: 10, fontWeight: 600 }}>{c.l}</div>
                  <div style={{ fontSize: 8, opacity: .6, marginTop: 1 }}>{c.d}</div>
                </button>
              ))}
            </div>

            {!etfs.length && !stocks.length && <div style={{ textAlign: "center", padding: 25, color: cs.muted, fontSize: 10, border: "1px dashed rgba(255,255,255,.06)", borderRadius: 7 }}>Add holdings first.</div>}
            {aiL && <div style={{ padding: 18, textAlign: "center" }}><div style={{ fontSize: 12, color: cs.green }}><span style={{ display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }}>✦</span> Analyzing with live market data...</div></div>}
            {aiText && !aiL && <div style={{ padding: 16, borderRadius: 9, background: "rgba(110,231,183,.02)", border: "1px solid rgba(110,231,183,.08)", fontSize: 11, lineHeight: 1.65, color: "#d1d5db" }}><AiMarkdown text={aiText} /></div>}
          </div>
        </div>}

        {/* ════ BACKTEST ════ */}
        {tab === "Backtest" && <div>
          <div style={cardS}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
              <span style={{ fontSize: 16 }}>📈</span><div style={{ fontSize: 13, fontWeight: 700 }}>Backtest: 2016–2025</div>
            </div>
            <div style={{ fontSize: 10, color: cs.dim, marginBottom: 14 }}>Simulates your optimizer settings against historical data. Annual rebalancing using trailing 12-month stats. Half Kelly caps + Vol Target + VaR Sharpe all applied.</div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 9, color: cs.dim }}>Starting Capital $</span>
                <input type="number" value={btStartCash} onChange={e => setBtStartCash(Math.max(1000, +e.target.value || 100000))} style={{ ...inpS, width: 100, fontSize: 12, fontWeight: 600, textAlign: "right", color: cs.blue }} />
              </div>
              <div style={{ fontSize: 9, color: cs.dim }}>
                Strategy: <span style={{ color: cs.green, fontWeight: 600 }}>{ot.replace("_", " ")}</span>
                {srMode !== "std" && <span style={{ color: cs.pink }}> · {srMode === "var" ? "VaR" : "σ²"} SR</span>}
                {volTarget > 0 && <span style={{ color: cs.blue }}> · Vol {volTarget}%</span>}
                {useKelly && <span style={{ color: cs.purple }}> · ½Kelly</span>}
                {useRegime && <span style={{ color: cs.yellow }}> · Regime-Adaptive</span>}
                <span style={{ color: cs.purple }}> · Tax: {taxRates.lt.toFixed(1)}% LT</span>
              </div>
            </div>

            <button onClick={runBacktest} disabled={btRunning} style={{ width: "100%", padding: "11px", borderRadius: 7, border: "none", background: btRunning ? "rgba(255,255,255,.06)" : "linear-gradient(135deg,#6ee7b7,#3b82f6)", color: btRunning ? cs.dim : cs.bg, fontSize: 12, fontWeight: 700, cursor: btRunning ? "wait" : "pointer", fontFamily: "inherit" }}>
              {btRunning ? btProgress : "Run Backtest (2016–2025)"}
            </button>
          </div>

          {btResult && (() => {
            const { curves, summary, annual, startCash: sc2 } = btResult;
            const allPts = [...curves.opt, ...curves.spy, ...curves.bal60];
            const maxV = Math.max(...allPts.map(p => p.value));
            const minV = Math.min(...allPts.map(p => p.value));
            const W = 560, H = 280, pd = { t: 25, r: 15, b: 30, l: 60 };
            const w = W - pd.l - pd.r, h = H - pd.t - pd.b;
            const sx = (i, len) => pd.l + (i / Math.max(1, len - 1)) * w;
            const sy = v => pd.t + h - ((v - minV) / (maxV - minV || 1)) * h;

            const drawLine = (data, color) => data.map((p, i) => `${sx(i, data.length)},${sy(p.value)}`).join(" ");

            return <>
              {/* Equity Curve */}
              <div style={cardS}>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10 }}>Equity Curve — ${(sc2/1000).toFixed(0)}k Starting Capital</div>
                <div style={{ display: "flex", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 3, borderRadius: 2, background: cs.green, display: "inline-block" }} />Optimized ({fmt$(summary.opt.final)})</span>
                  <span style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 3, borderRadius: 2, background: cs.blue, display: "inline-block" }} />SPY ({fmt$(summary.spy.final)})</span>
                  <span style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 3, borderRadius: 2, background: cs.purple, display: "inline-block" }} />60/40 ({fmt$(summary.bal60.final)})</span>
                </div>
                <svg width={W} height={H} style={{ overflow: "visible", maxWidth: "100%" }} viewBox={`0 0 ${W} ${H}`}>
                  {/* Grid lines */}
                  {[0, .25, .5, .75, 1].map(f => {
                    const yy = pd.t + h * (1 - f), val = minV + f * (maxV - minV);
                    return <g key={f}><line x1={pd.l} x2={W - pd.r} y1={yy} y2={yy} stroke="rgba(255,255,255,0.04)" /><text x={pd.l - 5} y={yy + 3} fill={cs.muted} fontSize={8} textAnchor="end" fontFamily={mono2}>{fmt$(val)}</text></g>;
                  })}
                  {/* Year labels */}
                  {curves.opt.filter((_, i) => i % 12 === 0).map((p, i) => {
                    const x = sx(i * 12, curves.opt.length);
                    return <text key={i} x={x} y={H - 5} fill={cs.muted} fontSize={8} textAnchor="middle" fontFamily={mono2}>{p.date?.slice(0, 4)}</text>;
                  })}
                  {/* Lines */}
                  <polyline points={drawLine(curves.bal60, cs.purple)} fill="none" stroke={cs.purple} strokeWidth={1.5} opacity={.6} />
                  <polyline points={drawLine(curves.spy, cs.blue)} fill="none" stroke={cs.blue} strokeWidth={1.5} opacity={.7} />
                  <polyline points={drawLine(curves.opt, cs.green)} fill="none" stroke={cs.green} strokeWidth={2} />
                </svg>
              </div>

              {/* Summary Metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 14 }}>
                {[
                  { label: "Optimized", data: summary.opt, color: cs.green },
                  { label: "S&P 500", data: summary.spy, color: cs.blue },
                  { label: "60/40", data: summary.bal60, color: cs.purple },
                ].map(s => (
                  <div key={s.label} style={{ ...cardS, marginBottom: 0, borderColor: `${s.color}22` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: s.color, marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: mono2, color: s.color }}>{fmt$(s.data.final)}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 8 }}>
                      <div><div style={{ fontSize: 7, color: cs.dim }}>CAGR</div><div style={{ fontSize: 11, fontWeight: 600, fontFamily: mono2 }}>{s.data.cagr.toFixed(1)}%</div></div>
                      <div><div style={{ fontSize: 7, color: cs.dim }}>Total</div><div style={{ fontSize: 11, fontWeight: 600, fontFamily: mono2 }}>{s.data.total.toFixed(0)}%</div></div>
                      <div><div style={{ fontSize: 7, color: cs.dim }}>Vol</div><div style={{ fontSize: 11, fontWeight: 600, fontFamily: mono2 }}>{s.data.vol.toFixed(1)}%</div></div>
                      <div><div style={{ fontSize: 7, color: cs.dim }}>Sharpe</div><div style={{ fontSize: 11, fontWeight: 600, fontFamily: mono2 }}>{s.data.sharpe.toFixed(2)}</div></div>
                      <div><div style={{ fontSize: 7, color: cs.dim }}>Max DD</div><div style={{ fontSize: 11, fontWeight: 600, fontFamily: mono2, color: cs.red }}>-{s.data.dd.toFixed(1)}%</div></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tax Impact Summary */}
              {btResult.tax && (btResult.tax.totalPaid > 0 || btResult.tax.totalSaved > 0) && <div style={{ ...cardS, marginBottom: 14, background: "rgba(167,139,250,.02)", borderColor: "rgba(167,139,250,.1)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: cs.purple }}>🏛 Tax Impact ({btResult.tax.state === "None" ? "Federal Only" : `${STATE_NAMES[btResult.tax.state]} + Federal`})</div>
                    <div style={{ fontSize: 8, color: cs.dim, marginTop: 2 }}>Tax on rebalancing (LT: {btResult.tax.rates.lt.toFixed(1)}%, ST: {btResult.tax.rates.st.toFixed(1)}%) · {btResult.tax.rebalances} rebalances · Losses offset gains, carry forward up to $3k/yr ordinary income</div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 7, color: cs.dim }}>Net Tax Paid</div>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: mono2, color: cs.red }}>{fmt$(btResult.tax.totalPaid)}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 7, color: cs.dim }}>Saved via Losses</div>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: mono2, color: cs.green }}>{fmt$(btResult.tax.totalSaved)}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 7, color: cs.dim }}>Loss Carryover</div>
                      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: mono2, color: cs.blue }}>{fmt$(btResult.tax.finalCarryover)}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 7, color: cs.dim }}>Tax Drag</div>
                      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: mono2, color: cs.red }}>{btResult.tax.effectiveDrag}%</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 7, color: cs.dim }}>After-Tax Value</div>
                      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: mono2, color: cs.green }}>{fmt$(summary.opt.final)}</div>
                    </div>
                  </div>
                </div>
              </div>}
              <div style={cardS}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>Annual Returns & Rebalancing</div>
                  <div style={{ fontSize: 8, color: cs.dim }}>Click a year to see holdings & trades</div>
                </div>
                {useRegime && <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6, padding: "5px 8px", borderRadius: 5, background: "rgba(255,255,255,.015)" }}>
                  <span style={{ fontSize: 8, color: cs.dim, fontWeight: 600 }}>Regime:</span>
                  <span style={{ fontSize: 8, color: cs.dim }}>🟢 Strong Risk-On</span>
                  <span style={{ fontSize: 8, color: cs.dim }}>🟩 Mild Risk-On</span>
                  <span style={{ fontSize: 8, color: cs.dim }}>🟡 Neutral</span>
                  <span style={{ fontSize: 8, color: cs.dim }}>🟧 Mild Risk-Off</span>
                  <span style={{ fontSize: 8, color: cs.dim }}>🔴 Strong Risk-Off</span>
                </div>}
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                        <th style={{ padding: "6px 8px", textAlign: "left", color: cs.dim, fontFamily: mono2, fontSize: 9 }}>Year</th>
                        <th style={{ padding: "6px 8px", textAlign: "right", color: cs.dim, fontFamily: mono2, fontSize: 9 }}>Value</th>
                        <th style={{ padding: "6px 8px", textAlign: "right", color: cs.green, fontFamily: mono2, fontSize: 9 }}>Opt</th>
                        <th style={{ padding: "6px 8px", textAlign: "right", color: cs.blue, fontFamily: mono2, fontSize: 9 }}>SPY</th>
                        <th style={{ padding: "6px 8px", textAlign: "right", color: cs.dim, fontFamily: mono2, fontSize: 9 }}>Alpha</th>
                        <th style={{ padding: "6px 8px", textAlign: "center", color: cs.dim, fontFamily: mono2, fontSize: 9 }}>ETFs</th>
                        {useRegime && <th style={{ padding: "6px 8px", textAlign: "center", color: cs.yellow, fontFamily: mono2, fontSize: 9 }}>Regime</th>}
                        {useRegime && <th style={{ padding: "6px 8px", textAlign: "center", color: cs.dim, fontFamily: mono2, fontSize: 9 }}>Accel</th>}
                        <th style={{ padding: "6px 8px", textAlign: "right", color: cs.purple, fontFamily: mono2, fontSize: 9 }}>Tax</th>
                        <th style={{ padding: "6px 8px", textAlign: "center", color: cs.dim, fontFamily: mono2, fontSize: 9 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {annual.map(a => {
                        const alpha = a.optRet - a.spyRet;
                        const isExp = btExpandedYear === a.year;
                        const cs2 = 8 + (useRegime ? 2 : 0);
                        return (<React.Fragment key={a.year}>
                          <tr onClick={() => setBtExpandedYear(isExp ? null : a.year)}
                            style={{ borderBottom: isExp ? "none" : "1px solid rgba(255,255,255,.03)", cursor: "pointer", background: isExp ? "rgba(110,231,183,.03)" : "transparent" }}
                            onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = "rgba(255,255,255,.02)" }}
                            onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = "transparent" }}>
                            <td style={{ padding: "5px 8px", fontFamily: mono2, fontWeight: 600 }}>{isExp ? "▾" : "▸"} {a.year}</td>
                            <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: mono2, color: cs.dim, fontSize: 9 }}>{fmt$(a.portfolioValue || 0)}</td>
                            <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: mono2, color: a.optRet >= 0 ? cs.green : cs.red }}>{a.optRet >= 0 ? "+" : ""}{a.optRet.toFixed(1)}%</td>
                            <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: mono2, color: a.spyRet >= 0 ? cs.blue : cs.red }}>{a.spyRet >= 0 ? "+" : ""}{a.spyRet.toFixed(1)}%</td>
                            <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: mono2, fontWeight: 600, color: alpha >= 0 ? cs.green : cs.red }}>{alpha >= 0 ? "+" : ""}{alpha.toFixed(1)}%</td>
                            <td style={{ padding: "5px 8px", textAlign: "center", fontFamily: mono2, color: cs.dim, fontSize: 9 }}>{a.holdings?.length || 0}</td>
                            {useRegime && <td style={{ padding: "5px 8px", textAlign: "center", fontSize: 9 }}>
                              <span title={a.state5 ? a.state5.replace(/_/g, " ") : a.regime}>{
                                a.state5 === "strong_risk_on" ? "🟢" : a.state5 === "mild_risk_on" ? "🟩" : a.state5 === "neutral" ? "🟡" : a.state5 === "mild_risk_off" ? "🟧" : a.state5 === "strong_risk_off" ? "🔴" : a.regime === "bear" ? "🔴" : a.regime === "bull" ? "🟢" : "🟡"
                              }</span>
                            </td>}
                            {useRegime && <td style={{ padding: "5px 8px", textAlign: "center", fontSize: 9, fontFamily: mono2, color: a.acceleration > 0.1 ? cs.red : a.acceleration < -0.1 ? cs.green : cs.dim }}>
                              {a.acceleration != null ? `${a.acceleration > 0 ? "+" : ""}${a.acceleration.toFixed(1)}` : "—"}
                            </td>}
                            <td style={{ padding: "5px 8px", textAlign: "right", fontSize: 9, fontFamily: mono2, color: a.taxPaid > 0 ? cs.red : cs.dim }}>
                              {a.taxPaid > 0 ? `-${fmt$(a.taxPaid)}` : "—"}
                            </td>
                            <td style={{ padding: "5px 8px", textAlign: "center" }}>
                              <Badge color={a.rebalanceCount > 0 ? cs.green : cs.blue}>{a.rebalanceCount > 0 ? `${a.rebalanceCount}×` : "HOLD"}</Badge>
                            </td>
                          </tr>
                          {/* ── Expanded Detail Row ── */}
                          {isExp && <tr><td colSpan={cs2} style={{ padding: 0 }}>
                            <div style={{ padding: "10px 12px 14px", background: "rgba(110,231,183,.02)", borderBottom: "1px solid rgba(110,231,183,.08)" }}>
                              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                {/* Holdings */}
                                <div style={{ flex: "1 1 250px", minWidth: 200 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: cs.green, marginBottom: 6 }}>📊 Holdings ({a.holdings?.length || 0} ETFs · {fmt$(a.portfolioValue || 0)})</div>
                                  {a.holdings?.length > 0 ? <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    {a.holdings.map((h, i) => (
                                      <div key={h.ticker} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 7px", borderRadius: 4, background: i % 2 ? "rgba(255,255,255,.01)" : "transparent" }}>
                                        <span style={{ width: 4, height: 14, borderRadius: 2, background: PAL[i % PAL.length], flexShrink: 0 }} />
                                        <span style={{ fontFamily: mono2, fontWeight: 600, fontSize: 10, color: cs.green, minWidth: 40 }}>{h.ticker}</span>
                                        <span style={{ fontSize: 8, color: cs.dim, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</span>
                                        <span style={{ fontFamily: mono2, fontSize: 9, color: cs.text, fontWeight: 600, minWidth: 35, textAlign: "right" }}>{h.weight}%</span>
                                        <span style={{ fontFamily: mono2, fontSize: 8, color: cs.muted, minWidth: 50, textAlign: "right" }}>{fmt$(h.dollars)}</span>
                                      </div>
                                    ))}
                                    <div style={{ marginTop: 6, padding: "6px 7px", borderRadius: 4, background: "rgba(255,255,255,.015)", fontSize: 8, color: cs.dim }}>
                                      {(() => { const cats = {}; (a.holdings || []).forEach(h => { cats[h.cat] = (cats[h.cat] || 0) + h.weight; }); return Object.entries(cats).sort(([,x],[,y]) => y - x).map(([cat, wt]) => `${cat}: ${wt.toFixed(0)}%`).join(" · "); })()}
                                    </div>
                                  </div> : <div style={{ fontSize: 9, color: cs.muted }}>No data</div>}
                                </div>
                                {/* Rebalance Trades */}
                                <div style={{ flex: "1 1 250px", minWidth: 200 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: a.rebalanceCount > 0 ? cs.blue : cs.blue, marginBottom: 6 }}>{a.rebalanceCount > 0 ? `⚡ ${a.rebalanceCount} Rebalance${a.rebalanceCount > 1 ? "s" : ""} This Year` : "🛡 Held All Year (tax-optimized)"}</div>
                                  {a.rebalanceEvents?.length > 0 ? <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {a.rebalanceEvents.map((evt, ei) => (
                                      <div key={ei} style={{ padding: "6px 8px", borderRadius: 5, background: "rgba(110,231,183,.02)", border: "1px solid rgba(110,231,183,.06)" }}>
                                        <div style={{ fontSize: 9, fontWeight: 600, color: cs.green, marginBottom: 3 }}>📅 {evt.date} · {evt.taxType} rate ({evt.taxRate?.toFixed(1)}%)</div>
                                        <div style={{ fontSize: 8, fontFamily: mono2, color: cs.dim, marginBottom: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                          <span>Gains: <span style={{ color: cs.green }}>{fmt$(evt.grossGains || 0)}</span></span>
                                          <span>Losses: <span style={{ color: cs.red }}>{fmt$(evt.grossLosses || 0)}</span></span>
                                          {(evt.lossOffset || 0) > 0 && <span>Offset: <span style={{ color: cs.blue }}>−{fmt$(evt.lossOffset)}</span></span>}
                                          <span>Net Tax: <span style={{ color: evt.taxPaid > 0 ? cs.red : cs.green }}>{fmt$(evt.taxPaid)}</span></span>
                                          {(evt.taxSaved || 0) > 0 && <span style={{ color: cs.green }}>Saved: {fmt$(evt.taxSaved)}</span>}
                                          {(evt.lossCarryover || 0) > 0 && <span style={{ color: cs.blue }}>Carry: {fmt$(evt.lossCarryover)}</span>}
                                        </div>
                                        {evt.trades?.map((t2, i) => (
                                          <div key={t2.ticker} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 4px", fontSize: 9 }}>
                                            <Badge color={t2.action === "BUY" ? cs.green : cs.red}>{t2.action}</Badge>
                                            <span style={{ fontFamily: mono2, fontWeight: 600, color: t2.action === "BUY" ? cs.green : cs.red, minWidth: 36 }}>{t2.ticker}</span>
                                            <span style={{ fontSize: 8, color: cs.dim, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t2.name}</span>
                                            <span style={{ fontFamily: mono2, fontSize: 9, fontWeight: 600, color: t2.change > 0 ? cs.green : cs.red, minWidth: 40, textAlign: "right" }}>{t2.change > 0 ? "+" : ""}{t2.change}%</span>
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div> : <div style={{ fontSize: 9, color: cs.muted, padding: "8px 0" }}>{a.year === 2016 ? "Initial allocation" : "Portfolio held — rebalance tax cost exceeded expected improvement every month"}</div>}
                                </div>
                              </div>
                              {/* Regime Context for this year */}
                              {useRegime && a.state5 && <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 6, background: "rgba(251,191,36,.03)", border: "1px solid rgba(251,191,36,.08)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                <span style={{ fontSize: 9, fontWeight: 600, color: cs.yellow }}>🌊 Regime</span>
                                <span style={{ fontSize: 9, fontFamily: mono2, color: cs.text }}>{a.state5?.replace(/_/g, " ")}</span>
                                {a.duration > 0 && <span style={{ fontSize: 9, fontFamily: mono2, color: cs.dim }}>Duration: <span style={{ color: cs.text, fontWeight: 600 }}>{a.duration}m</span></span>}
                                {a.transition && <span style={{ fontSize: 9, fontFamily: mono2, color: cs.dim }}>Transition: <span style={{ color: cs.blue, fontWeight: 600 }}>{a.transition}</span></span>}
                                {a.acceleration != null && <span style={{ fontSize: 9, fontFamily: mono2, color: a.acceleration > 0.1 ? cs.red : a.acceleration < -0.1 ? cs.green : cs.dim }}>Accel: {a.acceleration > 0 ? "+" : ""}{a.acceleration.toFixed(2)} {a.acceleration < -0.1 ? "↓ improving" : a.acceleration > 0.1 ? "↑ deteriorating" : "→ stable"}</span>}
                                {a.transition && (() => {
                                  const [from, to] = a.transition.includes("→") ? a.transition.split("→") : [null, null];
                                  if (from === "bear" && (to === "bull" || to === "neutral") && a.duration >= 2 && a.duration <= 8)
                                    return <Badge color={cs.green}>ENTRY SIGNAL</Badge>;
                                  return null;
                                })()}
                              </div>}
                              {/* Rebalance Decision */}
                              <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 6, background: a.rebalanceCount > 0 ? "rgba(110,231,183,.03)" : "rgba(96,165,250,.03)", border: `1px solid ${a.rebalanceCount > 0 ? "rgba(110,231,183,.08)" : "rgba(96,165,250,.12)"}`, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                <Badge color={a.rebalanceCount > 0 ? cs.green : cs.blue}>{a.rebalanceCount > 0 ? `${a.rebalanceCount} REBALANCE${a.rebalanceCount > 1 ? "S" : ""}` : "HOLD ALL YEAR"}</Badge>
                                <span style={{ fontSize: 9, fontFamily: mono2, color: cs.dim }}>Monitored monthly · {12 - (a.rebalanceCount || 0)} holds, {a.rebalanceCount || 0} trades</span>
                                {a.rebalanceCount === 0 && <span style={{ fontSize: 8, color: cs.blue }}>Tax cost exceeded expected improvement every month → kept existing positions</span>}
                              </div>
                              {/* Tax Impact for this year */}
                              {(a.taxPaid > 0 || a.grossGains > 0 || a.grossLosses > 0 || a.taxSaved > 0) && <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 6, background: "rgba(167,139,250,.03)", border: "1px solid rgba(167,139,250,.08)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                <span style={{ fontSize: 9, fontWeight: 600, color: cs.purple }}>🏛 Tax</span>
                                <span style={{ fontSize: 9, fontFamily: mono2, color: cs.dim }}>Gross Gains: <span style={{ color: cs.green }}>{fmt$(a.grossGains || 0)}</span></span>
                                <span style={{ fontSize: 9, fontFamily: mono2, color: cs.dim }}>Losses: <span style={{ color: cs.red }}>{fmt$(a.grossLosses || 0)}</span></span>
                                {(a.lossOffset || 0) > 0 && <span style={{ fontSize: 9, fontFamily: mono2, color: cs.dim }}>Offset: <span style={{ color: cs.blue }}>−{fmt$(a.lossOffset)}</span></span>}
                                <span style={{ fontSize: 9, fontFamily: mono2, color: cs.dim }}>Net Tax: <span style={{ color: cs.red, fontWeight: 600 }}>{a.taxPaid > 0 ? `-${fmt$(a.taxPaid)}` : "$0"}</span></span>
                                {(a.taxSaved || 0) > 0 && <span style={{ fontSize: 9, fontFamily: mono2, color: cs.green, fontWeight: 600 }}>Saved: {fmt$(a.taxSaved)}</span>}
                              </div>}
                            </div>
                          </td></tr>}
                        </React.Fragment>);
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ fontSize: 8, color: cs.muted, textAlign: "center", marginTop: 8 }}>
                {btResult.etfsUsed} ETFs · Monthly monitoring, tax-aware rebalancing · {ot.replace("_"," ")} · {srLabel}{volTarget > 0 ? ` · Vol target ${volTarget}%` : ""}{useKelly ? " · ½Kelly" : ""}{useRegime ? ` · Regime (${btResult.regimeSource || "FRED"})` : ""} · {btResult.tax?.rates?.lt?.toFixed(1)}% LT ({btResult.tax?.state === "None" ? "Federal" : btResult.tax?.state})
              </div>
            </>;
          })()}
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
