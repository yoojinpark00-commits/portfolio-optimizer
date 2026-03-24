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
  // ── Extended: US Broad / Large Cap ──
  {t:"SPYD",n:"SPDR Portfolio S&P 500 High Div",c:"US Dividend",h:80,er:.07,r:8.5,v:16.0,d:4.5},
  {t:"COWZ",n:"Pacer US Cash Cows 100",c:"US Value",h:100,er:.49,r:11.0,v:17.0,d:1.8},
  {t:"DIVO",n:"Amplify CWP Enhanced Dividend",c:"US Dividend",h:25,er:.55,r:9.5,v:13.0,d:4.5},
  {t:"NOBL",n:"ProShares S&P 500 Div Aristoc",c:"US Dividend",h:66,er:.35,r:9.0,v:14.5,d:2.1},
  {t:"FDN",n:"First Trust Dow Jones Internet",c:"US Growth",h:40,er:.51,r:13.0,v:22.0,d:0},
  {t:"ONEQ",n:"Fidelity Nasdaq Composite",c:"US Growth",h:1000,er:.21,r:13.5,v:19.0,d:.5},
  {t:"SPGP",n:"Invesco S&P 500 GARP",c:"US Growth",h:200,er:.34,r:11.0,v:16.5,d:1.0},
  {t:"RPV",n:"Invesco S&P 500 Pure Value",c:"US Value",h:120,er:.35,r:9.0,v:18.0,d:2.0},
  {t:"VONV",n:"Vanguard Russell 1000 Value",c:"US Value",h:850,er:.08,r:9.5,v:15.5,d:2.0},
  {t:"IWN",n:"iShares Russell 2000 Value",c:"US Small Cap",h:1400,er:.24,r:7.5,v:19.5,d:1.8},
  {t:"IWO",n:"iShares Russell 2000 Growth",c:"US Small Cap",h:1200,er:.24,r:8.5,v:22.0,d:.5},
  {t:"VBR",n:"Vanguard Small Cap Value",c:"US Small Cap",h:900,er:.07,r:8.0,v:19.0,d:1.9},
  {t:"VBK",n:"Vanguard Small Cap Growth",c:"US Small Cap",h:700,er:.07,r:8.5,v:21.5,d:.4},
  {t:"AVUV",n:"Avantis US Small Cap Value",c:"US Small Cap",h:500,er:.25,r:9.5,v:20.0,d:1.5},
  {t:"SCHA",n:"Schwab US Small Cap",c:"US Small Cap",h:1800,er:.04,r:8.0,v:19.5,d:1.2},
  {t:"VO",n:"Vanguard Mid-Cap",c:"US Mid Cap",h:350,er:.04,r:9.5,v:16.5,d:1.3},
  {t:"IWR",n:"iShares Russell Midcap",c:"US Mid Cap",h:800,er:.19,r:9.5,v:16.0,d:1.2},
  {t:"IVOO",n:"Vanguard S&P Mid-Cap 400",c:"US Mid Cap",h:400,er:.10,r:9.0,v:17.0,d:1.3},
  // ── Extended: Income / Covered Call ──
  {t:"XYLD",n:"Global X S&P 500 Covered Call",c:"US Dividend",h:503,er:.60,r:7.0,v:11.0,d:9.5},
  {t:"QYLD",n:"Global X Nasdaq 100 Covered Call",c:"US Dividend",h:101,er:.60,r:7.5,v:13.0,d:11.0},
  {t:"NUSI",n:"Nationwide Nasdaq 100 Risk-Managed",c:"US Dividend",h:101,er:.68,r:7.0,v:12.0,d:7.0},
  {t:"SVOL",n:"Simplify Volatility Premium",c:"US Dividend",h:1,er:.50,r:8.0,v:10.0,d:15.0},
  // ── Extended: Factor / Smart Beta ──
  {t:"DGRW",n:"WisdomTree US Qual Div Growth",c:"US Dividend",h:300,er:.28,r:10.5,v:14.5,d:1.8},
  {t:"MOAT",n:"VanEck Morningstar Wide Moat",c:"Factor Quality",h:50,er:.46,r:11.0,v:16.0,d:1.2},
  {t:"JMOM",n:"JPMorgan US Momentum Factor",c:"Factor Momentum",h:300,er:.12,r:11.5,v:16.5,d:1.0},
  {t:"FNDX",n:"Schwab Fundamental US Large",c:"US Value",h:1000,er:.25,r:9.5,v:15.5,d:1.8},
  {t:"VTV",n:"Vanguard Value",c:"US Value",h:340,er:.04,r:9.5,v:15.0,d:2.5},
  {t:"IUSV",n:"iShares Core S&P US Value",c:"US Value",h:700,er:.04,r:9.2,v:15.2,d:2.2},
  // ── Extended: Sector SPDRs ──
  {t:"XLP",n:"Consumer Staples Select SPDR",c:"Sector Consumer",h:33,er:.09,r:7.5,v:12.0,d:2.8},
  {t:"XLY",n:"Consumer Discretionary SPDR",c:"Sector Consumer",h:52,er:.09,r:10.5,v:19.0,d:.8},
  {t:"XLK",n:"Technology Select SPDR",c:"Sector Tech",h:70,er:.09,r:14.0,v:19.5,d:.7},
  {t:"XLV",n:"Health Care Select SPDR",c:"Sector Health",h:60,er:.09,r:9.0,v:14.0,d:1.5},
  {t:"XBI",n:"SPDR S&P Biotech",c:"Sector Health",h:140,er:.35,r:5.0,v:28.0,d:0},
  {t:"ARKG",n:"ARK Genomic Revolution",c:"Sector Health",h:45,er:.75,r:4.0,v:32.0,d:0},
  // ── Extended: International ──
  {t:"FXI",n:"iShares China Large-Cap",c:"Emerging Mkts",h:50,er:.74,r:2.0,v:28.0,d:2.5},
  {t:"VNQI",n:"Vanguard Global ex-US Real Estate",c:"Sector RE",h:700,er:.12,r:4.0,v:16.0,d:4.0},
  {t:"VXUS",n:"Vanguard Total International",c:"International",h:7500,er:.07,r:5.0,v:15.5,d:3.0},
  {t:"IXUS",n:"iShares Core MSCI Total Intl",c:"International",h:4000,er:.07,r:5.0,v:15.5,d:2.8},
  {t:"SPDW",n:"SPDR Developed World ex-US",c:"Intl Developed",h:2400,er:.04,r:5.5,v:15.0,d:2.8},
  {t:"IEFA",n:"iShares Core MSCI EAFE",c:"Intl Developed",h:2500,er:.07,r:5.5,v:15.0,d:2.8},
  {t:"SCZ",n:"iShares MSCI EAFE Small Cap",c:"Intl Developed",h:1500,er:.39,r:6.0,v:17.0,d:2.2},
  {t:"SPEM",n:"SPDR Portfolio Emerging Mkts",c:"Emerging Mkts",h:2800,er:.07,r:4.0,v:18.0,d:2.5},
  {t:"EEMV",n:"iShares MSCI Emerging Min Vol",c:"Emerging Mkts",h:300,er:.25,r:3.5,v:14.0,d:2.8},
  {t:"FLCH",n:"Franklin FTSE China",c:"Emerging Mkts",h:900,er:.19,r:1.5,v:28.0,d:2.5},
  {t:"EWT",n:"iShares MSCI Taiwan",c:"Emerging Mkts",h:90,er:.59,r:8.0,v:22.0,d:2.0},
  {t:"EWJ",n:"iShares MSCI Japan",c:"Intl Developed",h:230,er:.50,r:5.5,v:16.0,d:1.8},
  {t:"EWG",n:"iShares MSCI Germany",c:"Intl Developed",h:60,er:.50,r:4.0,v:18.0,d:2.5},
  {t:"EWU",n:"iShares MSCI United Kingdom",c:"Intl Developed",h:90,er:.50,r:5.0,v:15.5,d:3.5},
  {t:"EWA",n:"iShares MSCI Australia",c:"Intl Developed",h:70,er:.50,r:5.5,v:17.0,d:4.0},
  {t:"EWC",n:"iShares MSCI Canada",c:"Intl Developed",h:90,er:.50,r:6.0,v:16.5,d:2.5},
  {t:"EPOL",n:"iShares MSCI Poland",c:"Emerging Mkts",h:30,er:.59,r:3.0,v:25.0,d:2.0},
  // ── Extended: Fixed Income ──
  {t:"GOVT",n:"iShares US Treasury Bond",c:"US Treasury",h:100,er:.05,r:2.8,v:6.0,d:3.0},
  {t:"MUB",n:"iShares National Muni Bond",c:"US Bond",h:5000,er:.07,r:3.0,v:4.5,d:2.5},
  {t:"HYG",n:"iShares High Yield Corp Bond",c:"US High Yield",h:1200,er:.49,r:4.5,v:7.5,d:5.5},
  {t:"BKLN",n:"Invesco Senior Loan",c:"US High Yield",h:1000,er:.65,r:4.0,v:3.5,d:6.5},
  {t:"FLOT",n:"iShares Floating Rate Bond",c:"US Bond",h:300,er:.15,r:3.5,v:1.5,d:5.0},
  {t:"VTEB",n:"Vanguard Tax-Exempt Bond",c:"US Bond",h:7000,er:.05,r:2.8,v:4.0,d:2.5},
  {t:"SGOV",n:"iShares 0-3M Treasury Bond",c:"US Treasury",h:1,er:.05,r:4.5,v:.5,d:5.0},
  {t:"BIL",n:"SPDR 1-3M T-Bill",c:"US Treasury",h:1,er:.14,r:4.5,v:.3,d:5.0},
  {t:"SCHO",n:"Schwab Short-Term US Treasury",c:"US Treasury",h:50,er:.03,r:3.0,v:2.0,d:3.5},
  {t:"SCHR",n:"Schwab Interm US Treasury",c:"US Treasury",h:30,er:.03,r:3.2,v:6.0,d:3.2},
  {t:"SCHZ",n:"Schwab US Aggregate Bond",c:"US Bond",h:8000,er:.03,r:3.0,v:5.5,d:3.2},
  {t:"FBND",n:"Fidelity Total Bond",c:"US Bond",h:5000,er:.36,r:3.5,v:5.0,d:3.5},
  {t:"VGSH",n:"Vanguard Short-Term Treasury",c:"US Treasury",h:40,er:.04,r:2.8,v:2.0,d:3.2},
  {t:"VGIT",n:"Vanguard Interm Treasury",c:"US Treasury",h:20,er:.04,r:3.0,v:6.5,d:3.3},
  {t:"VGLT",n:"Vanguard Long-Term Treasury",c:"US Treasury",h:10,er:.04,r:2.5,v:14.0,d:3.0},
  {t:"EDV",n:"Vanguard Extended Duration Treasury",c:"US Treasury",h:5,er:.06,r:1.5,v:20.0,d:2.8},
  {t:"TMF",n:"Direxion 3x 20Y Treasury",c:"US Treasury",h:1,er:.93,r:-5.0,v:50.0,d:0,lev:3},
  {t:"TBT",n:"ProShares UltraShort 20Y Treasury",c:"US Treasury",h:1,er:.90,r:5.0,v:35.0,d:0,lev:-2},
  // ── Extended: Real Estate ──
  {t:"IYR",n:"iShares US Real Estate",c:"Sector RE",h:80,er:.39,r:6.5,v:18.0,d:3.2},
  {t:"SCHH",n:"Schwab US REIT",c:"Sector RE",h:150,er:.07,r:6.5,v:18.0,d:3.5},
  {t:"RWR",n:"SPDR Dow Jones REIT",c:"Sector RE",h:100,er:.25,r:6.5,v:18.5,d:3.8},
  // ── Extended: Thematic / Niche ──
  {t:"HACK",n:"ETFMG Prime Cyber Security",c:"Sector Tech",h:60,er:.60,r:10.0,v:22.0,d:0},
  {t:"BOTZ",n:"Global X Robotics & AI",c:"Sector Tech",h:40,er:.68,r:8.0,v:24.0,d:.5},
  {t:"LIT",n:"Global X Lithium & Battery",c:"Sector Materials",h:40,er:.75,r:5.0,v:30.0,d:1.0},
  {t:"TAN",n:"Invesco Solar",c:"Sector Energy",h:30,er:.67,r:3.0,v:35.0,d:.5},
  {t:"ICLN",n:"iShares Global Clean Energy",c:"Sector Energy",h:100,er:.40,r:3.0,v:28.0,d:1.0},
  {t:"PBW",n:"Invesco WilderHill Clean Energy",c:"Sector Energy",h:50,er:.62,r:2.0,v:32.0,d:.3},
  {t:"BLOK",n:"Amplify Transformational Data",c:"Sector Tech",h:50,er:.71,r:8.0,v:30.0,d:0},
  {t:"BITQ",n:"Bitwise Crypto Industry Innovators",c:"Sector Tech",h:30,er:.85,r:10.0,v:55.0,d:0},
  {t:"IBIT",n:"iShares Bitcoin Trust",c:"Commodity",h:1,er:.12,r:50.0,v:60.0,d:0},
  {t:"MSTR",n:"MicroStrategy (Bitcoin proxy)",c:"Sector Tech",h:1,er:0,r:60.0,v:80.0,d:0},
  {t:"GBTC",n:"Grayscale Bitcoin Trust",c:"Commodity",h:1,er:1.50,r:45.0,v:60.0,d:0},
  {t:"ETHE",n:"Grayscale Ethereum Trust",c:"Commodity",h:1,er:2.50,r:30.0,v:70.0,d:0},
  {t:"BITO",n:"ProShares Bitcoin Strategy",c:"Commodity",h:1,er:.95,r:40.0,v:58.0,d:0},
  {t:"JETS",n:"US Global Jets",c:"Sector Indust",h:30,er:.60,r:6.0,v:28.0,d:.3},
  {t:"BUZZ",n:"VanEck Social Sentiment",c:"US Growth",h:75,er:.75,r:8.0,v:22.0,d:0},
  {t:"ARKX",n:"ARK Space Exploration",c:"Sector Tech",h:35,er:.70,r:4.0,v:28.0,d:0},
  // ── Extended: Utilities / Defensive ──
  {t:"IDU",n:"iShares US Utilities",c:"Sector Utilities",h:60,er:.39,r:7.5,v:15.0,d:3.0},
  {t:"VPU",n:"Vanguard Utilities",c:"Sector Utilities",h:70,er:.10,r:7.5,v:15.0,d:3.2},
  // ── Extended: Materials / Industrials ──
  {t:"XME",n:"SPDR S&P Metals & Mining",c:"Sector Materials",h:30,er:.35,r:5.0,v:28.0,d:1.5},
  {t:"PICK",n:"iShares MSCI Global Metals & Mining",c:"Sector Materials",h:200,er:.39,r:4.5,v:25.0,d:3.0},
  {t:"ITB",n:"iShares US Home Construction",c:"Sector Consumer",h:35,er:.39,r:12.0,v:24.0,d:.5},
  {t:"ITA",n:"iShares US Aerospace & Defense",c:"Sector Indust",h:35,er:.39,r:10.0,v:18.0,d:.8},
  {t:"XAR",n:"SPDR S&P Aerospace & Defense",c:"Sector Indust",h:70,er:.35,r:10.5,v:20.0,d:.5},
  // ── Extended: Buffer / Defined Outcome ──
  {t:"BUFR",n:"FT Cboe Vest Fund of Buffer ETFs",c:"US Large Cap",h:503,er:.95,r:7.0,v:8.0,d:0},
];

const CORR={"US Large Cap":{"US Total Mkt":.99,"US Growth":.92,"US Value":.92,"US Mid Cap":.95,"US Small Cap":.88,"US Dividend":.93,"International":.72,"Intl Developed":.74,"Emerging Mkts":.65,"Sector Tech":.88,"Sector Health":.78,"Sector Finance":.82,"Sector Energy":.58,"Sector Indust":.88,"Sector Consumer":.87,"Sector RE":.62,"Sector Utilities":.55,"Sector Materials":.72,"Sector Comms":.82,"Factor Momentum":.90,"Factor Quality":.96,"Factor LowVol":.85,"US Bond":-.15,"Intl Bond":-.08,"US Treasury":-.35,"US Corp Bond":.10,"US High Yield":.60,"Commodity":.25,"Stock":.75,"Cash":0},"US Growth":{"US Value":.72,"US Small Cap":.82,"International":.65,"US Bond":-.22,"US Treasury":-.42,"Commodity":.15,"Stock":.78,"Cash":0},"US Value":{"US Small Cap":.88,"International":.78,"US Bond":.05,"US Treasury":-.15,"Commodity":.35,"Stock":.70,"Cash":0},"US Total Mkt":{"Commodity":.22,"Stock":.76,"Cash":0},"US Mid Cap":{"Commodity":.28,"Stock":.72,"Cash":0},"US Small Cap":{"International":.72,"US Bond":-.08,"US Treasury":-.28,"Commodity":.25,"Stock":.68,"Cash":0},"US Dividend":{"US Bond":.08,"US Treasury":-.12,"Commodity":.30,"Stock":.65,"Cash":0},"International":{"Intl Developed":.98,"Emerging Mkts":.88,"US Bond":.05,"US Treasury":-.10,"Commodity":.35,"Stock":.55,"Cash":0},"Intl Developed":{"Emerging Mkts":.82,"Commodity":.30,"Stock":.52,"Cash":0},"Emerging Mkts":{"US Bond":.02,"US Treasury":-.15,"Commodity":.40,"Stock":.48,"Cash":0},"Sector Tech":{"Sector Health":.62,"Sector Finance":.72,"Sector Energy":.32,"Sector Indust":.75,"Sector Consumer":.78,"Sector RE":.42,"Sector Utilities":.30,"Sector Materials":.48,"Sector Comms":.82,"Commodity":.10,"Stock":.80,"Cash":0},"Sector Health":{"Sector Finance":.58,"Sector Energy":.35,"Sector Indust":.60,"Sector Consumer":.62,"Sector RE":.45,"Sector Utilities":.48,"Sector Materials":.42,"Sector Comms":.55,"Commodity":.15,"Stock":.60,"Cash":0},"Sector Finance":{"Sector Energy":.55,"Sector Indust":.72,"Sector Consumer":.68,"Sector RE":.58,"Sector Utilities":.42,"Sector Materials":.55,"Sector Comms":.62,"Commodity":.25,"Stock":.65,"Cash":0},"Sector Energy":{"Sector Indust":.55,"Sector Consumer":.42,"Sector RE":.30,"Sector Utilities":.35,"Sector Materials":.62,"Sector Comms":.35,"Commodity":.65,"Stock":.45,"Cash":0},"Sector Indust":{"Sector Consumer":.72,"Sector RE":.48,"Sector Utilities":.42,"Sector Materials":.68,"Sector Comms":.62,"Commodity":.35,"Stock":.68,"Cash":0},"Sector Consumer":{"Sector RE":.45,"Sector Utilities":.38,"Sector Materials":.48,"Sector Comms":.70,"Commodity":.20,"Stock":.70,"Cash":0},"Sector RE":{"Sector Utilities":.62,"Sector Materials":.35,"Sector Comms":.38,"Commodity":.15,"Stock":.40,"Cash":0},"Sector Utilities":{"Sector Materials":.38,"Sector Comms":.32,"Commodity":.18,"US Bond":.25,"Stock":.35,"Cash":0},"Sector Materials":{"Sector Comms":.42,"Commodity":.60,"Stock":.55,"Cash":0},"Sector Comms":{"Commodity":.12,"Stock":.72,"Cash":0},"Factor Momentum":{"Commodity":.18,"Stock":.72,"Cash":0},"Factor Quality":{"Commodity":.20,"Stock":.74,"Cash":0},"Factor LowVol":{"US Bond":.15,"Commodity":.12,"Stock":.55,"Cash":0},"US Bond":{"Intl Bond":.65,"US Treasury":.88,"US Corp Bond":.92,"US High Yield":.45,"Commodity":-.05,"Stock":-.10,"Cash":.05},"Intl Bond":{"US Treasury":.55,"US Corp Bond":.60,"US High Yield":.35,"Commodity":.05,"Stock":-.05,"Cash":.03},"US Treasury":{"US Corp Bond":.72,"US High Yield":.05,"Commodity":-.10,"Stock":-.30,"Cash":.02},"US Corp Bond":{"US High Yield":.68,"Commodity":.00,"Stock":.05,"Cash":.03},"US High Yield":{"Commodity":.20,"Stock":.50,"Cash":0},"Commodity":{"Stock":.20,"Cash":0},"Stock":{"Cash":0},"Cash":{"Cash":1}};
// Parent category mapping: sub-category → parent ETF category (for cross-group fallback)
const SUB_PARENT = {
  "Tech-Semi":"Sector Tech","Tech-Software":"Sector Tech","Tech-Internet":"Sector Tech",
  "Tech-Hardware":"Sector Tech","Tech-Cyber":"Sector Tech",
  "Consumer-Staple":"Sector Consumer","Consumer-Disc":"Sector Consumer","Consumer-Auto":"Sector Consumer",
  "Fin-Bank":"Sector Finance","Fin-Payments":"Sector Finance","Fin-Diversified":"Sector Finance",
  "Health-Pharma":"Sector Health","Health-Biotech":"Sector Health","Health-MedTech":"Sector Health","Health-Services":"Sector Health",
  "Energy-Major":"Sector Energy","Energy-Svc":"Sector Energy",
  "Indust-Defense":"Sector Indust","Indust-General":"Sector Indust",
};

function gc(a,b){
  if(a===b)return 1;
  // 1. Direct sub-category correlation
  const sub = SUB_CORR[a]?.[b] ?? SUB_CORR[b]?.[a];
  if(sub != null) return sub;
  // 2. Base CORR matrix
  const base = CORR[a]?.[b] ?? CORR[b]?.[a];
  if(base != null) return base;
  // 3. Parent fallback: if either side is a sub-category, try parent's correlation
  const pa = SUB_PARENT[a], pb = SUB_PARENT[b];
  if(pa && pb) return CORR[pa]?.[pb] ?? CORR[pb]?.[pa] ?? .5;
  if(pa) return CORR[pa]?.[b] ?? CORR[b]?.[pa] ?? SUB_CORR[b]?.[pa] ?? .5;
  if(pb) return CORR[a]?.[pb] ?? CORR[pb]?.[a] ?? SUB_CORR[a]?.[pb] ?? .5;
  return .5;
}

const RF=4.5;

// ── Forward Return Estimator ──
// Trailing 12m returns are NOT forward expectations. This shrinks them toward
// a long-term equity mean (10%) with more shrinkage for higher-vol portfolios.
// Clamped to 3-18% to prevent absurd projections.
function shrinkToForward(trailing, vol) {
  const longTermMean = 10; // long-term equity real return
  const volFactor = Math.min(1, (vol || 15) / 30);
  const shrinkWeight = 0.4 + volFactor * 0.3; // 40-70% toward mean
  const fwd = trailing * (1 - shrinkWeight) + longTermMean * shrinkWeight;
  return Math.max(3, Math.min(18, fwd));
}

// ── Return Shrinkage: dampen extreme trailing returns to reduce momentum bias ──
// A stock that returned 200% last year almost never repeats — mean reversion dominates.
// This blends extreme returns toward a cap, preventing any single stock from dominating
// the Sharpe pre-filter purely on trailing momentum.
// For stocks: cap at 80% annualized, keep 20% of excess above cap
// For ETFs: cap at 120% annualized (ETFs are diversified, more sustainable momentum)
function shrinkReturn(r, isStock) {
  // Progressive shrinkage: starts light at threshold, increases with magnitude
  // ETFs: shrink above 25% annualized, Stocks: shrink above 20%
  // Formula: beyond threshold, keep diminishing fraction via log-style compression
  // This prevents the momentum signal from being dominated by recent rockets
  // while still allowing moderate momentum to express
  const threshold = isStock ? 20 : 25;    // where shrinkage begins
  const hardCap = isStock ? 60 : 80;      // absolute max after shrinkage
  const sign = r >= 0 ? 1 : -1;
  const absR = Math.abs(r);
  if (absR <= threshold) return r;
  // Progressive: keep 60% of the next 25%, then 30% beyond that
  const tier1 = Math.min(absR - threshold, 25) * 0.60;
  const tier2 = Math.max(0, absR - threshold - 25) * 0.30;
  const shrunk = threshold + tier1 + tier2;
  return sign * Math.min(shrunk, hardCap);
}
const PAL=["#42be65","#78a9ff","#ff7eb6","#ffab91","#be95ff","#82cfff","#08bdba","#ff8389","#33b1ff","#d4bbff"];

const STOCK_DB=[
  // ipo = year stock became publicly available (approximate)
  // Mega-cap Tech
  {t:"AAPL",n:"Apple Inc.",s:"Technology",ipo:1980},{t:"MSFT",n:"Microsoft",s:"Technology",ipo:1986},{t:"GOOGL",n:"Alphabet (A)",s:"Technology",ipo:2004},{t:"AMZN",n:"Amazon",s:"Consumer",ipo:1997},{t:"NVDA",n:"NVIDIA",s:"Technology",ipo:1999},{t:"META",n:"Meta Platforms",s:"Technology",ipo:2012},{t:"TSLA",n:"Tesla",s:"Consumer",ipo:2010},
  // Financials
  {t:"BRK.B",n:"Berkshire B",s:"Financial",ipo:1996},{t:"V",n:"Visa",s:"Financial",ipo:2008},{t:"JPM",n:"JPMorgan",s:"Financial",ipo:1969},{t:"UNH",n:"UnitedHealth",s:"Healthcare",ipo:1984},{t:"MA",n:"Mastercard",s:"Financial",ipo:2006},{t:"GS",n:"Goldman Sachs",s:"Financial",ipo:1999},{t:"MS",n:"Morgan Stanley",s:"Financial",ipo:1986},{t:"C",n:"Citigroup",s:"Financial",ipo:1986},{t:"SCHW",n:"Charles Schwab",s:"Financial",ipo:1987},{t:"CME",n:"CME Group",s:"Financial",ipo:2002},{t:"ICE",n:"Intercontinental Exch",s:"Financial",ipo:2005},{t:"BAC",n:"Bank of America",s:"Financial",ipo:1973},
  // Healthcare
  {t:"LLY",n:"Eli Lilly",s:"Healthcare",ipo:1952},{t:"JNJ",n:"J&J",s:"Healthcare",ipo:1944},{t:"PFE",n:"Pfizer",s:"Healthcare",ipo:1944},{t:"MRK",n:"Merck",s:"Healthcare",ipo:1946},{t:"ABBV",n:"AbbVie",s:"Healthcare",ipo:2013},{t:"ISRG",n:"Intuitive Surgical",s:"Healthcare",ipo:2000},{t:"MRNA",n:"Moderna",s:"Healthcare",ipo:2018},{t:"CVS",n:"CVS Health",s:"Healthcare",ipo:1996},{t:"REGN",n:"Regeneron",s:"Healthcare",ipo:1991},{t:"VRTX",n:"Vertex Pharma",s:"Healthcare",ipo:1991},{t:"GILD",n:"Gilead",s:"Healthcare",ipo:1992},{t:"CI",n:"Cigna",s:"Healthcare",ipo:1982},{t:"DHR",n:"Danaher",s:"Healthcare",ipo:1981},{t:"EXAS",n:"Exact Sciences",s:"Healthcare",ipo:2001},
  // Consumer
  {t:"PG",n:"Procter & Gamble",s:"Consumer",ipo:1890},{t:"HD",n:"Home Depot",s:"Consumer",ipo:1981},{t:"COST",n:"Costco",s:"Consumer",ipo:1985},{t:"KO",n:"Coca-Cola",s:"Consumer",ipo:1919},{t:"PEP",n:"PepsiCo",s:"Consumer",ipo:1972},{t:"WMT",n:"Walmart",s:"Consumer",ipo:1972},{t:"SBUX",n:"Starbucks",s:"Consumer",ipo:1992},{t:"MCD",n:"McDonald's",s:"Consumer",ipo:1965},{t:"LOW",n:"Lowe's",s:"Consumer",ipo:1961},{t:"TGT",n:"Target",s:"Consumer",ipo:1967},{t:"LULU",n:"Lululemon",s:"Consumer",ipo:2007},{t:"CMG",n:"Chipotle",s:"Consumer",ipo:2006},{t:"F",n:"Ford",s:"Consumer",ipo:1956},{t:"GM",n:"General Motors",s:"Consumer",ipo:2010},
  // Technology
  {t:"AVGO",n:"Broadcom",s:"Technology",ipo:2009},{t:"CRM",n:"Salesforce",s:"Technology",ipo:2004},{t:"AMD",n:"AMD",s:"Technology",ipo:1979},{t:"NFLX",n:"Netflix",s:"Technology",ipo:2002},{t:"ADBE",n:"Adobe",s:"Technology",ipo:1986},{t:"CSCO",n:"Cisco",s:"Technology",ipo:1990},{t:"INTC",n:"Intel",s:"Technology",ipo:1971},{t:"ORCL",n:"Oracle",s:"Technology",ipo:1986},{t:"IBM",n:"IBM",s:"Technology",ipo:1911},{t:"QCOM",n:"Qualcomm",s:"Technology",ipo:1991},{t:"INTU",n:"Intuit",s:"Technology",ipo:1993},{t:"MU",n:"Micron",s:"Technology",ipo:1984},{t:"NOW",n:"ServiceNow",s:"Technology",ipo:2012},{t:"PANW",n:"Palo Alto Networks",s:"Technology",ipo:2012},{t:"DELL",n:"Dell",s:"Technology",ipo:2018},{t:"NXPI",n:"NXP Semi",s:"Technology",ipo:2010},{t:"ADI",n:"Analog Devices",s:"Technology",ipo:1969},{t:"SNPS",n:"Synopsys",s:"Technology",ipo:1992},{t:"CDNS",n:"Cadence Design",s:"Technology",ipo:1993},{t:"FTNT",n:"Fortinet",s:"Technology",ipo:2009},{t:"WDAY",n:"Workday",s:"Technology",ipo:2012},{t:"SMCI",n:"Super Micro",s:"Technology",ipo:2007},
  // Post-2015 IPOs (tagged for dynamic filtering)
  {t:"UBER",n:"Uber",s:"Technology",ipo:2019},{t:"PLTR",n:"Palantir",s:"Technology",ipo:2020},{t:"SHOP",n:"Shopify",s:"Technology",ipo:2015},{t:"SQ",n:"Block",s:"Technology",ipo:2015},{t:"COIN",n:"Coinbase",s:"Financial",ipo:2021},{t:"CRWD",n:"CrowdStrike",s:"Technology",ipo:2019},{t:"NET",n:"Cloudflare",s:"Technology",ipo:2019},{t:"ABNB",n:"Airbnb",s:"Consumer",ipo:2020},{t:"PYPL",n:"PayPal",s:"Financial",ipo:2015},{t:"TEAM",n:"Atlassian",s:"Technology",ipo:2015},{t:"HUBS",n:"HubSpot",s:"Technology",ipo:2014},{t:"SNOW",n:"Snowflake",s:"Technology",ipo:2020},{t:"DASH",n:"DoorDash",s:"Technology",ipo:2020},{t:"SPOT",n:"Spotify",s:"Communications",ipo:2018},{t:"DDOG",n:"Datadog",s:"Technology",ipo:2019},{t:"AFRM",n:"Affirm",s:"Technology",ipo:2021},{t:"ARM",n:"Arm Holdings",s:"Technology",ipo:2023},{t:"APP",n:"AppLovin",s:"Technology",ipo:2021},{t:"SOFI",n:"SoFi",s:"Financial",ipo:2021},{t:"RIVN",n:"Rivian",s:"Consumer",ipo:2021},{t:"HOOD",n:"Robinhood",s:"Financial",ipo:2021},{t:"IONQ",n:"IonQ",s:"Technology",ipo:2021},{t:"SOUN",n:"SoundHound AI",s:"Technology",ipo:2022},{t:"RKLB",n:"Rocket Lab",s:"Industrial",ipo:2021},{t:"NU",n:"Nu Holdings",s:"Financial",ipo:2021},{t:"SE",n:"Sea Limited",s:"Technology",ipo:2017},{t:"CPNG",n:"Coupang",s:"Consumer",ipo:2021},
  // Energy
  {t:"XOM",n:"Exxon Mobil",s:"Energy",ipo:1920},{t:"CVX",n:"Chevron",s:"Energy",ipo:1921},{t:"COP",n:"ConocoPhillips",s:"Energy",ipo:2012},{t:"OXY",n:"Occidental Petroleum",s:"Energy",ipo:1964},{t:"FSLR",n:"First Solar",s:"Energy",ipo:2006},
  // Communications
  {t:"DIS",n:"Disney",s:"Communications",ipo:1957},{t:"TMUS",n:"T-Mobile",s:"Communications",ipo:2007},{t:"CMCSA",n:"Comcast",s:"Communications",ipo:1972},{t:"EA",n:"Electronic Arts",s:"Communications",ipo:1989},{t:"BILI",n:"Bilibili (ADR)",s:"Communications",ipo:2018},
  // International ADR
  {t:"BABA",n:"Alibaba (ADR)",s:"Technology",ipo:2014},{t:"JD",n:"JD.com (ADR)",s:"Consumer",ipo:2014},{t:"PDD",n:"PDD Holdings",s:"Consumer",ipo:2018},{t:"NIO",n:"NIO (ADR)",s:"Consumer",ipo:2018},{t:"TSM",n:"Taiwan Semi (ADR)",s:"Technology",ipo:1997},{t:"ASML",n:"ASML (ADR)",s:"Technology",ipo:1995},{t:"MELI",n:"MercadoLibre",s:"Consumer",ipo:2007},{t:"VALE",n:"Vale (ADR)",s:"Materials",ipo:2002},{t:"BHP",n:"BHP (ADR)",s:"Materials",ipo:1987},{t:"RIO",n:"Rio Tinto (ADR)",s:"Materials",ipo:1962},
  // Industrial
  {t:"GE",n:"GE",s:"Industrial",ipo:1892},{t:"CAT",n:"Caterpillar",s:"Industrial",ipo:1929},{t:"BA",n:"Boeing",s:"Industrial",ipo:1962},{t:"LMT",n:"Lockheed Martin",s:"Industrial",ipo:1995},{t:"HON",n:"Honeywell",s:"Industrial",ipo:1925},{t:"ETN",n:"Eaton",s:"Industrial",ipo:1923},{t:"DE",n:"Deere",s:"Industrial",ipo:1911},{t:"UPS",n:"UPS",s:"Industrial",ipo:1999},{t:"FDX",n:"FedEx",s:"Industrial",ipo:1978},{t:"DAL",n:"Delta Air Lines",s:"Industrial",ipo:2007},
  // Real Estate / Utilities / Materials
  {t:"O",n:"Realty Income",s:"Real Estate",ipo:1994},{t:"AMT",n:"American Tower",s:"Real Estate",ipo:1998},{t:"NEE",n:"NextEra Energy",s:"Utilities",ipo:1984},{t:"SO",n:"Southern Co",s:"Utilities",ipo:1949},{t:"NEM",n:"Newmont",s:"Materials",ipo:1940},{t:"FCX",n:"Freeport-McMoRan",s:"Materials",ipo:1995},{t:"GOLD",n:"Barrick Gold",s:"Materials",ipo:1987},
  // Historical top-30 (not currently top, but were major S&P 500 names in 2016-2020)
  {t:"WFC",n:"Wells Fargo",s:"Financial",ipo:1978},{t:"T",n:"AT&T",s:"Communications",ipo:1984},{t:"VZ",n:"Verizon",s:"Communications",ipo:1984},
  // Sector leaders needed for historical backtest (SP500_BY_SECTOR)
  // Technology
  {t:"TXN",n:"Texas Instruments",s:"Technology",ipo:1953},{t:"ACN",n:"Accenture",s:"Technology",ipo:2001},
  // Healthcare
  {t:"AMGN",n:"Amgen",s:"Healthcare",ipo:1983},{t:"MDT",n:"Medtronic",s:"Healthcare",ipo:1977},{t:"BMY",n:"Bristol-Myers Squibb",s:"Healthcare",ipo:1972},
  // Consumer
  {t:"NKE",n:"Nike",s:"Consumer",ipo:1980},
  // Financials
  {t:"BLK",n:"BlackRock",s:"Financial",ipo:1999},
  // Communications
  {t:"CHTR",n:"Charter Communications",s:"Communications",ipo:2009},
  // Energy
  {t:"EOG",n:"EOG Resources",s:"Energy",ipo:1989},{t:"SLB",n:"Schlumberger",s:"Energy",ipo:1962},{t:"PSX",n:"Phillips 66",s:"Energy",ipo:2012},{t:"MPC",n:"Marathon Petroleum",s:"Energy",ipo:2011},{t:"VLO",n:"Valero Energy",s:"Energy",ipo:1997},{t:"HAL",n:"Halliburton",s:"Energy",ipo:1948},
  // Industrial
  {t:"UNP",n:"Union Pacific",s:"Industrial",ipo:1969},{t:"RTX",n:"RTX (Raytheon)",s:"Industrial",ipo:2020},{t:"GD",n:"General Dynamics",s:"Industrial",ipo:1952},{t:"MMM",n:"3M",s:"Industrial",ipo:1946},
  // Materials
  {t:"LIN",n:"Linde",s:"Materials",ipo:2018},{t:"APD",n:"Air Products",s:"Materials",ipo:1961},{t:"ECL",n:"Ecolab",s:"Materials",ipo:1957},{t:"SHW",n:"Sherwin-Williams",s:"Materials",ipo:1964},{t:"PPG",n:"PPG Industries",s:"Materials",ipo:1900},{t:"DD",n:"DuPont",s:"Materials",ipo:2019},{t:"DOW",n:"Dow Inc",s:"Materials",ipo:2019},{t:"NUE",n:"Nucor",s:"Materials",ipo:1972},
  // Utilities
  {t:"DUK",n:"Duke Energy",s:"Utilities",ipo:1961},{t:"D",n:"Dominion Energy",s:"Utilities",ipo:1983},{t:"AEP",n:"American Electric Power",s:"Utilities",ipo:1906},{t:"EXC",n:"Exelon",s:"Utilities",ipo:2000},{t:"SRE",n:"Sempra",s:"Utilities",ipo:1998},{t:"WEC",n:"WEC Energy",s:"Utilities",ipo:1947},{t:"ES",n:"Eversource Energy",s:"Utilities",ipo:1966},{t:"XEL",n:"Xcel Energy",s:"Utilities",ipo:1910},
  // Real Estate
  {t:"PLD",n:"Prologis",s:"Real Estate",ipo:1997},{t:"CCI",n:"Crown Castle",s:"Real Estate",ipo:1998},{t:"EQIX",n:"Equinix",s:"Real Estate",ipo:2000},{t:"PSA",n:"Public Storage",s:"Real Estate",ipo:1980},{t:"DLR",n:"Digital Realty",s:"Real Estate",ipo:2004},{t:"SPG",n:"Simon Property Group",s:"Real Estate",ipo:1993},{t:"WELL",n:"Welltower",s:"Real Estate",ipo:1985},{t:"AVB",n:"AvalonBay",s:"Real Estate",ipo:1994},
  // Historical leaders (pre-2016, needed for extended backtest 2006-2015)
  {t:"HPQ",n:"HP Inc",s:"Technology",ipo:1961},{t:"ABT",n:"Abbott Labs",s:"Healthcare",ipo:1964},{t:"MET",n:"MetLife",s:"Financial",ipo:2000},{t:"AIG",n:"AIG",s:"Financial",ipo:1969},{t:"BIIB",n:"Biogen",s:"Healthcare",ipo:1991},
];

// Map STOCK_DB sector names to optimizer category system
const SECTOR_TO_CAT = {"Technology":"Sector Tech","Consumer":"Sector Consumer","Financial":"Sector Finance","Healthcare":"Sector Health","Energy":"Sector Energy","Industrial":"Sector Indust","Communications":"Sector Comms","Real Estate":"Sector RE","Utilities":"Sector Utilities","Materials":"Sector Materials"};

// ── Granular sub-categories for stocks ──
// Stocks in the same sector have very different correlation profiles.
// NVDA-AMD (semi) ≈ 0.82, but NVDA-MSFT (semi vs software) ≈ 0.62.
// Without sub-categories, both pairs get corr = 1.0 (same "Sector Tech").
const STOCK_SUB = {
  // Tech → 5 sub-categories
  // Semiconductors: driven by chip demand cycles, capex, AI inference buildout
  NVDA:"Tech-Semi",AMD:"Tech-Semi",AVGO:"Tech-Semi",INTC:"Tech-Semi",QCOM:"Tech-Semi",MU:"Tech-Semi",
  NXPI:"Tech-Semi",ADI:"Tech-Semi",TSM:"Tech-Semi",ASML:"Tech-Semi",ARM:"Tech-Semi",TXN:"Tech-Semi",
  SNPS:"Tech-Semi",CDNS:"Tech-Semi",
  // Enterprise Software/Cloud: driven by IT spending, subscription revenue, AI SaaS
  MSFT:"Tech-Software",CRM:"Tech-Software",ADBE:"Tech-Software",ORCL:"Tech-Software",INTU:"Tech-Software",
  NOW:"Tech-Software",WDAY:"Tech-Software",SNOW:"Tech-Software",TEAM:"Tech-Software",HUBS:"Tech-Software",
  DDOG:"Tech-Software",PLTR:"Tech-Software",
  // Internet/Platforms: driven by ad revenue, user growth, e-commerce
  GOOGL:"Tech-Internet",META:"Tech-Internet",NFLX:"Tech-Internet",UBER:"Tech-Internet",SHOP:"Tech-Internet",
  SQ:"Tech-Internet",SE:"Tech-Internet",APP:"Tech-Internet",DASH:"Tech-Internet",BABA:"Tech-Internet",
  SPOT:"Tech-Internet",AFRM:"Tech-Internet",
  // Hardware/Infrastructure: driven by product cycles, enterprise refresh
  AAPL:"Tech-Hardware",CSCO:"Tech-Hardware",IBM:"Tech-Hardware",DELL:"Tech-Hardware",SMCI:"Tech-Hardware",
  HPQ:"Tech-Hardware",IONQ:"Tech-Hardware",SOUN:"Tech-Hardware",
  // Cybersecurity: driven by breach cycles, compliance spend
  PANW:"Tech-Cyber",CRWD:"Tech-Cyber",FTNT:"Tech-Cyber",NET:"Tech-Cyber",

  // Consumer → 3 sub-categories
  // Staples: defensive, low beta, dividend-heavy
  PG:"Consumer-Staple",KO:"Consumer-Staple",PEP:"Consumer-Staple",WMT:"Consumer-Staple",
  COST:"Consumer-Staple",TGT:"Consumer-Staple",NKE:"Consumer-Staple",
  // Discretionary: cyclical, driven by consumer confidence
  AMZN:"Consumer-Disc",HD:"Consumer-Disc",LOW:"Consumer-Disc",SBUX:"Consumer-Disc",MCD:"Consumer-Disc",
  CMG:"Consumer-Disc",LULU:"Consumer-Disc",ABNB:"Consumer-Disc",JD:"Consumer-Disc",PDD:"Consumer-Disc",
  MELI:"Consumer-Disc",CPNG:"Consumer-Disc",
  // Autos: highly cyclical, capex-heavy, EV transition
  TSLA:"Consumer-Auto",F:"Consumer-Auto",GM:"Consumer-Auto",RIVN:"Consumer-Auto",NIO:"Consumer-Auto",

  // Financial → 3 sub-categories
  // Banks: rate-sensitive, credit cycle driven
  JPM:"Fin-Bank",BAC:"Fin-Bank",GS:"Fin-Bank",MS:"Fin-Bank",C:"Fin-Bank",WFC:"Fin-Bank",
  AIG:"Fin-Bank",MET:"Fin-Bank",
  // Payments/Fintech: volume-driven, secular growth
  V:"Fin-Payments",MA:"Fin-Payments",PYPL:"Fin-Payments",COIN:"Fin-Payments",
  SOFI:"Fin-Payments",HOOD:"Fin-Payments",NU:"Fin-Payments",
  // Diversified: conglomerates, exchanges, asset managers
  "BRK.B":"Fin-Diversified",SCHW:"Fin-Diversified",CME:"Fin-Diversified",ICE:"Fin-Diversified",BLK:"Fin-Diversified",

  // Healthcare → 3 sub-categories
  // Pharma: pipeline-driven, patent cliffs, stable revenue
  LLY:"Health-Pharma",JNJ:"Health-Pharma",PFE:"Health-Pharma",MRK:"Health-Pharma",ABBV:"Health-Pharma",BMY:"Health-Pharma",
  // Biotech: binary outcomes, high vol, M&A targets
  MRNA:"Health-Biotech",REGN:"Health-Biotech",VRTX:"Health-Biotech",GILD:"Health-Biotech",BIIB:"Health-Biotech",
  AMGN:"Health-Biotech",EXAS:"Health-Biotech",
  // MedTech + Services: procedure volumes, insurance cycles
  UNH:"Health-Services",CVS:"Health-Services",CI:"Health-Services",
  ISRG:"Health-MedTech",DHR:"Health-MedTech",MDT:"Health-MedTech",ABT:"Health-MedTech",

  // Energy → 2 sub-categories
  // Integrated majors: diversified, dividend, lower vol
  XOM:"Energy-Major",CVX:"Energy-Major",COP:"Energy-Major",OXY:"Energy-Major",
  // Services & downstream: higher vol, levered to oil price
  EOG:"Energy-Svc",SLB:"Energy-Svc",PSX:"Energy-Svc",MPC:"Energy-Svc",VLO:"Energy-Svc",HAL:"Energy-Svc",FSLR:"Energy-Svc",

  // Industrial → 2 sub-categories
  // Defense/Aerospace: government contracts, long cycles
  BA:"Indust-Defense",LMT:"Indust-Defense",RTX:"Indust-Defense",GD:"Indust-Defense",RKLB:"Indust-Defense",
  // General industrial: capex cycle, economic sensitivity
  GE:"Indust-General",CAT:"Indust-General",HON:"Indust-General",ETN:"Indust-General",DE:"Indust-General",
  UPS:"Indust-General",FDX:"Indust-General",DAL:"Indust-General",MMM:"Indust-General",UNP:"Indust-General",
};

// ── Sub-category correlations ──
// These define how sub-categories correlate with each other AND with existing ETF categories.
// Within a sub-category: gc() returns 1.0 (same-category rule). Between sub-categories:
const SUB_CORR = {
  // Tech sub-categories: within-tech cross-correlations
  "Tech-Semi":    {"Tech-Software":.68,"Tech-Internet":.62,"Tech-Hardware":.72,"Tech-Cyber":.60,
                   "US Growth":.85,"US Large Cap":.78,"Sector Tech":.92,"Sector Comms":.58,"US Bond":-.25,"US Treasury":-.40,"Commodity":.08,"Cash":0},
  "Tech-Software":{"Tech-Internet":.78,"Tech-Hardware":.65,"Tech-Cyber":.82,
                   "US Growth":.88,"US Large Cap":.82,"Sector Tech":.90,"US Bond":-.20,"US Treasury":-.38,"Commodity":.05,"Cash":0},
  "Tech-Internet":{"Tech-Hardware":.60,"Tech-Cyber":.70,
                   "US Growth":.90,"US Large Cap":.80,"Sector Tech":.85,"Sector Comms":.75,"Sector Consumer":.65,"US Bond":-.18,"US Treasury":-.35,"Commodity":.08,"Cash":0},
  "Tech-Hardware":{"Tech-Cyber":.58,
                   "US Growth":.75,"US Large Cap":.80,"Sector Tech":.88,"US Bond":-.12,"US Treasury":-.30,"Commodity":.12,"Cash":0},
  "Tech-Cyber":   {"US Growth":.80,"US Large Cap":.72,"Sector Tech":.82,"US Bond":-.18,"US Treasury":-.32,"Commodity":.05,"Cash":0},

  // Consumer sub-categories
  "Consumer-Staple":{"Consumer-Disc":.52,"Consumer-Auto":.30,
                     "US Value":.78,"US Dividend":.82,"US Large Cap":.72,"Sector Consumer":.85,"US Bond":.12,"US Treasury":-.05,"Factor LowVol":.75,"Commodity":.22,"Cash":0},
  "Consumer-Disc":  {"Consumer-Auto":.55,
                     "US Growth":.75,"US Large Cap":.85,"Sector Consumer":.90,"US Bond":-.12,"US Treasury":-.28,"Commodity":.18,"Cash":0},
  "Consumer-Auto":  {"US Growth":.60,"US Large Cap":.55,"Sector Consumer":.65,"Sector Indust":.62,"Emerging Mkts":.45,"US Bond":-.15,"US Treasury":-.30,"Commodity":.25,"Cash":0},

  // Financial sub-categories
  "Fin-Bank":      {"Fin-Payments":.62,"Fin-Diversified":.78,
                    "US Value":.80,"US Large Cap":.82,"Sector Finance":.95,"US Bond":.05,"US Treasury":-.20,"Commodity":.22,"Cash":0},
  "Fin-Payments":  {"Fin-Diversified":.65,
                    "US Growth":.72,"US Large Cap":.78,"Sector Finance":.80,"Tech-Internet":.62,"US Bond":-.10,"US Treasury":-.25,"Commodity":.12,"Cash":0},
  "Fin-Diversified":{"US Large Cap":.85,"US Value":.75,"Sector Finance":.88,"US Bond":.02,"US Treasury":-.15,"Commodity":.20,"Cash":0},

  // Healthcare sub-categories
  "Health-Pharma": {"Health-Biotech":.55,"Health-MedTech":.68,"Health-Services":.62,
                    "US Large Cap":.72,"US Value":.70,"Sector Health":.92,"US Bond":.02,"US Treasury":-.10,"Commodity":.12,"Cash":0},
  "Health-Biotech": {"Health-MedTech":.50,"Health-Services":.42,
                     "US Large Cap":.58,"Sector Health":.82,"US Growth":.55,"US Bond":-.08,"US Treasury":-.18,"Commodity":.08,"Cash":0},
  "Health-MedTech": {"Health-Services":.60,
                     "US Large Cap":.72,"Sector Health":.85,"US Bond":-.02,"US Treasury":-.12,"Commodity":.10,"Cash":0},
  "Health-Services":{"US Large Cap":.68,"US Value":.65,"Sector Health":.80,"US Bond":.05,"US Treasury":-.08,"Commodity":.10,"Cash":0},

  // Energy sub-categories
  "Energy-Major":  {"Energy-Svc":.80,
                    "US Value":.65,"US Large Cap":.60,"Sector Energy":.95,"Commodity":.62,"US Bond":.02,"US Treasury":-.08,"Cash":0},
  "Energy-Svc":    {"US Value":.55,"US Large Cap":.50,"Sector Energy":.90,"Commodity":.70,"US Bond":-.02,"US Treasury":-.12,"Cash":0},

  // Industrial sub-categories
  "Indust-Defense":{"Indust-General":.65,
                    "US Large Cap":.62,"Sector Indust":.78,"US Value":.60,"US Bond":.08,"US Treasury":-.05,"Commodity":.20,"Cash":0},
  "Indust-General":{"US Large Cap":.82,"Sector Indust":.95,"US Value":.75,"Commodity":.38,"US Bond":-.05,"US Treasury":-.18,"Cash":0},
};

// Build STOCK_OPT with sub-categories
const STOCK_OPT = STOCK_DB.map(s => {
  const sub = STOCK_SUB[s.t];
  const cat = sub || SECTOR_TO_CAT[s.s] || "Stock";
  return { t: s.t, n: s.n, c: cat, r: 12, v: 25, er: 0, d: 0, h: 1, type: "stock", ipo: s.ipo || 2000 };
});
// Helper: check if a stock was publicly traded by a given year
function stockAvailableAt(stock, year) { return (stock.ipo || 0) <= year; }

// ── Historical S&P 500 Top ~5 per GICS sector by market cap at January of each year ──
// This captures sector leaders INCLUDING growth names that aren't overall top-30
// e.g., NVDA was tech top-5 by 2018 (GPU dominance) even though it wasn't overall top-30 until 2021
// Format: { year: { sector: [tickers] } }
const SP500_BY_SECTOR = {
  2006: {
    Technology: ["AAPL","MSFT","INTC","CSCO","ORCL","IBM","QCOM","HPQ","TXN","ACN","MU","ADBE","ADI","SNPS","CDNS"],
    Financials: ["BRK.B","C","BAC","JPM","WFC","AIG","GS","MS","MET","SCHW","CME","ICE"],
    Healthcare: ["JNJ","PFE","UNH","MRK","AMGN","GILD","ABT","MDT","BMY","LLY","CI","DHR","CVS","BIIB"],
    Consumer: ["WMT","PG","KO","PEP","HD","MCD","COST","NKE","SBUX","LOW","TGT","F","GM"],
    Communications: ["GOOGL","DIS","CMCSA","VZ","T","EA"],
    Energy: ["XOM","CVX","COP","SLB","OXY","EOG","HAL","VLO"],
    Industrial: ["GE","BA","HON","UNP","CAT","MMM","LMT","GD","DE","UPS","FDX","DAL","ETN"],
    Materials: ["DD","NEM","FCX","APD","ECL","SHW","PPG","NUE","GOLD","VALE","BHP","RIO"],
    Utilities: ["NEE","SO","DUK","D","AEP","EXC","SRE","WEC","ES","XEL"],
    RealEstate: ["SPG","PSA","AVB","WELL","O"],
  },
  2007: {
    Technology: ["AAPL","MSFT","INTC","CSCO","ORCL","IBM","QCOM","HPQ","TXN","ACN","MU","ADBE","ADI","SNPS","CDNS"],
    Financials: ["BRK.B","C","BAC","JPM","WFC","AIG","GS","MS","MET","SCHW","CME","ICE"],
    Healthcare: ["JNJ","PFE","UNH","MRK","AMGN","GILD","ABT","MDT","BMY","LLY","CI","DHR","CVS","BIIB"],
    Consumer: ["AMZN","WMT","PG","KO","PEP","HD","MCD","COST","NKE","SBUX","LOW","TGT","F","GM"],
    Communications: ["GOOGL","DIS","CMCSA","VZ","T","EA"],
    Energy: ["XOM","CVX","COP","SLB","OXY","EOG","HAL","VLO"],
    Industrial: ["GE","BA","HON","UNP","CAT","MMM","LMT","GD","DE","UPS","FDX","DAL","ETN"],
    Materials: ["DD","NEM","FCX","APD","ECL","SHW","PPG","NUE","GOLD","VALE","BHP","RIO"],
    Utilities: ["NEE","SO","DUK","D","AEP","EXC","SRE","WEC","ES","XEL"],
    RealEstate: ["SPG","PSA","AVB","WELL","O"],
  },
  2008: {
    Technology: ["AAPL","MSFT","INTC","CSCO","ORCL","IBM","QCOM","HPQ","TXN","ACN","MU","ADBE","ADI","SNPS","CDNS"],
    Financials: ["BRK.B","JPM","BAC","WFC","GS","MS","C","MET","SCHW","CME","ICE"],
    Healthcare: ["JNJ","PFE","UNH","MRK","AMGN","GILD","ABT","MDT","BMY","LLY","CI","DHR","CVS","BIIB"],
    Consumer: ["AMZN","WMT","PG","KO","PEP","HD","MCD","COST","NKE","SBUX","LOW","TGT","F"],
    Communications: ["GOOGL","DIS","CMCSA","VZ","T","EA"],
    Energy: ["XOM","CVX","COP","SLB","OXY","EOG","HAL","VLO"],
    Industrial: ["GE","BA","HON","UNP","CAT","MMM","LMT","GD","DE","UPS","FDX","DAL","ETN"],
    Materials: ["DD","NEM","FCX","APD","ECL","SHW","PPG","NUE","GOLD","VALE","BHP","RIO"],
    Utilities: ["NEE","SO","DUK","D","AEP","EXC","SRE","WEC","ES","XEL"],
    RealEstate: ["SPG","PSA","AVB","WELL","O"],
  },
  2009: {
    Technology: ["AAPL","MSFT","INTC","CSCO","ORCL","IBM","QCOM","HPQ","TXN","ACN","MU","ADBE","ADI","SNPS","CDNS"],
    Financials: ["BRK.B","JPM","WFC","BAC","GS","MS","C","V","MET","SCHW","CME","ICE"],
    Healthcare: ["JNJ","PFE","UNH","MRK","AMGN","GILD","ABT","MDT","BMY","LLY","CI","DHR","CVS","BIIB"],
    Consumer: ["AMZN","WMT","PG","KO","PEP","HD","MCD","COST","NKE","SBUX","LOW","TGT","F"],
    Communications: ["GOOGL","DIS","CMCSA","VZ","T","EA"],
    Energy: ["XOM","CVX","COP","SLB","OXY","EOG","HAL","VLO"],
    Industrial: ["GE","BA","HON","UNP","CAT","MMM","LMT","GD","DE","UPS","FDX","DAL","ETN"],
    Materials: ["DD","NEM","FCX","APD","ECL","SHW","PPG","NUE","GOLD","VALE","BHP","RIO"],
    Utilities: ["NEE","SO","DUK","D","AEP","EXC","SRE","WEC","ES","XEL"],
    RealEstate: ["SPG","PSA","AVB","WELL","O","AMT"],
  },
  2010: {
    Technology: ["AAPL","MSFT","INTC","CSCO","ORCL","IBM","QCOM","HPQ","TXN","ACN","MU","ADBE","CRM","ADI","SNPS","CDNS"],
    Financials: ["BRK.B","JPM","WFC","BAC","GS","MS","C","V","MA","MET","SCHW","CME","ICE","BLK"],
    Healthcare: ["JNJ","PFE","UNH","MRK","AMGN","GILD","ABT","MDT","BMY","LLY","CI","DHR","CVS","BIIB","ISRG"],
    Consumer: ["AMZN","WMT","PG","KO","PEP","HD","MCD","COST","NKE","SBUX","LOW","TGT","F","GM"],
    Communications: ["GOOGL","DIS","CMCSA","VZ","T","NFLX","EA"],
    Energy: ["XOM","CVX","COP","SLB","OXY","EOG","HAL","VLO"],
    Industrial: ["GE","BA","HON","UNP","CAT","MMM","LMT","GD","DE","UPS","FDX","DAL","ETN"],
    Materials: ["DD","NEM","FCX","APD","ECL","SHW","PPG","NUE","GOLD","VALE","BHP","RIO"],
    Utilities: ["NEE","SO","DUK","D","AEP","EXC","SRE","WEC","ES","XEL"],
    RealEstate: ["SPG","AMT","PSA","AVB","WELL","O","PLD"],
  },
  2011: {
    Technology: ["AAPL","MSFT","INTC","CSCO","ORCL","IBM","QCOM","HPQ","TXN","ACN","MU","ADBE","CRM","ADI","SNPS","CDNS"],
    Financials: ["BRK.B","JPM","WFC","BAC","GS","MS","C","V","MA","MET","SCHW","CME","ICE","BLK"],
    Healthcare: ["JNJ","PFE","UNH","MRK","AMGN","GILD","ABT","MDT","BMY","LLY","CI","DHR","CVS","BIIB","ISRG"],
    Consumer: ["AMZN","WMT","PG","KO","PEP","HD","MCD","COST","NKE","SBUX","LOW","TGT","F","GM","TSLA"],
    Communications: ["GOOGL","DIS","CMCSA","VZ","T","NFLX","EA"],
    Energy: ["XOM","CVX","COP","SLB","OXY","EOG","HAL","VLO","MPC"],
    Industrial: ["GE","BA","HON","UNP","CAT","MMM","LMT","GD","DE","UPS","FDX","DAL","ETN"],
    Materials: ["DD","NEM","FCX","APD","ECL","SHW","PPG","NUE","GOLD","VALE","BHP","RIO"],
    Utilities: ["NEE","SO","DUK","D","AEP","EXC","SRE","WEC","ES","XEL"],
    RealEstate: ["SPG","AMT","PLD","PSA","AVB","WELL","O","CCI","EQIX"],
  },
  2012: {
    Technology: ["AAPL","MSFT","INTC","CSCO","ORCL","IBM","QCOM","TXN","ACN","MU","ADBE","CRM","INTU","ADI","SNPS","CDNS"],
    Financials: ["BRK.B","JPM","WFC","BAC","GS","MS","C","V","MA","MET","SCHW","CME","ICE","BLK"],
    Healthcare: ["JNJ","PFE","UNH","MRK","AMGN","GILD","ABT","MDT","BMY","LLY","CI","DHR","CVS","BIIB","ISRG","REGN"],
    Consumer: ["AMZN","WMT","PG","KO","PEP","HD","MCD","COST","NKE","SBUX","LOW","TGT","F","GM","TSLA","CMG"],
    Communications: ["GOOGL","META","DIS","CMCSA","VZ","T","NFLX","EA"],
    Energy: ["XOM","CVX","COP","SLB","OXY","EOG","HAL","VLO","PSX","MPC"],
    Industrial: ["GE","BA","HON","UNP","CAT","MMM","LMT","GD","DE","UPS","FDX","DAL","ETN"],
    Materials: ["DD","NEM","FCX","APD","ECL","SHW","PPG","NUE","GOLD","VALE","BHP","RIO"],
    Utilities: ["NEE","SO","DUK","D","AEP","EXC","SRE","WEC","ES","XEL"],
    RealEstate: ["SPG","AMT","PLD","CCI","EQIX","PSA","O","WELL","AVB","DLR"],
  },
  2013: {
    Technology: ["AAPL","MSFT","INTC","CSCO","ORCL","IBM","QCOM","TXN","ACN","MU","ADBE","CRM","INTU","ADI","SNPS","CDNS"],
    Financials: ["BRK.B","JPM","WFC","BAC","GS","MS","C","V","MA","MET","SCHW","CME","ICE","BLK"],
    Healthcare: ["JNJ","PFE","UNH","MRK","ABBV","AMGN","GILD","ABT","MDT","BMY","LLY","CI","DHR","CVS","BIIB","ISRG","REGN","VRTX"],
    Consumer: ["AMZN","WMT","PG","KO","PEP","HD","MCD","COST","NKE","SBUX","LOW","TGT","F","GM","TSLA","CMG","LULU"],
    Communications: ["GOOGL","META","DIS","CMCSA","VZ","T","NFLX","EA","TMUS"],
    Energy: ["XOM","CVX","COP","SLB","OXY","EOG","HAL","VLO","PSX","MPC","FSLR"],
    Industrial: ["GE","BA","HON","UNP","CAT","MMM","LMT","GD","DE","UPS","FDX","DAL","ETN"],
    Materials: ["DD","NEM","FCX","APD","ECL","SHW","PPG","NUE","GOLD","VALE","BHP","RIO"],
    Utilities: ["NEE","SO","DUK","D","AEP","EXC","SRE","WEC","ES","XEL"],
    RealEstate: ["SPG","AMT","PLD","CCI","EQIX","PSA","O","WELL","AVB","DLR"],
  },
  2014: {
    Technology: ["AAPL","MSFT","INTC","CSCO","ORCL","IBM","QCOM","TXN","ACN","MU","ADBE","CRM","INTU","ADI","SNPS","CDNS","AVGO"],
    Financials: ["BRK.B","JPM","WFC","BAC","GS","MS","C","V","MA","MET","SCHW","CME","ICE","BLK"],
    Healthcare: ["JNJ","PFE","UNH","MRK","ABBV","AMGN","GILD","ABT","MDT","BMY","LLY","CI","DHR","CVS","BIIB","ISRG","REGN","VRTX"],
    Consumer: ["AMZN","WMT","PG","KO","PEP","HD","MCD","COST","NKE","SBUX","LOW","TGT","F","GM","TSLA","CMG","LULU"],
    Communications: ["GOOGL","META","DIS","CMCSA","VZ","T","NFLX","EA","TMUS","CHTR"],
    Energy: ["XOM","CVX","COP","SLB","OXY","EOG","HAL","VLO","PSX","MPC","FSLR"],
    Industrial: ["GE","BA","HON","UNP","CAT","MMM","LMT","GD","DE","UPS","FDX","DAL","ETN"],
    Materials: ["DD","NEM","FCX","APD","ECL","SHW","PPG","NUE","GOLD","VALE","BHP","RIO"],
    Utilities: ["NEE","SO","DUK","D","AEP","EXC","SRE","WEC","ES","XEL"],
    RealEstate: ["SPG","AMT","PLD","CCI","EQIX","PSA","O","WELL","AVB","DLR"],
  },
  2015: {
    Technology: ["AAPL","MSFT","INTC","CSCO","ORCL","IBM","QCOM","TXN","ACN","MU","ADBE","CRM","INTU","ADI","SNPS","CDNS","AVGO","NXPI"],
    Financials: ["BRK.B","JPM","WFC","BAC","GS","MS","C","V","MA","MET","SCHW","CME","ICE","BLK"],
    Healthcare: ["JNJ","PFE","UNH","MRK","ABBV","AMGN","GILD","ABT","MDT","BMY","LLY","CI","DHR","CVS","BIIB","ISRG","REGN","VRTX"],
    Consumer: ["AMZN","WMT","PG","KO","PEP","HD","MCD","COST","NKE","SBUX","LOW","TGT","F","GM","TSLA","CMG","LULU"],
    Communications: ["GOOGL","META","DIS","CMCSA","VZ","T","NFLX","EA","TMUS","CHTR"],
    Energy: ["XOM","CVX","COP","SLB","OXY","EOG","HAL","VLO","PSX","MPC","FSLR"],
    Industrial: ["GE","BA","HON","UNP","CAT","MMM","LMT","GD","DE","UPS","FDX","DAL","ETN"],
    Materials: ["DD","NEM","FCX","APD","ECL","SHW","PPG","NUE","GOLD","VALE","BHP","RIO"],
    Utilities: ["NEE","SO","DUK","D","AEP","EXC","SRE","WEC","ES","XEL"],
    RealEstate: ["SPG","AMT","PLD","CCI","EQIX","PSA","O","WELL","AVB","DLR"],
  },
  2016: {
    Technology: ["AAPL","MSFT","INTC","CSCO","ORCL","IBM","QCOM","AVGO","TXN","ACN","MU","INTU","ADBE","CRM","ADI","SNPS","CDNS","NXPI"],
    Financials: ["BRK.B","JPM","WFC","BAC","C","GS","MS","V","MA","SCHW","CME","ICE","BLK"],
    Healthcare: ["JNJ","PFE","UNH","MRK","ABBV","AMGN","GILD","LLY","MDT","BMY","CI","DHR","CVS","REGN","VRTX","ISRG"],
    Consumer: ["AMZN","WMT","HD","KO","PEP","PG","COST","MCD","NKE","SBUX","LOW","TGT","F","CMG","LULU"],
    Communications: ["GOOGL","META","DIS","CMCSA","VZ","T","NFLX","EA","TMUS","CHTR"],
    Energy: ["XOM","CVX","COP","OXY","EOG","SLB","PSX","MPC","VLO","HAL","FSLR"],
    Industrial: ["GE","BA","HON","UNP","CAT","MMM","LMT","GD","DE","UPS","FDX","DAL","ETN"],
    Materials: ["DD","DOW","NEM","FCX","APD","ECL","SHW","PPG","NUE","GOLD","VALE","BHP","RIO"],
    Utilities: ["NEE","SO","DUK","D","AEP","EXC","SRE","WEC","ES","XEL"],
    RealEstate: ["AMT","SPG","PLD","CCI","EQIX","PSA","O","WELL","AVB","DLR"],
  },
  2017: {
    Technology: ["AAPL","MSFT","INTC","CSCO","ORCL","IBM","QCOM","AVGO","TXN","ACN","MU","INTU","ADBE","CRM","ADI","SNPS","CDNS","NXPI","NVDA"],
    Financials: ["BRK.B","JPM","WFC","BAC","C","GS","MS","V","MA","SCHW","CME","ICE","BLK"],
    Healthcare: ["JNJ","UNH","PFE","MRK","ABBV","AMGN","GILD","LLY","MDT","BMY","CI","DHR","CVS","REGN","VRTX","ISRG"],
    Consumer: ["AMZN","TSLA","WMT","HD","KO","PEP","PG","COST","MCD","NKE","SBUX","LOW","TGT","F","CMG","LULU"],
    Communications: ["GOOGL","META","DIS","CMCSA","VZ","T","NFLX","EA","TMUS","CHTR"],
    Energy: ["XOM","CVX","COP","OXY","EOG","SLB","PSX","MPC","VLO","HAL","FSLR"],
    Industrial: ["GE","BA","HON","UNP","CAT","MMM","LMT","GD","DE","UPS","FDX","DAL","ETN"],
    Materials: ["DD","DOW","NEM","FCX","APD","ECL","SHW","PPG","NUE","GOLD","VALE","BHP","RIO"],
    Utilities: ["NEE","SO","DUK","D","AEP","EXC","SRE","WEC","ES","XEL"],
    RealEstate: ["AMT","SPG","PLD","CCI","EQIX","PSA","O","WELL","AVB","DLR"],
  },
  2018: {
    Technology: ["AAPL","MSFT","NVDA","INTC","CSCO","ORCL","AVGO","CRM","ADBE","ACN","TXN","QCOM","MU","INTU","ADI","SNPS","CDNS","NXPI","PANW","FTNT"],
    Financials: ["BRK.B","JPM","BAC","WFC","C","GS","MS","V","MA","SCHW","CME","ICE","BLK","PYPL"],
    Healthcare: ["JNJ","UNH","PFE","MRK","ABBV","AMGN","LLY","MDT","BMY","GILD","CI","DHR","CVS","REGN","VRTX","ISRG"],
    Consumer: ["AMZN","TSLA","WMT","HD","KO","PEP","PG","COST","MCD","NKE","SBUX","LOW","TGT","F","CMG","LULU"],
    Communications: ["GOOGL","META","DIS","CMCSA","VZ","T","NFLX","EA","TMUS","CHTR"],
    Energy: ["XOM","CVX","COP","OXY","EOG","SLB","PSX","MPC","VLO","HAL","FSLR"],
    Industrial: ["BA","HON","UNP","CAT","MMM","LMT","GD","DE","UPS","FDX","DAL","ETN","RTX"],
    Materials: ["LIN","NEM","FCX","APD","ECL","SHW","PPG","DD","NUE","GOLD","VALE","BHP","RIO"],
    Utilities: ["NEE","SO","DUK","D","AEP","EXC","SRE","WEC","ES","XEL"],
    RealEstate: ["AMT","SPG","PLD","CCI","EQIX","PSA","O","WELL","AVB","DLR"],
  },
  2019: {
    Technology: ["MSFT","AAPL","NVDA","CSCO","INTC","ORCL","AVGO","CRM","ADBE","ACN","TXN","QCOM","MU","INTU","AMD","ADI","SNPS","CDNS","NXPI","PANW","FTNT"],
    Financials: ["BRK.B","JPM","BAC","WFC","C","GS","V","MA","MS","SCHW","PYPL","CME","ICE","BLK"],
    Healthcare: ["JNJ","UNH","PFE","MRK","ABBV","AMGN","LLY","MDT","BMY","GILD","CI","DHR","CVS","REGN","VRTX","ISRG"],
    Consumer: ["AMZN","TSLA","WMT","HD","KO","PEP","PG","COST","MCD","NKE","SBUX","LOW","TGT","F","GM","CMG","LULU"],
    Communications: ["GOOGL","META","DIS","CMCSA","VZ","T","NFLX","EA","TMUS","CHTR"],
    Energy: ["XOM","CVX","COP","EOG","SLB","OXY","PSX","MPC","VLO","HAL","FSLR"],
    Industrial: ["BA","HON","UNP","CAT","LMT","GD","DE","UPS","FDX","RTX","DAL","ETN"],
    Materials: ["LIN","NEM","FCX","APD","ECL","SHW","PPG","DD","NUE","DOW","GOLD","VALE","BHP","RIO"],
    Utilities: ["NEE","SO","DUK","D","AEP","EXC","SRE","WEC","ES","XEL"],
    RealEstate: ["AMT","PLD","CCI","EQIX","PSA","SPG","O","WELL","AVB","DLR"],
  },
  2020: {
    Technology: ["AAPL","MSFT","NVDA","ADBE","CRM","INTC","CSCO","AVGO","ORCL","AMD","ACN","TXN","QCOM","MU","INTU","ADI","SNPS","CDNS","NXPI","PANW","FTNT","NOW","WDAY"],
    Financials: ["BRK.B","V","JPM","MA","PYPL","BAC","GS","MS","C","SCHW","CME","ICE","BLK"],
    Healthcare: ["JNJ","UNH","MRK","PFE","ABBV","LLY","AMGN","MDT","BMY","ISRG","GILD","CI","DHR","CVS","REGN","VRTX"],
    Consumer: ["AMZN","TSLA","WMT","HD","KO","PEP","PG","COST","MCD","NKE","SBUX","LOW","TGT","GM","CMG","LULU","MELI"],
    Communications: ["GOOGL","META","DIS","CMCSA","VZ","T","NFLX","TMUS","EA","CHTR"],
    Energy: ["XOM","CVX","COP","EOG","SLB","OXY","PSX","MPC","VLO","HAL","FSLR"],
    Industrial: ["BA","HON","UNP","CAT","LMT","DE","UPS","FDX","RTX","GD","DAL","ETN"],
    Materials: ["LIN","NEM","APD","ECL","SHW","FCX","PPG","DD","NUE","DOW","GOLD","VALE","BHP","RIO"],
    Utilities: ["NEE","SO","DUK","D","AEP","EXC","SRE","WEC","ES","XEL"],
    RealEstate: ["AMT","PLD","CCI","EQIX","PSA","O","SPG","WELL","AVB","DLR"],
  },
  2021: {
    Technology: ["AAPL","MSFT","NVDA","ADBE","CRM","AVGO","AMD","INTC","CSCO","ORCL","ACN","TXN","QCOM","MU","INTU","NOW","PANW","SNPS","CDNS","NXPI","FTNT","WDAY","ADI","SMCI"],
    Financials: ["BRK.B","V","JPM","MA","PYPL","BAC","GS","MS","SCHW","C","CME","ICE","BLK","SQ"],
    Healthcare: ["JNJ","UNH","PFE","LLY","MRK","ABBV","AMGN","MDT","BMY","ISRG","GILD","CI","DHR","REGN","VRTX","MRNA","CVS"],
    Consumer: ["AMZN","TSLA","WMT","HD","KO","PEP","PG","COST","MCD","NKE","SBUX","LOW","TGT","CMG","LULU","MELI"],
    Communications: ["GOOGL","META","DIS","NFLX","CMCSA","TMUS","VZ","T","EA","CHTR","SPOT"],
    Energy: ["XOM","CVX","COP","EOG","SLB","OXY","PSX","MPC","VLO","HAL","FSLR"],
    Industrial: ["HON","UNP","CAT","LMT","DE","UPS","FDX","RTX","GD","BA","DAL","ETN"],
    Materials: ["LIN","APD","SHW","ECL","FCX","NEM","PPG","DD","NUE","DOW","GOLD","VALE","BHP","RIO"],
    Utilities: ["NEE","SO","DUK","D","AEP","SRE","EXC","WEC","ES","XEL"],
    RealEstate: ["AMT","PLD","CCI","EQIX","PSA","O","DLR","SPG","WELL","AVB"],
  },
  2022: {
    Technology: ["AAPL","MSFT","NVDA","AVGO","ADBE","CRM","AMD","CSCO","INTC","ORCL","ACN","TXN","QCOM","MU","INTU","NOW","PANW","SNPS","CDNS","NXPI","FTNT","WDAY","ADI","SMCI"],
    Financials: ["BRK.B","V","JPM","MA","BAC","GS","MS","SCHW","PYPL","C","CME","ICE","BLK","SQ"],
    Healthcare: ["UNH","JNJ","LLY","PFE","MRK","ABBV","AMGN","MDT","ISRG","BMY","GILD","CI","DHR","REGN","VRTX","MRNA","CVS"],
    Consumer: ["AMZN","TSLA","WMT","HD","KO","PEP","PG","COST","MCD","NKE","SBUX","LOW","TGT","CMG","LULU","MELI"],
    Communications: ["GOOGL","META","NFLX","DIS","CMCSA","TMUS","VZ","T","EA","CHTR","SPOT"],
    Energy: ["XOM","CVX","COP","EOG","SLB","OXY","MPC","PSX","VLO","HAL","FSLR"],
    Industrial: ["HON","UNP","CAT","DE","UPS","LMT","RTX","BA","GD","FDX","DAL","ETN"],
    Materials: ["LIN","SHW","APD","ECL","FCX","NEM","PPG","NUE","DD","DOW","GOLD","VALE","BHP","RIO"],
    Utilities: ["NEE","SO","DUK","D","AEP","SRE","EXC","WEC","ES","XEL"],
    RealEstate: ["AMT","PLD","CCI","EQIX","PSA","O","DLR","WELL","SPG","AVB"],
  },
  2023: {
    Technology: ["AAPL","MSFT","NVDA","AVGO","CRM","AMD","ADBE","CSCO","ORCL","INTC","ACN","TXN","QCOM","MU","INTU","NOW","PANW","SNPS","CDNS","NXPI","FTNT","WDAY","ADI","SMCI"],
    Financials: ["BRK.B","V","JPM","MA","BAC","GS","MS","SCHW","C","BLK","CME","ICE","PYPL"],
    Healthcare: ["UNH","LLY","JNJ","MRK","ABBV","PFE","AMGN","ISRG","MDT","BMY","GILD","CI","DHR","REGN","VRTX","MRNA","CVS"],
    Consumer: ["AMZN","TSLA","WMT","HD","COST","KO","PEP","PG","MCD","NKE","SBUX","LOW","TGT","CMG","LULU","MELI"],
    Communications: ["GOOGL","META","NFLX","DIS","CMCSA","TMUS","VZ","EA","CHTR","T","SPOT"],
    Energy: ["XOM","CVX","COP","EOG","SLB","OXY","MPC","PSX","VLO","HAL","FSLR"],
    Industrial: ["HON","CAT","UNP","DE","UPS","LMT","RTX","GD","BA","FDX","DAL","ETN"],
    Materials: ["LIN","SHW","APD","ECL","FCX","NEM","NUE","PPG","DD","DOW","GOLD","VALE","BHP","RIO"],
    Utilities: ["NEE","SO","DUK","AEP","D","SRE","EXC","WEC","ES","XEL"],
    RealEstate: ["PLD","AMT","EQIX","CCI","PSA","O","DLR","WELL","SPG","AVB"],
  },
  2024: {
    Technology: ["AAPL","MSFT","NVDA","AVGO","AMD","CRM","ADBE","CSCO","ORCL","INTU","ACN","TXN","QCOM","MU","NOW","PANW","SNPS","CDNS","NXPI","FTNT","WDAY","ADI","SMCI","DELL"],
    Financials: ["BRK.B","V","JPM","MA","BAC","GS","MS","SCHW","C","BLK","CME","ICE","PYPL"],
    Healthcare: ["LLY","UNH","JNJ","MRK","ABBV","AMGN","ISRG","PFE","MDT","BMY","GILD","CI","DHR","REGN","VRTX","MRNA","CVS"],
    Consumer: ["AMZN","TSLA","WMT","COST","HD","KO","PEP","PG","MCD","NKE","SBUX","LOW","TGT","CMG","LULU","MELI"],
    Communications: ["GOOGL","META","NFLX","DIS","CMCSA","TMUS","EA","CHTR","VZ","T","SPOT"],
    Energy: ["XOM","CVX","COP","EOG","SLB","OXY","MPC","PSX","VLO","HAL","FSLR"],
    Industrial: ["HON","CAT","UNP","DE","LMT","UPS","RTX","GD","BA","FDX","DAL","ETN"],
    Materials: ["LIN","SHW","APD","ECL","FCX","NEM","NUE","PPG","DD","DOW","GOLD","VALE","BHP","RIO"],
    Utilities: ["NEE","SO","DUK","AEP","D","SRE","EXC","WEC","ES","XEL"],
    RealEstate: ["PLD","AMT","EQIX","CCI","PSA","O","DLR","WELL","SPG","AVB"],
  },
  2025: {
    Technology: ["AAPL","MSFT","NVDA","AVGO","AMD","CRM","ORCL","ADBE","CSCO","INTU","ACN","TXN","QCOM","MU","NOW","PANW","SNPS","CDNS","NXPI","FTNT","WDAY","ADI","SMCI","DELL"],
    Financials: ["BRK.B","V","JPM","MA","BAC","GS","MS","SCHW","C","BLK","CME","ICE","PYPL"],
    Healthcare: ["LLY","UNH","JNJ","ABBV","MRK","AMGN","ISRG","PFE","MDT","BMY","GILD","CI","DHR","REGN","VRTX","MRNA","CVS"],
    Consumer: ["AMZN","TSLA","WMT","COST","HD","PG","KO","PEP","MCD","NKE","SBUX","LOW","TGT","CMG","LULU","MELI"],
    Communications: ["GOOGL","META","NFLX","TMUS","DIS","CMCSA","EA","CHTR","VZ","T","SPOT"],
    Energy: ["XOM","CVX","COP","EOG","SLB","OXY","MPC","PSX","VLO","HAL","FSLR"],
    Industrial: ["HON","CAT","UNP","DE","LMT","UPS","RTX","GD","BA","FDX","DAL","ETN"],
    Materials: ["LIN","SHW","APD","ECL","FCX","NEM","NUE","PPG","DD","DOW","GOLD","VALE","BHP","RIO"],
    Utilities: ["NEE","SO","DUK","AEP","D","SRE","EXC","WEC","ES","XEL"],
    RealEstate: ["PLD","AMT","EQIX","CCI","PSA","O","DLR","WELL","SPG","AVB"],
  },
};
// Get stock tickers available for a given year
function getStocksForYear(year) {
  const sectors = SP500_BY_SECTOR[year] || SP500_BY_SECTOR[2025];
  return [...new Set(Object.values(sectors).flat())];
}
// All unique tickers across all years (for data fetching)
const SP500_ALL_TICKERS = [...new Set(Object.values(SP500_BY_SECTOR).flatMap(y => Object.values(y).flat()))];

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
const DEFENSIVE_CATS = new Set(["US Bond","US Treasury","US Corp Bond","Intl Bond","Commodity","Factor LowVol","Sector Utilities","US Dividend","US Value",
  "Consumer-Staple","Health-Pharma","Health-Services","Indust-Defense","Energy-Major"]);
const AGGRESSIVE_CATS = new Set(["US Growth","US Small Cap","US Mid Cap","Emerging Mkts","Sector Tech","Sector Consumer","Sector Comms","Sector Finance","Factor Momentum",
  "Tech-Semi","Tech-Software","Tech-Internet","Tech-Hardware","Tech-Cyber","Consumer-Disc","Consumer-Auto","Fin-Bank","Fin-Payments","Health-Biotech"]);

// ── Macro-Sector mapping for concentration limits ──
// Maps ETF categories to broad macro-sectors to prevent over-concentration
const MACRO_SECTOR_MAP = {
  "US Large Cap": "equity-core", "US Total Mkt": "equity-core", "US Value": "equity-core",
  "US Growth": "equity-growth", "Sector Tech": "equity-growth", "Sector Comms": "equity-growth", "Factor Momentum": "equity-growth",
  "US Small Cap": "equity-satellite", "US Mid Cap": "equity-satellite", "US Dividend": "equity-satellite", "Factor Quality": "equity-satellite", "Factor LowVol": "equity-satellite",
  "Sector Health": "sector-defensive", "Sector Utilities": "sector-defensive", "Sector Consumer": "sector-cyclical", "Sector Finance": "sector-cyclical",
  "Sector Energy": "sector-cyclical", "Sector Indust": "sector-cyclical", "Sector Materials": "sector-cyclical", "Sector RE": "sector-cyclical",
  "International": "intl", "Intl Developed": "intl", "Emerging Mkts": "intl-em",
  "US Bond": "fixed-income", "US Treasury": "fixed-income", "US Corp Bond": "fixed-income", "US High Yield": "fixed-income", "Intl Bond": "fixed-income",
  "Commodity": "alternatives",
};

// ── Category-level skewness estimates for CVaR computation ──
// Negative skew = fat left tail (crash-prone), positive = fat right tail
const CATEGORY_SKEW = {
  "US Growth": -0.45, "Sector Tech": -0.50, "Sector Comms": -0.40, "Factor Momentum": -0.55,
  "US Small Cap": -0.35, "Emerging Mkts": -0.60, "US Mid Cap": -0.30,
  "US Large Cap": -0.25, "US Total Mkt": -0.25, "US Value": -0.15, "US Dividend": -0.10,
  "Sector Health": -0.20, "Sector Finance": -0.40, "Sector Energy": -0.50,
  "Sector Consumer": -0.30, "Sector Indust": -0.25, "Sector Utilities": 0.05,
  "US Bond": 0.15, "US Treasury": 0.25, "US Corp Bond": 0.10, "Intl Bond": 0.05,
  "Commodity": -0.10, "Factor LowVol": 0.0, "Factor Quality": -0.15,
};

/**
 * Cornish-Fisher CVaR (Expected Shortfall) at 95% confidence.
 * Adjusts for skewness to capture true tail risk beyond parametric VaR.
 * @param {number} vol - annualized portfolio volatility (%)
 * @param {number} skew - portfolio skewness (negative = fatter left tail)
 * @returns {number} CVaR as annualized percentage
 */
function computeCVaR(vol, skew = -0.3) {
  const z = 1.645; // 95% quantile
  // Cornish-Fisher expansion for skewed distributions
  const zCF = z + (z * z - 1) * skew / 6;
  // CVaR ≈ E[loss | loss > VaR] ≈ σ × φ(zCF) / (1 - Φ(zCF))
  // Simplified: CVaR ≈ VaR × (1 + 0.4 × |skew|) for moderate skewness
  const cvar = vol * zCF * (1 + 0.2 * Math.abs(skew));
  return Math.max(cvar, vol * 1.645); // floor at parametric VaR
}

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

// ── Regime-Duration-Return Model ──
// Computes average forward 6-month SPY returns for each (state5, duration_bucket) combination
// This tells the optimizer: "Given we're in strong_risk_off for 6 months, what historically happens next?"
// Duration buckets: [1-3, 4-6, 7-12, 13-24, 24+] months
// Build regime-duration model using ONLY data available before cutoffIdx (no forward-looking bias)
// cutoffIdx = null means use all data (for live optimizer / analytics display)
function buildRegimeDurationModel(historicalRegimes, sortedDates, returnsByDateSym, cutoffIdx) {
  if (!historicalRegimes || !sortedDates || !returnsByDateSym) return null;
  const buckets = [[1,3],[4,6],[7,12],[13,24],[25,999]];
  const bucketLabels = ["1-3m","4-6m","7-12m","13-24m","24m+"];
  const model = {}; // state5 → [{fwdReturn, count, label}]

  // Use data up to cutoffIdx (exclusive), or all data if cutoffIdx is null
  const maxIdx = cutoffIdx != null ? Math.min(cutoffIdx, sortedDates.length) : sortedDates.length;

  // For each month in history, compute: what regime state + duration are we in, and what does SPY do over the next 6 months?
  for (let i = 12; i < maxIdx - 6; i++) { // need 12m lookback and 6m forward
    const dateKey = sortedDates[i];
    const regData = historicalRegimes[dateKey];
    if (!regData || !regData.state5) continue;

    const state5 = regData.state5;
    const regime3 = regData.regime;

    // Compute duration at this point (how long has this regime been running?)
    let dur = 1;
    for (let lb = 1; lb <= 36 && i - lb >= 0; lb++) {
      const prevReg = historicalRegimes[sortedDates[i - lb]];
      if (prevReg && prevReg.regime === regime3) dur++;
      else break;
    }

    // Compute forward 6-month SPY return from this point
    let fwd6m = 0, fwdCount = 0;
    for (let f = 1; f <= 6 && i + f < maxIdx; f++) {
      const fwdData = returnsByDateSym[sortedDates[i + f]];
      if (fwdData?.SPY) { fwd6m += fwdData.SPY.ret; fwdCount++; }
    }
    if (fwdCount < 3) continue; // need at least 3 months of forward data
    const fwd6mAnn = fwd6m * (12 / fwdCount) * 100; // annualize

    // Find bucket
    const bIdx = buckets.findIndex(b => dur >= b[0] && dur <= b[1]);
    if (bIdx < 0) continue;

    if (!model[state5]) model[state5] = buckets.map((_, j) => ({ fwdReturn: 0, fwdReturnSq: 0, count: 0, label: bucketLabels[j] }));
    model[state5][bIdx].fwdReturn += fwd6mAnn;
    model[state5][bIdx].fwdReturnSq += fwd6mAnn * fwd6mAnn;
    model[state5][bIdx].count++;
  }

  // Compute averages and confidence
  for (const state of Object.keys(model)) {
    for (const b of model[state]) {
      if (b.count > 0) {
        b.avgFwd = b.fwdReturn / b.count;
        b.stdFwd = Math.sqrt(Math.max(0, b.fwdReturnSq / b.count - b.avgFwd * b.avgFwd));
        b.confidence = Math.min(1, b.count / 12); // full confidence at 12+ observations
      } else {
        b.avgFwd = 0; b.stdFwd = 0; b.confidence = 0;
      }
    }
  }
  return model;
}

// Lookup: given state5 + duration, get the historical forward return modifier
function getRegimeDurationFwd(model, state5, duration) {
  if (!model || !model[state5]) return { fwd: 0, confidence: 0 };
  const buckets = [[1,3],[4,6],[7,12],[13,24],[25,999]];
  const bIdx = buckets.findIndex(b => duration >= b[0] && duration <= b[1]);
  if (bIdx < 0) return { fwd: 0, confidence: 0 };
  const b = model[state5][bIdx];
  return { fwd: b.avgFwd || 0, confidence: b.confidence || 0, count: b.count || 0, std: b.stdFwd || 0 };
}

// ── Three-Stage Regime Context ──
// Tracks the pattern: prevRegime → bridgeRegime → currentRegime
// This distinguishes: bull→neutral(1m)→bull (brief pause) from bear→neutral(3m)→bull (genuine reversal)
function computeThreeStageCtx(historicalRegimes, sortedDates, mIdx) {
  if (!historicalRegimes || mIdx < 3) return null;
  const dateKey = sortedDates[mIdx];
  const current = historicalRegimes[dateKey];
  if (!current) return null;

  const curRegime = current.regime; // bull/neutral/bear (3-state)

  // Walk backward to find: current run → bridge regime → previous regime
  let curDuration = 1;
  let bridgeRegime = null, bridgeDuration = 0;
  let prevRegime = null, prevDuration = 0;
  let phase = "current"; // current → bridge → prev

  for (let lb = 1; lb <= 60 && mIdx - lb >= 0; lb++) {
    const prev = historicalRegimes[sortedDates[mIdx - lb]];
    if (!prev) continue;
    const r = prev.regime;

    if (phase === "current") {
      if (r === curRegime) { curDuration++; }
      else { bridgeRegime = r; bridgeDuration = 1; phase = "bridge"; }
    } else if (phase === "bridge") {
      if (r === bridgeRegime) { bridgeDuration++; }
      else { prevRegime = r; prevDuration = 1; phase = "prev"; }
    } else if (phase === "prev") {
      if (r === prevRegime) { prevDuration++; }
      else break; // found all three stages
    }
  }

  if (!bridgeRegime) return null; // no transition found (been in same regime entire history)

  // Classify the pattern
  let patternType, patternSignal;
  const fullPattern = `${prevRegime || "?"}→${bridgeRegime}→${curRegime}`;

  if (prevRegime === curRegime) {
    // Same regime before and after the bridge
    if (bridgeDuration <= 2) {
      patternType = "continuation_brief"; // brief pause, resume — treat as extended run
      patternSignal = 0; // no special signal, just extend duration
    } else if (bridgeDuration <= 6) {
      patternType = "continuation_extended"; // consolidation then re-entry
      patternSignal = curRegime === "bull" ? 0.03 : curRegime === "bear" ? -0.03 : 0;
    } else {
      patternType = "consolidation_reset"; // long pause = fresh start, don't extend duration
      patternSignal = 0;
    }
  } else if (prevRegime && prevRegime !== curRegime) {
    // Different regime — genuine reversal
    if (prevRegime === "bear" && curRegime === "bull") {
      patternType = "reversal_bear_to_bull";
      patternSignal = bridgeDuration <= 3 ? 0.10 : bridgeDuration <= 6 ? 0.06 : 0.03; // shorter bridge = sharper reversal = stronger signal
    } else if (prevRegime === "bull" && curRegime === "bear") {
      patternType = "reversal_bull_to_bear";
      patternSignal = bridgeDuration <= 3 ? -0.10 : bridgeDuration <= 6 ? -0.06 : -0.03;
    } else if (prevRegime === "bear" && curRegime === "neutral") {
      patternType = "recovery_emerging";
      patternSignal = 0.04; // cautious optimism
    } else if (prevRegime === "bull" && curRegime === "neutral") {
      patternType = "topping_emerging";
      patternSignal = -0.04; // cautious pessimism
    } else {
      patternType = "transition";
      patternSignal = 0;
    }
  } else {
    patternType = "unknown";
    patternSignal = 0;
  }

  // For continuation patterns with brief bridge, compute effective duration
  // bull(12m) → neutral(1m) → bull(3m) should feel like bull for ~15 months, not 3
  let effectiveDuration = curDuration;
  if (patternType === "continuation_brief" && prevDuration > 0) {
    effectiveDuration = curDuration + bridgeDuration + prevDuration; // full run including bridge
  } else if (patternType === "continuation_extended") {
    effectiveDuration = curDuration + Math.floor(prevDuration * 0.5); // partial credit for pre-bridge
  }

  return {
    pattern: fullPattern,
    patternType,
    patternSignal, // additional tilt adjustment
    prevRegime, prevDuration,
    bridgeRegime, bridgeDuration,
    currentRegime: curRegime, currentDuration: curDuration,
    effectiveDuration, // used instead of raw duration for tilt scaling
  };
}

// 5-state tilt table: [defensive_bonus, aggressive_bonus, kelly_mult]
const REGIME_TILTS = {
  strong_risk_on: [-0.12, +0.15, 1.0],
  mild_risk_on:   [-0.06, +0.08, 1.0],
  neutral:        [0, 0, 1.0],
  mild_risk_off:  [+0.08, -0.06, 0.8],
  strong_risk_off: [+0.15, -0.12, 0.5],
};

// ═══════════════════════════════════════════════════════════════════
//  INLINE HMM REGIME ENGINE — 5-State Gaussian HMM + BOCPD + Ensemble
//  Bull(0) / Euphoria(1) / Correction(2) / Crisis(3) / Recovery(4)
// ═══════════════════════════════════════════════════════════════════
const HMM_REGIMES = [
  { id: 0, name: "Bull", color: "#42be65", state5: "mild_risk_on" },
  { id: 1, name: "Euphoria", color: "#fbbf24", state5: "mild_risk_off" },  // late-cycle caution
  { id: 2, name: "Correction", color: "#fb923c", state5: "mild_risk_off" },
  { id: 3, name: "Crisis", color: "#ff8389", state5: "strong_risk_off" },
  { id: 4, name: "Recovery", color: "#60a5fa", state5: "strong_risk_on" },
];
const HMM_N = 5;
const HMM_LOG2PI = Math.log(2 * Math.PI);
function hmmGauss(x, mu, s) { const z = (x - mu) / s; return -0.5 * (HMM_LOG2PI + 2 * Math.log(s) + z * z); }
function hmmLSE(v) { if (!v.length) return -Infinity; const m = Math.max(...v); if (m === -Infinity) return -Infinity; return m + Math.log(v.reduce((s, x) => s + Math.exp(x - m), 0)); }
function hmmNorm(lp) { const l = hmmLSE(lp); return lp.map(x => Math.exp(x - l)); }

function hmmTrain(obs, maxIter = 50) {
  const T = obs.length, N = HMM_N;
  let pi = [0.35, 0.10, 0.10, 0.05, 0.40];
  let A = [[.90,.06,.03,.005,.005],[.05,.80,.12,.02,.01],[.02,.01,.78,.15,.04],[.005,.005,.04,.82,.13],[.20,.02,.03,.02,.73]];
  let mu = [-0.5, -1.5, 0.8, 2.0, 0.0];
  let sig = [0.5, 0.6, 0.7, 0.8, 0.6];

  for (let iter = 0; iter < maxIter; iter++) {
    // Forward
    const alpha = [];
    const a0 = new Array(N);
    for (let i = 0; i < N; i++) a0[i] = Math.log(pi[i] + 1e-300) + hmmGauss(obs[0], mu[i], sig[i]);
    alpha.push(a0);
    for (let t = 1; t < T; t++) {
      const at = new Array(N);
      for (let j = 0; j < N; j++) { const tm = new Array(N); for (let i = 0; i < N; i++) tm[i] = alpha[t-1][i] + Math.log(A[i][j]+1e-300); at[j] = hmmLSE(tm) + hmmGauss(obs[t], mu[j], sig[j]); }
      alpha.push(at);
    }
    // Backward
    const beta = new Array(T);
    beta[T-1] = new Array(N).fill(0);
    for (let t = T-2; t >= 0; t--) { beta[t] = new Array(N); for (let i = 0; i < N; i++) { const tm = new Array(N); for (let j = 0; j < N; j++) tm[j] = Math.log(A[i][j]+1e-300) + hmmGauss(obs[t+1], mu[j], sig[j]) + beta[t+1][j]; beta[t][i] = hmmLSE(tm); } }
    // Gamma
    const gamma = alpha.map((at, t) => hmmNorm(at.map((v, i) => v + beta[t][i])));
    // M-step
    for (let i = 0; i < N; i++) pi[i] = Math.max(gamma[0][i], 1e-10);
    for (let i = 0; i < N; i++) {
      let gs = 0; for (let t = 0; t < T-1; t++) gs += gamma[t][i];
      for (let j = 0; j < N; j++) {
        let xs = 0; for (let t = 0; t < T-1; t++) { const lx = alpha[t][i]+Math.log(A[i][j]+1e-300)+hmmGauss(obs[t+1],mu[j],sig[j])+beta[t+1][j]; xs += Math.exp(lx - hmmLSE(alpha[t].map((v,k)=>v+beta[t][k]))); }
        A[i][j] = Math.max(xs / (gs+1e-300), 1e-10);
      }
      const rs = A[i].reduce((a,b)=>a+b,0); for (let j = 0; j < N; j++) A[i][j] /= rs;
    }
    for (let i = 0; i < N; i++) {
      let gs = 0, ws = 0, ws2 = 0;
      for (let t = 0; t < T; t++) { gs += gamma[t][i]; ws += gamma[t][i]*obs[t]; ws2 += gamma[t][i]*obs[t]*obs[t]; }
      mu[i] = ws / (gs+1e-300); sig[i] = Math.sqrt(Math.max((ws2/(gs+1e-300)) - mu[i]**2, 0.01));
    }
  }
  // Label-switch fix: sort states by emission mean → [Euphoria, Bull, Recovery, Correction, Crisis]
  const TARGET = [1, 0, 4, 2, 3];
  const idx = mu.map((m, i) => ({ m, i })).sort((a, b) => a.m - b.m);
  const o2n = new Array(N); for (let k = 0; k < N; k++) o2n[idx[k].i] = TARGET[k];
  const nPi = new Array(N), nMu = new Array(N), nSig = new Array(N);
  for (let i = 0; i < N; i++) { nPi[o2n[i]] = pi[i]; nMu[o2n[i]] = mu[i]; nSig[o2n[i]] = sig[i]; }
  const nA = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) nA[o2n[i]][o2n[j]] = A[i][j];

  return { pi: nPi, A: nA, mu: nMu, sig: nSig };
}

function hmmFilter(obs, model) {
  const { pi, A, mu, sig } = model;
  const T = obs.length, N = HMM_N;
  const result = [];
  const a0 = new Array(N); for (let i = 0; i < N; i++) a0[i] = Math.log(pi[i]+1e-300) + hmmGauss(obs[0], mu[i], sig[i]);
  result.push(hmmNorm(a0));
  let prev = a0;
  for (let t = 1; t < T; t++) {
    const at = new Array(N);
    for (let j = 0; j < N; j++) { const tm = new Array(N); for (let i = 0; i < N; i++) tm[i] = prev[i]+Math.log(A[i][j]+1e-300); at[j] = hmmLSE(tm)+hmmGauss(obs[t],mu[j],sig[j]); }
    result.push(hmmNorm(at)); prev = at;
  }
  return result;
}

function hmmForecast(probs, A, steps = 12) {
  const fc = []; let p = [...probs];
  for (let s = 0; s < steps; s++) { const n = new Array(HMM_N).fill(0); for (let j = 0; j < HMM_N; j++) for (let i = 0; i < HMM_N; i++) n[j] += p[i]*A[i][j]; fc.push(n); p = n; }
  return fc;
}

// ── BOCPD (simplified Bayesian Online Change-Point Detection) ──
function runBOCPD(data, hazard = 1/50) {
  const T = data.length; const cpProb = new Array(T).fill(0);
  let rl = [1.0], bMu = [0], bK = [1], bA = [1], bB = [1];
  for (let t = 0; t < T; t++) {
    const x = data[t], pLen = rl.length;
    const pred = new Array(pLen);
    for (let r = 0; r < pLen; r++) { const s2 = bB[r]*(bK[r]+1)/(bA[r]*bK[r]); const s = Math.sqrt(Math.max(s2,1e-8)); const z = (x-bMu[r])/s; pred[r] = Math.exp(-0.5*z*z)/(s*2.507); }
    const growth = rl.map((r,i) => r*pred[i]*(1-hazard));
    let cp = 0; for (let r = 0; r < pLen; r++) cp += rl[r]*pred[r]*hazard;
    const newRl = [cp, ...growth]; const tot = newRl.reduce((a,b)=>a+b,0)||1e-300;
    rl = newRl.map(v=>v/tot); cpProb[t] = rl[0];
    const nm=[0],nk=[1],na=[1],nb=[1];
    for (let r = 0; r < pLen; r++) { const k=bK[r],m=bMu[r],a=bA[r],b=bB[r]; nm.push((k*m+x)/(k+1)); nk.push(k+1); na.push(a+0.5); nb.push(b+(k*(x-m)**2)/(2*(k+1))); }
    bMu=nm; bK=nk; bA=na; bB=nb;
    if (rl.length > 150) { rl=rl.slice(0,150); bMu=bMu.slice(0,150); bK=bK.slice(0,150); bA=bA.slice(0,150); bB=bB.slice(0,150); }
  }
  return cpProb;
}

// ── Ensemble: fuse HMM + BOCPD into adjusted probabilities ──
function runEnsemble(hmmProbs, cpProbs) {
  return hmmProbs.map((base, t) => {
    const cpStress = Math.min(1, (cpProbs[t] || 0) * 3); // amplify CP signal
    const sf = Math.min(cpStress, 1);
    const adj = [
      base[0] * (1 - sf * 0.4),   // Bull penalized
      base[1] * (1 - sf * 0.2),   // Euphoria penalized
      base[2] + sf * 0.12,        // Correction boosted
      base[3] + sf * 0.18,        // Crisis boosted
      base[4] * (1 - sf * 0.1),   // Recovery mild penalty
    ];
    const tot = adj.reduce((a, b) => a + b, 0) || 1;
    return adj.map(p => Math.max(0, p) / tot);
  });
}

// Map HMM 5-state probabilities → existing state5 string for optimizer compatibility
function hmmToState5(probs) {
  // Compute a probability-weighted stress level instead of using a static lookup table.
  // This ensures HMM and FRED agree on the same risk scale.
  // Each regime has an intrinsic stress level: Bull=-1, Recovery=-0.5, Euphoria=0.3, Correction=0.8, Crisis=1.5
  const stressLevels = [-1.0, 0.3, 0.8, 1.5, -0.5]; // indexed by HMM regime id: Bull, Euphoria, Correction, Crisis, Recovery
  let weightedStress = 0;
  for (let i = 0; i < probs.length; i++) weightedStress += probs[i] * stressLevels[i];
  // Use the same thresholds as FRED's classify5State for consistency
  if (weightedStress < -0.6) return "strong_risk_on";
  if (weightedStress < -0.15) return "mild_risk_on";
  if (weightedStress <= 0.15) return "neutral";
  if (weightedStress <= 0.6) return "mild_risk_off";
  return "strong_risk_off";
}

// ═══════════════════════════════════════════════════════════════════
//  QUANT STRATEGY MODULE
//  Factor scoring, 12-1 momentum, carry, risk parity, Black-Litterman,
//  transaction costs, dynamic vol targeting, pairs/relative value
// ═══════════════════════════════════════════════════════════════════

/**
 * Compute multi-factor scores for all candidates using trailing return data.
 * Returns enriched candidates with factor scores attached.
 *
 * @param {Object} returnsByDate - { date: { sym: { ret, close } } }
 * @param {string[]} sortedDates - sorted date keys
 * @param {number} mIdx - current month index in sortedDates
 * @param {Object} trailingStats - { sym: { t, r, v, d, c, ... } }
 * @param {Object} etfDbMap - ticker → ETF_DB entry
 * @returns {Object} { enriched: trailingStats with factor fields, factorRanks: { sym: { mom, rev, val, qual, lowvol, carry, composite } } }
 */
function computeFactorScores(returnsByDate, sortedDates, mIdx, trailingStats, etfDbMap) {
  const syms = Object.keys(trailingStats);
  if (syms.length < 3 || mIdx < 13) return { enriched: trailingStats, factorRanks: {} };

  const scores = {};

  for (const sym of syms) {
    const db = etfDbMap[sym] || {};
    const ts = trailingStats[sym];
    const monthlyRets = [];
    for (let ti = Math.max(0, mIdx - 12); ti < mIdx; ti++) {
      const e = returnsByDate[sortedDates[ti]]?.[sym];
      if (e) monthlyRets.push(e.ret);
    }
    if (monthlyRets.length < 6) { scores[sym] = { mom12_1: 0, rev1m: 0, val: 0, qual: 0, lowvol: 0, carry: 0 }; continue; }

    // ── 1. Momentum (12-1): skip most recent month to avoid reversal ──
    const mom12_1raw = monthlyRets.slice(0, -1).reduce((a, b) => a + b, 0) * 100;

    // ── 2. Short-term Reversal (1-month): most recent month, inverted ──
    const rev1m = -(monthlyRets[monthlyRets.length - 1] || 0) * 100;

    // ── 3. Value: use dividend yield as proxy (higher = more value) ──
    const val = ts.d || db.d || 0;

    // ── 4. Quality: low expense ratio + low vol + positive returns ──
    // Higher = better quality
    const qual = (ts.r > 0 ? 1 : 0) * 2 + (1 / (1 + (ts.er || 0.1))) + (ts.v < 15 ? 1 : ts.v < 25 ? 0.5 : 0);

    // ── 5. Low Volatility: inverted vol (lower vol = higher score) ──
    const lowvol = ts.v > 0 ? 100 / ts.v : 0;

    // ── 6. Carry: dividend yield for equities, estimated for bonds ──
    let carry = ts.d || 0;
    const cat = (ts.c || "").toLowerCase();
    if (cat.includes("bond") || cat.includes("treasury")) carry = (ts.d || 0) + 1.5; // bond carry premium
    if (cat.includes("commodity")) carry = Math.max(0, carry - 0.5); // commodity roll cost

    scores[sym] = { mom12_1: mom12_1raw, rev1m, val, qual, lowvol, carry };
  }

  // ── Cross-sectional percentile ranking (0-1) for each factor ──
  const factors = ["mom12_1", "rev1m", "val", "qual", "lowvol", "carry"];
  const ranks = {};

  for (const f of factors) {
    const vals = syms.map(s => ({ sym: s, v: scores[s][f] || 0 })).sort((a, b) => a.v - b.v);
    vals.forEach((item, idx) => {
      if (!ranks[item.sym]) ranks[item.sym] = {};
      ranks[item.sym][f] = vals.length > 1 ? idx / (vals.length - 1) : 0.5;
    });
  }

  // ── Composite factor score (weighted blend) ──
  // Weights tuned for robustness: momentum strongest but diversified across all factors
  const factorWeights = { mom12_1: 0.30, rev1m: 0.10, val: 0.15, qual: 0.15, lowvol: 0.15, carry: 0.15 };
  for (const sym of syms) {
    let composite = 0;
    for (const [f, w] of Object.entries(factorWeights)) {
      composite += (ranks[sym]?.[f] || 0.5) * w;
    }
    ranks[sym].composite = composite;
    // Attach to trailing stats
    trailingStats[sym].factorScore = composite;
    trailingStats[sym].factorRanks = ranks[sym];
    trailingStats[sym].mom12_1 = scores[sym].mom12_1;
    trailingStats[sym].rev1m = scores[sym].rev1m;
  }

  return { enriched: trailingStats, factorRanks: ranks };
}

/**
 * Black-Litterman expected return adjustment.
 * Blends equilibrium (market-cap-implied) returns with factor-based "views".
 *
 * @param {Object[]} candidates - array of { r, v, d, factorScore, ... }
 * @param {number} tau - uncertainty scaling (default 0.05)
 * @returns {number[]} Adjusted expected returns per candidate
 */
function blackLittermanReturns(candidates, tau = 0.05) {
  const n = candidates.length;
  if (n === 0) return [];

  // Equilibrium returns: CAPM-style, proportional to vol (higher vol → higher expected return)
  const avgRet = candidates.reduce((s, c) => s + c.r, 0) / n;
  const avgVol = candidates.reduce((s, c) => s + c.v, 0) / n;
  const eqReturns = candidates.map(c => {
    const beta = c.v / (avgVol || 15);
    return RF + beta * (avgRet - RF);
  });

  // Views: factor score implies a view on relative performance
  // factorScore > 0.5 → bullish view, < 0.5 → bearish view
  const blReturns = candidates.map((c, i) => {
    const eq = eqReturns[i];
    const fs = c.factorScore ?? 0.5;
    // View: deviation from equilibrium proportional to factor score extremity
    const viewStrength = (fs - 0.5) * 2; // -1 to +1
    const view = eq + viewStrength * avgVol * 0.5; // scale view by average vol
    // Blend: tau controls how much views dominate vs equilibrium
    // Higher tau → more weight on views
    const conf = Math.abs(viewStrength) * 0.8 + 0.2; // confidence increases with factor extremity
    return eq * (1 - tau * conf) + view * tau * conf;
  });

  return blReturns;
}

/**
 * Compute risk parity weights: each position contributes equal portfolio risk.
 *
 * @param {Object[]} candidates - array of { v, c }
 * @param {Function} gc - correlation function gc(cat1, cat2)
 * @returns {number[]} Risk parity weights (sum to 1)
 */
function riskParityWeights(candidates, gc) {
  const n = candidates.length;
  if (n <= 1) return candidates.map(() => 1 / n || 1);

  // Iterative risk budgeting: start equal, adjust toward equal risk contribution
  let w = new Array(n).fill(1 / n);
  const vol = candidates.map(c => c.v / 100);

  for (let iter = 0; iter < 50; iter++) {
    // Compute marginal risk contribution for each position
    const mrc = new Array(n).fill(0);
    let totalVar = 0;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const cov = vol[i] * vol[j] * gc(candidates[i].c, candidates[j].c);
        totalVar += w[i] * w[j] * cov;
        mrc[i] += w[j] * cov;
      }
    }

    const portVol = Math.sqrt(Math.max(totalVar, 1e-10));
    // Risk contribution: RC_i = w_i × MRC_i / portVol
    const rc = w.map((wi, i) => wi * mrc[i] / portVol);
    const avgRC = rc.reduce((a, b) => a + b, 0) / n;

    // Adjust weights: positions with above-average RC get reduced, below get increased
    const newW = w.map((wi, i) => {
      const ratio = avgRC / (rc[i] + 1e-10);
      return wi * Math.pow(ratio, 0.3); // gentle adjustment for stability
    });

    // Renormalize
    const wSum = newW.reduce((a, b) => a + b, 0);
    w = newW.map(x => x / wSum);
  }

  return w;
}

/**
 * Compute transaction costs for a set of trades.
 *
 * @param {Object} prevAlloc - { ticker: weight }
 * @param {Object} newAlloc - { ticker: weight }
 * @param {number} portfolioValue
 * @param {Object} etfDbMap - ticker metadata
 * @returns {Object} { totalCostDollars, totalCostPct, perTicker: { ticker: cost } }
 */
function computeTransactionCosts(prevAlloc, newAlloc, portfolioValue, etfDbMap) {
  const allTickers = [...new Set([...Object.keys(prevAlloc || {}), ...Object.keys(newAlloc || {})])];
  let totalCost = 0;
  const perTicker = {};

  for (const ticker of allTickers) {
    const oldWt = prevAlloc?.[ticker] || 0;
    const newWt = newAlloc?.[ticker] || 0;
    const tradeWt = Math.abs(newWt - oldWt);
    if (tradeWt < 0.005) continue;

    const tradeDollars = tradeWt * portfolioValue;
    const db = etfDbMap[ticker];
    // Cost model: spread + market impact
    // Large-cap ETFs: ~3bps, Small-cap/EM ETFs: ~8bps, Stocks: ~10-20bps
    let spreadBps;
    const cat = (db?.c || "").toLowerCase();
    if (db?.type === "stock") spreadBps = cat.includes("mega") || ["AAPL","MSFT","GOOGL","AMZN","NVDA","META","TSLA"].includes(ticker) ? 5 : 12;
    else if (cat.includes("small") || cat.includes("emerg") || cat.includes("commodity")) spreadBps = 8;
    else spreadBps = 3;

    // Market impact: proportional to trade size (simplified square-root model)
    const impactBps = Math.sqrt(tradeDollars / 1000000) * 5; // 5bps per $1M^0.5

    const cost = tradeDollars * (spreadBps + impactBps) / 10000;
    totalCost += cost;
    perTicker[ticker] = cost;
  }

  return {
    totalCostDollars: totalCost,
    totalCostPct: portfolioValue > 0 ? (totalCost / portfolioValue) * 100 : 0,
    perTicker,
  };
}

/**
 * Dynamic volatility targeting: scale portfolio exposure to maintain target vol.
 *
 * @param {number} realizedVol - trailing realized portfolio vol (annualized %)
 * @param {number} targetVol - target vol (%)
 * @param {number} maxLeverage - max scale factor (default 1.5)
 * @param {number} minExposure - min scale factor (default 0.3)
 * @returns {number} Scale factor (< 1 = delever, > 1 = lever up, capped)
 */
function dynamicVolScale(realizedVol, targetVol, maxLeverage = 1.5, minExposure = 0.3) {
  if (!targetVol || targetVol <= 0 || !realizedVol || realizedVol <= 0) return 1.0;
  const raw = targetVol / realizedVol;
  return Math.max(minExposure, Math.min(maxLeverage, raw));
}

/**
 * Pairs/Relative Value signal: detect divergences between correlated assets.
 * Returns a bonus/penalty per candidate based on mean-reversion opportunity.
 *
 * @param {Object} returnsByDate - { date: { sym: { ret } } }
 * @param {string[]} sortedDates
 * @param {number} mIdx
 * @param {Object} trailingStats - { sym: { t, c, r, ... } }
 * @returns {Object} { sym: relValueSignal } — positive = undervalued vs peers
 */
function computeRelativeValue(returnsByDate, sortedDates, mIdx, trailingStats) {
  const syms = Object.keys(trailingStats);
  const signals = {};
  const lookback = Math.min(24, mIdx);

  // Group by category
  const catGroups = {};
  for (const sym of syms) {
    const cat = trailingStats[sym].c || "Other";
    if (!catGroups[cat]) catGroups[cat] = [];
    catGroups[cat].push(sym);
  }

  for (const [cat, members] of Object.entries(catGroups)) {
    if (members.length < 2) { members.forEach(s => { signals[s] = 0; }); continue; }

    // Compute cumulative return over lookback for each member
    const cumRets = {};
    for (const sym of members) {
      let cum = 0;
      for (let ti = Math.max(0, mIdx - lookback); ti < mIdx; ti++) {
        const e = returnsByDate[sortedDates[ti]]?.[sym];
        if (e) cum += e.ret;
      }
      cumRets[sym] = cum;
    }

    // Category average and std
    const vals = Object.values(cumRets);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const std = Math.sqrt(vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length) || 0.01;

    // Z-score: negative = underperformed peers = potential mean reversion opportunity
    for (const sym of members) {
      const z = (cumRets[sym] - mean) / std;
      // Signal: inverted z-score, capped. Underperformer gets positive signal.
      signals[sym] = Math.max(-0.05, Math.min(0.05, -z * 0.02));
    }
  }

  return signals;
}

/**
 * Factor diversification score: penalize portfolios concentrated in one factor.
 *
 * @param {Float64Array} alloc - allocation dollars per candidate
 * @param {Object[]} candidates - with factorRanks attached
 * @param {number} deployAmt - total deployment amount
 * @returns {number} Penalty (negative) for factor concentration, bonus for balance
 */
function factorDiversificationScore(alloc, candidates, deployAmt) {
  const factors = ["mom12_1", "rev1m", "val", "qual", "lowvol", "carry"];
  const weightedFactorAvg = {};
  let totalWt = 0;

  for (let i = 0; i < candidates.length; i++) {
    const wt = alloc[i] / (deployAmt || 1);
    if (wt < 0.01) continue;
    totalWt += wt;
    const fr = candidates[i].factorRanks;
    if (!fr) continue;
    for (const f of factors) {
      if (!weightedFactorAvg[f]) weightedFactorAvg[f] = 0;
      weightedFactorAvg[f] += wt * (fr[f] ?? 0.5);
    }
  }

  if (totalWt <= 0) return 0;
  for (const f of factors) weightedFactorAvg[f] = (weightedFactorAvg[f] || 0) / totalWt;

  // Score: reward portfolios near 0.5 (balanced) on each factor
  // Penalize portfolios above 0.8 or below 0.2 on any single factor
  let factorPenalty = 0;
  for (const f of factors) {
    const deviation = Math.abs(weightedFactorAvg[f] - 0.5);
    if (deviation > 0.3) factorPenalty -= (deviation - 0.3) * 0.10; // progressive penalty
    else if (deviation < 0.15) factorPenalty += 0.005; // small bonus for balance
  }

  return factorPenalty;
}

// ═══════════════════════════════════════════════════════════════════

// regimeCtx: { state5, acceleration, duration, transition, durationModel } or just a string
// prevBest: optional previous allocation weights to warm-start from
function optimizeCash(existing, cash, totalVal, candidates, target, srMode, volTarget, useKelly, regimeCtx, iterations, prevBest) {
  if (!candidates.length || cash <= 0) return [];
  const n = candidates.length; let best = null, bs = -Infinity;
  const numIterations = iterations || 6000;

  // Parse regimeCtx
  let state5 = "neutral", acceleration = 0, duration = 1, transition = null, durationModel = null, threeStage = null;
  let volSignal = 0, vixInversion = false;
  if (typeof regimeCtx === "string") {
    if (regimeCtx === "bull") state5 = "mild_risk_on";
    else if (regimeCtx === "bear") state5 = "mild_risk_off";
    else if (REGIME_TILTS[regimeCtx]) state5 = regimeCtx;
  } else if (regimeCtx && typeof regimeCtx === "object") {
    state5 = regimeCtx.state5 || "neutral";
    acceleration = regimeCtx.acceleration || 0;
    duration = regimeCtx.duration || 1;
    transition = regimeCtx.transition || null;
    durationModel = regimeCtx.durationModel || null;
    threeStage = regimeCtx.threeStage || null;
    volSignal = regimeCtx.volSignal || 0;
    vixInversion = regimeCtx.vixInversion || false;
  }

  // If three-stage context available, use effectiveDuration instead of raw duration
  if (threeStage?.effectiveDuration > 0) {
    duration = threeStage.effectiveDuration;
  }

  const [baseDefBonus, baseAggBonus, baseKellyMult] = REGIME_TILTS[state5] || [0, 0, 1.0];
  const durationScale = Math.min(2.0, 0.5 + (duration / 12) * 1.5);
  let accelMod = 1.0;
  if (state5.includes("risk_off")) accelMod = acceleration < -0.15 ? 0.6 : acceleration > 0.15 ? 1.3 : 1.0;
  else if (state5.includes("risk_on")) accelMod = acceleration > 0.15 ? 0.6 : acceleration < -0.15 ? 1.2 : 1.0;

  // ── Regime-Duration Forward Return Signal ──
  // Historical data tells us: at this state + duration, what does the market typically do next?
  // Use this to amplify or dampen regime tilts beyond the simple duration scaling
  let durationFwdMod = 1.0;
  if (durationModel) {
    const fwdData = getRegimeDurationFwd(durationModel, state5, duration);
    if (fwdData.confidence > 0.3) {
      // Strong forward signal: if historical forward returns are very positive during risk-off (bottom signal)
      // or very negative during risk-on (top signal), amplify the tilt
      if (state5.includes("risk_off") && fwdData.fwd > 10) {
        // Extended risk-off with positive forward returns = near bottom, START scaling back defensive
        durationFwdMod = Math.max(0.3, 1.0 - (fwdData.fwd - 10) * 0.03 * fwdData.confidence);
      } else if (state5.includes("risk_off") && fwdData.fwd < -5) {
        // Risk-off with negative forward returns = more downside ahead, INCREASE defensive
        durationFwdMod = Math.min(2.0, 1.0 + Math.abs(fwdData.fwd + 5) * 0.04 * fwdData.confidence);
      } else if (state5.includes("risk_on") && fwdData.fwd > 15) {
        // Risk-on with strong forward returns = momentum continues, INCREASE aggressive
        durationFwdMod = Math.min(1.8, 1.0 + (fwdData.fwd - 15) * 0.02 * fwdData.confidence);
      } else if (state5.includes("risk_on") && fwdData.fwd < 5) {
        // Extended risk-on with weak forward returns = overextended, DAMPEN aggressive
        durationFwdMod = Math.max(0.4, 1.0 - (5 - fwdData.fwd) * 0.04 * fwdData.confidence);
      }
    }
  }

  let entryBonus = 0;
  // Three-stage pattern signal overrides simple transition when available
  if (threeStage && threeStage.patternSignal !== 0) {
    entryBonus = threeStage.patternSignal;
    // Scale by how fresh the current stage is (strongest in months 1-6)
    if (threeStage.currentDuration > 8) entryBonus *= 0.5; // fade after 8 months
  } else if (transition) {
    // Fallback: simple two-stage transition (backward compat)
    const [from, to] = transition.includes("→") ? transition.split("→") : [null, null];
    if (from === "bear" && (to === "bull" || to === "neutral") && duration >= 2 && duration <= 8) entryBonus = 0.08;
    else if (from === "neutral" && to === "bull" && duration >= 1 && duration <= 4) entryBonus = 0.04;
  }

  // Vol regime modifier: gentler tilts to avoid over-trading alpha decay
  // Compression is NOT amplified (contrarian trap — often precedes crashes)
  // Expansion dampens risk-on modestly; VIX inversion is a tilt modifier only (not a rebalance trigger)
  const volMod = volSignal < 0 ? 0.85 : 1.0; // only dampen during expansion, never amplify
  const vixMod = vixInversion ? 0.7 : 1.0; // gentler than before (was 0.5)

  const defBonus = baseDefBonus * durationScale * accelMod * durationFwdMod * (volSignal < 0 ? 1.15 : 1.0);
  // Entry bonus reaches aggressive categories in ANY state (including neutral after bear→neutral recovery)
  const aggBonus = (baseAggBonus * durationScale * accelMod * durationFwdMod) * volMod * vixMod + entryBonus;
  const kellyMult = baseKellyMult;
  const regimeTilt = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const c = candidates[i];
    if (state5 === "neutral" && entryBonus === 0) { regimeTilt[i] = 0; continue; }
    if (DEFENSIVE_CATS.has(c.c)) regimeTilt[i] = defBonus - (entryBonus > 0 ? entryBonus * 0.5 : 0);
    else if (AGGRESSIVE_CATS.has(c.c)) regimeTilt[i] = aggBonus;
    else regimeTilt[i] = entryBonus > 0 ? entryBonus * 0.3 : 0;
  }

  // ── Pre-compute factor-aware returns (Black-Litterman blend if factor scores available) ──
  const hasFactors = candidates.some(c => c.factorScore != null);
  let blReturns = null;
  if (hasFactors) {
    blReturns = blackLittermanReturns(candidates);
  }

  // Pre-compute adjusted returns, vols as typed arrays
  const adjRet = new Float64Array(n), volArr = new Float64Array(n), isLev = new Uint8Array(n);
  // Pre-compute each candidate's correlation with SPY (US Large Cap category)
  const spyCorr = new Float64Array(n);
  // Pre-compute skewness and macro-sector for each candidate
  const skewArr = new Float64Array(n);
  const macroSectors = new Array(n);
  for (let i = 0; i < n; i++) {
    spyCorr[i] = gc(candidates[i].c, "US Large Cap");
    skewArr[i] = CATEGORY_SKEW[candidates[i].c] ?? -0.25;
    macroSectors[i] = MACRO_SECTOR_MAP[candidates[i].c] || "other";
  }
  for (let i = 0; i < n; i++) {
    const c = candidates[i];
    let baseRet = (c.lev && Math.abs(c.lev) > 1) ? getAdjustedReturn(c.r, c.v, c.lev) : c.r;
    // Black-Litterman blend: 70% trailing (momentum), 30% BL equilibrium+views
    if (blReturns) baseRet = baseRet * 0.70 + blReturns[i] * 0.30;
    adjRet[i] = baseRet;
    volArr[i] = c.v / 100;
    isLev[i] = (c.lev && Math.abs(c.lev) > 1) ? 1 : 0;
  }

  // ── Momentum crash filter: dampen extreme momentum when crowded ──
  let extremeMomCount = 0;
  for (let i = 0; i < n; i++) { if (adjRet[i] > 18) extremeMomCount++; }
  if (extremeMomCount / n > 0.4) {
    const momDampen = 0.85;
    for (let i = 0; i < n; i++) { if (adjRet[i] > 18) adjRet[i] *= momDampen; }
  }

  // ── Pre-compute relative value signals if available ──
  const relValSignals = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    relValSignals[i] = candidates[i].relValue || 0;
  }

  // ── Pre-compute risk parity reference weights ──
  let rpWeights = null;
  if (target === "risk_parity") {
    rpWeights = riskParityWeights(candidates, gc);
  }

  // ── Dynamic vol scale (if dynamic vol targeting enabled) ──
  let dynVolScale = 1.0;
  if (regimeCtx && typeof regimeCtx === "object" && regimeCtx.realizedVol > 0 && volTarget > 0) {
    dynVolScale = dynamicVolScale(regimeCtx.realizedVol, volTarget);
  }

  // Leverage caps + Kelly caps
  const maxPct = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const c = candidates[i];
    let levCap = 1.0;
    if (c.lev && Math.abs(c.lev) > 1) { levCap = c.lev < 0 ? 0.05 : Math.abs(c.lev) >= 3 ? 0.10 : 0.15; }
    // Individual stock cap: max 15% per stock to limit idiosyncratic risk
    if (c.type === "stock") levCap = Math.min(levCap, 0.15);
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
    // Position count distribution: favor 4-7 (sweet spot), explore 3 and 8-10
    let numActive;
    const rnd = Math.random();
    if (rnd < 0.10) numActive = 3;                                          // 10%: concentrated
    else if (rnd < 0.70) numActive = 4 + Math.floor(Math.random() * 4);     // 60%: 4-7 sweet spot
    else numActive = 8 + Math.floor(Math.random() * 3);                     // 30%: 8-10 diversified
    numActive = Math.min(numActive, n);

    // Warm-start: 50% of iterations mutate the best-so-far, 50% random exploration
    const warmStart = best && t > 10 && Math.random() < 0.5;

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
      // Balanced random weights using -log(U) (Gamma(1) ≈ Exponential)
      // This produces more balanced allocations than uniform random
      const idxArr = new Uint16Array(n);
      for (let i = 0; i < n; i++) idxArr[i] = i;
      for (let i = 0; i < numActive; i++) {
        const j = i + Math.floor(Math.random() * (n - i));
        const tmp = idxArr[i]; idxArr[i] = idxArr[j]; idxArr[j] = tmp;
      }
      for (let i = 0; i < numActive; i++) {
        const idx = idxArr[i];
        // -log(U) produces exponential draws; adding two makes it Gamma(2) = more balanced
        ws[idx] = -Math.log(Math.random() + 1e-10) + -Math.log(Math.random() + 1e-10);
        wSum += ws[idx];
      }
    }

    if (wSum <= 0) continue;
    const deployPct = 0.9 + Math.random() * 0.1;
    const deployAmt = cash * deployPct;

    // Normalize + apply Kelly/leverage caps + hard 30% per-position cap
    // Two-pass: cap positions, then re-normalize the uncapped to fill the freed weight
    let allocSum2 = 0;
    const POS_CAP = 0.30; // no single position > 30% of deployment
    for (let i = 0; i < n; i++) {
      let pct = ws[i] / wSum;
      if (pct > 0) pct = Math.min(pct, maxPct[i], POS_CAP);
      alloc[i] = pct;
      allocSum2 += pct;
    }
    if (allocSum2 <= 0) continue;
    // Re-normalize so total = deployAmt, but re-check caps after
    for (let i = 0; i < n; i++) alloc[i] = (alloc[i] / allocSum2) * deployAmt;
    // Post-normalize cap enforcement: if re-normalization pushed anyone over 30%, cap and redistribute
    for (let pass = 0; pass < 3; pass++) {
      let excess = 0, uncappedTotal = 0;
      const maxDollars = deployAmt * POS_CAP;
      for (let i = 0; i < n; i++) {
        if (alloc[i] > maxDollars) { excess += alloc[i] - maxDollars; alloc[i] = maxDollars; }
        else if (alloc[i] > 0) uncappedTotal += alloc[i];
      }
      if (excess <= 0) break;
      // Distribute excess proportionally to uncapped positions
      if (uncappedTotal > 0) for (let i = 0; i < n; i++) {
        if (alloc[i] > 0 && alloc[i] < maxDollars) alloc[i] += excess * (alloc[i] / uncappedTotal);
      }
    }

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

    // ── Diversification: HARD constraints + scoring ──
    let activeCount = 0;
    let maxSingleWt = 0;
    for (let i = 0; i < n; i++) {
      const wt = alloc[i] / (deployAmt || 1);
      if (alloc[i] > deployAmt * 0.02) activeCount++;
      if (wt > maxSingleWt) maxSingleWt = wt;
    }

    // HARD REJECT: fewer than 3 positions — no single-stock or 2-stock portfolios allowed
    if (activeCount < 3) continue;

    // HARD CAP: enforce max 25% per individual stock AFTER normalization
    let hadStockViolation = false;
    for (let i = 0; i < n; i++) {
      const wt = alloc[i] / (deployAmt || 1);
      if (candidates[i].type === "stock" && wt > 0.25) hadStockViolation = true;
    }
    if (hadStockViolation) continue; // skip this iteration entirely

    // ── SECTOR CONCENTRATION: hard reject if any macro-sector exceeds limit ──
    // Use relaxed limit (75%) for small candidate pools (backtest) to avoid rejecting everything
    const sectorHardLimit = n <= 40 ? 0.75 : 0.60;
    const sectorWts = {};
    let maxSectorWt = 0;
    for (let i = 0; i < n; i++) {
      const wt = alloc[i] / (deployAmt || 1);
      if (wt < 0.01) continue;
      const sec = macroSectors[i];
      sectorWts[sec] = (sectorWts[sec] || 0) + wt;
      if (sectorWts[sec] > maxSectorWt) maxSectorWt = sectorWts[sec];
    }
    if (maxSectorWt > sectorHardLimit) continue; // reject over-concentrated portfolios

    // Position count scoring: reward 4-7 sweet spot
    let divScore;
    if (activeCount === 3) divScore = -0.02;      // borderline — slight penalty
    else if (activeCount <= 5) divScore = 0.04;    // sweet spot
    else if (activeCount <= 7) divScore = 0.03;    // good diversification
    else divScore = 0.01;                          // 8+: slight bonus

    // Single-position concentration penalty — progressive above 25%
    // Even within the 30% hard cap, softer concentration is preferred
    const concPenalty = maxSingleWt > 0.25 ? -0.20 * (maxSingleWt - 0.25) / 0.75 : 0;

    let sc;
    const divAdj = divScore + concPenalty;
    // ── Max drawdown estimate: VaR95 × √2 approximates annual max drawdown ──
    const estMaxDD = var95 * 1.41;

    // ── CVaR / Expected Shortfall: tail-risk-aware scoring ──
    let wtdSkew = 0;
    for (let i = 0; i < n; i++) wtdSkew += (alloc[i] / (deployAmt || 1)) * skewArr[i];
    const cvar = computeCVaR(vol, wtdSkew);
    const cvarPenalty = -0.03 * Math.max(0, cvar - 25); // penalize CVaR > 25%

    // ── Tail risk penalty: leverage + EM + high-vol concentration ──
    let emWeight = 0, highVolWeight = 0;
    for (let i = 0; i < n; i++) {
      const wt = alloc[i] / (deployAmt || 1);
      if (macroSectors[i] === "intl-em") emWeight += wt;
      if (candidates[i].v > 25) highVolWeight += wt;
    }
    const tailRisk = levExposure * 0.15 + (emWeight > 0.20 ? (emWeight - 0.20) * 0.3 : 0) + highVolWeight * 0.08;
    const tailRiskPenalty = -tailRisk * 0.08;

    // ── Sector concentration soft penalty: progressive above 40% ──
    const sectorConcPenalty = maxSectorWt > 0.40 ? -0.05 * (maxSectorWt - 0.40) : 0;

    // ── SPY overlap penalty: if portfolio is >85% correlated with SPY, you should just buy SPY ──
    let wtdSpyCorr = 0;
    for (let i = 0; i < n; i++) wtdSpyCorr += (alloc[i] / (deployAmt || 1)) * spyCorr[i];
    // Also add existing positions' SPY correlation
    for (let i = 0; i < nEx; i++) wtdSpyCorr += exW[i] * gc(itemCats[i], "US Large Cap");
    const spyPenalty = wtdSpyCorr > 0.85 ? -0.08 * (wtdSpyCorr - 0.85) / 0.15 : wtdSpyCorr < 0.5 ? 0.03 : 0; // penalize high overlap, reward differentiation

    // ── Factor diversification: reward balanced factor exposure ──
    const factorDiv = hasFactors ? factorDiversificationScore(alloc, candidates, deployAmt) : 0;

    // ── Relative value signal: bonus for undervalued-vs-peers positions ──
    let relValBonus = 0;
    for (let i = 0; i < n; i++) relValBonus += (alloc[i] / (deployAmt || 1)) * relValSignals[i];

    // ── Dynamic vol targeting: scale expected return by vol scale factor ──
    const dynRet = ret * dynVolScale;

    // Combined new penalties
    const newPenalties = cvarPenalty + tailRiskPenalty + sectorConcPenalty;

    if (target === "risk_parity" && rpWeights) {
      // Risk parity objective: minimize distance from equal-risk-contribution weights
      let rpDist = 0;
      for (let i = 0; i < n; i++) {
        const actual = alloc[i] / (deployAmt || 1);
        rpDist += (actual - rpWeights[i]) ** 2;
      }
      sc = -rpDist * 100 + sh * 0.1 + regimeBonus + divAdj + factorDiv + relValBonus + spyPenalty + newPenalties;
    } else if (target === "max_sharpe") sc = sh + volPenalty + regimeBonus + divAdj + levPenalty + spyPenalty + factorDiv + relValBonus + newPenalties;
    else if (target === "min_vol") sc = -vol + regimeBonus + divAdj + levPenalty + spyPenalty + factorDiv + relValBonus + newPenalties;
    else if (target === "max_return") {
      const ddPenalty = srMode === "var" ? -0.08 * estMaxDD : srMode === "vol2" ? -0.04 * vol : -0.01 * vol;
      sc = dynRet * 1.5 + ddPenalty + volPenalty + regimeBonus + divAdj + levPenalty + spyPenalty + factorDiv + relValBonus + newPenalties;
    }
    else sc = sh * .5 + dynRet * .02 - vol * .01 - estMaxDD * 0.05 + volPenalty + regimeBonus + divAdj + levPenalty + spyPenalty + factorDiv + relValBonus + newPenalties;
    if (sc > bs) { bs = sc; best = new Float64Array(alloc); }
  }
  const minAlloc = cash * 0.03;
  if (!best) return [];
  const raw = candidates.map((e, i) => {
    const hk = useKelly ? maxPct[i] : null;
    const lev = e.lev && Math.abs(e.lev) > 1 ? e.lev : null;
    const decay = lev ? getLevDecay(e.v, lev) : null;
    const ar = adjRet[i];
    return { ticker: e.t, name: e.n, cat: e.c, r: e.r, v: e.v, er: e.er, d: e.d, dollars: +best[i].toFixed(0), pct: +((best[i] / cash) * 100).toFixed(1), hk: hk != null ? +(hk * 100).toFixed(1) : null, lev, decay: decay != null ? +decay.toFixed(1) : null, adjR: lev ? +ar.toFixed(1) : null, isStock: e.type === "stock" };
  }).sort((a, b) => b.dollars - a.dollars);
  // Keep at least 3 positions: apply minAlloc only to 4th position onward
  const keepTop3 = raw.slice(0, 3);
  const rest = raw.slice(3).filter(e => e.dollars >= minAlloc);
  const filtered = [...keepTop3.filter(e => e.dollars > 0), ...rest];
  // Ensure total deployment is at least 90% of cash
  const deployed = filtered.reduce((s, r) => s + r.dollars, 0);
  const minDeploy = cash * 0.9;
  if (deployed < minDeploy && filtered.length > 0) {
    // Distribute shortfall EQUALLY (not proportionally) to avoid making big positions bigger
    const shortfall = minDeploy - deployed;
    const perPos = Math.round(shortfall / filtered.length);
    filtered.forEach(r => {
      r.dollars += perPos;
      r.pct = +((r.dollars / cash) * 100).toFixed(1);
    });
  }
  // Final max cap enforcement: no single position > 30% of total deployment
  // Redistribute excess proportional to REMAINING HEADROOM (cap - current), not equally
  // This guarantees convergence: no position can be pushed over the cap by redistribution
  const finalTotal = filtered.reduce((s, r) => s + r.dollars, 0) || 1;
  const maxPosDollars = finalTotal * 0.30;
  for (let pass = 0; pass < 5; pass++) {
    let excess = 0;
    filtered.forEach(r => {
      if (r.dollars > maxPosDollars) { excess += r.dollars - maxPosDollars; r.dollars = maxPosDollars; }
    });
    if (excess <= 0) break;
    // Compute total headroom across all under-cap positions
    let totalHeadroom = 0;
    filtered.forEach(r => { if (r.dollars < maxPosDollars) totalHeadroom += maxPosDollars - r.dollars; });
    if (totalHeadroom <= 0) break; // all positions at cap, nowhere to redistribute
    // Distribute proportional to headroom — position at 10% gets more than position at 28%
    filtered.forEach(r => {
      if (r.dollars < maxPosDollars) {
        const headroom = maxPosDollars - r.dollars;
        r.dollars += excess * (headroom / totalHeadroom);
      }
    });
  }
  filtered.forEach(r => { r.pct = +((r.dollars / cash) * 100).toFixed(1); });
  return filtered;
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
const mono2 = "'IBM Plex Mono','SF Mono',monospace"; const sans2 = "'IBM Plex Sans','Inter',sans-serif";
const cs = { bg: "#161616", card: "#1e1e1e", card2: "#262626", border: "#333333", muted: "#6f6f6f", dim: "#8d8d8d", text: "#f4f4f4", subtle: "rgba(255,255,255,.03)", green: "#42be65", blue: "#78a9ff", pink: "#ff7eb6", yellow: "#ffab91", gold: "#f1c21b", purple: "#be95ff", red: "#ff8389" };
const inpS = { background: "#1e1e1e", border: "1px solid #333333", borderRadius: 2, color: cs.text, padding: "8px 10px", fontSize: 11, fontFamily: mono2, outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color .15s ease" };
const cardS = { background: cs.card, border: `1px solid ${cs.border}`, borderRadius: 3, padding: 16, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,.25)" };

function MC({ label, value, sub, accent, sm }) { return (<div className="metric-card" style={{ background: cs.card, border: `1px solid ${cs.border}`, borderTop: `2px solid ${accent || cs.border}`, borderRadius: 3, padding: sm ? "10px 12px" : "14px 16px", flex: 1, minWidth: sm ? 100 : 130, boxShadow: "0 1px 4px rgba(0,0,0,.2)" }}><div style={{ fontSize: 9, color: cs.dim, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 5, fontFamily: mono2 }}>{label}</div><div style={{ fontSize: sm ? 16 : 22, fontWeight: 700, color: accent || cs.text, fontFamily: mono2, lineHeight: 1 }}>{value}</div>{sub && <div style={{ fontSize: 9, color: cs.muted, marginTop: 4 }}>{sub}</div>}</div>) }
function Badge({ children, color = cs.green }) { return <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 2, fontSize: 8, fontWeight: 700, background: `${color}18`, color, letterSpacing: ".04em", fontFamily: mono2, border: `1px solid ${color}25` }}>{children}</span> }
function GR({ value, max, label, color, sz = 82 }) { const pct = Math.min(Math.max(value, 0) / max, 1), r2 = (sz - 8) / 2, ci = 2 * Math.PI * r2; return (<div style={{ textAlign: "center" }}><svg width={sz} height={sz}><circle cx={sz / 2} cy={sz / 2} r={r2} fill="none" stroke="#2a2a2a" strokeWidth={5} /><circle cx={sz / 2} cy={sz / 2} r={r2} fill="none" stroke={color} strokeWidth={5} strokeDasharray={`${pct * ci} ${ci}`} strokeLinecap="round" transform={`rotate(-90 ${sz / 2} ${sz / 2})`} style={{ transition: "stroke-dasharray .8s ease-out", filter: `drop-shadow(0 0 3px ${color}40)` }} /><text x={sz / 2} y={sz / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill={cs.text} fontSize={12} fontWeight="700" fontFamily={mono2}>{typeof value === 'number' ? value.toFixed(2) : value}</text></svg><div style={{ fontSize: 9, color: cs.dim, marginTop: 3, fontFamily: mono2 }}>{label}</div></div>) }

/**
 * RegimeLineChart — Multi-line SVG time series with hover interaction.
 *
 * Props:
 *   data: [{ date, ...values }]        — array of data points
 *   series: [{ key, label, color, width?, dash?, opacity? }] — line definitions
 *   regimeBands: { key: string }?       — if set, draws colored background bands from data[key] (0-4 regime idx)
 *   thresholds: [{ value, color, label, dash? }]? — horizontal reference lines
 *   yDomain: [min, max]?                — fixed Y axis domain (auto if omitted)
 *   yFormat: (v) => string?             — Y axis label formatter
 *   height: number?                     — SVG height (default 200)
 *   stacked: boolean?                   — if true, renders stacked area instead of lines
 *   title: string?
 *   subtitle: string?
 */
function RegimeLineChart({ data, series, regimeBands, thresholds, yDomain, yFormat, height: H = 200, stacked, title, subtitle }) {
  const [hoverIdx, setHoverIdx] = React.useState(null);
  const svgRef = React.useRef(null);
  if (!data?.length || !series?.length) return null;

  const W = 580;
  const pd = { t: 20, r: 14, b: 44, l: 48 };
  const w = W - pd.l - pd.r, h = H - pd.t - pd.b;
  const hmmColors = ["#42be65", "#fbbf24", "#fb923c", "#ff8389", "#60a5fa"];

  // Compute Y domain
  let yMin, yMax;
  if (yDomain) { [yMin, yMax] = yDomain; }
  else if (stacked) { yMin = 0; yMax = 1; }
  else {
    const allVals = data.flatMap(d => series.map(s => d[s.key] ?? 0));
    yMin = Math.min(...allVals); yMax = Math.max(...allVals);
    const padding = (yMax - yMin) * 0.08 || 0.1;
    yMin -= padding; yMax += padding;
  }

  const sx = (i) => pd.l + (i / Math.max(1, data.length - 1)) * w;
  const sy = (v) => pd.t + h - ((v - yMin) / (yMax - yMin || 1)) * h;
  const fmt = yFormat || (v => v.toFixed(2));

  // Date labels
  const dateLabels = [];
  const labelInterval = Math.max(1, Math.floor(data.length / 6));
  for (let i = 0; i < data.length; i += labelInterval) {
    const d = data[i]?.date;
    if (d) dateLabels.push({ i, label: d.length > 7 ? d.slice(0, 7) : d });
  }
  // Always show last date
  const lastDate = data[data.length - 1]?.date;
  if (lastDate && (dateLabels.length === 0 || dateLabels[dateLabels.length - 1].i < data.length - 3))
    dateLabels.push({ i: data.length - 1, label: lastDate.length > 7 ? lastDate.slice(0, 7) : lastDate });

  const getIdx = (e) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width * W;
    return Math.max(0, Math.min(data.length - 1, Math.round(((mx - pd.l) / w) * (data.length - 1))));
  };

  // Build polyline points for each series
  const lines = series.map(s => ({
    ...s,
    points: data.map((d, i) => `${sx(i)},${sy(d[s.key] ?? 0)}`).join(" "),
  }));

  // Stacked area paths
  let stackedPaths = null;
  if (stacked) {
    stackedPaths = [];
    const cumulative = data.map(() => 0);
    for (let si = 0; si < series.length; si++) {
      const s = series[si];
      const topPoints = data.map((d, i) => {
        cumulative[i] += (d[s.key] ?? 0);
        return { x: sx(i), y: sy(cumulative[i]) };
      });
      const bottomPoints = data.map((d, i) => {
        const bottom = cumulative[i] - (d[s.key] ?? 0);
        return { x: sx(i), y: sy(bottom) };
      }).reverse();
      const pathD = `M${topPoints.map(p => `${p.x},${p.y}`).join("L")} L${bottomPoints.map(p => `${p.x},${p.y}`).join("L")} Z`;
      stackedPaths.push({ ...s, pathD });
    }
  }

  const hPt = hoverIdx != null ? data[hoverIdx] : null;

  return <div style={cardS}>
    {title && <div style={{ fontSize: 12, fontWeight: 700, marginBottom: subtitle ? 2 : 8 }}>{title}</div>}
    {subtitle && <div style={{ fontSize: 9, color: cs.dim, marginBottom: 10 }}>{subtitle}</div>}

    {/* Legend */}
    <div style={{ display: "flex", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
      {series.map(s => (
        <span key={s.key} style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 14, height: s.dash ? 1 : 3, background: s.color, display: "inline-block", borderTop: s.dash ? `2px dashed ${s.color}` : "none" }} />
          <span style={{ color: s.color }}>{s.label}</span>
          {hPt && <span style={{ fontFamily: mono2, fontWeight: 600, color: s.color, marginLeft: 2 }}>{(hPt[s.key] ?? 0).toFixed(stacked ? 1 : 2)}{stacked ? "%" : ""}</span>}
        </span>
      ))}
    </div>

    <svg ref={svgRef} width={W} height={H} style={{ overflow: "visible", maxWidth: "100%", cursor: "crosshair" }}
      viewBox={`0 0 ${W} ${H}`}
      onMouseMove={(e) => setHoverIdx(getIdx(e))}
      onMouseLeave={() => setHoverIdx(null)}>

      {/* Regime background bands */}
      {regimeBands && data.map((d, i) => {
        const rIdx = d[regimeBands.key];
        if (rIdx == null) return null;
        const x1 = sx(i), x2 = i < data.length - 1 ? sx(i + 1) : x1 + w / data.length;
        return <rect key={i} x={x1} y={pd.t} width={Math.max(1, x2 - x1)} height={h} fill={hmmColors[rIdx] || "#333"} opacity={0.06} />;
      })}

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => {
        const yy = pd.t + h * (1 - f), val = yMin + f * (yMax - yMin);
        return <g key={f}>
          <line x1={pd.l} x2={W - pd.r} y1={yy} y2={yy} stroke="#262626" />
          <text x={pd.l - 5} y={yy + 3} fill={cs.muted} fontSize={8} textAnchor="end" fontFamily={mono2}>{fmt(val)}</text>
        </g>;
      })}

      {/* Threshold lines */}
      {thresholds?.map((t, i) => {
        const yy = sy(t.value);
        if (yy < pd.t || yy > pd.t + h) return null;
        return <g key={i}>
          <line x1={pd.l} x2={W - pd.r} y1={yy} y2={yy} stroke={t.color} strokeWidth={1} strokeDasharray={t.dash || "4,3"} opacity={0.6} />
          {t.label && <text x={W - pd.r + 3} y={yy + 3} fill={t.color} fontSize={7} fontFamily={mono2}>{t.label}</text>}
        </g>;
      })}

      {/* Date labels */}
      {dateLabels.map(({ i, label }) => (
        <g key={i}>
          <line x1={sx(i)} x2={sx(i)} y1={pd.t} y2={pd.t + h} stroke="#1e1e1e" strokeDasharray="2,3" />
          <text x={sx(i)} y={H - 14} fill={cs.muted} fontSize={7} textAnchor="middle" fontFamily={mono2}>{label}</text>
        </g>
      ))}

      {/* Stacked areas or lines */}
      {stacked ? stackedPaths.map(s => (
        <path key={s.key} d={s.pathD} fill={s.color} opacity={s.opacity || 0.55} stroke={s.color} strokeWidth={0.5} />
      )) : lines.map(s => (
        <polyline key={s.key} points={s.points} fill="none" stroke={s.color}
          strokeWidth={s.width || 1.5} strokeDasharray={s.dash || "none"} opacity={s.opacity || 0.85} />
      ))}

      {/* Hover crosshair & dots */}
      {hoverIdx != null && <>
        <line x1={sx(hoverIdx)} x2={sx(hoverIdx)} y1={pd.t} y2={pd.t + h} stroke={cs.dim} strokeWidth={0.5} strokeDasharray="3,2" />
        {!stacked && series.map(s => {
          const val = data[hoverIdx]?.[s.key];
          if (val == null) return null;
          return <circle key={s.key} cx={sx(hoverIdx)} cy={sy(val)} r={3} fill={s.color} stroke={cs.bg} strokeWidth={1.5} />;
        })}
      </>}

      {/* Hover tooltip background */}
      {hPt && <g>
        <rect x={sx(hoverIdx) + (hoverIdx > data.length * 0.7 ? -130 : 10)} y={pd.t + 2} width={120} height={12 + series.length * 13}
          rx={3} fill="rgba(22,22,22,0.92)" stroke="#393939" strokeWidth={0.5} />
        <text x={sx(hoverIdx) + (hoverIdx > data.length * 0.7 ? -124 : 16)} y={pd.t + 12}
          fill={cs.dim} fontSize={8} fontFamily={mono2}>{hPt.date}</text>
        {series.map((s, si) => (
          <text key={s.key} x={sx(hoverIdx) + (hoverIdx > data.length * 0.7 ? -124 : 16)} y={pd.t + 24 + si * 13}
            fill={s.color} fontSize={8} fontWeight="600" fontFamily={mono2}>
            {s.label}: {(hPt[s.key] ?? 0).toFixed(stacked ? 1 : 3)}{stacked ? "%" : ""}
          </text>
        ))}
      </g>}
    </svg>
  </div>;
}

function Scatter({ data, cp, w: W = 520, h: H = 320 }) {
  if (!data?.all) return null;
  const pd = { t: 28, r: 28, b: 38, l: 52 }, w = W - pd.l - pd.r, h2 = H - pd.t - pd.b; const pts = data.all;
  const x0 = Math.min(...pts.map(p => p.vol)) - .5, x1 = Math.max(...pts.map(p => p.vol)) + .5;
  const y0 = Math.min(...pts.map(p => p.ret)) - .5, y1 = Math.max(...pts.map(p => p.ret)) + .5;
  const sx = v => pd.l + ((v - x0) / (x1 - x0)) * w, sy = v => pd.t + h2 - ((v - y0) / (y1 - y0)) * h2;
  const ms = data.fr.reduce((b, p) => p.sh > b.sh ? p : b, data.fr[0]);
  return (<svg width={W} height={H} style={{ overflow: "visible" }}>
    {[0, .25, .5, .75, 1].map(f => { const yy = pd.t + h2 * (1 - f), val = y0 + f * (y1 - y0); return <g key={f}><line x1={pd.l} x2={W - pd.r} y1={yy} y2={yy} stroke="#262626" /><text x={pd.l - 6} y={yy + 3} fill={cs.muted} fontSize={8} textAnchor="end" fontFamily={mono2}>{val.toFixed(1)}%</text></g> })}
    {[0, .25, .5, .75, 1].map(f => { const x = pd.l + w * f, val = x0 + f * (x1 - x0); return <text key={f} x={x} y={H - 6} fill={cs.muted} fontSize={8} textAnchor="middle" fontFamily={mono2}>{val.toFixed(1)}%</text> })}
    {pts.map((p, i) => <circle key={i} cx={sx(p.vol)} cy={sy(p.ret)} r={1.2} fill="rgba(96,165,250,0.12)" />)}
    <polyline points={data.fr.map(p => `${sx(p.vol)},${sy(p.ret)}`).join(" ")} fill="none" stroke={cs.green} strokeWidth={2} />
    {data.fr.map((p, i) => <circle key={i} cx={sx(p.vol)} cy={sy(p.ret)} r={2.5} fill={cs.green} />)}
    {ms && <><circle cx={sx(ms.vol)} cy={sy(ms.ret)} r={6} fill="none" stroke={cs.yellow} strokeWidth={2} /><text x={sx(ms.vol) + 9} y={sy(ms.ret) - 5} fill={cs.yellow} fontSize={9} fontFamily={mono2}>Max Sharpe ({ms.sh.toFixed(2)})</text></>}
    {cp && <><circle cx={sx(cp.vol)} cy={sy(cp.er)} r={6} fill={cs.pink} /><text x={sx(cp.vol) + 9} y={sy(cp.er) + 4} fill={cs.pink} fontSize={9} fontWeight="600" fontFamily={mono2}>Current</text></>}
  </svg>)
}

const fmt$ = v => v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(1)}k` : `$${(+v || 0).toFixed(0)}`;

// ─── Interactive Equity Curve Component ───
function EquityCurve({ curves, sc2 }) {
  const [zoomRange, setZoomRange] = React.useState(null);
  const [hoverIdx, setHoverIdx] = React.useState(null);
  const [showDD, setShowDD] = React.useState(false);
  const [dragStart, setDragStart] = React.useState(null);
  const [dragging, setDragging] = React.useState(null);
  const svgRef = React.useRef(null);

  const fullLen = curves.opt.length;
  const rangeStart = zoomRange ? zoomRange[0] : 0;
  const rangeEnd = zoomRange ? zoomRange[1] : fullLen - 1;
  const sliceLen = rangeEnd - rangeStart + 1;

  const optSlice = curves.opt.slice(rangeStart, rangeEnd + 1);
  const spySlice = curves.spy.slice(rangeStart, rangeEnd + 1);
  const balSlice = curves.bal60.slice(rangeStart, rangeEnd + 1);

  const allPtsZ = [...optSlice, ...spySlice, ...balSlice];
  const maxVZ = Math.max(...allPtsZ.map(p => p.value));
  const minVZ = Math.min(...allPtsZ.map(p => p.value));
  const WZ = 560, HZ = 310, pdZ = { t: 25, r: 15, b: 52, l: 62 };
  const wZ = WZ - pdZ.l - pdZ.r, hZ = HZ - pdZ.t - pdZ.b;
  const sxZ = (i) => pdZ.l + (i / Math.max(1, sliceLen - 1)) * wZ;
  const syZ = (v) => pdZ.t + hZ - ((v - minVZ) / (maxVZ - minVZ || 1)) * hZ;
  const drawLineZ = (data) => data.map((p, i) => `${sxZ(i)},${syZ(p.value)}`).join(" ");

  const computeDD = (data) => {
    let peak = data[0]?.value || 0;
    return data.map(p => { if (p.value > peak) peak = p.value; return { dd: ((p.value - peak) / peak) * 100, date: p.date }; });
  };
  const optDD = showDD ? computeDD(optSlice) : null;
  const maxDDInRange = optDD ? Math.min(...optDD.map(d => d.dd)) : 0;

  const hoverPt = hoverIdx != null ? {
    opt: optSlice[hoverIdx], spy: spySlice[hoverIdx], bal: balSlice[hoverIdx],
    dd: optDD ? optDD[hoverIdx] : null, x: sxZ(hoverIdx),
  } : null;

  const getIdxFromMouse = (e) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width * WZ;
    const idx = Math.round(((mx - pdZ.l) / wZ) * (sliceLen - 1));
    return Math.max(0, Math.min(sliceLen - 1, idx));
  };

  const setPeriod = (months) => {
    if (!months) { setZoomRange(null); return; }
    const end = fullLen - 1;
    const start = Math.max(0, end - months);
    setZoomRange([start, end]);
  };

  const yearMarkers = [];
  for (let i = 0; i < sliceLen; i++) {
    const d = optSlice[i]?.date;
    if (d && (i === 0 || d.slice(0, 4) !== optSlice[i - 1]?.date?.slice(0, 4))) {
      yearMarkers.push({ i, year: d.slice(0, 4) });
    }
  }
  const showEvery = sliceLen < 48 ? 1 : sliceLen < 96 ? 2 : sliceLen < 144 ? 3 : 4;
  const filteredMarkers = yearMarkers.filter((_, idx) => idx % showEvery === 0);

  return <div style={cardS}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 700 }}>Equity Curve — ${(sc2/1000).toFixed(0)}k Starting Capital</div>
      <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
        {[
          { label: "1Y", m: 12 }, { label: "3Y", m: 36 }, { label: "5Y", m: 60 },
          { label: "10Y", m: 120 }, { label: "All", m: null },
        ].map(p => {
          const isActive = p.m === null ? !zoomRange : zoomRange && (rangeEnd - rangeStart + 1) === Math.min(p.m, fullLen);
          return <button key={p.label} onClick={() => setPeriod(p.m)}
            style={{ padding: "3px 8px", borderRadius: 0, border: `1px solid ${isActive ? cs.blue : cs.border}`,
              background: isActive ? `${cs.blue}20` : "transparent", color: isActive ? cs.blue : cs.dim,
              fontSize: 9, fontWeight: 600, cursor: "pointer", fontFamily: mono2 }}>{p.label}</button>;
        })}
        <button onClick={() => setShowDD(d => !d)}
          style={{ padding: "3px 8px", borderRadius: 0, border: `1px solid ${showDD ? cs.red : cs.border}`,
            background: showDD ? `${cs.red}20` : "transparent", color: showDD ? cs.red : cs.dim,
            fontSize: 9, fontWeight: 600, cursor: "pointer", fontFamily: mono2, marginLeft: 4 }}>DD</button>
      </div>
    </div>

    <div style={{ display: "flex", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
      <span style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 3, background: cs.green, display: "inline-block" }} />Optimized ({fmt$(optSlice[optSlice.length - 1]?.value)})</span>
      <span style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 3, background: cs.blue, display: "inline-block" }} />SPY ({fmt$(spySlice[spySlice.length - 1]?.value)})</span>
      <span style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 3, background: cs.purple, display: "inline-block" }} />60/40 ({fmt$(balSlice[balSlice.length - 1]?.value)})</span>
      {showDD && <span style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4, color: cs.red }}><span style={{ width: 14, height: 3, background: cs.red, opacity: .3, display: "inline-block" }} />Drawdown</span>}
    </div>

    <svg ref={svgRef} width={WZ} height={HZ} style={{ overflow: "visible", maxWidth: "100%", cursor: "crosshair" }}
      viewBox={`0 0 ${WZ} ${HZ}`}
      onMouseMove={(e) => { const idx = getIdxFromMouse(e); setHoverIdx(idx); if (dragStart != null) setDragging(idx); }}
      onMouseLeave={() => { setHoverIdx(null); setDragStart(null); setDragging(null); }}
      onMouseDown={(e) => { e.preventDefault(); setDragStart(getIdxFromMouse(e)); setDragging(null); }}
      onMouseUp={() => {
        if (dragStart != null && dragging != null && Math.abs(dragging - dragStart) > 3) {
          const s = Math.min(dragStart, dragging) + rangeStart;
          const e2 = Math.max(dragStart, dragging) + rangeStart;
          setZoomRange([s, Math.min(e2, fullLen - 1)]);
        }
        setDragStart(null); setDragging(null);
      }}>

      {[0, .25, .5, .75, 1].map(f => {
        const yy = pdZ.t + hZ * (1 - f), val = minVZ + f * (maxVZ - minVZ);
        return <g key={f}><line x1={pdZ.l} x2={WZ - pdZ.r} y1={yy} y2={yy} stroke="#262626" />
          <text x={pdZ.l - 5} y={yy + 3} fill={cs.muted} fontSize={8} textAnchor="end" fontFamily={mono2}>{fmt$(val)}</text></g>;
      })}

      {filteredMarkers.map(({ i, year }) => (
        <g key={year}><line x1={sxZ(i)} x2={sxZ(i)} y1={pdZ.t} y2={pdZ.t + hZ} stroke="#1e1e1e" strokeDasharray="2,3" />
          <text x={sxZ(i)} y={HZ - 18} fill={cs.muted} fontSize={8} textAnchor="middle" fontFamily={mono2}>{year}</text></g>
      ))}

      {showDD && optDD && <path d={`M${sxZ(0)},${syZ(optSlice[0].value)} ` +
        optDD.map((d, i) => `L${sxZ(i)},${pdZ.t + hZ + (d.dd / (maxDDInRange || -1)) * 40}`).join(" ") +
        ` L${sxZ(optDD.length - 1)},${syZ(optSlice[optSlice.length - 1].value)} Z`}
        fill={cs.red} opacity={.08} />}
      {showDD && optDD && <polyline points={optDD.map((d, i) => `${sxZ(i)},${pdZ.t + hZ + (d.dd / (maxDDInRange || -1)) * 40}`).join(" ")}
        fill="none" stroke={cs.red} strokeWidth={1} opacity={.4} />}

      <polyline points={drawLineZ(balSlice)} fill="none" stroke={cs.purple} strokeWidth={1.5} opacity={.5} />
      <polyline points={drawLineZ(spySlice)} fill="none" stroke={cs.blue} strokeWidth={1.5} opacity={.6} />
      <polyline points={drawLineZ(optSlice)} fill="none" stroke={cs.green} strokeWidth={2} />

      {dragStart != null && dragging != null && Math.abs(dragging - dragStart) > 1 && (
        <rect x={sxZ(Math.min(dragStart, dragging))} y={pdZ.t}
          width={Math.abs(sxZ(dragging) - sxZ(dragStart))} height={hZ}
          fill={cs.blue} opacity={.12} stroke={cs.blue} strokeWidth={0.5} />
      )}

      {hoverPt && <>
        <line x1={hoverPt.x} x2={hoverPt.x} y1={pdZ.t} y2={pdZ.t + hZ} stroke={cs.dim} strokeWidth={0.5} strokeDasharray="3,2" />
        <circle cx={hoverPt.x} cy={syZ(hoverPt.opt?.value)} r={3.5} fill={cs.green} stroke={cs.bg} strokeWidth={1.5} />
        <circle cx={hoverPt.x} cy={syZ(hoverPt.spy?.value)} r={3} fill={cs.blue} stroke={cs.bg} strokeWidth={1.5} />
        <circle cx={hoverPt.x} cy={syZ(hoverPt.bal?.value)} r={3} fill={cs.purple} stroke={cs.bg} strokeWidth={1.5} />
      </>}
    </svg>

    <div style={{ height: 20, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontSize: 9, fontFamily: mono2, color: cs.dim }}>
      {hoverPt ? <>
        <span style={{ color: cs.text }}>{hoverPt.opt?.date}</span>
        <span style={{ color: cs.green }}>Opt: {fmt$(hoverPt.opt?.value)}</span>
        <span style={{ color: cs.blue }}>SPY: {fmt$(hoverPt.spy?.value)}</span>
        <span style={{ color: cs.purple }}>60/40: {fmt$(hoverPt.bal?.value)}</span>
        {hoverPt.dd && <span style={{ color: cs.red }}>DD: {hoverPt.dd.dd.toFixed(1)}%</span>}
      </> : <span>Hover to inspect · Drag to zoom · Click period buttons above</span>}
    </div>

    {zoomRange && <div style={{ position: "relative", height: 28, marginTop: 4, background: "#1e1e1e", border: `1px solid ${cs.border}` }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${fullLen} 28`} preserveAspectRatio="none" style={{ position: "absolute", top: 0, left: 0 }}>
        <polyline points={curves.opt.map((p, i) => {
          const allFull = [...curves.opt, ...curves.spy, ...curves.bal60];
          const fMax = Math.max(...allFull.map(q => q.value));
          const fMin = Math.min(...allFull.map(q => q.value));
          return `${i},${28 - ((p.value - fMin) / (fMax - fMin || 1)) * 26}`;
        }).join(" ")} fill="none" stroke={cs.green} strokeWidth={1} opacity={.4} />
      </svg>
      <div style={{ position: "absolute", top: 0, bottom: 0,
        left: `${(rangeStart / fullLen) * 100}%`, width: `${((rangeEnd - rangeStart + 1) / fullLen) * 100}%`,
        background: `${cs.blue}18`, borderLeft: `2px solid ${cs.blue}`, borderRight: `2px solid ${cs.blue}` }} />
      <button onClick={() => setZoomRange(null)}
        style={{ position: "absolute", right: 4, top: 4, padding: "2px 6px", borderRadius: 0,
          border: `1px solid ${cs.border}`, background: cs.card, color: cs.dim,
          fontSize: 8, fontWeight: 600, cursor: "pointer", fontFamily: mono2 }}>Reset Zoom</button>
    </div>}
  </div>;
}

// ─── Annual Returns Bar Chart ───
function AnnualReturnBars({ annual }) {
  const [hoveredYear, setHoveredYear] = React.useState(null);
  if (!annual || annual.length === 0) return null;

  const W = 560, H = 240;
  const pad = { t: 30, r: 20, b: 50, l: 60 };
  const chartW = W - pad.l - pad.r, chartH = H - pad.t - pad.b;

  const minRet = Math.min(...annual.flatMap(y => [y.optRet || 0, y.spyRet || 0, y.bal60Ret || 0]));
  const maxRet = Math.max(...annual.flatMap(y => [y.optRet || 0, y.spyRet || 0, y.bal60Ret || 0]));
  const retRange = Math.max(Math.abs(minRet), Math.abs(maxRet)) * 1.1;

  const barW = chartW / (annual.length * 4);
  const barGap = barW * 0.3;

  const sx = (i) => pad.l + (i / annual.length) * chartW;
  const sy = (ret) => pad.t + chartH / 2 - (ret / retRange) * (chartH / 2);

  return <div style={cardS}>
    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Annual Returns Comparison</div>

    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
      <span style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 12, height: 12, background: cs.green, display: "inline-block" }} />Optimized</span>
      <span style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 12, height: 12, background: cs.blue, display: "inline-block" }} />SPY</span>
      <span style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 12, height: 12, background: cs.purple, display: "inline-block" }} />60/40</span>
    </div>

    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: "100%", overflow: "visible" }}>
      {/* Gridlines */}
      {[0, 25, 50, -25, -50].map(val => {
        const yy = sy(val);
        return <g key={val}>
          <line x1={pad.l} x2={W - pad.r} y1={yy} y2={yy} stroke={cs.border} strokeWidth={val === 0 ? 1 : 0.5} opacity={val === 0 ? 1 : 0.5} />
          <text x={pad.l - 8} y={yy + 3} fill={cs.dim} fontSize={8} textAnchor="end" fontFamily={mono2}>{val}%</text>
        </g>;
      })}

      {/* Zero line */}
      <line x1={pad.l} x2={W - pad.r} y1={sy(0)} y2={sy(0)} stroke={cs.text} strokeWidth={1.5} />

      {/* Year labels */}
      {annual.map((yr, i) => (
        <text key={`yr-${i}`} x={sx(i + 0.5)} y={H - 15} fill={cs.dim} fontSize={8} textAnchor="middle" fontFamily={mono2}>{yr.year}</text>
      ))}

      {/* Bars */}
      {annual.map((yr, i) => {
        const x0 = sx(i) + barGap;
        const h1 = chartH / 2;
        const zeroY = sy(0);
        const barY = (ret) => ret >= 0 ? sy(ret) : zeroY;
        const barH = (ret) => Math.abs((ret || 0) / retRange) * h1;
        return <g key={`bars-${i}`} onMouseEnter={() => setHoveredYear(i)} onMouseLeave={() => setHoveredYear(null)}>
          <rect x={x0} y={barY(yr.optRet || 0)} width={barW} height={barH(yr.optRet)} fill={cs.green} opacity={hoveredYear === i ? 1 : 0.7} />
          <rect x={x0 + barW + barGap} y={barY(yr.spyRet || 0)} width={barW} height={barH(yr.spyRet)} fill={cs.blue} opacity={hoveredYear === i ? 1 : 0.7} />
          <rect x={x0 + 2 * (barW + barGap)} y={barY(yr.bal60Ret || 0)} width={barW} height={barH(yr.bal60Ret)} fill={cs.purple} opacity={hoveredYear === i ? 1 : 0.7} />
          {hoveredYear === i && (
            <g>
              <rect x={sx(i)} y={pad.t} width={sx(i + 1) - sx(i)} height={chartH} fill={cs.text} opacity={0.03} />
              <text x={sx(i + 0.5)} y={pad.t - 10} fill={cs.text} fontSize={9} textAnchor="middle" fontFamily={mono2} fontWeight="600">{yr.year}</text>
              <text x={sx(i + 0.5)} y={pad.t - 1} fill={cs.dim} fontSize={7} textAnchor="middle" fontFamily={mono2}>
                {(yr.optRet || 0) >= 0 ? "+" : ""}{(yr.optRet || 0).toFixed(1)}% / {(yr.spyRet || 0) >= 0 ? "+" : ""}{(yr.spyRet || 0).toFixed(1)}% / {(yr.bal60Ret || 0) >= 0 ? "+" : ""}{(yr.bal60Ret || 0).toFixed(1)}%
              </text>
            </g>
          )}
        </g>;
      })}
    </svg>
  </div>;
}

// ─── Monthly Returns Heatmap ───
function MonthlyHeatmap({ curves }) {
  if (!curves || !curves.opt || curves.opt.length === 0) return null;

  // Compute monthly returns
  const monthlyReturns = {};
  let prevDate = null, prevValue = null;

  curves.opt.forEach(pt => {
    const d = pt.date;
    const ym = d.slice(0, 7); // YYYY-MM
    if (!monthlyReturns[ym]) monthlyReturns[ym] = [];

    if (prevDate && prevValue) {
      const prevYM = prevDate.slice(0, 7);
      if (prevYM !== ym && prevValue > 0) {
        const monthRet = ((pt.value - prevValue) / prevValue) * 100;
        monthlyReturns[prevYM] = monthRet;
      }
    }
    prevDate = d;
    prevValue = pt.value;
  });

  // Convert to year-month grid
  const yearMonths = Object.keys(monthlyReturns).sort();
  const yearMap = {};
  yearMonths.forEach(ym => {
    const yr = ym.slice(0, 4);
    if (!yearMap[yr]) yearMap[yr] = {};
    const mo = parseInt(ym.slice(5, 7)) - 1;
    yearMap[yr][mo] = typeof monthlyReturns[ym] === 'number' ? monthlyReturns[ym] : 0;
  });

  const years = Object.keys(yearMap).sort();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const cellSize = 38;

  const colorForValue = (val) => {
    if (val < -20) return cs.red;
    if (val < 0) return `rgba(255, 131, 137, ${0.2 + (Math.abs(val) / 20) * 0.8})`;
    if (val === 0) return "#444";
    if (val < 20) return `rgba(66, 190, 101, ${(val / 20) * 0.7})`;
    return cs.green;
  };

  return <div style={cardS}>
    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Monthly Returns Heatmap</div>
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "inline-block", fontFamily: mono2, fontSize: 9 }}>
        {/* Header row */}
        <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
          <div style={{ width: 50, textAlign: "center", color: cs.dim }}>Year</div>
          {months.map(m => <div key={m} style={{ width: cellSize, textAlign: "center", color: cs.dim, fontSize: 8 }}>{m}</div>)}
          <div style={{ width: 60, textAlign: "center", color: cs.dim, fontSize: 8 }}>Annual</div>
        </div>

        {/* Data rows */}
        {years.map(yr => {
          const yearData = yearMap[yr];
          const annual = Object.values(yearData).reduce((a, b) => a + b, 0);
          return <div key={yr} style={{ display: "flex", gap: 2, marginBottom: 2 }}>
            <div style={{ width: 50, textAlign: "center", color: cs.text, fontWeight: 600 }}>{yr}</div>
            {months.map((m, mi) => {
              const val = yearData[mi] || 0;
              return <div key={`${yr}-${m}`} style={{ width: cellSize, height: cellSize, background: colorForValue(val), border: `1px solid ${cs.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: Math.abs(val) > 10 ? cs.text : cs.dim, fontWeight: 600 }} title={`${yr}-${String(mi + 1).padStart(2, '0')}: ${val.toFixed(1)}%`}>
                {val > 0 ? "+" : ""}{val.toFixed(1)}%
              </div>;
            })}
            <div style={{ width: 60, height: cellSize, display: "flex", alignItems: "center", justifyContent: "center", color: annual > 0 ? cs.green : cs.red, fontWeight: 600, fontSize: 8 }}>
              {annual > 0 ? "+" : ""}{annual.toFixed(1)}%
            </div>
          </div>;
        })}
      </div>
    </div>
  </div>;
}

// ─── Drawdown Chart ───
function DrawdownChart({ curves }) {
  const [hoverIdx, setHoverIdx] = React.useState(null);
  if (!curves || !curves.opt || curves.opt.length < 2) return null;

  const W = 560, H = 200;
  const pad = { t: 30, r: 20, b: 40, l: 60 };
  const chartW = W - pad.l - pad.r, chartH = H - pad.t - pad.b;

  // Compute drawdowns
  const computeDD = (curve) => {
    let peak = curve[0].value;
    return curve.map(pt => {
      peak = Math.max(peak, pt.value);
      return { date: pt.date, dd: ((pt.value - peak) / peak) * 100 };
    });
  };

  const optDD = computeDD(curves.opt);
  const spyDD = computeDD(curves.spy || []);
  const balDD = computeDD(curves.bal60 || []);

  const maxDD = Math.min(...[optDD, spyDD, balDD].flatMap(d => d.map(x => x.dd)));
  const ddRange = Math.abs(maxDD) * 1.1;

  const sx = (i) => pad.l + (i / optDD.length) * chartW;
  const sy = (dd) => pad.t + (Math.abs(dd) / ddRange) * chartH;

  // Sample year markers
  const yearMarkers = [];
  let lastYear = null;
  optDD.forEach((pt, i) => {
    const yr = pt.date.slice(0, 4);
    if (yr !== lastYear) {
      yearMarkers.push({ i, year: yr });
      lastYear = yr;
    }
  });
  const showEvery = optDD.length < 96 ? 1 : optDD.length < 192 ? 2 : 3;
  const filteredMarkers = yearMarkers.filter((_, idx) => idx % showEvery === 0);

  const drawLine = (ddArray) => ddArray.map((pt, i) => `${sx(i)},${sy(pt.dd)}`).join(" ");

  return <div style={cardS}>
    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Drawdown (Underwater)</div>

    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
      <span style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 12, height: 12, background: cs.green, display: "inline-block" }} />Optimized</span>
      <span style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 12, height: 12, background: cs.blue, display: "inline-block" }} />SPY</span>
      <span style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 12, height: 12, background: cs.purple, display: "inline-block" }} />60/40</span>
    </div>

    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: "100%", overflow: "visible" }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const idx = Math.floor((x - pad.l) / chartW * optDD.length);
        setHoverIdx(Math.max(0, Math.min(optDD.length - 1, idx)));
      }}
      onMouseLeave={() => setHoverIdx(null)}>

      {/* Gridlines */}
      {[0, -10, -20, -30].map(val => {
        const yy = sy(val);
        if (yy < pad.t || yy > pad.t + chartH) return null;
        return <g key={val}>
          <line x1={pad.l} x2={W - pad.r} y1={yy} y2={yy} stroke={cs.border} strokeWidth={0.5} opacity={0.5} />
          <text x={pad.l - 8} y={yy + 3} fill={cs.dim} fontSize={8} textAnchor="end" fontFamily={mono2}>{val}%</text>
        </g>;
      })}

      {/* Year labels */}
      {filteredMarkers.map(({ i, year }) => (
        <g key={year}><line x1={sx(i)} x2={sx(i)} y1={pad.t} y2={pad.t + chartH} stroke="#1e1e1e" strokeDasharray="2,3" />
          <text x={sx(i)} y={H - 18} fill={cs.muted} fontSize={8} textAnchor="middle" fontFamily={mono2}>{year}</text></g>
      ))}

      {/* Area fills */}
      {optDD.length > 0 && <path d={`M${sx(0)},${pad.t + chartH} ` + optDD.map((pt, i) => `L${sx(i)},${sy(pt.dd)}`).join(" ") + ` L${sx(optDD.length - 1)},${pad.t + chartH} Z`} fill={cs.green} opacity={0.1} />}

      {/* Lines */}
      {optDD.length > 1 && <polyline points={drawLine(optDD)} fill="none" stroke={cs.green} strokeWidth={2} />}
      {spyDD.length > 1 && <polyline points={drawLine(spyDD)} fill="none" stroke={cs.blue} strokeWidth={1.5} opacity={0.7} />}
      {balDD.length > 1 && <polyline points={drawLine(balDD)} fill="none" stroke={cs.purple} strokeWidth={1.5} opacity={0.6} />}

      {/* Hover crosshair */}
      {hoverIdx !== null && optDD[hoverIdx] && (
        <g>
          <line x1={sx(hoverIdx)} x2={sx(hoverIdx)} y1={pad.t} y2={pad.t + chartH} stroke={cs.dim} strokeWidth={0.5} strokeDasharray="3,2" opacity={0.6} />
          <circle cx={sx(hoverIdx)} cy={sy(optDD[hoverIdx].dd)} r={3.5} fill={cs.green} stroke={cs.bg} strokeWidth={1.5} />
          {spyDD[hoverIdx] && <circle cx={sx(hoverIdx)} cy={sy(spyDD[hoverIdx].dd)} r={3} fill={cs.blue} stroke={cs.bg} strokeWidth={1.5} />}
          {balDD[hoverIdx] && <circle cx={sx(hoverIdx)} cy={sy(balDD[hoverIdx].dd)} r={3} fill={cs.purple} stroke={cs.bg} strokeWidth={1.5} />}
        </g>
      )}
    </svg>

    {hoverIdx !== null && optDD[hoverIdx] && <div style={{ marginTop: 8, padding: "8px 12px", background: "#1e1e1e", borderRadius: 0, display: "flex", gap: 16, justifyContent: "center", fontSize: 9, fontFamily: mono2 }}>
      <span style={{ color: cs.green }}>Opt: {optDD[hoverIdx].dd.toFixed(1)}%</span>
      {spyDD[hoverIdx] && <span style={{ color: cs.blue }}>SPY: {spyDD[hoverIdx].dd.toFixed(1)}%</span>}
      {balDD[hoverIdx] && <span style={{ color: cs.purple }}>60/40: {balDD[hoverIdx].dd.toFixed(1)}%</span>}
      <span style={{ color: cs.dim }}>{optDD[hoverIdx].date}</span>
    </div>}
  </div>;
}

// ─── Enhanced Frontier with ETF Scatter, CML, Stats ───
function EnhancedFrontier({ frontier, metrics, etfDB, cashBalance, allPos, holdingsVal }) {
  const [hoveredETF, setHoveredETF] = React.useState(null);

  if (!etfDB || etfDB.length === 0) return null;

  // Prepare current portfolio metrics
  const currentVol = metrics.vol || 0;
  const currentRet = metrics.er || 0;

  // Compute max Sharpe portfolio from frontier
  const maxSharpePort = frontier?.fr?.length > 0 ? frontier.fr.reduce((best, p) => p.sh > best.sh ? p : best, frontier.fr[0]) : null;
  const minVolPort = frontier?.fr?.length > 0 ? frontier.fr.reduce((best, p) => (!best || p.vol < best.vol) ? p : best, null) : null;

  // Category colors
  const catColors = {
    "US Large Cap": "#42be65",
    "US Total Mkt": "#78a9ff",
    "US Growth": "#ff7eb6",
    "US Value": "#ffab91",
    "US Dividend": "#be95ff",
    "US Mid Cap": "#82cfff",
    "US Small Cap": "#08bdba",
    "International": "#ff8389",
    "Intl Developed": "#33b1ff",
    "Emerging Mkts": "#d4bbff",
    "Sector Tech": "#42be65",
    "Sector Health": "#78a9ff",
    "Sector Finance": "#ff7eb6",
    "Sector Energy": "#ffab91",
    "Sector Indust": "#be95ff",
    "Sector Consumer": "#82cfff",
    "Sector Utilities": "#08bdba",
    "Sector Materials": "#ff8389",
    "Sector Comms": "#33b1ff",
    "Sector RE": "#d4bbff",
  };

  const getCatColor = (cat) => catColors[cat] || "#8d8d8d";

  // ETF scatter plot (vol vs return)
  const W = 560, H = 320;
  const pad = { t: 28, r: 28, b: 38, l: 52 };
  const w = W - pad.l - pad.r, h2 = H - pad.t - pad.b;

  const volVals = etfDB.map(e => e.v);
  const retVals = etfDB.map(e => e.r);
  const x0 = Math.min(...volVals) - 0.5, x1 = Math.max(...volVals) + 0.5;
  const y0 = Math.min(...retVals) - 0.5, y1 = Math.max(...retVals) + 0.5;

  const sx = (v) => pad.l + ((v - x0) / (x1 - x0)) * w;
  const sy = (v) => pad.t + h2 - ((v - y0) / (y1 - y0)) * h2;

  // Capital Market Line: from risk-free (0% vol, ~2% ret) through max Sharpe
  const riskFree = 2;
  const cmlSlope = maxSharpePort ? (maxSharpePort.ret - riskFree) / maxSharpePort.vol : 0;

  return <div>
    {/* ETF Scatter + Frontier */}
    <div style={cardS}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>ETF Risk-Return Universe</div>

      <svg width={W} height={H} style={{ maxWidth: "100%", overflow: "visible" }}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => {
          const yy = pad.t + h2 * (1 - f), val = y0 + f * (y1 - y0);
          return <g key={f}><line x1={pad.l} x2={W - pad.r} y1={yy} y2={yy} stroke="#262626" />
            <text x={pad.l - 6} y={yy + 3} fill={cs.muted} fontSize={8} textAnchor="end" fontFamily={mono2}>{val.toFixed(1)}%</text></g>;
        })}
        {[0, 0.25, 0.5, 0.75, 1].map(f => {
          const x = pad.l + w * f, val = x0 + f * (x1 - x0);
          return <text key={f} x={x} y={H - 6} fill={cs.muted} fontSize={8} textAnchor="middle" fontFamily={mono2}>{val.toFixed(1)}%</text>;
        })}

        {/* Capital Market Line */}
        {maxSharpePort && (
          <line x1={sx(0.01)} x2={sx(Math.max(...volVals) + 2)} y1={sy(riskFree)} y2={sy(riskFree + cmlSlope * (Math.max(...volVals) + 2))} stroke={cs.yellow} strokeWidth={1.5} strokeDasharray="4,2" opacity={0.6} />
        )}

        {/* Efficient Frontier */}
        {frontier.fr?.length > 0 && <polyline points={frontier.fr.map(p => `${sx(p.vol)},${sy(p.ret)}`).join(" ")} fill="none" stroke={cs.green} strokeWidth={2} />}

        {/* ETF dots */}
        {etfDB.map((e, i) => (
          <circle key={i} cx={sx(e.v)} cy={sy(e.r)} r={hoveredETF === i ? 4 : 2.5} fill={getCatColor(e.c)} opacity={hoveredETF === i ? 1 : 0.6} style={{ cursor: "pointer" }}
            onMouseEnter={() => setHoveredETF(i)} onMouseLeave={() => setHoveredETF(null)} title={`${e.t}: ${e.r.toFixed(1)}% return, ${e.v.toFixed(1)}% vol`} />
        ))}

        {/* Current portfolio */}
        {currentVol > 0 && <circle cx={sx(currentVol)} cy={sy(currentRet)} r={7} fill="none" stroke={cs.pink} strokeWidth={2} />}
        {currentVol > 0 && <text x={sx(currentVol) + 12} y={sy(currentRet) - 5} fill={cs.pink} fontSize={9} fontWeight="600" fontFamily={mono2}>Current</text>}

        {/* Max Sharpe marker */}
        {maxSharpePort && <circle cx={sx(maxSharpePort.vol)} cy={sy(maxSharpePort.ret)} r={6} fill="none" stroke={cs.yellow} strokeWidth={2} />}
        {maxSharpePort && <text x={sx(maxSharpePort.vol) + 9} y={sy(maxSharpePort.ret) - 5} fill={cs.yellow} fontSize={9} fontFamily={mono2}>Max Sharpe ({maxSharpePort.sh.toFixed(2)})</text>}
      </svg>

      {hoveredETF !== null && <div style={{ marginTop: 8, padding: "8px 12px", background: "#1e1e1e", borderRadius: 0, fontSize: 9, color: cs.text, fontFamily: mono2 }}>
        {etfDB[hoveredETF].t} ({etfDB[hoveredETF].n}): {etfDB[hoveredETF].r.toFixed(1)}% return, {etfDB[hoveredETF].v.toFixed(1)}% vol, {etfDB[hoveredETF].d.toFixed(1)}% dividend
      </div>}
    </div>

    {/* Stats Panel */}
    {(maxSharpePort || minVolPort || currentVol > 0) && <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 14 }}>
      {/* Max Sharpe Portfolio */}
      {maxSharpePort && <div style={cardS}>
        <div style={{ fontSize: 10, fontWeight: 700, color: cs.yellow, marginBottom: 8 }}>Max Sharpe Portfolio</div>
        <div style={{ fontSize: 10, fontFamily: mono2 }}>
          <div><span style={{ color: cs.dim, fontSize: 8 }}>Sharpe</span><div style={{ fontSize: 12, fontWeight: 700, color: cs.yellow }}>{maxSharpePort.sh.toFixed(2)}</div></div>
          <div style={{ marginTop: 6 }}><span style={{ color: cs.dim, fontSize: 8 }}>Return</span><div style={{ fontSize: 11, fontWeight: 600 }}>{maxSharpePort.ret.toFixed(1)}%</div></div>
          <div style={{ marginTop: 4 }}><span style={{ color: cs.dim, fontSize: 8 }}>Vol</span><div style={{ fontSize: 11, fontWeight: 600 }}>{maxSharpePort.vol.toFixed(1)}%</div></div>
        </div>
      </div>}

      {/* Min Vol Portfolio */}
      {minVolPort && <div style={cardS}>
        <div style={{ fontSize: 10, fontWeight: 700, color: cs.blue, marginBottom: 8 }}>Min Vol Portfolio</div>
        <div style={{ fontSize: 10, fontFamily: mono2 }}>
          <div><span style={{ color: cs.dim, fontSize: 8 }}>Vol</span><div style={{ fontSize: 12, fontWeight: 700, color: cs.blue }}>{minVolPort.vol.toFixed(1)}%</div></div>
          <div style={{ marginTop: 6 }}><span style={{ color: cs.dim, fontSize: 8 }}>Return</span><div style={{ fontSize: 11, fontWeight: 600 }}>{minVolPort.ret.toFixed(1)}%</div></div>
          <div style={{ marginTop: 4 }}><span style={{ color: cs.dim, fontSize: 8 }}>Sharpe</span><div style={{ fontSize: 11, fontWeight: 600 }}>{minVolPort.sh.toFixed(2)}</div></div>
        </div>
      </div>}

      {/* Current Portfolio */}
      {currentVol > 0 && <div style={cardS}>
        <div style={{ fontSize: 10, fontWeight: 700, color: cs.pink, marginBottom: 8 }}>Current Portfolio</div>
        <div style={{ fontSize: 10, fontFamily: mono2 }}>
          <div><span style={{ color: cs.dim, fontSize: 8 }}>Value</span><div style={{ fontSize: 12, fontWeight: 700, color: cs.pink }}>{fmt$(holdingsVal)}</div></div>
          <div style={{ marginTop: 6 }}><span style={{ color: cs.dim, fontSize: 8 }}>Vol</span><div style={{ fontSize: 11, fontWeight: 600 }}>{currentVol.toFixed(1)}%</div></div>
          <div style={{ marginTop: 4 }}><span style={{ color: cs.dim, fontSize: 8 }}>Return (est)</span><div style={{ fontSize: 11, fontWeight: 600 }}>{currentRet.toFixed(1)}%</div></div>
        </div>
      </div>}
    </div>}
  </div>;
}

// ─── Portfolio vs S&P 500 Performance Tracker ───
const SNAP_KEY = "portfolio_perf_snapshots_v1";
function PortfolioPerf({ etfV, stockV, holdingsVal, totalCostBasis, live, lastF }) {
  const [spyHist, setSpyHist] = React.useState(null);
  const [snapshots, setSnapshots] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Find inception: earliest purchaseDate across all holdings
  const inception = React.useMemo(() => {
    let earliest = null;
    [...(etfV || []), ...(stockV || [])].forEach(h => {
      if (h.purchaseDate && (!earliest || h.purchaseDate < earliest)) earliest = h.purchaseDate;
    });
    return earliest;
  }, [etfV, stockV]);

  // Load snapshots from localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(SNAP_KEY);
      if (raw) setSnapshots(JSON.parse(raw));
    } catch (e) { }
  }, []);

  // Save snapshot on each live price update (max 1 per day)
  React.useEffect(() => {
    if (!lastF || !holdingsVal || holdingsVal <= 0 || !inception || !totalCostBasis || totalCostBasis <= 0) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const spyPrice = live?.["SPY"]?.price;
      setSnapshots(prev => {
        const existing = prev.find(s => s.date === today);
        let next;
        if (existing) {
          next = prev.map(s => s.date === today ? { ...s, value: holdingsVal, spy: spyPrice || s.spy, costBasis: totalCostBasis } : s);
        } else {
          next = [...prev, { date: today, value: holdingsVal, spy: spyPrice || 0, costBasis: totalCostBasis }];
        }
        const cutoff = new Date(Date.now() - 3 * 365 * 86400000).toISOString().slice(0, 10);
        next = next.filter(s => s.date >= cutoff);
        try { localStorage.setItem(SNAP_KEY, JSON.stringify(next)); } catch (e) { }
        return next;
      });
    } catch (e) { console.warn("Snapshot save error:", e); }
  }, [lastF, holdingsVal, totalCostBasis, inception, live]);

  // Fetch SPY history from inception
  React.useEffect(() => {
    if (!inception) return;
    setLoading(true);
    (async () => {
      try {
        const end = new Date().toISOString().slice(0, 10);
        const resp = await fetch(`/api/history?symbols=SPY&start=${inception}&end=${end}`);
        if (resp.ok) {
          const json = await resp.json();
          if (json.data?.SPY?.length > 0) setSpyHist(json.data.SPY);
        }
      } catch (e) { console.warn("SPY history fetch failed:", e); }
      setLoading(false);
    })();
  }, [inception]);

  if (!inception || !holdingsVal || holdingsVal <= 0 || !totalCostBasis || totalCostBasis <= 0) return null;

  // Wrap all computations in try-catch to prevent crashing the entire app
  try {

  const portReturn = ((holdingsVal / totalCostBasis) - 1) * 100;
  if (!isFinite(portReturn)) return null;
  const inceptionDate = new Date(inception);
  if (isNaN(inceptionDate.getTime())) return null;
  const daysSince = Math.floor((Date.now() - inceptionDate.getTime()) / 86400000);
  const yearsSince = daysSince / 365.25;

  let spyReturn = null, spyCAGR = null;
  if (spyHist && spyHist.length >= 2) {
    const spyStart = spyHist[0].close;
    const spyEnd = spyHist[spyHist.length - 1].close;
    if (spyStart > 0) {
      spyReturn = ((spyEnd / spyStart) - 1) * 100;
      if (yearsSince > 0.25) spyCAGR = (Math.pow(spyEnd / spyStart, 1 / yearsSince) - 1) * 100;
    }
  }
  const portCAGR = yearsSince > 0.25 ? (Math.pow(holdingsVal / totalCostBasis, 1 / yearsSince) - 1) * 100 : null;
  const alpha = portReturn != null && spyReturn != null ? portReturn - spyReturn : null;

  // Build chart data: normalize both to 100 at inception
  // SPY line: from monthly history
  // Portfolio line: from snapshots
  const WP = 560, HP = 200, pdP = { t: 20, r: 12, b: 28, l: 45 };
  const wP = WP - pdP.l - pdP.r, hP = HP - pdP.t - pdP.b;

  let spyNorm = [], portNorm = [];
  if (spyHist && spyHist.length >= 2) {
    const spyBase = spyHist[0].close;
    if (spyBase > 0) spyNorm = spyHist.map(p => ({ date: p.date, value: (p.close / spyBase) * 100 }));
  }
  // Portfolio: use cost basis as starting 100, then snapshots, then current
  if (snapshots.length > 0 && totalCostBasis > 0) {
    const firstSnap = snapshots[0];
    const base = firstSnap.costBasis || totalCostBasis;
    if (base > 0) portNorm = snapshots.map(s => ({ date: s.date, value: (s.value / base) * 100 }));
  }
  // Ensure current point is included
  const today = new Date().toISOString().slice(0, 10);
  if (portNorm.length > 0 && portNorm[portNorm.length - 1].date !== today) {
    const base = snapshots[0]?.costBasis || totalCostBasis;
    if (base > 0) portNorm.push({ date: today, value: (holdingsVal / base) * 100 });
  } else if (portNorm.length === 0 && totalCostBasis > 0) {
    portNorm = [
      { date: inception, value: 100 },
      { date: today, value: (holdingsVal / totalCostBasis) * 100 },
    ];
  }

  // Combine all dates for x-axis
  const allDates = [...new Set([...spyNorm.map(p => p.date), ...portNorm.map(p => p.date)])].sort();
  if (allDates.length < 2) return null;
  const dateRange = [allDates[0], allDates[allDates.length - 1]];
  const allVals = [...spyNorm.map(p => p.value), ...portNorm.map(p => p.value)].filter(v => isFinite(v));
  if (allVals.length === 0) return null;
  const minVal = Math.min(80, ...allVals);
  const maxVal = Math.max(120, ...allVals);

  const sx = (date) => pdP.l + ((new Date(date) - new Date(dateRange[0])) / (new Date(dateRange[1]) - new Date(dateRange[0]) || 1)) * wP;
  const sy = (v) => pdP.t + hP - ((v - minVal) / (maxVal - minVal || 1)) * hP;

  const spyLine = spyNorm.map(p => `${sx(p.date)},${sy(p.value)}`).join(" ");
  const portLine = portNorm.map(p => `${sx(p.date)},${sy(p.value)}`).join(" ");

  // Year markers
  const years = [];
  for (const d of allDates) {
    const y = d.slice(0, 4);
    if (!years.length || years[years.length - 1] !== y) years.push(y);
  }

  return <div style={cardS}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 700 }}>Portfolio vs S&P 500</div>
      <div style={{ fontSize: 8, color: cs.dim, fontFamily: mono2 }}>Since {inception} · {daysSince}d ({yearsSince >= 1 ? yearsSince.toFixed(1) + "y" : daysSince + "d"})</div>
    </div>

    {/* Metrics row */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 6, marginBottom: 10 }}>
      <div style={{ background: "#1e1e1e", padding: "8px 10px" }}>
        <div style={{ fontSize: 7, color: cs.dim, fontFamily: mono2 }}>PORTFOLIO RETURN</div>
        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: mono2, color: portReturn >= 0 ? cs.green : cs.red }}>{portReturn >= 0 ? "+" : ""}{portReturn.toFixed(1)}%</div>
        {portCAGR != null && <div style={{ fontSize: 8, color: cs.muted, fontFamily: mono2 }}>{portCAGR.toFixed(1)}% CAGR</div>}
      </div>
      <div style={{ background: "#1e1e1e", padding: "8px 10px" }}>
        <div style={{ fontSize: 7, color: cs.dim, fontFamily: mono2 }}>S&P 500 RETURN</div>
        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: mono2, color: spyReturn != null ? (spyReturn >= 0 ? cs.blue : cs.red) : cs.dim }}>
          {spyReturn != null ? `${spyReturn >= 0 ? "+" : ""}${spyReturn.toFixed(1)}%` : loading ? "..." : "—"}
        </div>
        {spyCAGR != null && <div style={{ fontSize: 8, color: cs.muted, fontFamily: mono2 }}>{spyCAGR.toFixed(1)}% CAGR</div>}
      </div>
      <div style={{ background: "#1e1e1e", padding: "8px 10px" }}>
        <div style={{ fontSize: 7, color: cs.dim, fontFamily: mono2 }}>ALPHA</div>
        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: mono2, color: alpha != null ? (alpha >= 0 ? cs.green : cs.red) : cs.dim }}>
          {alpha != null ? `${alpha >= 0 ? "+" : ""}${alpha.toFixed(1)}%` : "—"}
        </div>
        <div style={{ fontSize: 8, color: cs.muted, fontFamily: mono2 }}>{alpha != null && alpha >= 0 ? "Beating market" : alpha != null ? "Trailing market" : ""}</div>
      </div>
      <div style={{ background: "#1e1e1e", padding: "8px 10px" }}>
        <div style={{ fontSize: 7, color: cs.dim, fontFamily: mono2 }}>COST BASIS</div>
        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: mono2, color: cs.text }}>{fmt$(totalCostBasis)}</div>
        <div style={{ fontSize: 8, color: cs.muted, fontFamily: mono2 }}>→ {fmt$(holdingsVal)} today</div>
      </div>
    </div>

    {/* Chart: both lines normalized to 100 */}
    {(spyNorm.length >= 2 || portNorm.length >= 2) && <>
      <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
        <span style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 3, background: cs.green, display: "inline-block" }} />Portfolio</span>
        <span style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 3, background: cs.blue, display: "inline-block" }} />S&P 500</span>
        <span style={{ fontSize: 8, color: cs.dim }}>Normalized to 100 at inception</span>
      </div>
      <svg width={WP} height={HP} viewBox={`0 0 ${WP} ${HP}`} style={{ overflow: "visible", maxWidth: "100%" }}>
        {/* Grid */}
        {[0, .25, .5, .75, 1].map(f => {
          const yy = pdP.t + hP * (1 - f), val = minVal + f * (maxVal - minVal);
          return <g key={f}><line x1={pdP.l} x2={WP - pdP.r} y1={yy} y2={yy} stroke="#262626" />
            <text x={pdP.l - 4} y={yy + 3} fill={cs.muted} fontSize={8} textAnchor="end" fontFamily={mono2}>{val.toFixed(0)}</text></g>;
        })}
        {/* 100 baseline */}
        <line x1={pdP.l} x2={WP - pdP.r} y1={sy(100)} y2={sy(100)} stroke={cs.dim} strokeDasharray="3,3" strokeWidth={0.5} />
        {/* Year labels */}
        {years.filter((_, i) => i % Math.ceil(years.length / 8) === 0).map(y => (
          <text key={y} x={sx(`${y}-07-01`)} y={HP - 6} fill={cs.muted} fontSize={8} textAnchor="middle" fontFamily={mono2}>{y}</text>
        ))}
        {/* Lines */}
        {spyLine && <polyline points={spyLine} fill="none" stroke={cs.blue} strokeWidth={1.5} opacity={.7} />}
        {portLine && <polyline points={portLine} fill="none" stroke={cs.green} strokeWidth={2} />}
        {/* End dots */}
        {spyNorm.length > 0 && <circle cx={sx(spyNorm[spyNorm.length-1].date)} cy={sy(spyNorm[spyNorm.length-1].value)} r={3} fill={cs.blue} />}
        {portNorm.length > 0 && <circle cx={sx(portNorm[portNorm.length-1].date)} cy={sy(portNorm[portNorm.length-1].value)} r={3} fill={cs.green} />}
      </svg>
      <div style={{ fontSize: 7, color: cs.dim, textAlign: "center", marginTop: 4 }}>
        Chart builds over time as daily snapshots accumulate · SPY data from Yahoo Finance (adjusted close, includes dividends)
      </div>
    </>}
  </div>;

  } catch (e) {
    console.warn("PortfolioPerf render error:", e);
    return null;
  }
}

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
      else if (m[4]) parts.push(<code key={m.index} style={{ background: "rgba(66,190,101,.1)", color: cs.green, padding: "1px 5px", borderRadius: 0, fontSize: 10, fontFamily: mono2 }}>{m[4]}</code>);
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
      elements.push(<hr key={i} style={{ border: "none", borderTop: "1px solid #393939", margin: "12px 0" }} />);
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
          <div key={`tbl-${i}`} style={{ margin: "8px 0", overflowX: "auto", borderRadius: 0, border: "1px solid #393939" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
              <thead>
                <tr style={{ background: "rgba(66,190,101,.06)" }}>
                  {header.map((h, ci) => <th key={ci} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: cs.green, borderBottom: "1px solid #393939", fontFamily: mono2, fontSize: 9 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 ? "rgba(255,255,255,.01)" : "transparent" }}>
                    {row.map((cell, ci) => <td key={ci} style={{ padding: "5px 10px", borderBottom: "1px solid #222222", color: cs.text }}>{fmt(cell)}</td>)}
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

const TABS = ["My Portfolio", "Deploy Cash", "Portfolio Analysis", "Regime Analysis", "Frontier", "AI Advisor", "Backtest"];
// ═══ MAIN APP ═══
export default function App() {
  const [etfs, setEtfs] = useState([]);       // {ticker, data, shares, costBasis, mktValue}
  const [stocks, setStocks] = useState([]);    // {ticker, name, shares, costBasis, mktValue, sector, locked:true}
  const [cashBalance, setCashBalance] = useState(0); // $ to deploy

  const [tab, setTab] = useState("My Portfolio");
  const [sq, setSq] = useState(""); const [so, setSo] = useState(false); const [sc, setSc] = useState("All");
  const [srMode, setSrMode] = useState("std"); // "std" | "var" | "vol2"
  const [ot, setOt] = useState("max_sharpe");
  const [volTarget, setVolTarget] = useState(0);  // 0 = off, otherwise target vol %
  const [useKelly, setUseKelly] = useState(true); // Half Kelly toggle
  const [useRegime, setUseRegime] = useState(true); // Regime-adaptive toggle
  const [taxState, setTaxState] = useState("None"); // State for tax calc
  const [includeStocks, setIncludeStocks] = useState(false); // ETF+Stocks toggle
  const [optResult, setOptResult] = useState(null);
  const [optRunning, setOptRunning] = useState(false);
  const [recPrices, setRecPrices] = useState({}); // cached live prices for optimizer recommendations
  const [lastRegimeCtx, setLastRegimeCtx] = useState(null); // regime context used by last optimizer run
  const [aiText, setAiText] = useState(""); const [aiL, setAiL] = useState(false); const [aiCtx, setAiCtx] = useState("deploy");
  const [live, setLive] = useState({}); const [liveL, setLiveL] = useState(false); const [lastF, setLastF] = useState(null);
  const [sf, setSf] = useState({ t: "", n: "", sh: "", cb: "", sec: "Technology", pd: "" });
  const [stockDD, setStockDD] = useState(false); const [stockResults, setStockResults] = useState([]);
  const [stockSearching, setStockSearching] = useState(false); const [stockTimer, setStockTimer] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addType, setAddType] = useState("stock"); // "stock" or "etf"
  const [accepted, setAccepted] = useState(new Set()); // tickers accepted from optimizer
  const [rebalAnalysis, setRebalAnalysis] = useState(null); // full rebalance analysis result
  const [rebalRunning, setRebalRunning] = useState(false);

  // ── Backtest state ──
  const [btRunning, setBtRunning] = useState(false);
  const [btProgress, setBtProgress] = useState("");
  const [btResult, setBtResult] = useState(null);
  const [btStartCash, setBtStartCash] = useState(100000);
  const [btExpandedYear, setBtExpandedYear] = useState(null);
  const [simRunning, setSimRunning] = useState(false);
  const [simProgress, setSimProgress] = useState("");
  const [simResult, setSimResult] = useState(null);

  // ── Regime state ──
  const [regimeData, setRegimeData] = useState(null);
  const [regimeLoading, setRegimeLoading] = useState(false);
  const [regimeError, setRegimeError] = useState("");
  const [regimeAnalytics, setRegimeAnalytics] = useState(null);
  const [hmmResult, setHmmResult] = useState(null);
  const [hmmLoading, setHmmLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // ── Mobile Responsiveness ──
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

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

  // ── Run HMM + BOCPD + Ensemble on regime history data ──
  const runHmmAnalysis = useCallback(async () => {
    setHmmLoading(true);
    try {
      // Retry up to 2 times on failure (FRED API can be slow/flaky)
      let json = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const resp = await fetch("/api/regime?history=true");
          if (!resp.ok) { console.warn(`HMM fetch attempt ${attempt + 1} failed: ${resp.status}`); continue; }
          json = await resp.json();
          if (json.monthlyRegimes?.length) break;
          console.warn(`HMM fetch attempt ${attempt + 1}: no monthly regimes in response`, json.errors || "");
        } catch (e) { console.warn(`HMM fetch attempt ${attempt + 1} error:`, e.message); }
        if (attempt < 1) await new Promise(r => setTimeout(r, 2000)); // wait 2s before retry
      }
      if (!json?.monthlyRegimes?.length) { console.warn("HMM: no historical regime data after retries"); setHmmLoading(false); return; }

      const months = json.monthlyRegimes.sort((a, b) => a.date.localeCompare(b.date));
      // Extract composite scores from FRED data (use the pre-computed score field)
      const composite = months.map(m => m.score ?? 0);
      const dates = months.map(m => m.date);

      if (composite.length < 30) { setHmmLoading(false); return; }

      // Train HMM
      const model = hmmTrain(composite, 40);

      // Get filtered probabilities (real-time, causal)
      const filtered = hmmFilter(composite, model);

      // BOCPD change-point detection
      const cpProb = runBOCPD(composite);

      // Ensemble fusion
      const ensembleProbs = runEnsemble(filtered, cpProb);

      // Current state
      const currentFiltered = filtered[filtered.length - 1];
      const currentEnsemble = ensembleProbs[ensembleProbs.length - 1];
      const hmmRegimeIdx = currentFiltered.indexOf(Math.max(...currentFiltered));
      const ensRegimeIdx = currentEnsemble.indexOf(Math.max(...currentEnsemble));

      // Viterbi-like: take MAP state at each time step for regime history
      const regimePath = filtered.map(p => p.indexOf(Math.max(...p)));

      // Forecast (12 months ahead)
      const forecast = hmmForecast(currentEnsemble, model.A, 12);

      // Expected durations
      const expDurations = model.A.map((row, i) => 1 / (1 - row[i] + 1e-300));

      // Regime-conditional return stats (using composite as proxy)
      const condStats = HMM_REGIMES.map((r, ri) => {
        const vals = composite.filter((_, t) => regimePath[t] === ri);
        if (vals.length < 3) return { ...r, meanScore: 0, count: 0, pctTime: 0 };
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        return { ...r, meanScore: mean, count: vals.length, pctTime: vals.length / composite.length };
      });

      // Build alerts
      const alerts = [];
      const lastCP = cpProb[cpProb.length - 1];
      if (lastCP > 0.2) alerts.push({ source: "Change-Point", message: `CP probability ${(lastCP*100).toFixed(0)}% — regime transition may be underway`, severity: lastCP > 0.5 ? "high" : "medium" });
      if (hmmRegimeIdx !== ensRegimeIdx) alerts.push({ source: "Ensemble", message: `HMM → ${HMM_REGIMES[hmmRegimeIdx].name} vs Ensemble → ${HMM_REGIMES[ensRegimeIdx].name}`, severity: "medium" });

      // Build timeline for display (downsample if needed)
      const step = Math.max(1, Math.floor(dates.length / 120));
      const timeline = [];
      for (let i = 0; i < dates.length; i += step) {
        const entry = { date: dates[i], composite: composite[i], cpProb: cpProb[i], regime: regimePath[i] };
        HMM_REGIMES.forEach((r, ri) => { entry[`p_${r.name}`] = filtered[i][ri]; entry[`e_${r.name}`] = ensembleProbs[i][ri]; });
        timeline.push(entry);
      }

      setHmmResult({
        model,
        currentHMM: { idx: hmmRegimeIdx, probs: currentFiltered, name: HMM_REGIMES[hmmRegimeIdx].name, color: HMM_REGIMES[hmmRegimeIdx].color },
        currentEnsemble: { idx: ensRegimeIdx, probs: currentEnsemble, name: HMM_REGIMES[ensRegimeIdx].name, color: HMM_REGIMES[ensRegimeIdx].color },
        state5: hmmToState5(currentEnsemble),  // maps to optimizer-compatible state5
        forecast,
        expDurations,
        condStats,
        alerts,
        timeline,
        cpProb,
        transMatrix: model.A,
        agreement: hmmRegimeIdx === ensRegimeIdx,
        dates,
      });
    } catch (e) { console.warn("HMM analysis failed:", e); }
    setHmmLoading(false);
  }, []);

  const didHydrate = useRef(false);

  // ── Auto-fetch regime data on mount ──
  const didFetchRegime = useRef(false);
  useEffect(() => {
    if (didFetchRegime.current) return;
    didFetchRegime.current = true;
    // Fetch both live regime and full analytics in parallel on app launch
    fetchRegime();
    fetchRegimeAnalytics();
    runHmmAnalysis();
  }, [fetchRegime, fetchRegimeAnalytics, runHmmAnalysis]);

  // ── Backtest runner ──
  const runBacktest = useCallback(async () => {
    setBtRunning(true); setBtResult(null); setBtProgress("Fetching historical data..."); setBtExpandedYear(null);

    // ── Fetch historical regime data from FRED (if regime enabled) ──
    let historicalRegimes = null;
    if (useRegime) {
      setBtProgress("Fetching historical regime data from FRED (12 macro series)...");
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

    // ── Prepare HMM data arrays for INCREMENTAL training during backtest ──
    // NO full-history training here — that would be look-ahead bias.
    // Instead, we prepare the raw score arrays and retrain periodically in the loop.
    let btHmmAllScores = null, btHmmAllDates = null, btHmmDateToIdx = {};
    let btHmmModel = null, btHmmEnsembleMap = {}; // date → ensemble probs
    let lastHmmBuildDate = null;
    if (historicalRegimes) {
      try {
        const regEntries = Object.entries(historicalRegimes).sort((a, b) => a[0].localeCompare(b[0]));
        btHmmAllScores = regEntries.map(([, r]) => r.score ?? 0);
        btHmmAllDates = regEntries.map(([d]) => d);
        btHmmAllDates.forEach((d, i) => { btHmmDateToIdx[d] = i; });
        setBtProgress(`Prepared ${btHmmAllScores.length} months of FRED scores for incremental HMM. Fetching ETF prices...`);
      } catch (e) { console.warn("HMM data prep failed:", e); }
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
      "HDV","DGRO",
    ];
    const benchmarks = ["SPY"];
    // For stocks: use historical S&P 500 top 30 by year (no survivorship bias)
    const btStocks = includeStocks ? SP500_ALL_TICKERS : [];

    const allSymbols = [...new Set([...btETFs, ...benchmarks, ...btStocks])];
    setBtProgress(`Fetching ${allSymbols.length} symbols (2005-2025)...`);

    let histData = {};
    try {
      // Fetch in large batches — Yahoo Finance has no rate limit
      for (let i = 0; i < allSymbols.length; i += 15) {
        const batch = allSymbols.slice(i, i + 15);
        setBtProgress(`Fetching batch ${Math.floor(i/15)+1}/${Math.ceil(allSymbols.length/15)}: ${batch.join(", ")}...`);
        const resp = await fetch(`/api/history?symbols=${batch.join(",")}&start=2005-01-01&end=2025-12-31`);
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
    const optCurve = [{ date: "2006-01", value: startCash }];
    const spyCurve = [{ date: "2006-01", value: startCash }];
    const bal60Curve = [{ date: "2006-01", value: startCash }];
    let optValue = startCash, spyValue = startCash, bal60Value = startCash;
    let optAlloc = {};
    let costBasisMap = {}; // ticker → total dollar cost basis (actual purchase cost)
    let sharesMap = {}; // ticker → shares held
    let costPerShareMap = {}; // ticker → average cost per share
    let posEstablishedMap = {}; // ticker → monthKey when position was first established/last increased
    let totalTaxPaid = 0, totalRebalances = 0;
    let totalTaxSaved = 0; // tax saved via loss offsets
    let lossCarryover = 0; // unused losses carried forward to future periods
    let annualOrdinaryOffsetUsed = 0; // track $3k/year ordinary income offset
    let lastOffsetYear = 0; // reset tracker each calendar year
    let lastRebalanceMonth = null;
    let lastBestWeights = null; // for warm-starting optimizer
    const btTaxRates = getTaxRates(taxState);
    const rebalanceEvents = [];
    const etfDbMap = {}; ETF_DB.forEach(e => { etfDbMap[e.t] = e; }); STOCK_OPT.forEach(s => { etfDbMap[s.t] = s; });
    // Only simulate months where SPY data actually exists
    const spyDates = new Set(Object.keys(returnsByDateSym).filter(k => returnsByDateSym[k]["SPY"]));
    const simDates = sortedDates.filter(d => d >= "2006-01" && d <= "2025-12" && spyDates.has(d));

    // ── Build regime-duration-return model from historical data ──
    // IMPORTANT: To avoid forward-looking bias, we build this INCREMENTALLY during the backtest.
    // Each evaluation only uses data up to 12 months before the current month.
    // The model is rebuilt periodically (every 12 months) for efficiency.
    let regimeDurModel = null;
    let lastModelBuildDate = null;

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
          btState5 = regData.state5 || null; btRegimeScore = regData.score; btAcceleration = regData.acceleration ?? null;
          const regime3 = regData.regime; btDuration = 1;
          for (let lb = 1; lb <= 36 && mIdx - lb >= 0; lb++) {
            const prev = historicalRegimes[sortedDates[mIdx - lb]];
            if (prev && prev.regime === regime3) btDuration++; else { if (prev) btTransition = `${prev.regime}→${regime3}`; break; }
          }
          btRegime = { state5: btState5 || regime3, acceleration: btAcceleration || 0, duration: btDuration, transition: btTransition,
            threeStage: computeThreeStageCtx(historicalRegimes, sortedDates, mIdx),
            volSignal: regData?.volSignal || 0,
            vixInversion: regData?.vixInversion || false };
          if (mi > 0) { const prevReg = historicalRegimes[simDates[mi - 1]]; if (prevReg && prevReg.regime !== regime3) regimeChanged = true; }

          // ── HMM ensemble overlay (conservative fusion, same logic as live optimizer) ──
          // Uses incrementally-trained HMM — only past data, no look-ahead
          if (btHmmEnsembleMap[monthKey]) {
              const ensProbs = btHmmEnsembleMap[monthKey];
              const hmmState5 = hmmToState5(ensProbs);
              const fredState5 = btRegime.state5;
              const riskOrder = ["strong_risk_off", "mild_risk_off", "neutral", "mild_risk_on", "strong_risk_on"];
              const fredRisk = riskOrder.indexOf(fredState5);
              const hmmRisk = riskOrder.indexOf(hmmState5);
              if (fredRisk >= 0 && hmmRisk >= 0) {
                btRegime.state5 = riskOrder[Math.min(fredRisk, hmmRisk)];
              }
              btRegime.hmmState5 = hmmState5;
              btRegime.hmmProbs = ensProbs;
              // Detect regime change from HMM perspective too
              const prevMonth = mi > 0 ? simDates[mi - 1] : null;
              if (prevMonth && btHmmEnsembleMap[prevMonth]) {
                const prevHmmState = hmmToState5(btHmmEnsembleMap[prevMonth]);
                if (prevHmmState !== hmmState5) regimeChanged = true;
              }
          }
        }
      }
      // ── Signal-driven rebalance triggers with confirmation requirement ──
      // Require 2+ signals OR a regime change to trigger rebalance (reduces whipsaw)
      let shouldEvaluate = isFirstAllocation;

      if (!shouldEvaluate && useRegime && historicalRegimes) {
        const regData = historicalRegimes[monthKey];

        // Regime change is strong enough to trigger alone
        if (regimeChanged) shouldEvaluate = true;

        // For other signals, count confirmations — need 2+ to trigger
        if (!shouldEvaluate) {
          let signalCount = 0;

          // Signal 1: Stress acceleration crossover (raised threshold from 0.3 to 0.5)
          if (regData && Math.abs(regData.stressAcceleration || 0) >= 0.5) signalCount++;

          // Signal 2: Volatility regime shift (not just any change — only meaningful ones)
          if (mi > 0) {
            const prevReg = historicalRegimes[simDates[mi - 1]];
            const volShift = regData?.volRegime !== prevReg?.volRegime;
            const meaningfulShift = volShift && (
              (prevReg?.volRegime === "compression" && regData?.volRegime === "expansion") ||
              (prevReg?.volRegime === "normal" && regData?.volRegime === "elevated") ||
              (prevReg?.volRegime === "elevated" && regData?.volRegime === "normal")
            );
            if (meaningfulShift) signalCount++;
          }

          // Signal 3: VIX inversion (tilt modifier only, counts toward confirmation but doesn't trigger alone)
          if (regData?.vixInversion) signalCount++;

          // Need 2+ confirming signals to trigger a non-quarterly rebalance
          if (signalCount >= 2) shouldEvaluate = true;
        }

        // Quarterly fallback (only if no signal-driven trigger recently)
        if (!shouldEvaluate && mMonth % 3 === 0 && monthsSinceRebal >= 2) shouldEvaluate = true;
      } else if (!shouldEvaluate) {
        // No regime data: fall back to quarterly
        if (mMonth % 3 === 0) shouldEvaluate = true;
      }

      // Minimum cooldown: 2 months between rebalances (balance patience vs responsiveness)
      if (!isFirstAllocation && monthsSinceRebal < 2) shouldEvaluate = false;

      if (!shouldEvaluate) continue;
      // Yield to UI every evaluation to prevent freeze
      setBtProgress(`Evaluating ${monthKey}...`);
      await new Promise(r => setTimeout(r, 0));

      // Step 3: Trailing stats with RECENCY WEIGHTING + RETURN SHRINKAGE
      // Recent months matter more than old months to avoid momentum whipsaw
      // (e.g., Jan 2021 still seeing the March-Dec 2020 rocket with equal weight)
      const trailingStats = {};
      const trailStart = Math.max(0, mIdx - 12);
      for (const sym of available) {
        let sumWRet = 0, sumW = 0, sumRet = 0, sumRetSq = 0, count = 0;
        for (let ti = trailStart; ti < mIdx; ti++) {
          const entry = returnsByDateSym[sortedDates[ti]]?.[sym];
          if (entry) {
            const age = mIdx - 1 - ti;
            const w = Math.exp(-0.05 * age);
            sumWRet += w * entry.ret;
            sumW += w;
            sumRet += entry.ret;
            sumRetSq += entry.ret * entry.ret;
            count++;
          }
        }
        if (count < 6) continue;
        const wAvgMo = sumWRet / sumW;
        const rawR = wAvgMo * 12 * 100;
        const db = etfDbMap[sym];
        const isStk = db?.type === "stock";
        const shrunkR = shrinkReturn(rawR, isStk);
        const vol = Math.max(Math.sqrt(Math.max(0, sumRetSq / count - (sumRet/count) * (sumRet/count))) * Math.sqrt(12) * 100, 1);
        trailingStats[sym] = { t: sym, n: db?.n || sym, c: db?.c || "US Large Cap", r: shrunkR, v: vol, er: db?.er || 0.1, d: db?.d || 0, lev: db?.lev || null, type: db?.type || "etf", ipo: db?.ipo };
      }
      const isBullish = btState5 && (btState5.includes("risk_on"));
      // In bull markets: exclude assets below -50% (likely broken).
      // In bear/neutral: relax to -80% so crash recovery candidates remain accessible.
      const returnFloor = isBullish ? -50 : -80;

      // ── Compute multi-factor scores ──
      computeFactorScores(returnsByDateSym, sortedDates, mIdx, trailingStats, etfDbMap);

      // ── Compute relative value signals ──
      const relValSignals = computeRelativeValue(returnsByDateSym, sortedDates, mIdx, trailingStats);
      for (const sym of Object.keys(trailingStats)) {
        trailingStats[sym].relValue = relValSignals[sym] || 0;
      }

      // ── Compute realized portfolio vol for dynamic vol targeting ──
      if (btRegime && Object.keys(optAlloc).length > 0) {
        let portVarSum = 0;
        const recentRets = [];
        for (let rv = Math.max(0, mIdx - 6); rv < mIdx; rv++) {
          const md = returnsByDateSym[sortedDates[rv]];
          if (!md) continue;
          let mRet = 0;
          for (const [sym, wt] of Object.entries(optAlloc)) {
            if (md[sym]) mRet += wt * md[sym].ret;
          }
          recentRets.push(mRet);
        }
        if (recentRets.length >= 3) {
          const rm = recentRets.reduce((a, b) => a + b, 0) / recentRets.length;
          const rv = recentRets.reduce((a, r) => a + (r - rm) ** 2, 0) / recentRets.length;
          btRegime.realizedVol = Math.sqrt(rv) * Math.sqrt(12) * 100; // annualized
        }
      }

      const allCandidates = Object.values(trailingStats).filter(s => {
        if (s.t === "SPY" || s.v <= 0 || s.r <= returnFloor) return false;
        // For stocks: only include if it was a sector leader for this year
        const db = etfDbMap[s.t];
        if (db?.type === "stock") {
          const yearStocks = getStocksForYear(mYear);
          if (!yearStocks.includes(s.t)) return false;
        }
        return true;
      });
      // ── Tiered candidate selection ──
      // Sort by blended score: 60% Sharpe-like + 40% composite factor score
      // This diversifies the signal away from pure momentum
      const sortScore = (s) => {
        const sharpe = (s.r - 4) / (s.v || 1);
        const factor = s.factorScore ?? 0.5;
        return sharpe * 0.60 + factor * 3.0 * 0.40; // scale factor to comparable range
      };
      // Bull markets: top 50 by blended score — momentum + factor quality
      // Bear/neutral: ALL candidates — diversification matters most
      let candidates;
      if (isBullish) {
        candidates = allCandidates.sort((a, b) => sortScore(b) - sortScore(a)).slice(0, 50);
      } else {
        const sorted = allCandidates.sort((a, b) => sortScore(b) - sortScore(a));
        candidates = [...sorted]; // all candidates
      }
      if (candidates.length < 3) continue;

      // Scale iterations to candidate pool: more candidates → more iterations needed for coverage
      const btIterations = candidates.length > 80 ? 600 : candidates.length > 40 ? 400 : 300;
      setBtProgress(`${monthKey}: ${isBullish ? "bull" : "bear/neutral"} → ${candidates.length} candidates, ${btIterations} iterations`);

      // Rebuild regime-duration model periodically (every 12 months) using only PAST data
      // This prevents forward-looking bias: the model at 2008-10 only knows data up to 2007-10
      if (historicalRegimes && (!lastModelBuildDate || mIdx - dateToIdx[lastModelBuildDate] >= 12)) {
        const cutoffIdx = Math.max(0, mIdx - 6); // 6-month gap to prevent leakage
        if (cutoffIdx > 24) {
          regimeDurModel = buildRegimeDurationModel(historicalRegimes, sortedDates, returnsByDateSym, cutoffIdx);
          lastModelBuildDate = monthKey;
        }
      }

      // ── Incremental HMM training: retrain every 12 months on PAST data only ──
      // At 2008-01, the HMM has only seen data up to 2007-10 (3-month gap).
      // This prevents any future information from leaking into regime classifications.
      if (btHmmAllScores && (!lastHmmBuildDate || mIdx - (dateToIdx[lastHmmBuildDate] || 0) >= 12)) {
        const hmmCutoffIdx = btHmmDateToIdx[monthKey];
        if (hmmCutoffIdx != null) {
          const pastCutoff = Math.max(0, hmmCutoffIdx - 3); // 3-month gap to prevent leakage
          if (pastCutoff > 36) { // need at least 36 months to train meaningfully
            try {
              const pastScores = btHmmAllScores.slice(0, pastCutoff);
              btHmmModel = hmmTrain(pastScores, 30);
              const pastFiltered = hmmFilter(pastScores, btHmmModel);
              const pastCP = runBOCPD(pastScores);
              const pastEnsemble = runEnsemble(pastFiltered, pastCP);
              // Store ensemble probs for each past date
              for (let k = 0; k < pastCutoff; k++) {
                btHmmEnsembleMap[btHmmAllDates[k]] = pastEnsemble[k];
              }
              lastHmmBuildDate = monthKey;
            } catch (e) { /* HMM training failed for this window, continue */ }
          }
        }
      }
      // Update btRegime with current model
      if (btRegime) btRegime.durationModel = regimeDurModel;

      // Step 4: Optimizer (btIterations scaled to candidate pool size)
      // Build warm-start weights: map previous best allocation to current candidate indices
      let warmWeights = null;
      if (lastBestWeights) {
        warmWeights = new Float64Array(candidates.length);
        for (let i = 0; i < candidates.length; i++) {
          warmWeights[i] = lastBestWeights[candidates[i].t] || 0;
        }
      }
      const result = optimizeCash([], optValue, 0, candidates, ot, srMode, volTarget, useKelly, btRegime, btIterations, warmWeights);
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
      const monthPrices = returnsByDateSym[monthKey] || {};
      const trades = allTkrs.map(ticker => {
        const ow = prevAlloc[ticker] || 0, nw = newAlloc[ticker] || 0, ch = nw - ow;
        if (Math.abs(ch) < 0.005) return null;
        const rc = result.find(r => r.ticker === ticker);
        const closePrice = monthPrices[ticker]?.close || 0;
        const action = ch > 0.005 ? "BUY" : "SELL";
        const tradeDollars = Math.abs(ch) * optValue;
        const tradeShares = closePrice > 0 ? +(tradeDollars / closePrice).toFixed(2) : 0;

        // Per-trade cost basis and G/L (for sells)
        let costPerShare = 0, tradeGL = 0;
        if (action === "SELL" && ow > 0) {
          costPerShare = costPerShareMap[ticker] || 0;
          if (costPerShare > 0 && closePrice > 0) {
            tradeGL = +((closePrice - costPerShare) * tradeShares).toFixed(0);
          }
        }

        return {
          ticker, name: rc?.name || candidates.find(c => c.t === ticker)?.n || ticker,
          cat: rc?.cat || candidates.find(c => c.t === ticker)?.c || "",
          oldWt: +(ow * 100).toFixed(1), newWt: +(nw * 100).toFixed(1), change: +(ch * 100).toFixed(1),
          action, dollars: tradeDollars,
          price: closePrice > 0 ? +closePrice.toFixed(2) : null,
          shares: tradeShares,
          costPerShare: action === "SELL" && costPerShare > 0 ? +costPerShare.toFixed(2) : null,
          gl: action === "SELL" ? tradeGL : null,
        };
      }).filter(Boolean).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

      // Compute realized gains AND losses using ACTUAL cost basis with per-position LT/ST rates
      let grossGains = 0, grossLosses = 0;
      let stGains = 0, ltGains = 0; // track ST vs LT gains separately for accurate tax
      for (const sell of trades.filter(t => t.action === "SELL")) {
        const ticker = sell.ticker;
        const oldWt = prevAlloc[ticker] || 0;
        if (oldWt <= 0) continue;
        const sellWt = Math.abs(sell.change / 100);
        const proportionSold = Math.min(1, sellWt / oldWt);
        const sellProceeds = sellWt * optValue;
        const positionCostBasis = costBasisMap[ticker] || 0;
        const soldCostBasis = positionCostBasis * proportionSold;
        const gl = sellProceeds - soldCostBasis;
        // Per-position holding period: months since position was established
        const estMonth = posEstablishedMap[ticker];
        const posHoldingMonths = estMonth ? (dateToIdx[monthKey] - dateToIdx[estMonth]) : monthsSinceRebal;
        const isLongTerm = posHoldingMonths >= 12;
        if (gl > 0) { grossGains += gl; if (isLongTerm) ltGains += gl; else stGains += gl; }
        else grossLosses += Math.abs(gl);
      }

      // Tax computation: per-position ST/LT rates
      // ST gains taxed at ST rate, LT gains at LT rate (after loss offsets)
      // Losses offset ST gains first (most tax-efficient), then LT gains
      const stLosses = Math.min(grossLosses + lossCarryover, stGains);
      const netStGains = Math.max(0, stGains - stLosses);
      const remainingLosses = Math.max(0, (grossLosses + lossCarryover) - stGains);
      const netLtGains = Math.max(0, ltGains - remainingLosses);
      const netGains = netStGains + netLtGains;
      const excessLosses = Math.max(0, (grossLosses + lossCarryover) - grossGains);
      // $3,000/year ordinary income offset — track annual usage (IRS annual limit, not per-rebalance)
      if (mYear !== lastOffsetYear) { annualOrdinaryOffsetUsed = 0; lastOffsetYear = mYear; }
      const remainingAnnualOffset = Math.max(0, 3000 - annualOrdinaryOffsetUsed);
      const ordinaryIncomeOffset = Math.min(excessLosses, remainingAnnualOffset);
      annualOrdinaryOffsetUsed += ordinaryIncomeOffset;
      const ordinaryTaxSaved = ordinaryIncomeOffset * (btTaxRates.st / 100);
      const newCarryover = excessLosses - ordinaryIncomeOffset;

      // Blended tax: ST gains at ST rate + LT gains at LT rate
      const grossTax = stGains * (btTaxRates.st / 100) + ltGains * (btTaxRates.lt / 100);
      const netTax = netStGains * (btTaxRates.st / 100) + netLtGains * (btTaxRates.lt / 100);
      const taxSaved = grossTax - netTax + ordinaryTaxSaved;
      const estTC = netTax;
      const tcPct = optValue > 0 ? (estTC / optValue) * 100 : 0;
      const appRate = (stGains + ltGains) > 0 ? (estTC / (netGains || 1)) * 100 : btTaxRates.lt; // blended effective rate for display

      // Step 7: Decision — rebalance if improvement justifies costs
      const retImp = propExpRet - currExpRet; const curAlpha = currExpRet - spyExpRet;

      // Turnover cost: light penalty for portfolio churn
      let turnoverPct = 0;
      for (const [ticker, newWt] of Object.entries(newAlloc)) {
        turnoverPct += Math.abs(newWt - (prevAlloc[ticker] || 0));
      }
      for (const ticker of prevTickers) {
        if (!newAlloc[ticker]) turnoverPct += prevAlloc[ticker] || 0;
      }
      turnoverPct *= 50;

      // ── Transaction cost model: spread + market impact ──
      const txCosts = computeTransactionCosts(prevAlloc, newAlloc, optValue, etfDbMap);
      const txCostPct = txCosts.totalCostPct;

      // Hurdle: tax cost + transaction costs × multiplier, with 1.5% minimum floor
      const taxHurdle = isFirstAllocation ? -999 :
        btTransition && btTransition.startsWith("bear→") && btDuration >= 2 && btDuration <= 8 ? tcPct * 0.5 :
        curAlpha > 3 ? tcPct * 2.0 :
        curAlpha < -2 ? tcPct * 0.8 :
        tcPct * 1.2;
      const minFloor = isFirstAllocation ? -999 : 1.5;
      const hurdle = Math.max(taxHurdle, minFloor) + turnoverPct * 0.01 + txCostPct;

      if (isFirstAllocation || retImp > hurdle) {
        // Deduct tax AND transaction costs BEFORE computing new cost basis
        const postTaxValue = optValue - estTC - txCosts.totalCostDollars;

        // ── Update cost basis, shares, and cost-per-share maps ──
        const newCostBasis = {}, newShares = {}, newCostPerShare = {}, newPosEstablished = {};
        const monthPrices2 = returnsByDateSym[monthKey] || {};
        for (const [ticker, newWt] of Object.entries(newAlloc)) {
          if (newWt <= 0.005) continue;
          const closePrice = monthPrices2[ticker]?.close || 0;
          const oldWt = prevAlloc[ticker] || 0;
          if (oldWt <= 0.005) {
            // New position: buying at current close price
            const dollars = newWt * postTaxValue;
            newCostBasis[ticker] = dollars;
            newShares[ticker] = closePrice > 0 ? dollars / closePrice : 0;
            newCostPerShare[ticker] = closePrice;
            newPosEstablished[ticker] = monthKey; // track when position was established
          } else if (newWt <= oldWt) {
            // Reduced/kept position: proportional
            const proportionKept = newWt / oldWt;
            newCostBasis[ticker] = (costBasisMap[ticker] || 0) * proportionKept;
            newShares[ticker] = (sharesMap[ticker] || 0) * proportionKept;
            newCostPerShare[ticker] = costPerShareMap[ticker] || closePrice;
            newPosEstablished[ticker] = posEstablishedMap[ticker] || monthKey; // preserve original establishment date
          } else {
            // Increased position: old basis + new at current price
            const addedWt = newWt - oldWt;
            const addedDollars = addedWt * postTaxValue;
            const addedShares = closePrice > 0 ? addedDollars / closePrice : 0;
            const oldShares = sharesMap[ticker] || 0;
            const totalShares = oldShares + addedShares;
            newCostBasis[ticker] = (costBasisMap[ticker] || 0) + addedDollars;
            newShares[ticker] = totalShares;
            newCostPerShare[ticker] = totalShares > 0 ? newCostBasis[ticker] / totalShares : closePrice;
            newPosEstablished[ticker] = monthKey; // reset establishment date (new lot at higher cost)
          }
        }

        optAlloc = newAlloc; optValue = postTaxValue; totalTaxPaid += estTC; totalTaxSaved += taxSaved; totalRebalances++; lastRebalanceMonth = monthKey;
        costBasisMap = newCostBasis; sharesMap = newShares; costPerShareMap = newCostPerShare; posEstablishedMap = newPosEstablished;
        lossCarryover = newCarryover;
        rebalanceEvents.push({ date: monthKey, decision: "REBALANCE", holdings: result.map(r => ({ ticker: r.ticker, name: r.name, cat: r.cat, weight: +((newAlloc[r.ticker] || 0) * 100).toFixed(1), dollars: Math.round((newAlloc[r.ticker] || 0) * optValue) })).filter(h => h.weight > 0).sort((a, b) => b.weight - a.weight), trades,
          taxPaid: Math.round(estTC), grossTax: Math.round(grossTax), taxSaved: Math.round(taxSaved),
          grossGains: Math.round(grossGains), grossLosses: Math.round(grossLosses), realizedGains: Math.round(netGains),
          stGains: Math.round(stGains), ltGains: Math.round(ltGains),
          lossOffset: Math.round(Math.max(0, grossGains - netGains)), lossCarryover: Math.round(newCarryover),
          returnImprovement: +retImp.toFixed(1), taxCostPct: +tcPct.toFixed(2), currAlpha: +curAlpha.toFixed(1), taxRate: +appRate.toFixed(1), taxType: stGains > ltGains ? "ST-heavy" : ltGains > stGains ? "LT-heavy" : "Blended", regime: btState5, regimeScore: btRegimeScore, acceleration: btAcceleration, duration: btDuration, transition: btTransition,
          fwdSignal: regimeDurModel ? getRegimeDurationFwd(regimeDurModel, btState5 || "neutral", btDuration) : null,
          threeStage: btRegime?.threeStage ? { pattern: btRegime.threeStage.pattern, type: btRegime.threeStage.patternType, signal: btRegime.threeStage.patternSignal, bridgeDur: btRegime.threeStage.bridgeDuration, effDur: btRegime.threeStage.effectiveDuration } : null,
          candidateCount: candidates.length, iterations: btIterations });
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

      // Get regime at year-end from actual FRED data (independent of random rebalance timing)
      let yearEndState5 = null, yearEndRegimeScore = null, yearEndAcceleration = null, yearEndDuration = 0, yearEndTransition = null;
      if (historicalRegimes) {
        // Try December, then November, then last available month of the year
        for (let m = 12; m >= 1; m--) {
          const mk = `${year}-${String(m).padStart(2, "0")}`;
          const rd = historicalRegimes[mk];
          if (rd) {
            yearEndState5 = rd.state5 || rd.regime || null;
            yearEndRegimeScore = rd.score || null;
            yearEndAcceleration = rd.acceleration ?? null;
            // Compute duration at year-end
            const rdIdx = dateToIdx[mk];
            if (rdIdx != null) {
              yearEndDuration = 1;
              const r3 = rd.regime;
              for (let lb = 1; lb <= 36 && rdIdx - lb >= 0; lb++) {
                const prev = historicalRegimes[sortedDates[rdIdx - lb]];
                if (prev && prev.regime === r3) yearEndDuration++;
                else { if (prev) yearEndTransition = `${prev.regime}→${r3}`; break; }
              }
            }
            break;
          }
        }
      }

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
        regime: yearEndState5,
        state5: yearEndState5,
        regimeScore: yearEndRegimeScore,
        probBear: null,
        acceleration: yearEndAcceleration,
        duration: yearEndDuration,
        transition: yearEndTransition,
        hmmState5: (() => {
          if (!btHmmEnsembleMap) return null;
          for (let m = 12; m >= 1; m--) {
            const mk = `${year}-${String(m).padStart(2, "0")}`;
            if (btHmmEnsembleMap[mk]) return hmmToState5(btHmmEnsembleMap[mk]);
          }
          return null;
        })(),
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
      regimeSource: historicalRegimes ? (btHmmModel ? "FRED + HMM Ensemble (incremental, no look-ahead)" : "FRED (12-series, 5-state, daily EMA)") : "Proxy (SPY momentum/vol)",
      regimeDurationModel: regimeDurModel ? true : false,
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
  }, [ot, srMode, volTarget, useKelly, useRegime, taxState, includeStocks, btStartCash]);

  // ═══ SIMULATION: Run backtest N times to measure win rate vs SPY ═══
  const runSimulation = useCallback(async () => {
    if (!btResult) return; // Must run backtest first to have data
    setSimRunning(true); setSimResult(null); setSimProgress("Preparing simulation...");

    const NUM_SIMS = 100;
    const startCash = btStartCash;

    // ── Fetch historical data (same as backtest) ──
    const btETFs = [
      "SPY","VTI","QQQ","IWM","SCHD","SCHG","SCHF","VEA","VWO","EFA","MCHI",
      "XLK","XLF","XLV","XLE","XLU","XLRE","SOXX","ARKK","ICLN",
      "VIG","MTUM","USMV","BND","AGG","TIP","IEF","HYG","GLD","SLV","DBC","HDV","DGRO",
    ];
    const btStocks = includeStocks ? SP500_ALL_TICKERS : [];
    const allSymbols = [...new Set([...btETFs, "SPY", ...btStocks])];

    setSimProgress(`Fetching ${allSymbols.length} symbols...`);
    let histData = {};
    try {
      for (let i = 0; i < allSymbols.length; i += 15) {
        const batch = allSymbols.slice(i, i + 15);
        const resp = await fetch(`/api/history?symbols=${batch.join(",")}&start=2005-01-01&end=2025-12-31`);
        const json = await resp.json();
        if (json.data) Object.assign(histData, json.data);
      }
    } catch (e) { setSimProgress("Error: " + e.message); setSimRunning(false); return; }

    const available = Object.keys(histData).filter(k => histData[k]?.length >= 12);
    if (available.length < 3) { setSimProgress("Not enough data"); setSimRunning(false); return; }

    // Build indexed data structures (same as backtest)
    const returnsByDateSym = {};
    const allDateKeys = new Set();
    for (const sym of available) {
      const prices = histData[sym];
      for (let i = 1; i < prices.length; i++) {
        const dk = prices[i].date.slice(0, 7);
        const entry = { ret: (prices[i].close - prices[i - 1].close) / prices[i - 1].close };
        if (!returnsByDateSym[dk]) returnsByDateSym[dk] = {};
        returnsByDateSym[dk][sym] = entry;
        allDateKeys.add(dk);
      }
    }
    const sortedDates = [...allDateKeys].sort();
    const dateToIdx = {}; sortedDates.forEach((d, i) => { dateToIdx[d] = i; });
    const spyDates = new Set(Object.keys(returnsByDateSym).filter(k => returnsByDateSym[k]["SPY"]));
    const simDates = sortedDates.filter(d => d >= "2006-01" && d <= "2025-12" && spyDates.has(d));
    const etfDbMap = {}; ETF_DB.forEach(e => { etfDbMap[e.t] = e; }); STOCK_OPT.forEach(s => { etfDbMap[s.t] = s; });

    // Compute SPY final value (same for all sims)
    let spyFinal = startCash;
    for (const mk of simDates) {
      const spyRet = returnsByDateSym[mk]?.["SPY"]?.ret || 0;
      spyFinal *= (1 + spyRet);
    }
    const spyCAGR = (Math.pow(spyFinal / startCash, 1 / Math.max(1, simDates.length / 12)) - 1) * 100;

    // Fetch regime data for simulation (matches main backtest)
    let simHistRegimes = null;
    if (useRegime) {
      try {
        const regResp = await fetch("/api/regime?history=true");
        const regJson = await regResp.json();
        if (regJson.monthlyRegimes) {
          simHistRegimes = {};
          regJson.monthlyRegimes.forEach(r => { simHistRegimes[r.date] = r; });
        }
      } catch (e) { /* proceed without regime */ }
    }

    // Build incremental HMM ensemble map for simulation (no look-ahead bias)
    // Retrain every 12 months using only PAST data, same as backtest
    let simHmmEnsembleMap = {};
    if (simHistRegimes) {
      try {
        const entries = Object.entries(simHistRegimes).sort((a, b) => a[0].localeCompare(b[0]));
        const allScores = entries.map(([, r]) => r.score ?? 0);
        const allDates = entries.map(([d]) => d);
        if (allScores.length > 36) {
          let lastBuild = -999;
          for (let i = 36; i < allScores.length; i++) {
            if (i - lastBuild >= 12) {
              const pastCutoff = Math.max(0, i - 3);
              const pastScores = allScores.slice(0, pastCutoff);
              const model = hmmTrain(pastScores, 25);
              const filtered = hmmFilter(pastScores, model);
              const cp = runBOCPD(pastScores);
              const ensemble = runEnsemble(filtered, cp);
              for (let k = 0; k < pastCutoff; k++) simHmmEnsembleMap[allDates[k]] = ensemble[k];
              lastBuild = i;
            }
          }
        }
      } catch (e) { /* proceed without HMM */ }
    }

    // ── Run N simulations ──
    const results = [];
    for (let sim = 0; sim < NUM_SIMS; sim++) {
      if (sim % 5 === 0) {
        setSimProgress(`Simulation ${sim + 1} / ${NUM_SIMS}...`);
        await new Promise(r => setTimeout(r, 0)); // yield to UI
      }

      let optValue = startCash;
      let optAlloc = {};
      let lastRebalMonth = null;
      let simTaxPaid = 0;
      let simLossCarry = 0;
      let simCostBasis = {}; // ticker → actual dollar cost basis
      let simAnnualOrdOffsetUsed = 0; // Fix #3: track $3k/year limit
      let simLastOffsetYear = 0;
      const simTaxRates = getTaxRates(taxState);

      for (let mi = 0; mi < simDates.length; mi++) {
        const monthKey = simDates[mi];
        const mIdx = dateToIdx[monthKey];
        const mYear = parseInt(monthKey.slice(0, 4));
        const mMonth = parseInt(monthKey.slice(5, 7)) - 1;
        const monthData = returnsByDateSym[monthKey] || {};

        // Apply returns
        if (Object.keys(optAlloc).length > 0) {
          let mRet = 0;
          for (const [sym, wt] of Object.entries(optAlloc)) {
            mRet += wt * (monthData[sym]?.ret || 0);
          }
          optValue *= (1 + mRet);
        }

        // Quarterly evaluation (Jan/Apr/Jul/Oct) — matches main backtest
        if (mMonth % 3 !== 0) continue;
        const prevTickers = Object.keys(optAlloc);
        const isFirst = prevTickers.length === 0;
        const mSinceRebal = lastRebalMonth ? (mIdx - dateToIdx[lastRebalMonth]) : 999;
        if (!isFirst && mSinceRebal < 3) continue;

        // Trailing stats with recency weighting + shrinkage (matches main backtest)
        const trailingStats = {};
        const trailStart = Math.max(0, mIdx - 12);
        for (const sym of available) {
          let sWR = 0, sW = 0, sR = 0, sR2 = 0, cnt = 0;
          for (let ti = trailStart; ti < mIdx; ti++) {
            const e = returnsByDateSym[sortedDates[ti]]?.[sym];
            if (e) {
              const age = mIdx - 1 - ti;
              const w = Math.exp(-0.05 * age);
              sWR += w * e.ret; sW += w;
              sR += e.ret; sR2 += e.ret * e.ret; cnt++;
            }
          }
          if (cnt < 6) continue;
          const db = etfDbMap[sym];
          const rawR = (sWR / sW) * 12 * 100;
          const shrunkR = shrinkReturn(rawR, db?.type === "stock");
          const vol = Math.max(Math.sqrt(Math.max(0, sR2 / cnt - (sR/cnt) ** 2)) * Math.sqrt(12) * 100, 1);
          trailingStats[sym] = { t: sym, n: db?.n || sym, c: db?.c || "US Large Cap", r: shrunkR, v: vol, er: db?.er || 0.1, d: 0, lev: db?.lev || null, type: db?.type || "etf" };
        }

        const cands = Object.values(trailingStats).filter(s => {
          if (s.t === "SPY" || s.v <= 0 || s.r <= -50) return false;
          const db = etfDbMap[s.t];
          if (db?.type === "stock") {
            const yearStocks = getStocksForYear(mYear);
            if (!yearStocks.includes(s.t)) return false;
          }
          return true;
        }).sort((a, b) => ((b.r - 4) / b.v) - ((a.r - 4) / a.v)).slice(0, 30);

        // Factor scoring for simulation candidates (lightweight)
        if (mIdx > 12) computeFactorScores(returnsByDateSym, sortedDates, mIdx, trailingStats, etfDbMap);

        // Randomly sample 20 from top 30 — ensures each sim sees different candidates
        while (cands.length > 20) cands.splice(Math.floor(Math.random() * cands.length), 1);
        if (cands.length < 3) continue;

        // Lightweight optimizer with regime context (matches main backtest strategy)
        let simRegime = null;
        if (simHistRegimes) {
          const rd = simHistRegimes[monthKey];
          if (rd) {
            let sDur = 1;
            const sRegime3 = rd.regime;
            for (let lb = 1; lb <= 36 && mIdx - lb >= 0; lb++) {
              const prev = simHistRegimes[sortedDates[mIdx - lb]];
              if (prev && prev.regime === sRegime3) sDur++; else break;
            }
            simRegime = { state5: rd.state5 || sRegime3, acceleration: rd.acceleration ?? 0, duration: sDur, transition: null };
            // HMM overlay (conservative fusion, incremental — no look-ahead)
            if (simHmmEnsembleMap[monthKey]) {
              const hmmS5 = hmmToState5(simHmmEnsembleMap[monthKey]);
              const ro = ["strong_risk_off","mild_risk_off","neutral","mild_risk_on","strong_risk_on"];
              const fR = ro.indexOf(simRegime.state5), hR = ro.indexOf(hmmS5);
              if (fR >= 0 && hR >= 0) simRegime.state5 = ro[Math.min(fR, hR)];
            }
          }
        }
        const result = optimizeCash([], optValue, 0, cands, ot, srMode, volTarget, useKelly, simRegime, 100);
        if (!result || result.length === 0) continue;

        const newAlloc = {};
        const totalDep = result.reduce((s, r) => s + r.dollars, 0) || optValue;
        result.forEach(r => { newAlloc[r.ticker] = r.dollars / totalDep; });

        // ── Tax-aware rebalance decision (matches main backtest logic) ──
        const spyExp = trailingStats["SPY"]?.r || 10;
        let currExp = 0; for (const [sym, wt] of Object.entries(optAlloc)) currExp += wt * (trailingStats[sym]?.r || spyExp);
        let propExp = 0; for (const [sym, wt] of Object.entries(newAlloc)) if (trailingStats[sym]) propExp += wt * trailingStats[sym].r;

        // Compute tax cost using ACTUAL cost basis
        let grossGains = 0, grossLosses = 0;
        for (const ticker of prevTickers) {
          const oldWt = optAlloc[ticker] || 0;
          const newWt = newAlloc[ticker] || 0;
          if (newWt < oldWt - 0.005) { // selling
            const sellWt = oldWt - newWt;
            const sellProceeds = sellWt * optValue;
            const proportionSold = Math.min(1, sellWt / oldWt);
            const soldCostBasis = (simCostBasis[ticker] || 0) * proportionSold;
            const gl = sellProceeds - soldCostBasis;
            if (gl > 0) grossGains += gl; else grossLosses += Math.abs(gl);
          }
        }

        const availLoss = grossLosses + simLossCarry;
        const netGains = Math.max(0, grossGains - availLoss);
        const excessLoss = Math.max(0, availLoss - grossGains);
        // Fix #3: $3k ordinary income offset is per-year, not per-rebalance
        if (mYear !== simLastOffsetYear) { simAnnualOrdOffsetUsed = 0; simLastOffsetYear = mYear; }
        const remainingOrdOffset = Math.max(0, 3000 - simAnnualOrdOffsetUsed);
        const ordOffset = Math.min(excessLoss, remainingOrdOffset);
        simAnnualOrdOffsetUsed += ordOffset;

        const taxRate = mSinceRebal >= 12 ? simTaxRates.lt : simTaxRates.st;
        const estTax = netGains * (taxRate / 100);
        const tcPct = optValue > 0 ? (estTax / optValue) * 100 : 0;

        // Hurdle: matches main backtest — 1.5% floor + light turnover cost
        const retImp = propExp - currExp;
        const curAlpha = currExp - spyExp;
        let simTurnover = 0;
        for (const [ticker, newWt] of Object.entries(newAlloc)) simTurnover += Math.abs(newWt - (optAlloc[ticker] || 0));
        for (const ticker of prevTickers) if (!newAlloc[ticker]) simTurnover += optAlloc[ticker] || 0;
        simTurnover *= 50;
        const simTaxHurdle = isFirst ? -999 : curAlpha > 3 ? tcPct * 2.0 : curAlpha < -2 ? tcPct * 0.8 : tcPct * 1.2;
        const hurdle = isFirst ? -999 : Math.max(simTaxHurdle, 1.5) + simTurnover * 0.01;

        if (isFirst || retImp > hurdle) {
          // Update cost basis map
          const newCB = {};
          for (const [ticker, newWt] of Object.entries(newAlloc)) {
            if (newWt <= 0.005) continue;
            const oldWt = optAlloc[ticker] || 0;
            if (oldWt <= 0.005) newCB[ticker] = newWt * optValue;
            else if (newWt <= oldWt) newCB[ticker] = (simCostBasis[ticker] || 0) * (newWt / oldWt);
            else newCB[ticker] = (simCostBasis[ticker] || 0) + (newWt - oldWt) * optValue;
          }
          optAlloc = newAlloc;
          optValue -= estTax;
          simTaxPaid += estTax;
          simCostBasis = newCB;
          simLossCarry = excessLoss - ordOffset;
          lastRebalMonth = monthKey;
        }
      }

      const optCAGR = (Math.pow(Math.max(0, optValue) / startCash, 1 / Math.max(1, simDates.length / 12)) - 1) * 100;
      results.push({
        finalValue: optValue,
        cagr: optCAGR,
        beatsSPY: optValue > spyFinal,
        alpha: optCAGR - spyCAGR,
        taxPaid: simTaxPaid,
      });
    }

    // ── Aggregate results ──
    const wins = results.filter(r => r.beatsSPY).length;
    const alphas = results.map(r => r.alpha).sort((a, b) => a - b);
    const cagrs = results.map(r => r.cagr).sort((a, b) => a - b);
    const finals = results.map(r => r.finalValue).sort((a, b) => a - b);
    const taxes = results.map(r => r.taxPaid || 0);
    const avg = arr => arr.reduce((s, v) => s + v, 0) / arr.length;
    const pctl = (arr, p) => arr[Math.floor(arr.length * p / 100)] || 0;

    setSimResult({
      numSims: NUM_SIMS,
      winRate: wins,
      winPct: +(wins / NUM_SIMS * 100).toFixed(1),
      spyFinal: Math.round(spyFinal),
      spyCAGR: +spyCAGR.toFixed(1),
      avgFinal: Math.round(avg(finals)),
      avgCAGR: +avg(cagrs).toFixed(1),
      avgAlpha: +avg(alphas).toFixed(1),
      medianAlpha: +pctl(alphas, 50).toFixed(1),
      p10Alpha: +pctl(alphas, 10).toFixed(1),
      p90Alpha: +pctl(alphas, 90).toFixed(1),
      p10Final: Math.round(pctl(finals, 10)),
      p50Final: Math.round(pctl(finals, 50)),
      p90Final: Math.round(pctl(finals, 90)),
      minFinal: Math.round(finals[0]),
      maxFinal: Math.round(finals[finals.length - 1]),
      distribution: results, // for histogram
      avgTaxPaid: Math.round(avg(taxes)),
    });
    setSimProgress(""); setSimRunning(false);
  }, [btResult, btStartCash, ot, srMode, volTarget, useKelly, includeStocks]);
  
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
    if (typeof saved.includeStocks === "boolean") setIncludeStocks(saved.includeStocks);

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
      includeStocks,
      sc,
      so,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [etfs, stocks, cashBalance, tab, srMode, ot, volTarget, useKelly, useRegime, taxState, includeStocks, sc, so]);

  // ─── Computed: merge live prices into holdings ───
  // When live prices arrive, fix holdings that were added without price data
  const prevLiveRef = useRef({});
  useEffect(() => {
    if (!Object.keys(live).length) return;
    // Only run when live data actually changes
    const liveKey = Object.keys(live).sort().join(",");
    if (prevLiveRef.current === liveKey) return;
    prevLiveRef.current = liveKey;

    // Fix ETFs with missing shares or costBasis
    let etfFixed = false;
    const fixedEtfs = etfs.map(e => {
      const lp = live[e.ticker]?.price;
      if (!lp || lp <= 0) return e;
      let changed = false, newE = { ...e };
      // If shares=0 but has a dollar value, compute shares from live price
      if ((!e.shares || e.shares === 0) && e.mktValue > 0) {
        newE.shares = Math.floor(e.mktValue / lp);
        newE.costBasis = lp; // bought at current price (just added)
        newE.mktValue = lp * newE.shares;
        changed = true;
      }
      // If shares exist but costBasis missing, set costBasis to live price
      if (e.shares > 0 && (!e.costBasis || e.costBasis === 0)) {
        newE.costBasis = lp;
        changed = true;
      }
      if (changed) { etfFixed = true; return newE; }
      return e;
    });
    if (etfFixed) setEtfs(fixedEtfs);

    // Fix stocks with missing shares or costBasis
    let stockFixed = false;
    const fixedStocks = stocks.map(s => {
      const lp = live[s.ticker]?.price;
      if (!lp || lp <= 0) return s;
      let changed = false, newS = { ...s };
      if ((!s.shares || s.shares === 0) && s.mktValue > 0) {
        newS.shares = Math.floor(s.mktValue / lp);
        newS.costBasis = lp;
        newS.mktValue = lp * newS.shares;
        changed = true;
      }
      if (s.shares > 0 && (!s.costBasis || s.costBasis === 0)) {
        newS.costBasis = lp;
        changed = true;
      }
      if (changed) { stockFixed = true; return newS; }
      return s;
    });
    if (stockFixed) setStocks(fixedStocks);
  }, [live]); // eslint-disable-line react-hooks/exhaustive-deps

  const etfV = useMemo(() => etfs.map(e => {
    const lp = live[e.ticker]?.price;
    const shares = e.shares || 0;
    const mv = (lp && shares > 0) ? lp * shares : (e.mktValue || 0);
    return { ...e, mktValue: mv, livePrice: lp, shares };
  }), [etfs, live]);

  const stockV = useMemo(() => stocks.map(s => {
    const lp = live[s.ticker]?.price;
    const shares = s.shares || 0;
    const mv = (lp && shares > 0) ? lp * shares : (s.mktValue || 0);
    return { ...s, mktValue: mv, livePrice: lp, shares };
  }), [stocks, live]);

  const holdingsVal = useMemo(() => etfV.reduce((s, e) => s + (e.mktValue || 0), 0) + stockV.reduce((s, s2) => s + (s2.mktValue || 0), 0), [etfV, stockV]);
  const totalCostBasis = useMemo(() => {
    let basis = 0;
    etfV.forEach(e => { if (e.shares > 0 && e.costBasis > 0) basis += e.shares * e.costBasis; });
    stockV.forEach(s => { if (s.shares > 0 && s.costBasis > 0) basis += s.shares * s.costBasis; });
    return basis;
  }, [etfV, stockV]);
  const totalPnL = totalCostBasis > 0 ? holdingsVal - totalCostBasis : null;
  const totalPnLPct = totalCostBasis > 0 ? ((holdingsVal / totalCostBasis) - 1) * 100 : null;
  const totalDayChange = useMemo(() => {
    if (!lastF || Object.keys(live).length === 0) return null;
    let dayDollar = 0, hasAny = false;
    etfV.forEach(e => { const lp = live[e.ticker]; if (lp?.change != null && e.mktValue > 0) { dayDollar += e.mktValue * (lp.change / 100) / (1 + lp.change / 100); hasAny = true; }});
    stockV.forEach(s => { const lp = live[s.ticker]; if (lp?.change != null && s.mktValue > 0) { dayDollar += s.mktValue * (lp.change / 100) / (1 + lp.change / 100); hasAny = true; }});
    if (!hasAny) return null;
    const dayPct = holdingsVal > 0 ? (dayDollar / (holdingsVal - dayDollar)) * 100 : 0;
    return { dollar: dayDollar, pct: dayPct };
  }, [etfV, stockV, live, lastF, holdingsVal]);
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
    try { if (cashBalance <= 0) return null; const fCands = includeStocks ? [...ETF_DB, ...STOCK_OPT].slice(0, 40) : ETF_DB.slice(0, 30); return genFrontier(allPos, cashBalance, holdingsVal, fCands); } catch (e) { return null }
  }, [allPos, cashBalance, holdingsVal]);

  // ─── Ticker search ───
  const searchTicker = useCallback((query) => {
    if (!query || query.length < 1) { setStockResults([]); return }
    const q = query.toUpperCase();
    const db = addType === "etf" ? ETF_DB.map(e => ({ t: e.t, n: e.n, s: e.c })) : STOCK_DB;
    const local = db.filter(s => s.t.startsWith(q) || s.t.includes(q) || s.n.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
    setStockResults(local);
    // Yahoo Finance search fallback — free, instant, covers ALL tickers
    if (local.length < 5 && query.length >= 2) {
      if (stockTimer) clearTimeout(stockTimer);
      const timer = setTimeout(async () => {
        setStockSearching(true);
        try {
          const resp = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          if (resp.ok) {
            const json = await resp.json();
            if (json.results?.length > 0) {
              const seen = new Set(local.map(l => l.t.toUpperCase()));
              const merged = [...local];
              // Map Yahoo categories to our system
              const etfCatMap = { "ETF": "US Large Cap" }; // default for ETFs not in our DB
              json.results.forEach(r => {
                if (!r.t || seen.has(r.t.toUpperCase())) return;
                seen.add(r.t.toUpperCase());
                r.t = r.t.toUpperCase();
                // For ETFs, check if we have category data in our DB
                const dbEntry = addType === "etf" ? ETF_DB.find(e => e.t === r.t) : null;
                if (dbEntry) r.s = dbEntry.c;
                merged.push(r);
              });
              setStockResults(merged.slice(0, 12));
              setStockSearching(false);
              return;
            }
          }
        } catch (e) { console.warn("Yahoo search failed:", e); }
        // AI fallback if Yahoo search fails
        try {
          const kind = addType === "etf" ? "ETF" : "stock";
          const resp = await fetch("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: `${kind} tickers matching "${query}" tradable on Schwab. Return ONLY JSON array: [{"t":"TICKER","n":"Name","s":"Category"}] up to 8. Categories for ETFs: US Large Cap/US Growth/US Value/US Mid Cap/US Small Cap/US Dividend/International/Intl Developed/Emerging Mkts/Sector Tech/Sector Health/Sector Finance/Sector Energy/Sector Indust/Sector Consumer/Sector RE/Sector Utilities/Sector Materials/Sector Comms/Factor Momentum/Factor Quality/Factor LowVol/US Bond/US Treasury/US Corp Bond/US High Yield/Intl Bond/Commodity. Categories for stocks: Technology/Healthcare/Financial/Energy/Consumer/Industrial/Real Estate/Communications/Utilities/Materials. No markdown.` }),
          });
          const data = await resp.json();
          if (data.text) {
            try { const parsed = JSON.parse(data.text.replace(/```json|```/g, "").trim()); if (Array.isArray(parsed)) { const seen = new Set(local.map(l => l.t.toUpperCase())); const merged = [...local]; parsed.forEach(p => { if (p.t) { p.t = p.t.toUpperCase(); if (!seen.has(p.t)) { seen.add(p.t); merged.push(p) } } }); setStockResults(merged.slice(0, 12)); } } catch (e) { }
          }
        } catch (e) { }
        setStockSearching(false);
      }, 300);
      setStockTimer(timer);
    }
  }, [stockTimer, addType]);

  // ─── Select from dropdown → fetch live price via Twelve Data ───
  const selectTicker = useCallback(async (stk) => {
    const normalizedTicker = stk.t.toUpperCase();
    setSf(f => ({ ...f, t: normalizedTicker, n: stk.n, sec: stk.s })); setStockDD(false); setStockResults([]); setAdding(true);
    try {
      const resp = await fetch(`/api/prices?tickers=${normalizedTicker}`);
      if (resp.ok) {
        const json = await resp.json();
        // Try both original and uppercase keys (server normalizes to uppercase)
        const info = json.data?.[normalizedTicker] || json.data?.[stk.t] || Object.values(json.data || {})[0];
        if (info?.price) {
          setSf(f => ({ ...f, livePrice: info.price }));
        }
      }
    } catch (e) { console.warn("Ticker price lookup failed:", e); }
    setAdding(false);
  }, []);

  // ─── Add holding ───
  const addHolding = useCallback(async () => {
    if (!sf.t) return;
    setAdding(true);
    const ticker = sf.t.toUpperCase(); const shares = +sf.sh || 0; const costBasis = +sf.cb || 0;
    const purchaseDate = sf.pd || new Date().toISOString().slice(0, 10);

    // Always fetch live price — don't rely on selectTicker having been called
    let livePrice = sf.livePrice || 0;
    if (livePrice <= 0) {
      try {
        const yahooTicker = ticker.replace(".", "-");
        const resp = await fetch(`/api/prices?tickers=${yahooTicker}`);
        if (resp.ok) {
          const json = await resp.json();
          livePrice = json.data?.[ticker]?.price || json.data?.[yahooTicker]?.price || Object.values(json.data || {})[0]?.price || 0;
        }
      } catch (e) { console.warn(`Price fetch for ${ticker} failed:`, e); }
    }

    // Use live price for market value, cost basis for G/L tracking
    const priceForMV = livePrice || costBasis; // best available price for market value
    const mktValue = shares > 0 ? priceForMV * shares : 0;
    // costBasis stays as user-entered (what they actually paid) — NOT the live price
    // If user didn't enter cost basis, use live price as fallback (just bought at market)
    const finalCostBasis = costBasis > 0 ? costBasis : livePrice;

    if (addType === "etf") {
      if (etfs.find(e => e.ticker === ticker)) { setAdding(false); return; }
      let etfData = ETF_DB.find(e => e.t === ticker);
      if (!etfData) {
        const cat = sf.sec || "US Large Cap";
        etfData = { t: ticker, n: sf.n || ticker, c: cat, h: 50, er: .20, r: 8.0, v: 18.0, d: 1.0 };
      }
      setEtfs(p => [...p, { ticker, data: etfData, shares, costBasis: finalCostBasis, mktValue, type: "etf", purchaseDate }]);
    } else {
      if (stocks.find(s => s.ticker === ticker)) { setAdding(false); return; }
      setStocks(p => [...p, { ticker, name: sf.n || ticker, shares, costBasis: finalCostBasis, mktValue, sector: sf.sec || "Technology", type: "stock", locked: true, purchaseDate }]);
    }
    // Update live state immediately for this ticker
    if (livePrice > 0) setLive(prev => ({ ...prev, [ticker]: { price: livePrice, change: 0, ...(prev[ticker] || {}) } }));
    setSf({ t: "", n: "", sh: "", cb: "", sec: "Technology", pd: "" });
    setAdding(false);
  }, [sf, addType, etfs, stocks]);

  const removeHolding = useCallback((ticker, type) => {
    if (type === "etf") {
      // Enforce minimum 10-day holding period for ETFs
      const etf = etfs.find(e => e.ticker === ticker);
      if (etf?.purchaseDate) {
        const daysSince = Math.floor((Date.now() - new Date(etf.purchaseDate).getTime()) / 86400000);
        if (daysSince < 10) {
          alert(`Cannot remove ${ticker} — ETFs must be held for a minimum of 10 days. Held ${daysSince} day${daysSince !== 1 ? "s" : ""} so far (${10 - daysSince} remaining).`);
          return;
        }
      }
      setEtfs(p => p.filter(e => e.ticker !== ticker));
    }
    else setStocks(p => p.filter(s => s.ticker !== ticker));
  }, [etfs]);

  // ─── Toggle optimizer recommendation → add or remove ETF holding, adjust cash ───
  const toggleRec = useCallback(async (rec) => {
    const alreadyAdded = accepted.has(rec.ticker);
    if (alreadyAdded) {
      // DESELECT: remove from holdings, refund cash
      if (rec.isStock) {
        const existing = stocks.find(s => s.ticker === rec.ticker);
        const refund = existing ? existing.mktValue || 0 : rec.dollars;
        setStocks(p => p.filter(s => s.ticker !== rec.ticker));
        setCashBalance(prev => prev + refund);
      } else {
        const existing = etfs.find(e => e.ticker === rec.ticker);
        const refund = existing ? existing.mktValue || 0 : rec.dollars;
        setEtfs(p => p.filter(e => e.ticker !== rec.ticker));
        setCashBalance(prev => prev + refund);
      }
      setAccepted(prev => { const next = new Set(prev); next.delete(rec.ticker); return next; });
    } else {
      // SELECT: use pre-fetched price from recPrices (batch-loaded after optimizer runs)
      let price = recPrices[rec.ticker]?.price || 0;

      // Fallback: individual fetch if batch didn't have this ticker
      if (price <= 0) {
        try {
          const yahooTicker = rec.ticker.replace(".", "-");
          const resp = await fetch(`/api/prices?tickers=${yahooTicker}`);
          if (resp.ok) {
            const json = await resp.json();
            // Try Yahoo-format ticker first, then original
            price = json.data?.[yahooTicker]?.price || json.data?.[rec.ticker]?.price || 0;
          }
        } catch (e) { console.warn(`Price fetch failed for ${rec.ticker}:`, e); }
      }

      const shares = price > 0 ? Math.floor(rec.dollars / price) : 0;
      const actualCost = price > 0 ? shares * price : rec.dollars;

      if (rec.isStock) {
        setStocks(p => [...p, { ticker: rec.ticker, name: rec.name, shares, costBasis: price || 0, mktValue: actualCost, sector: rec.cat.replace("Sector ", "").replace(/^(Tech|Consumer|Fin|Health|Energy|Indust)-\w+$/, "$1"), locked: false, purchaseDate: new Date().toISOString().slice(0, 10) }]);
      } else {
        let etfData = ETF_DB.find(e => e.t === rec.ticker);
        if (!etfData) {
          etfData = { t: rec.ticker, n: rec.name, c: rec.cat, h: 50, er: rec.er || .20, r: rec.r || 8.0, v: rec.v || 18.0, d: rec.d || 0 };
        }
        setEtfs(p => [...p, { ticker: rec.ticker, data: etfData, shares, costBasis: price || 0, mktValue: actualCost, type: "etf", purchaseDate: new Date().toISOString().slice(0, 10) }]);
      }
      setCashBalance(prev => Math.max(0, prev - actualCost));
      setAccepted(prev => new Set([...prev, rec.ticker]));
    }
  }, [accepted, etfs, stocks, recPrices]);

  // ─── Fetch live prices via Twelve Data (serverless proxy) ───
  const fetchLive = useCallback(async () => {
    setLiveL(true);
    try {
      const tickers = [...new Set([...etfs.map(e => e.ticker), ...stocks.map(s => s.ticker), "SPY"])].filter(Boolean);
      if (!tickers.length) { setLiveL(false); return; }
      const results = {};

      // Primary: /api/prices (Yahoo v7 quote)
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

      // Fallback: for tickers missing from primary results, try /api/history for latest close
      const missing = tickers.filter(t => !results[t]?.price);
      if (missing.length > 0) {
        const endDate = new Date().toISOString().slice(0, 10);
        const startDate = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        for (let i = 0; i < missing.length; i += 15) {
          const batch = missing.slice(i, i + 15);
          try {
            const resp = await fetch(`/api/history?symbols=${batch.join(",")}&start=${startDate}&end=${endDate}`);
            if (resp.ok) {
              const json = await resp.json();
              if (json.data) {
                for (const [sym, hist] of Object.entries(json.data)) {
                  if (hist?.length > 0) {
                    const latest = hist[hist.length - 1];
                    const prev = hist.length > 1 ? hist[hist.length - 2] : null;
                    const change = prev?.close > 0 ? ((latest.close - prev.close) / prev.close) * 100 : 0;
                    results[sym] = { price: latest.close, change: +change.toFixed(2), prevClose: prev?.close || 0, ts: Date.now() };
                  }
                }
              }
            }
          } catch (e) { console.warn("History fallback batch failed:", e); }
        }
      }

      if (Object.keys(results).length > 0) {
        // MERGE with existing live data (don't replace — preserves prices from addHolding)
        setLive(prev => ({ ...prev, ...results }));
        setLastF(new Date());
      }
    } catch (e) { console.warn("Price fetch failed:", e); }
    setLiveL(false);
  }, [etfs, stocks]);

  // ── Auto-fetch live prices on mount and when holdings change ──
  const holdingTickers = useMemo(() => [...etfs.map(e => e.ticker), ...stocks.map(s => s.ticker)].filter(Boolean).join(","), [etfs, stocks]);
  useEffect(() => {
    if (!holdingTickers) return;
    // Small delay to avoid fetching during rapid state changes (adding multiple holdings)
    const timer = setTimeout(() => fetchLive(), 500);
    return () => clearTimeout(timer);
  }, [holdingTickers]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Periodic refresh every 60 seconds (only during US market hours: 9:30-16:00 ET, Mon-Fri) ──
  useEffect(() => {
    if (!holdingTickers) return;
    const interval = setInterval(() => {
      const now = new Date();
      const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
      const day = et.getDay(), hr = et.getHours(), mn = et.getMinutes();
      const isMarketOpen = day >= 1 && day <= 5 && (hr > 9 || (hr === 9 && mn >= 30)) && hr < 16;
      if (isMarketOpen) fetchLive();
    }, 60000);
    return () => clearInterval(interval);
  }, [holdingTickers, fetchLive]);

  // ─── Optimizer ───
  const runOptimizer = useCallback(async () => {
    if (cashBalance <= 0) return;
    setOptRunning(true);

    try {
    // ── Step 1: Fetch trailing 12-month history for all candidates ──
    const baseCandidates = includeStocks ? [...ETF_DB, ...STOCK_OPT] : ETF_DB;
    const tickers = baseCandidates.map(c => c.t);
    // Compute date range: 13 months back (need 12 months of returns = 13 price points)
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 14 * 30 * 86400000).toISOString().slice(0, 10);

    let histData = {};
    try {
      for (let i = 0; i < tickers.length; i += 15) {
        const batch = tickers.slice(i, i + 15);
        const resp = await fetch(`/api/history?symbols=${batch.join(",")}&start=${startDate}&end=${endDate}`);
        const json = await resp.json();
        if (json.data) Object.assign(histData, json.data);
      }
    } catch (e) {
      console.warn("Failed to fetch live history, falling back to static data:", e.message);
    }

    // ── Step 2: Compute trailing stats with recency weighting + shrinkage ──
    let candidates;
    const fetchedTickers = Object.keys(histData).filter(k => histData[k]?.length >= 7);

    if (fetchedTickers.length > 10) {
      // Build monthly return series
      const returnsByDate = {};
      for (const sym of fetchedTickers) {
        const prices = histData[sym].sort((a, b) => a.date.localeCompare(b.date));
        for (let j = 1; j < prices.length; j++) {
          const date = prices[j].date.slice(0, 7);
          const ret = (prices[j].close - prices[j - 1].close) / prices[j - 1].close;
          if (!returnsByDate[date]) returnsByDate[date] = {};
          returnsByDate[date][sym] = { ret, close: prices[j].close };
        }
      }
      const sortedDates = Object.keys(returnsByDate).sort();
      const etfDbMap = {};
      baseCandidates.forEach(c => { etfDbMap[c.t] = c; });

      // Compute recency-weighted trailing stats (same logic as backtest)
      const liveCandidates = [];
      const mIdx = sortedDates.length;
      const trailStart = Math.max(0, mIdx - 12);

      for (const sym of fetchedTickers) {
        let sumWRet = 0, sumW = 0, sumRet = 0, sumRetSq = 0, count = 0;
        for (let ti = trailStart; ti < mIdx; ti++) {
          const entry = returnsByDate[sortedDates[ti]]?.[sym];
          if (entry) {
            const age = mIdx - 1 - ti;
            const w = Math.exp(-0.05 * age);
            sumWRet += w * entry.ret;
            sumW += w;
            sumRet += entry.ret;
            sumRetSq += entry.ret * entry.ret;
            count++;
          }
        }
        if (count < 6) continue;
        const wAvgMo = sumWRet / sumW;
        const rawR = wAvgMo * 12 * 100;
        const db = etfDbMap[sym];
        if (!db) continue;
        const isStk = db.type === "stock";
        const shrunkR = shrinkReturn(rawR, isStk);
        const vol = Math.max(Math.sqrt(Math.max(0, sumRetSq / count - (sumRet/count) * (sumRet/count))) * Math.sqrt(12) * 100, 1);

        // Build candidate with live stats, keeping category/metadata from DB
        liveCandidates.push({
          t: sym, n: db.n, c: db.c, h: db.h || 1,
          er: db.er || 0, d: db.d || 0, lev: db.lev || null,
          r: shrunkR,  // LIVE: recency-weighted + shrunk trailing return
          v: vol,      // LIVE: trailing 12-month volatility
          type: db.type || "etf", ipo: db.ipo,
        });
      }

      // Add candidates that had no history data (use static DB values as fallback)
      const liveSet = new Set(liveCandidates.map(c => c.t));
      for (const c of baseCandidates) {
        if (!liveSet.has(c.t)) liveCandidates.push(c);
      }

      candidates = liveCandidates.filter(c => c.t !== "SPY" && c.v > 0 && c.r > -80);

      // ── Compute multi-factor scores for live candidates ──
      if (sortedDates.length > 6) {
        const liveTrailing = {};
        candidates.forEach(c => { liveTrailing[c.t] = c; });
        computeFactorScores(returnsByDate, sortedDates, mIdx, liveTrailing, etfDbMap);
        const relVal = computeRelativeValue(returnsByDate, sortedDates, mIdx, liveTrailing);
        candidates.forEach(c => { c.relValue = relVal[c.t] || 0; });
      }
    } else {
      // Fallback: no history available, use static DB values
      candidates = baseCandidates;
    }

    // ── Step 3: Build regime context (same as before) ──
    let regimeCtx = null;
    if (useRegime && regimeData?.regime) {
      const r = regimeData.regime;
      regimeCtx = {
        state5: r.state5 || r.regime || "neutral",
        acceleration: r.acceleration || 0,
        duration: 1,
        transition: null,
      };
      if (regimeAnalytics?.current) {
        regimeCtx.duration = regimeAnalytics.current.runLength || 1;
        regimeCtx.transition = regimeAnalytics.current.transition || null;
      }
      if (regimeAnalytics?.durationReturns) {
        const dr = regimeAnalytics.durationReturns;
        const bucketLabels = ["1-3m","4-6m","7-12m","13-24m","24m+"];
        const model = {};
        const stateMap = { bull: ["strong_risk_on","mild_risk_on"], neutral: ["neutral"], bear: ["mild_risk_off","strong_risk_off"] };
        for (const [regime3, states5] of Object.entries(stateMap)) {
          if (!dr[regime3]) continue;
          for (const s5 of states5) {
            model[s5] = bucketLabels.map((label, i) => {
              const bData = dr[regime3][label];
              if (!bData) return { avgFwd: 0, stdFwd: 0, confidence: 0, count: 0, label };
              const fwd = bData.avg?.["6m"] || bData.avg?.["3m"] || 0;
              return { avgFwd: fwd, stdFwd: 0, confidence: Math.min(1, (bData.n || 0) / 12), count: bData.n || 0, label };
            });
          }
        }
        regimeCtx.durationModel = model;
      }
      if (regimeAnalytics?.current) {
        const ac = regimeAnalytics.current;
        const curRegime = ac.regime || "neutral";
        const prevRegime = ac.prevRegime || null;
        const prevDuration = ac.prevDuration || 0;
        const runLength = ac.runLength || 1;
        let bridgeRegime = null, bridgeDuration = 0;
        if (ac.transition) {
          const [from] = ac.transition.includes("→") ? ac.transition.split("→") : [null];
          if (from && from !== curRegime) {
            bridgeRegime = from;
            bridgeDuration = prevRegime && prevRegime !== from ? Math.min(prevDuration, 6) : 1;
          }
        }
        if (prevRegime && bridgeRegime) {
          let patternType, patternSignal;
          if (prevRegime === curRegime) {
            patternType = bridgeDuration <= 2 ? "continuation_brief" : bridgeDuration <= 6 ? "continuation_extended" : "consolidation_reset";
            patternSignal = patternType === "continuation_extended" ? (curRegime === "bull" ? 0.03 : curRegime === "bear" ? -0.03 : 0) : 0;
          } else {
            if (prevRegime === "bear" && curRegime === "bull") { patternType = "reversal_bear_to_bull"; patternSignal = bridgeDuration <= 3 ? 0.10 : 0.06; }
            else if (prevRegime === "bull" && curRegime === "bear") { patternType = "reversal_bull_to_bear"; patternSignal = bridgeDuration <= 3 ? -0.10 : -0.06; }
            else { patternType = "transition"; patternSignal = 0; }
          }
          regimeCtx.threeStage = {
            pattern: `${prevRegime}→${bridgeRegime}→${curRegime}`,
            patternType, patternSignal, prevRegime, prevDuration, bridgeRegime, bridgeDuration,
            currentRegime: curRegime, currentDuration: runLength,
            effectiveDuration: patternType === "continuation_brief" ? runLength + bridgeDuration + prevDuration : runLength,
          };
        }
      }
    }

    // ── Step 3b: Overlay HMM Ensemble classification if available ──
    if (useRegime && hmmResult) {
      if (!regimeCtx) regimeCtx = { state5: "neutral", acceleration: 0, duration: 1, transition: null };
      // The ensemble fuses HMM + BOCPD → more robust state5 classification
      regimeCtx.hmmState5 = hmmResult.state5;
      regimeCtx.hmmRegime = hmmResult.currentEnsemble.name;
      regimeCtx.hmmProbs = hmmResult.currentEnsemble.probs;
      regimeCtx.hmmAlerts = hmmResult.alerts;
      // If HMM and FRED agree, boost confidence (use HMM). If they disagree, use the more cautious signal.
      const fredState5 = regimeCtx.state5;
      const hmmState5 = hmmResult.state5;
      const riskOrder = ["strong_risk_off", "mild_risk_off", "neutral", "mild_risk_on", "strong_risk_on"];
      const fredRisk = riskOrder.indexOf(fredState5);
      const hmmRisk = riskOrder.indexOf(hmmState5);
      if (fredRisk >= 0 && hmmRisk >= 0) {
        // Conservative fusion: take the lower risk (more defensive) of the two
        const fusedIdx = Math.min(fredRisk, hmmRisk);
        regimeCtx.state5 = riskOrder[fusedIdx];
        regimeCtx.fusionNote = fredRisk === hmmRisk ? "FRED & HMM agree" : `Conservative: FRED=${fredState5} HMM=${hmmState5} → ${riskOrder[fusedIdx]}`;
      }
    }

    // ── Step 4: Run optimizer with live candidates ──
    setLastRegimeCtx(regimeCtx);
    const result = optimizeCash(allPos, cashBalance, holdingsVal, candidates, ot, srMode, volTarget, useKelly, regimeCtx);
    setOptResult(result);
    setAccepted(new Set());

    // ── Step 5: Batch-fetch live prices for all recommendations ──
    // Single API call instead of per-recommendation fetch — avoids Yahoo rate limiting
    if (result && result.length > 0) {
      try {
        const recTickers = result.map(r => r.ticker);
        // Normalize tickers for Yahoo (BRK.B → BRK-B)
        const yahooTickers = recTickers.map(t => t.replace(".", "-"));
        const prices = {};
        for (let i = 0; i < yahooTickers.length; i += 50) {
          const batch = yahooTickers.slice(i, i + 50);
          try {
            const resp = await fetch(`/api/prices?tickers=${batch.join(",")}`);
            if (resp.ok) {
              const json = await resp.json();
              if (json.data) {
                // Map Yahoo tickers back to original format
                for (const [yahooSym, data] of Object.entries(json.data)) {
                  const origSym = recTickers.find(t => t.replace(".", "-") === yahooSym) || yahooSym;
                  prices[origSym] = data;
                }
              }
            }
          } catch (e) { console.warn("Batch rec price fetch failed:", e); }
        }
        setRecPrices(prices);
      } catch (e) { console.warn("Rec price batch failed:", e); }
    }
    } catch (e) { console.error("Optimizer error:", e); }
    setOptRunning(false);
  }, [allPos, cashBalance, holdingsVal, ot, srMode, volTarget, useKelly, useRegime, regimeData, regimeAnalytics, hmmResult, includeStocks]);

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
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Gradient accent line */}
      <div className="header-accent" />

      {/* HEADER */}
      <div className="header-glass" style={{ borderBottom: `1px solid ${cs.border}`, padding: "11px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(22,22,22,.92)", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 8px rgba(0,0,0,.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 4, background: `linear-gradient(135deg, ${cs.blue}, ${cs.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", boxShadow: `0 0 12px ${cs.blue}30` }}>P</div>
          <div><div style={{ fontSize: 14, fontWeight: 700, letterSpacing: ".01em" }}>Portfolio Architect</div>
            <div style={{ fontSize: 8, color: cs.muted, letterSpacing: ".08em", textTransform: "uppercase", fontFamily: mono2 }}>Intelligent Portfolio Optimization</div></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {totalVal > 0 && <span style={{ fontSize: 11, fontFamily: mono2, color: cs.text, fontWeight: 700 }}>{fmt$(totalVal)}
            {totalPnL != null && <span style={{ color: totalPnL >= 0 ? cs.green : cs.red, fontSize: 9, fontWeight: 600, marginLeft: 5 }}>
              {totalPnL >= 0 ? "+" : ""}{fmt$(totalPnL)} ({totalPnLPct >= 0 ? "+" : ""}{totalPnLPct.toFixed(1)}%)
            </span>}
            {totalDayChange && <span style={{ color: totalDayChange.dollar >= 0 ? cs.green : cs.red, fontSize: 8, fontWeight: 400, marginLeft: 4 }}>
              Day {totalDayChange.dollar >= 0 ? "+" : ""}{fmt$(totalDayChange.dollar)}
            </span>}
          </span>}
          <button onClick={() => setSrMode(m => m === "std" ? "var" : m === "var" ? "vol2" : "std")} style={{ padding: "4px 8px", border: `1px solid ${srMode !== "std" ? "rgba(190,149,255,.3)" : "#393939"}`, background: srMode !== "std" ? "rgba(190,149,255,.1)" : "transparent", color: srMode !== "std" ? cs.pink : cs.dim, fontSize: 8, cursor: "pointer", fontFamily: mono2, fontWeight: 600 }}>{srMode === "var" ? "VaR" : srMode === "vol2" ? "σ²" : "Std"} SR</button>
          {lastF && <span className="live-badge" style={{ fontSize: 7, color: cs.muted, fontFamily: mono2, paddingLeft: 10 }}>{lastF.toLocaleTimeString()} · {Object.keys(live).length}/{etfs.length + stocks.length} live</span>}
          <button onClick={fetchLive} disabled={liveL} style={{ padding: "5px 10px", border: `1px solid ${lastF ? "rgba(66,190,101,.25)" : "rgba(66,190,101,.12)"}`, background: liveL ? "rgba(66,190,101,.08)" : "rgba(66,190,101,.15)", color: cs.green, fontSize: 9, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, boxShadow: lastF ? `0 0 8px rgba(66,190,101,.1)` : "none" }}>{liveL ? "Refreshing..." : lastF ? "⟳ Refresh" : "⟳ Get Prices"}</button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ borderBottom: `1px solid ${cs.border}`, padding: "0 16px", background: "rgba(22,22,22,.95)", position: "sticky", top: 52, zIndex: 99, display: "flex", overflowX: "auto", gap: 1 }}>
        {TABS.map(t => (
          <button key={t} className={`tab-btn${tab === t ? " active" : ""}`} onClick={() => setTab(t)} style={{ padding: "10px 16px", border: "none", cursor: "pointer", fontSize: 10, fontWeight: tab === t ? 700 : 500, fontFamily: "inherit", background: tab === t ? "rgba(120,169,255,.06)" : "transparent", color: tab === t ? cs.blue : cs.muted, borderBottom: tab === t ? `2px solid ${cs.blue}` : "2px solid transparent", whiteSpace: "nowrap", letterSpacing: ".02em" }}>{t}{t === "AI Advisor" ? " ✦" : ""}</button>
        ))}
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "14px 14px 50px" }}>

        {/* ════ MY HOLDINGS ════ */}
        {tab === "My Portfolio" && <div className="tab-content">
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
            <div style={{ display: "flex", borderRadius: 3, overflow: "hidden", height: 8, background: "#1a1a1a", boxShadow: "inset 0 1px 3px rgba(0,0,0,.3)" }}>{catBreak.map((it, i) => (<div key={i} className="alloc-segment" style={{ width: `${(it.v / Math.max(catBreak.reduce((s, x) => s + x.v, 0), .01)) * 100}%`, background: it.c, cursor: "pointer" }} title={`${it.l}: ${fmt$(it.v)}`} />))}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              {catBreak.map((it, i) => <span key={i} style={{ fontSize: 8, color: cs.dim, display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: 2, background: it.c, display: "inline-block" }} />{it.l} {fmt$(it.v)}</span>)}
            </div>
          </div>}

          {/* Portfolio vs S&P 500 Performance */}
          <PortfolioPerf etfV={etfV} stockV={stockV} holdingsVal={holdingsVal} totalCostBasis={totalCostBasis} live={live} lastF={lastF} />

          {/* Cash contribution */}
          <div style={{ ...cardS, background: "rgba(120,169,255,.04)", borderColor: "rgba(96,165,250,.1)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: cs.blue, marginBottom: 6 }}>💰 Cash Balance</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: mono2, color: cs.blue }}>{fmt$(cashBalance)}</div>
              <div style={{ fontSize: 9, color: cs.dim }}>available to invest</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", background: "rgba(120,169,255,.05)", borderRadius: 0, border: "1px solid rgba(96,165,250,.08)" }}>
              <span style={{ fontSize: 10, color: cs.dim, whiteSpace: "nowrap" }}>Contribute $</span>
              <input id="cashContribInput" type="number" placeholder="10,000" style={{ ...inpS, flex: 1, fontSize: 13, fontWeight: 600, color: cs.blue, borderColor: "rgba(96,165,250,.15)", textAlign: "right" }} onKeyDown={e => { if (e.key === "Enter") { const v = +e.target.value || 0; if (v > 0) { setCashBalance(prev => prev + v); e.target.value = ""; } } }} />
              <button onClick={() => { const inp = document.getElementById("cashContribInput"); const v = +(inp?.value) || 0; if (v > 0) { setCashBalance(prev => prev + v); inp.value = ""; } }} style={{ padding: "6px 14px", borderRadius: 0, border: "1px solid rgba(96,165,250,.2)", background: "rgba(96,165,250,.1)", color: cs.blue, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>+ Add</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", background: "rgba(248,113,113,.02)", borderRadius: 0, border: "1px solid rgba(248,113,113,.08)", marginTop: 6 }}>
              <span style={{ fontSize: 10, color: cs.red, whiteSpace: "nowrap" }}>Withdraw $</span>
              <input id="cashWithdrawInput" type="number" placeholder="0" style={{ ...inpS, flex: 1, fontSize: 13, fontWeight: 600, color: cs.red, borderColor: "rgba(255,131,137,.18)", textAlign: "right" }} onKeyDown={e => { if (e.key === "Enter") { const v = +e.target.value || 0; if (v > 0) { setCashBalance(prev => Math.max(0, prev - v)); e.target.value = ""; } } }} />
              <button onClick={() => { const inp = document.getElementById("cashWithdrawInput"); const v = +(inp?.value) || 0; if (v > 0) { setCashBalance(prev => Math.max(0, prev - v)); inp.value = ""; } }} style={{ padding: "6px 14px", borderRadius: 0, border: "1px solid rgba(248,113,113,.15)", background: "rgba(255,131,137,.08)", color: cs.red, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>− Withdraw</button>
            </div>
            <div style={{ fontSize: 8, color: cs.dim, marginTop: 4 }}>Contribute or withdraw cash. Balance cannot go below $0.</div>
          </div>

          {/* Tax residency state */}
          <div style={{ ...cardS, background: "rgba(167,139,250,.02)", borderColor: "rgba(190,149,255,.1)", padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: cs.purple }}>🏛 Tax Residency</div>
                <div style={{ fontSize: 8, color: cs.dim, marginTop: 1 }}>Used for rebalancing, tax-loss harvesting, and backtest tax drag</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <select value={taxState} onChange={e => setTaxState(e.target.value)} style={{ background: "#262626", border: "1px solid rgba(167,139,250,.15)", borderRadius: 0, color: cs.text, padding: "4px 8px", fontSize: 10, fontFamily: "inherit", cursor: "pointer", outline: "none" }}>
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
                  <button key={t} onClick={() => { setAddType(t); setSf({ t: "", n: "", sh: "", cb: "", sec: "Technology", pd: "" }); setStockResults([]) }} style={{ padding: "4px 10px", borderRadius: 0, border: "1px solid", borderColor: addType === t ? "rgba(66,190,101,.25)" : "#393939", background: addType === t ? "rgba(66,190,101,.1)" : "transparent", color: addType === t ? cs.green : cs.dim, fontSize: 9, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>{t === "stock" ? "Stock" : "ETF"}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: 10, background: "#1c1c1c", borderRadius: 0, border: "1px solid #262626" }}>
              <div style={{ flex: "1 1 80px", minWidth: 70, position: "relative" }}>
                <label style={{ fontSize: 8, color: cs.dim, display: "block", marginBottom: 2, fontFamily: mono2 }}>TICKER</label>
                <input value={sf.t} onChange={e => { setSf(f => ({ ...f, t: e.target.value, livePrice: null })); setStockDD(true); searchTicker(e.target.value) }} onFocus={() => { if (sf.t) { setStockDD(true); searchTicker(sf.t) } }} placeholder={addType === "etf" ? "VOO" : "AAPL"} style={inpS} autoComplete="off" />
                {stockDD && (stockResults.length > 0 || stockSearching) && <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 60, background: "#14161c", border: "1px solid #393939", borderRadius: 0, maxHeight: 240, overflowY: "auto", boxShadow: "0 8px 28px rgba(0,0,0,.6)", marginTop: 2, minWidth: 220 }}>
                  {stockResults.map(stk => (
                    <div key={stk.t} onClick={() => selectTicker(stk)} style={{ padding: "7px 10px", cursor: "pointer", borderBottom: "1px solid #222222", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = "#262626"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
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
              <div style={{ flex: "1 1 90px", minWidth: 80 }}><label style={{ fontSize: 8, color: cs.dim, display: "block", marginBottom: 2, fontFamily: mono2 }}>DATE BOUGHT</label>
                <input type="date" value={sf.pd} onChange={e => setSf(f => ({ ...f, pd: e.target.value }))} max={new Date().toISOString().slice(0, 10)} style={{ ...inpS, fontSize: 10 }} /></div>
              <div style={{ display: "flex", alignItems: "end" }}><button onClick={addHolding} disabled={adding} style={{ padding: "7px 14px", borderRadius: 0, border: "none", background: adding ? "#393939" : cs.blue, color: adding ? cs.dim : cs.bg, fontSize: 10, fontWeight: 700, cursor: adding ? "wait" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>{adding ? "Fetching price..." : "+ Add"}</button></div>
            </div>
            {(adding || priceInfo) && <div style={{ marginTop: 6, padding: "5px 9px", borderRadius: 0, background: "rgba(66,190,101,.06)", fontSize: 9, color: cs.green }}>
              {adding ? <><span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>✦</span> Fetching live price...</> : `✓ ${priceInfo}`}
            </div>}
          </div>

          {/* Holdings list */}
          {(etfV.length > 0 || stockV.length > 0) && <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {stockV.length > 0 && <div style={{ fontSize: 10, fontWeight: 600, color: cs.yellow, marginBottom: 2, marginTop: 4 }}>Stocks ({stockV.length})</div>}
            {stockV.map(s => {
              const gl = s.shares > 0 && s.costBasis > 0 ? s.mktValue - (s.shares * s.costBasis) : null;
              const glPct = gl != null && s.costBasis > 0 ? ((s.mktValue / (s.shares * s.costBasis)) - 1) * 100 : null;
              const hp = holdingPeriod(s.purchaseDate);
              const lp = live[s.ticker];
              const dayChg = lp?.change || 0;
              return (
              <div key={s.ticker} className="holding-row" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", borderRadius: 3, background: s.locked ? "rgba(255,171,145,.02)" : cs.card, border: `1px solid ${s.locked ? "rgba(255,171,145,.08)" : cs.border}` }}>
                <button onClick={() => setStocks(p => p.map(st => st.ticker === s.ticker ? { ...st, locked: !st.locked } : st))}
                  title={s.locked ? "Locked — optimizer works around this stock. Click to unlock." : "Unlocked — optimizer may suggest selling. Click to lock."}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: "2px", opacity: s.locked ? 1 : 0.4 }}>
                  {s.locked ? "🔒" : "🔓"}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexWrap: "wrap", marginBottom: 2 }}>
                    <span style={{ fontFamily: mono2, fontWeight: 600, fontSize: 12, color: cs.yellow }}>{s.ticker}</span>
                    <span style={{ fontSize: 9, color: cs.dim }}>{s.name}</span>
                    <Badge color={cs.dim}>{s.sector}</Badge>
                    {hp && <Badge color={hp.isLT ? cs.green : cs.yellow}>{hp.isLT ? "LT" : `${hp.daysToLT}d→LT`}</Badge>}
                  </div>
                  <div style={{ fontSize: 8, color: cs.muted, fontFamily: mono2 }}>
                    {s.shares > 0 ? `${s.shares} sh` : "—"}
                    {lp && <span> · <span style={{ color: cs.text }}>${lp.price?.toFixed(2)}</span></span>}
                    {!lp && s.costBasis > 0 && <span> · Cost ${(+s.costBasis).toFixed(2)}</span>}
                    {s.shares > 0 && s.costBasis > 0 && <span> · Basis {fmt$(s.shares * s.costBasis)}</span>}
                    {totalVal > 0 && <span> · Wt {((s.mktValue / totalVal) * 100).toFixed(1)}%</span>}
                    {gl != null && gl > 0 && <span style={{ color: cs.purple, fontSize: 7 }}> · tax ~{fmt$(gl * (hp?.isLT ? taxRates.lt : taxRates.st) / 100)} ({(hp?.isLT ? taxRates.lt : taxRates.st).toFixed(0)}%)</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 85 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: mono2, color: lp ? cs.text : cs.dim }}>{fmt$(s.mktValue)}</div>
                  {gl != null && <div style={{ fontSize: 10, fontWeight: 600, fontFamily: mono2, color: gl >= 0 ? cs.green : cs.red }}>
                    {gl >= 0 ? "+" : ""}{fmt$(gl)} <span style={{ fontSize: 8, fontWeight: 400 }}>({glPct >= 0 ? "+" : ""}{glPct.toFixed(1)}%)</span>
                  </div>}
                  {lp ? <div style={{ fontSize: 8, fontFamily: mono2, color: dayChg >= 0 ? cs.green : cs.red }}>
                    Day {dayChg > 0 ? "+" : ""}{dayChg.toFixed(2)}%
                  </div> : s.shares > 0 && <div style={{ fontSize: 7, fontFamily: mono2, color: cs.yellow }}>at cost — awaiting live price</div>}
                </div>
                <button onClick={() => removeHolding(s.ticker, "stock")} style={{ background: "none", border: "none", color: cs.muted, cursor: "pointer", fontSize: 14 }} onMouseEnter={e => e.currentTarget.style.color = cs.red} onMouseLeave={e => e.currentTarget.style.color = cs.muted}>×</button>
              </div>);
            })}

            {etfV.length > 0 && <div style={{ fontSize: 10, fontWeight: 600, color: cs.green, marginBottom: 2, marginTop: 8 }}>📊 ETF Holdings ({etfV.length})</div>}
            {etfV.map((e, idx) => {
              const gl = e.shares > 0 && e.costBasis > 0 ? e.mktValue - (e.shares * e.costBasis) : null;
              const glPct = gl != null && e.costBasis > 0 ? ((e.mktValue / (e.shares * e.costBasis)) - 1) * 100 : null;
              const hp = holdingPeriod(e.purchaseDate);
              const lp = live[e.ticker];
              const dayChg = lp?.change || 0;
              return (
              <div key={e.ticker} className="holding-row" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", borderRadius: 3, background: cs.card, border: `1px solid ${cs.border}` }}>
                <div style={{ width: 4, height: 40, background: PAL[idx % PAL.length] }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 2 }}>
                    <span style={{ fontFamily: mono2, fontWeight: 600, fontSize: 12, color: cs.green }}>{e.ticker}</span>
                    <span style={{ fontSize: 9, color: cs.dim }}>{e.data?.n}</span>
                    <Badge color={cs.dim}>{e.data?.c}</Badge>
                    {hp && <Badge color={hp.isLT ? cs.green : cs.yellow}>{hp.isLT ? "LT" : `${hp.daysToLT}d→LT`}</Badge>}
                    {hp && hp.days < 10 && <Badge color={cs.red}>HOLD {10 - hp.days}d</Badge>}
                  </div>
                  <div style={{ fontSize: 8, color: cs.muted, fontFamily: mono2 }}>
                    {e.shares > 0 ? `${e.shares} sh` : "—"}
                    {lp && <span> · <span style={{ color: cs.text }}>${lp.price?.toFixed(2)}</span></span>}
                    {!lp && e.costBasis > 0 && <span> · Cost ${(+e.costBasis).toFixed(2)}</span>}
                    {e.shares > 0 && e.costBasis > 0 && <span> · Basis {fmt$(e.shares * e.costBasis)}</span>}
                    {totalVal > 0 && <span> · Wt {((e.mktValue / totalVal) * 100).toFixed(1)}%</span>}
                    {gl != null && gl > 0 && <span style={{ color: cs.purple, fontSize: 7 }}> · tax ~{fmt$(gl * (hp?.isLT ? taxRates.lt : taxRates.st) / 100)} ({(hp?.isLT ? taxRates.lt : taxRates.st).toFixed(0)}%)</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 85 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: mono2, color: lp ? cs.text : cs.dim }}>{fmt$(e.mktValue)}</div>
                  {gl != null && <div style={{ fontSize: 10, fontWeight: 600, fontFamily: mono2, color: gl >= 0 ? cs.green : cs.red }}>
                    {gl >= 0 ? "+" : ""}{fmt$(gl)} <span style={{ fontSize: 8, fontWeight: 400 }}>({glPct >= 0 ? "+" : ""}{glPct.toFixed(1)}%)</span>
                  </div>}
                  {lp ? <div style={{ fontSize: 8, fontFamily: mono2, color: dayChg >= 0 ? cs.green : cs.red }}>
                    Day {dayChg > 0 ? "+" : ""}{dayChg.toFixed(2)}%
                  </div> : e.shares > 0 && <div style={{ fontSize: 7, fontFamily: mono2, color: cs.yellow }}>at cost — awaiting live price</div>}
                </div>
                {(() => { const held = hp ? hp.days : 999; return (
                  <button onClick={() => removeHolding(e.ticker, "etf")}
                    title={held < 10 ? `Must hold ${10 - held} more day${10 - held !== 1 ? "s" : ""} (10-day minimum)` : "Remove"}
                    style={{ background: "none", border: "none", color: held < 10 ? "#393939" : cs.muted, cursor: held < 10 ? "not-allowed" : "pointer", fontSize: 14 }}
                    onMouseEnter={e2 => { if (held >= 10) e2.currentTarget.style.color = cs.red }}
                    onMouseLeave={e2 => { e2.currentTarget.style.color = held < 10 ? "#393939" : cs.muted }}>×</button>
                ); })()}
              </div>);
            })}
          </div>}

          {!etfV.length && !stockV.length && <div style={{ textAlign: "center", padding: "48px 24px", border: "1px dashed rgba(120,169,255,.12)", borderRadius: 4, background: "rgba(120,169,255,.02)" }}>
            <div style={{ fontSize: 32, marginBottom: 8, opacity: .8 }}>📊</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: cs.text, marginBottom: 4 }}>Add Your Existing Holdings</div>
            <div style={{ fontSize: 10, color: cs.dim, maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>Add your stocks and ETFs above. Stocks can be locked (optimizer works around them) or unlocked. ETFs require a 10-day minimum hold. Set your purchase date for accurate tax tracking.</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16 }}>
              <div style={{ fontSize: 9, color: cs.blue, fontFamily: mono2 }}>1. Search ticker</div>
              <div style={{ fontSize: 9, color: cs.green, fontFamily: mono2 }}>2. Enter shares & cost</div>
              <div style={{ fontSize: 9, color: cs.purple, fontFamily: mono2 }}>3. Deploy cash</div>
            </div>
          </div>}
        </div>}

        {/* ════ DEPLOY CASH ════ */}
        {tab === "Deploy Cash" && <div className="tab-content">
          <div style={{ ...cardS, background: "rgba(120,169,255,.05)", borderColor: "rgba(96,165,250,.12)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div><div style={{ fontSize: 13, fontWeight: 700 }}>🎯 Deploy ${cashBalance.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: cs.dim, marginTop: 2 }}>Fetches trailing 12-month history for all candidates, computes recency-weighted returns and volatility with return shrinkage, then runs 6,000 Monte Carlo simulations. SPY-overlap penalty rewards differentiation. {includeStocks ? "Stocks filtered to S&P 500 sector leaders." : ""}</div></div>
              {cashBalance <= 0 && <div style={{ padding: "8px 12px", borderRadius: 0, background: "rgba(255,171,145,.08)", border: "1px solid rgba(251,191,36,.12)", fontSize: 10, color: cs.yellow }}>← Add cash in "My Portfolio" tab first</div>}
            </div>

            {cashBalance > 0 && <>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
                {[{ k: "max_sharpe", l: "Max Sharpe", d: "Risk-adjusted" }, { k: "min_vol", l: "Min Volatility", d: "Lowest risk" }, { k: "max_return", l: "Max Return", d: srMode === "var" ? "Aggressive + DD brake" : "Full aggressive" }, { k: "risk_parity", l: "Risk Parity", d: "Equal risk" }, { k: "balanced", l: "Balanced", d: "Multi-factor" }].map(o => (
                  <button key={o.k} onClick={() => setOt(o.k)} style={{ flex: "1 1 100px", padding: "8px 12px", borderRadius: 0, border: "1px solid", borderColor: ot === o.k ? "rgba(66,190,101,.25)" : "#2a2a2a", background: ot === o.k ? "rgba(66,190,101,.08)" : "#1c1c1c", color: ot === o.k ? cs.green : cs.dim, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                    <div style={{ fontSize: 10, fontWeight: 600 }}>{o.l}</div><div style={{ fontSize: 8, opacity: .7 }}>{o.d}</div>
                  </button>
                ))}
              </div>

              {/* Advanced: Vol Target + Sharpe mode */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, flex: "1 1 200px", padding: "7px 10px", borderRadius: 0, border: "1px solid rgba(96,165,250,.12)", background: "rgba(120,169,255,.05)" }}>
                  <span style={{ fontSize: 9, color: cs.blue, fontWeight: 600, whiteSpace: "nowrap" }}>🎯 Vol Target</span>
                  <input type="number" value={volTarget || ""} onChange={e => setVolTarget(Math.max(0, +e.target.value || 0))} placeholder="off" step="1" min="0" max="50" style={{ ...inpS, width: 55, fontSize: 11, fontWeight: 600, textAlign: "center", color: cs.blue, borderColor: "rgba(96,165,250,.15)" }} />
                  <span style={{ fontSize: 8, color: cs.dim }}>%</span>
                  {[8, 12, 16, 20].map(v => (
                    <button key={v} onClick={() => setVolTarget(volTarget === v ? 0 : v)} style={{ padding: "3px 6px", borderRadius: 0, border: `1px solid ${volTarget === v ? "rgba(96,165,250,.3)" : "#393939"}`, background: volTarget === v ? "rgba(96,165,250,.12)" : "transparent", color: volTarget === v ? cs.blue : cs.dim, fontSize: 8, cursor: "pointer", fontFamily: mono2, fontWeight: 600 }}>{v}%</button>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 10px", borderRadius: 0, border: "1px solid rgba(244,114,182,.1)", background: "rgba(244,114,182,.02)" }}>
                  <span style={{ fontSize: 9, color: cs.pink, fontWeight: 600, whiteSpace: "nowrap" }}>SR Mode</span>
                  {[{k:"std",l:"(R-Rf)/σ"},{k:"var",l:"(R-Rf)/VaR"},{k:"vol2",l:"(R-Rf)/σ²"}].map(m => (
                    <button key={m.k} onClick={() => setSrMode(m.k)} style={{ padding: "3px 7px", borderRadius: 0, border: `1px solid ${srMode === m.k ? (m.k === "std" ? "rgba(66,190,101,.3)" : "rgba(190,149,255,.3)") : "#393939"}`, background: srMode === m.k ? (m.k === "std" ? "rgba(66,190,101,.1)" : "rgba(190,149,255,.1)") : "transparent", color: srMode === m.k ? (m.k === "std" ? cs.green : cs.pink) : cs.dim, fontSize: 8, cursor: "pointer", fontFamily: mono2, fontWeight: 600 }}>{m.l}</button>
                  ))}
                </div>
                <button onClick={() => setUseKelly(v => !v)} style={{ padding: "7px 10px", borderRadius: 0, border: `1px solid ${useKelly ? "rgba(190,149,255,.2)" : "#393939"}`, background: useKelly ? "rgba(190,149,255,.06)" : "transparent", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontFamily: "inherit" }}>
                  <span style={{ fontSize: 9, color: useKelly ? cs.purple : cs.dim, fontWeight: 600 }}>½K</span>
                  <span style={{ fontSize: 8, color: useKelly ? cs.purple : cs.dim }}>{useKelly ? "ON" : "OFF"}</span>
                </button>
                <button onClick={() => setUseRegime(v => !v)} style={{ padding: "7px 10px", borderRadius: 0, border: `1px solid ${useRegime ? "rgba(255,171,145,.2)" : "#393939"}`, background: useRegime ? "rgba(255,171,145,.06)" : "transparent", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontFamily: "inherit" }}>
                  <span style={{ fontSize: 9, color: useRegime ? cs.yellow : cs.dim, fontWeight: 600 }}>🌊</span>
                  <span style={{ fontSize: 8, color: useRegime ? cs.yellow : cs.dim }}>{useRegime ? (hmmResult ? `${hmmResult.currentEnsemble.name} (HMM+FRED)` : regimeData?.regime?.state5 ? regimeData.regime.state5.replace(/_/g," ").toUpperCase() : regimeData?.regime?.regime?.toUpperCase() || "ON") : "OFF"}</span>
                </button>
                <button onClick={() => setIncludeStocks(v => !v)} style={{ padding: "7px 10px", borderRadius: 0, border: `1px solid ${includeStocks ? "rgba(120,169,255,.2)" : "#393939"}`, background: includeStocks ? "rgba(120,169,255,.06)" : "transparent", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontFamily: "inherit" }}>
                  <span style={{ fontSize: 9, color: includeStocks ? cs.blue : cs.dim, fontWeight: 600 }}>📈</span>
                  <span style={{ fontSize: 8, color: includeStocks ? cs.blue : cs.dim }}>{includeStocks ? "ETF+Stocks" : "ETF Only"}</span>
                </button>
              </div>

              {ot === "max_return" && srMode === "var" && <div style={{ fontSize: 8, color: cs.pink, marginBottom: 4 }}>🚀 Max Return + VaR: aggressive growth with a light drawdown brake. Return is weighted 1.5x with a mild VaR penalty. Hard constraints (min 3 positions, 25% stock cap, return shrinkage) still apply.</div>}
              {ot === "max_return" && srMode !== "var" && <div style={{ fontSize: 8, color: cs.pink, marginBottom: 4 }}>🚀 Max Return: full aggressive. Return weighted 1.5x with minimal vol penalty. The optimizer will chase the highest-returning assets within the diversification constraints. Switch to VaR mode for a light drawdown brake.</div>}
              {ot === "risk_parity" && <div style={{ fontSize: 8, color: cs.purple, marginBottom: 4 }}>⚖️ Risk Parity: each position contributes equal portfolio risk. Low-vol assets get higher weight, high-vol assets get lower weight. Iterative risk budgeting with Sharpe tiebreaker. Best in uncertain regimes where you want max diversification without directional bets.</div>}

              <button onClick={runOptimizer} disabled={optRunning} style={{ width: "100%", padding: "11px", borderRadius: 0, border: "none", background: optRunning ? "#2a2a2a" : cs.blue, color: optRunning ? cs.dim : cs.bg, fontSize: 12, fontWeight: 700, cursor: optRunning ? "wait" : "pointer", fontFamily: "inherit" }}>
                {optRunning ? "Fetching trailing data & optimizing..." : `Run Optimizer — Deploy $${cashBalance.toLocaleString()}${includeStocks ? " (ETF+Stocks)" : ""}${useRegime && regimeData?.regime?.state5 ? ` (${regimeData.regime.state5.replace(/_/g," ")})` : ""}`}
              </button>
              {useRegime && !regimeData && <div style={{ marginTop: 5, fontSize: 8, color: cs.yellow }}>⚠ Regime data loading — fetches automatically on app launch from 12 FRED macro indicators. If this persists, check FRED_API_KEY in Vercel env vars.</div>}

              {stocks.length > 0 && (() => { const locked = stocks.filter(s => s.locked); const unlocked = stocks.filter(s => !s.locked); return <>
                {locked.length > 0 && <div style={{ marginTop: 7, fontSize: 9, color: cs.yellow }}>🔒 {locked.map(s => s.ticker).join(", ")} locked — optimizer works around them.</div>}
                {unlocked.length > 0 && <div style={{ marginTop: locked.length > 0 ? 2 : 7, fontSize: 9, color: cs.dim }}>🔓 {unlocked.map(s => s.ticker).join(", ")} unlocked — optimizer may suggest selling.</div>}
              </>; })()}
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
            {/* Regime context used for this optimization */}
            {lastRegimeCtx && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, padding: "6px 8px", borderRadius: 0, background: "rgba(255,171,145,.04)", border: "1px solid rgba(251,191,36,.06)" }}>
              <span style={{ fontSize: 8, fontWeight: 600, color: cs.yellow }}>🌊 Regime Context:</span>
              <span style={{ fontSize: 8, fontFamily: mono2, color: cs.text }}>{lastRegimeCtx.state5?.replace(/_/g, " ")}</span>
              <span style={{ fontSize: 8, fontFamily: mono2, color: cs.dim }}>Duration: <span style={{ color: cs.text }}>{lastRegimeCtx.threeStage?.effectiveDuration || lastRegimeCtx.duration}m{lastRegimeCtx.threeStage?.effectiveDuration && lastRegimeCtx.threeStage.effectiveDuration !== lastRegimeCtx.threeStage.currentDuration ? ` (eff.)` : ""}</span></span>
              {lastRegimeCtx.acceleration != null && <span style={{ fontSize: 8, fontFamily: mono2, color: lastRegimeCtx.acceleration > 0.1 ? cs.red : lastRegimeCtx.acceleration < -0.1 ? cs.green : cs.dim }}>Accel: {lastRegimeCtx.acceleration > 0 ? "+" : ""}{lastRegimeCtx.acceleration.toFixed(2)}</span>}
              {/* Three-stage pattern display */}
              {lastRegimeCtx.threeStage ? <>
                <span style={{ fontSize: 8, fontFamily: mono2, color: cs.blue }}>{lastRegimeCtx.threeStage.pattern} <span style={{ color: cs.dim }}>({lastRegimeCtx.threeStage.bridgeDuration}m bridge)</span></span>
                <Badge color={lastRegimeCtx.threeStage.patternSignal > 0 ? cs.green : lastRegimeCtx.threeStage.patternSignal < 0 ? cs.red : cs.dim}>
                  {lastRegimeCtx.threeStage.patternType?.replace(/_/g, " ").toUpperCase()} {lastRegimeCtx.threeStage.patternSignal !== 0 ? `${lastRegimeCtx.threeStage.patternSignal > 0 ? "+" : ""}${(lastRegimeCtx.threeStage.patternSignal * 100).toFixed(0)}%` : ""}
                </Badge>
              </> : lastRegimeCtx.transition && <>
                <span style={{ fontSize: 8, fontFamily: mono2, color: cs.blue }}>Transition: {lastRegimeCtx.transition}</span>
                {(() => {
                  const [from, to] = lastRegimeCtx.transition.includes("→") ? lastRegimeCtx.transition.split("→") : [null, null];
                  if (from === "bear" && (to === "bull" || to === "neutral") && lastRegimeCtx.duration >= 2 && lastRegimeCtx.duration <= 8) return <Badge color={cs.green}>ENTRY +8%</Badge>;
                  if (from === "neutral" && to === "bull" && lastRegimeCtx.duration >= 1 && lastRegimeCtx.duration <= 4) return <Badge color={cs.green}>ENTRY +4%</Badge>;
                  return null;
                })()}
              </>}
              {lastRegimeCtx.durationModel && (() => {
                const fwd = getRegimeDurationFwd(lastRegimeCtx.durationModel, lastRegimeCtx.state5, lastRegimeCtx.duration);
                if (fwd.confidence > 0.3) return <span style={{ fontSize: 8, fontFamily: mono2, color: fwd.fwd > 10 ? cs.green : fwd.fwd < 0 ? cs.red : cs.dim }}>Fwd 6m: <span style={{ fontWeight: 600 }}>{fwd.fwd > 0 ? "+" : ""}{fwd.fwd.toFixed(1)}%</span> <span style={{ fontSize: 7, color: cs.dim }}>({fwd.count} obs, {(fwd.confidence * 100).toFixed(0)}% conf)</span></span>;
                return null;
              })()}
              {!regimeAnalytics?.current && <span style={{ fontSize: 7, color: cs.yellow }}>(analytics loading — duration/entry signals pending)</span>}
            </div>}
            {useRegime && !lastRegimeCtx && <div style={{ fontSize: 8, color: cs.yellow, marginBottom: 6 }}>⚠ Regime enabled but data not yet loaded — optimizer ran without regime tilts.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {optResult.map(r => {
                const isAccepted = accepted.has(r.ticker) || etfs.find(e => e.ticker === r.ticker) || stocks.find(s => s.ticker === r.ticker);
                const liveP = recPrices[r.ticker];
                const estShares = liveP?.price > 0 ? Math.floor(r.dollars / liveP.price) : null;
                return (
                <div key={r.ticker} onClick={() => toggleRec(r)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", borderRadius: 0,
                    background: isAccepted ? "rgba(66,190,101,.08)" : "rgba(66,190,101,.04)",
                    border: `1px solid ${isAccepted ? "rgba(66,190,101,.25)" : "rgba(66,190,101,.1)"}`,
                    cursor: "pointer", transition: "all .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = isAccepted ? "rgba(255,131,137,.08)" : "rgba(66,190,101,.1)" }}
                  onMouseLeave={e => { e.currentTarget.style.background = isAccepted ? "rgba(66,190,101,.08)" : "rgba(66,190,101,.04)" }}>
                  <Badge color={isAccepted ? cs.green : cs.blue}>{isAccepted ? "✓ ADDED" : "BUY"}</Badge>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: mono2, fontWeight: 600, fontSize: 12, color: isAccepted ? cs.green : cs.text }}>{r.ticker}</span>
                      <span style={{ fontSize: 9, color: cs.dim }}>{r.name}</span>
                      <Badge color={cs.dim}>{r.cat}</Badge>
                      {r.isStock && <Badge color={cs.blue}>STOCK</Badge>}
                      {r.lev && <Badge color={cs.red}>{r.lev > 0 ? `${r.lev}x LEV` : `${Math.abs(r.lev)}x INV`}</Badge>}
                    </div>
                    <div style={{ fontSize: 8, color: cs.muted, fontFamily: mono2, marginTop: 1 }}>
                      {r.lev ? `Stated R:${r.r?.toFixed?.(1) || r.r}% → Adj R:${r.adjR}% (decay:${r.decay}%)` : `R:${r.r?.toFixed?.(1) || r.r}%`} · V:{r.v?.toFixed?.(1) || r.v}% · ER:{r.er}%{r.hk != null ? ` · ½K:${r.hk}%` : ""}
                      {liveP && <span style={{ color: cs.text }}> · <span style={{ color: liveP.change >= 0 ? cs.green : cs.red }}>${liveP.price?.toFixed(2)} ({liveP.change > 0 ? "+" : ""}{liveP.change}%)</span></span>}
                      {estShares && <span> · ~{estShares} shares</span>}
                      {!liveP && <span style={{ color: cs.yellow }}> · Price pending</span>}
                      {r.lev && <span style={{ color: cs.red }}> · Vol decay drag</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: mono2, color: isAccepted ? cs.green : cs.text }}>${r.dollars.toLocaleString()}</div>
                    <div style={{ fontSize: 9, color: cs.dim, fontFamily: mono2 }}>{r.pct}% of cash</div>
                  </div>
                </div>
              )})}
            </div>

            {accepted.size > 0 && <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 0, background: "rgba(66,190,101,.06)", fontSize: 9, color: cs.green, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>✓ {accepted.size} of {optResult.length} added · Cash remaining: {fmt$(cashBalance)}</span>
              <span style={{ color: cs.dim }}>Click again to remove</span>
            </div>}

            {/* Accept all / Remove all buttons */}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {accepted.size < optResult.length && <button onClick={() => { optResult.forEach(r => { if (!accepted.has(r.ticker) && !etfs.find(e => e.ticker === r.ticker) && !stocks.find(s => s.ticker === r.ticker)) toggleRec(r) }) }}
                style={{ flex: 1, padding: "9px", borderRadius: 0, border: "1px solid rgba(110,231,183,.2)", background: "rgba(66,190,101,.08)", color: cs.green, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Add All {optResult.length - accepted.size} to Holdings
              </button>}
              {accepted.size > 0 && <button onClick={() => { [...accepted].forEach(ticker => { const rec = optResult.find(r => r.ticker === ticker); if (rec) toggleRec(rec) }) }}
                style={{ flex: accepted.size < optResult.length ? "0 0 auto" : 1, padding: "9px 16px", borderRadius: 0, border: "1px solid rgba(248,113,113,.15)", background: "rgba(255,131,137,.06)", color: cs.red, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
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

        {/* ════ PORTFOLIO ANALYSIS ════ */}
        {tab === "Portfolio Analysis" && <div className="tab-content">
          {!metrics ? <div style={{ textAlign: "center", padding: 45, color: cs.muted }}><div style={{ fontSize: 24, marginBottom: 5 }}>📈</div><div style={{ fontSize: 11 }}>Add holdings first</div></div>
            : <>
              <div style={{ display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap", padding: "14px 0 18px", borderBottom: "1px solid #262626", marginBottom: 14 }}>
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
              {(etfV.length > 0 || stockV.length > 0) && <div style={{ ...cardS, background: "rgba(167,139,250,.02)", borderColor: "rgba(190,149,255,.1)" }}>
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

              {/* ── Rebalance Advisor ── */}
              {metrics && totalVal > 0 && <div style={{ ...cardS, background: "rgba(66,190,101,.04)", borderColor: "rgba(110,231,183,.12)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: cs.green }}>🎯 Rebalance Advisor</div>
                    <div style={{ fontSize: 8, color: cs.dim, marginTop: 2 }}>Runs the optimizer on your full portfolio value to find the optimal allocation from scratch, then compares it against your current holdings using the same hurdle logic as the backtest.</div>
                  </div>
                  <button onClick={async () => {
                    setRebalRunning(true);
                    try {
                    // ── Fetch live trailing data (same as Deploy Cash optimizer) ──
                    const baseCandidates = includeStocks ? [...ETF_DB, ...STOCK_OPT] : ETF_DB;
                    const tickers = baseCandidates.map(c => c.t);
                    const endDate = new Date().toISOString().slice(0, 10);
                    const startDate = new Date(Date.now() - 14 * 30 * 86400000).toISOString().slice(0, 10);
                    let histData = {};
                    try {
                      for (let i = 0; i < tickers.length; i += 15) {
                        const batch = tickers.slice(i, i + 15);
                        const resp = await fetch(`/api/history?symbols=${batch.join(",")}&start=${startDate}&end=${endDate}`);
                        const json = await resp.json();
                        if (json.data) Object.assign(histData, json.data);
                      }
                    } catch (e) { console.warn("Rebal: failed to fetch history", e); }

                    let candidates;
                    const fetchedTickers = Object.keys(histData).filter(k => histData[k]?.length >= 7);
                    if (fetchedTickers.length > 10) {
                      const returnsByDate = {};
                      for (const sym of fetchedTickers) {
                        const prices = histData[sym].sort((a, b) => a.date.localeCompare(b.date));
                        for (let j = 1; j < prices.length; j++) {
                          const date = prices[j].date.slice(0, 7);
                          const ret = (prices[j].close - prices[j - 1].close) / prices[j - 1].close;
                          if (!returnsByDate[date]) returnsByDate[date] = {};
                          returnsByDate[date][sym] = { ret, close: prices[j].close };
                        }
                      }
                      const sortedDates = Object.keys(returnsByDate).sort();
                      const etfDbMap = {}; baseCandidates.forEach(c => { etfDbMap[c.t] = c; });
                      const liveCandidates = [];
                      const mIdx = sortedDates.length;
                      const trailStart = Math.max(0, mIdx - 12);
                      for (const sym of fetchedTickers) {
                        let sumWRet = 0, sumW = 0, sumRet = 0, sumRetSq = 0, count = 0;
                        for (let ti = trailStart; ti < mIdx; ti++) {
                          const entry = returnsByDate[sortedDates[ti]]?.[sym];
                          if (entry) { const age = mIdx - 1 - ti; const w = Math.exp(-0.05 * age); sumWRet += w * entry.ret; sumW += w; sumRet += entry.ret; sumRetSq += entry.ret * entry.ret; count++; }
                        }
                        if (count < 6) continue;
                        const db = etfDbMap[sym]; if (!db) continue;
                        const rawR = (sumWRet / sumW) * 12 * 100;
                        const shrunkR = shrinkReturn(rawR, db.type === "stock");
                        const vol = Math.max(Math.sqrt(Math.max(0, sumRetSq / count - (sumRet/count) ** 2)) * Math.sqrt(12) * 100, 1);
                        liveCandidates.push({ t: sym, n: db.n, c: db.c, h: db.h || 1, er: db.er || 0, d: db.d || 0, lev: db.lev || null, r: shrunkR, v: vol, type: db.type || "etf", ipo: db.ipo });
                      }
                      const liveSet = new Set(liveCandidates.map(c => c.t));
                      for (const c of baseCandidates) { if (!liveSet.has(c.t)) liveCandidates.push(c); }
                      candidates = liveCandidates.filter(c => c.t !== "SPY" && c.v > 0 && c.r > -80);
                    } else {
                      candidates = baseCandidates;
                    }

                    // Build regime context (same as Deploy Cash optimizer)
                    let regimeCtx = null;
                    if (useRegime && regimeData?.regime) {
                      const r = regimeData.regime;
                      regimeCtx = { state5: r.state5 || r.regime || "neutral", acceleration: r.acceleration || 0, duration: 1, transition: null };
                      if (regimeAnalytics?.current) { regimeCtx.duration = regimeAnalytics.current.runLength || 1; regimeCtx.transition = regimeAnalytics.current.transition || null; }
                      if (regimeAnalytics?.durationReturns) {
                        const dr = regimeAnalytics.durationReturns;
                        const bucketLabels = ["1-3m","4-6m","7-12m","13-24m","24m+"];
                        const model = {};
                        const stateMap = { bull: ["strong_risk_on","mild_risk_on"], neutral: ["neutral"], bear: ["mild_risk_off","strong_risk_off"] };
                        for (const [regime3, states5] of Object.entries(stateMap)) { if (!dr[regime3]) continue; for (const s5 of states5) { model[s5] = bucketLabels.map((label, i) => { const bData = dr[regime3][label]; if (!bData) return { avgFwd: 0, stdFwd: 0, confidence: 0, count: 0, label }; const fwd = bData.avg?.["6m"] || bData.avg?.["3m"] || 0; return { avgFwd: fwd, stdFwd: 0, confidence: Math.min(1, (bData.n || 0) / 12), count: bData.n || 0, label }; }); } }
                        regimeCtx.durationModel = model;
                      }
                      if (regimeAnalytics?.current) {
                        const ac = regimeAnalytics.current;
                        const curRegime = ac.regime || "neutral"; const prevRegime = ac.prevRegime || null; const prevDuration = ac.prevDuration || 0;
                        let bridgeRegime = null, bridgeDuration = 0;
                        if (ac.transition) { const [from] = ac.transition.includes("→") ? ac.transition.split("→") : [null]; if (from && from !== curRegime) { bridgeRegime = from; bridgeDuration = prevRegime && prevRegime !== from ? Math.min(prevDuration, 6) : 1; } }
                        if (prevRegime && bridgeRegime) {
                          let patternType, patternSignal;
                          if (prevRegime === curRegime) { patternType = bridgeDuration <= 2 ? "continuation_brief" : bridgeDuration <= 6 ? "continuation_extended" : "consolidation_reset"; patternSignal = patternType === "continuation_extended" ? (curRegime === "bull" ? 0.03 : curRegime === "bear" ? -0.03 : 0) : 0; }
                          else { if (prevRegime === "bear" && curRegime === "bull") { patternType = "reversal_bear_to_bull"; patternSignal = bridgeDuration <= 3 ? 0.10 : 0.06; } else if (prevRegime === "bull" && curRegime === "bear") { patternType = "reversal_bull_to_bear"; patternSignal = bridgeDuration <= 3 ? -0.10 : -0.06; } else { patternType = "transition"; patternSignal = 0; } }
                          const runLength = ac.runLength || 1;
                          regimeCtx.threeStage = { pattern: `${prevRegime}→${bridgeRegime}→${curRegime}`, patternType, patternSignal, prevRegime, prevDuration, bridgeRegime, bridgeDuration, currentRegime: curRegime, currentDuration: runLength, effectiveDuration: patternType === "continuation_brief" ? runLength + bridgeDuration + prevDuration : runLength };
                        }
                      }
                    }
                    // Run optimizer on FULL portfolio value with LIVE candidates
                    const optimalAlloc = optimizeCash([], totalVal, 0, candidates, ot, srMode, volTarget, useKelly, regimeCtx);

                    // Build current holdings map: ticker → { dollars, cat, r, v, costBasis, shares, purchaseDate, type }
                    const currentMap = {};
                    [...etfV, ...stockV].forEach(p => {
                      if (p.mktValue > 0) currentMap[p.ticker] = { dollars: p.mktValue, cat: p.data?.c || p.sector || "Stock", r: p.data?.r || 12, v: p.data?.v || 25, costBasis: p.costBasis || 0, shares: p.shares || 0, purchaseDate: p.purchaseDate, type: p.type || "etf", locked: p.locked || false };
                    });

                    // Build optimal holdings map
                    const optimalMap = {};
                    optimalAlloc.forEach(r => { optimalMap[r.ticker] = { dollars: r.dollars, pct: r.pct, cat: r.cat, r: r.r, v: r.v, name: r.name, isStock: r.isStock }; });

                    // Compute changes
                    const allTickers = [...new Set([...Object.keys(currentMap), ...Object.keys(optimalMap)])];
                    const sells = [], buys = [], keeps = [], reduces = [], increases = [];
                    let grossGains = 0, grossLosses = 0, stGains = 0, ltGains = 0;
                    let turnoverDollars = 0;

                    allTickers.forEach(ticker => {
                      const cur = currentMap[ticker];
                      const opt = optimalMap[ticker];

                      if (cur && !opt) {
                        // SELL: in current but not in optimal
                        if (cur.locked) { keeps.push({ ticker, action: "KEEP (locked)", curDollars: cur.dollars, optDollars: 0, reason: "Locked stock — not traded" }); return; }
                        const gl = cur.dollars - (cur.shares * cur.costBasis);
                        const hp = holdingPeriod(cur.purchaseDate);
                        if (gl > 0) { grossGains += gl; if (hp?.isLT) ltGains += gl; else stGains += gl; }
                        else grossLosses += Math.abs(gl);
                        turnoverDollars += cur.dollars;
                        sells.push({ ticker, curDollars: cur.dollars, gl, isLT: hp?.isLT, cat: cur.cat, reason: `Not in optimal portfolio — ${gl >= 0 ? "gain" : "loss"} of ${fmt$(Math.abs(gl))} (${hp?.isLT ? "LT" : "ST"})` });
                      } else if (!cur && opt) {
                        // BUY: in optimal but not in current
                        turnoverDollars += opt.dollars;
                        buys.push({ ticker, optDollars: opt.dollars, pct: opt.pct, name: opt.name, cat: opt.cat, reason: `New position — ${opt.pct.toFixed(1)}% of portfolio` });
                      } else if (cur && opt) {
                        // BOTH: check if weight changed significantly
                        const curPct = (cur.dollars / totalVal) * 100;
                        const optPct = opt.pct;
                        const diff = optPct - curPct;
                        if (Math.abs(diff) < 2) {
                          keeps.push({ ticker, curDollars: cur.dollars, optDollars: opt.dollars, curPct, optPct, reason: `Weight ~stable (${curPct.toFixed(1)}% → ${optPct.toFixed(1)}%)` });
                        } else if (diff > 0) {
                          turnoverDollars += (opt.dollars - cur.dollars);
                          increases.push({ ticker, curDollars: cur.dollars, optDollars: opt.dollars, curPct, optPct, reason: `Increase ${curPct.toFixed(1)}% → ${optPct.toFixed(1)}% (+${diff.toFixed(1)}%)` });
                        } else {
                          const sellAmt = cur.dollars - opt.dollars;
                          const proportion = sellAmt / cur.dollars;
                          const gl = proportion * (cur.dollars - (cur.shares * cur.costBasis));
                          const hp = holdingPeriod(cur.purchaseDate);
                          if (gl > 0) { grossGains += gl; if (hp?.isLT) ltGains += gl; else stGains += gl; }
                          else grossLosses += Math.abs(gl);
                          turnoverDollars += sellAmt;
                          reduces.push({ ticker, curDollars: cur.dollars, optDollars: opt.dollars, curPct, optPct, gl, reason: `Reduce ${curPct.toFixed(1)}% → ${optPct.toFixed(1)}% (${diff.toFixed(1)}%)` });
                        }
                      }
                    });

                    // Compute tax
                    const netGains = Math.max(0, grossGains - grossLosses);
                    const estTax = (Math.min(stGains, netGains) * taxRates.st / 100) + (Math.max(0, netGains - stGains) * taxRates.lt / 100);
                    const tcPct = totalVal > 0 ? (estTax / totalVal) * 100 : 0;
                    const turnoverPct = totalVal > 0 ? (turnoverDollars / totalVal) * 100 : 0;

                    // Hurdle — use FORWARD estimates, not raw trailing returns
                    // Raw metrics.er uses static DB returns for current, live trailing for proposed — unfair comparison
                    // shrinkToForward converts trailing returns to reasonable forward estimates
                    const currTrailing = metrics.er; // raw weighted trailing return (static DB for holdings)
                    const propPos = optimalAlloc.map(r => ({ dollars: r.dollars, r: r.r, v: r.v, d: r.d || 0, cat: r.cat, er: r.er, type: "etf" }));
                    const propMetrics = calcMetrics(propPos, cashBalance, totalVal);
                    const propTrailing = propMetrics?.er || currTrailing; // raw weighted trailing return (live data)

                    // Shrink both to forward estimates using same method (consistency)
                    const currReturn = shrinkToForward(currTrailing, metrics.vol);
                    const propReturn = shrinkToForward(propTrailing, propMetrics?.vol || metrics.vol);
                    const retImprovement = propReturn - currReturn;
                    const spyExpRet = 10;
                    const curAlpha = currReturn - spyExpRet;
                    const taxHurdle = curAlpha > 3 ? tcPct * 2.0 : curAlpha < -2 ? tcPct * 0.8 : tcPct * 1.2;
                    const minFloor = 1.5;
                    const turnoverCost = turnoverPct * 0.01;
                    const totalHurdle = Math.max(taxHurdle, minFloor) + turnoverCost;
                    const shouldRebalance = retImprovement > totalHurdle;

                    // SPY correlation of proposed
                    let wtdSpyCorrVal = 0;
                    optimalAlloc.forEach(r => { wtdSpyCorrVal += (r.dollars / (totalVal || 1)) * gc(r.cat || "Stock", "US Large Cap"); });

                    setRebalAnalysis({ shouldRebalance, retImprovement, totalHurdle, tcPct, taxHurdle, minFloor, turnoverCost, turnoverPct,
                      currReturn, propReturn, currTrailing, propTrailing, curAlpha, estTax, grossGains, grossLosses, netGains, stGains, ltGains,
                      sells, buys, keeps, reduces, increases,
                      currMetrics: metrics, propMetrics, wtdSpyCorrVal, regimeCtx,
                      optimalAlloc });
                    } catch (e) { console.error("Rebalance analysis error:", e); }
                    setRebalRunning(false);
                  }} disabled={rebalRunning} style={{ padding: "6px 12px", borderRadius: 0, border: "1px solid rgba(110,231,183,.2)", background: "rgba(66,190,101,.08)", color: cs.green, fontSize: 9, fontWeight: 600, cursor: rebalRunning ? "wait" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                    {rebalRunning ? "Analyzing..." : rebalAnalysis ? "⟳ Re-analyze" : "Run Rebalance Analysis"}
                  </button>
                </div>

                {!rebalAnalysis && !rebalRunning && <div style={{ textAlign: "center", padding: 14, color: cs.muted, fontSize: 9, border: "1px dashed #393939", borderRadius: 0, marginTop: 8 }}>
                  Runs the optimizer on your entire portfolio value ({fmt$(totalVal)}) to find the optimal allocation from scratch. Then compares the optimal portfolio against your current holdings to determine if rebalancing is justified after accounting for tax costs and transaction friction.
                </div>}

                {rebalAnalysis && (() => {
                  const ra = rebalAnalysis;
                  return <div style={{ marginTop: 8 }}>
                    {/* Verdict */}
                    <div style={{ padding: "12px 14px", borderRadius: 0, background: ra.shouldRebalance ? "rgba(66,190,101,.08)" : "rgba(255,171,145,.08)", border: `1px solid ${ra.shouldRebalance ? "rgba(66,190,101,.25)" : "rgba(255,171,145,.2)"}`, marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 20 }}>{ra.shouldRebalance ? "✅" : "⏸️"}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: ra.shouldRebalance ? cs.green : cs.yellow }}>{ra.shouldRebalance ? "REBALANCE RECOMMENDED" : "HOLD CURRENT PORTFOLIO"}</div>
                          <div style={{ fontSize: 9, color: cs.dim }}>Expected improvement {ra.retImprovement > 0 ? "+" : ""}{ra.retImprovement.toFixed(2)}% vs hurdle of {ra.totalHurdle.toFixed(2)}%</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 9, color: cs.muted, lineHeight: 1.6 }}>
                        {ra.shouldRebalance
                          ? `The optimal portfolio offers ${ra.retImprovement.toFixed(2)}% higher expected return, clearing the ${ra.totalHurdle.toFixed(2)}% hurdle. The improvement justifies the estimated ${fmt$(ra.estTax)} in tax costs and ${ra.turnoverPct.toFixed(0)}% portfolio turnover.`
                          : ra.retImprovement > 0
                            ? `The optimal portfolio has marginally higher return (+${ra.retImprovement.toFixed(2)}%), but the improvement doesn't justify the ${ra.totalHurdle.toFixed(2)}% hurdle (${fmt$(ra.estTax)} tax + ${ra.turnoverPct.toFixed(0)}% turnover). Hold current positions.`
                            : `The current portfolio already matches or exceeds the optimizer's suggestion. No benefit to rebalancing.`}
                      </div>
                    </div>

                    {/* Comparison Table */}
                    <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>Current vs Optimal Portfolio</div>
                    <div style={{ overflowX: "auto", marginBottom: 12 }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                        <thead><tr>
                          <th style={{ padding: "5px 8px", textAlign: "left", color: cs.dim, fontSize: 8 }}>Metric</th>
                          <th style={{ padding: "5px 8px", textAlign: "center", color: cs.dim, fontSize: 8 }}>Current</th>
                          <th style={{ padding: "5px 8px", textAlign: "center", color: cs.dim, fontSize: 8 }}>Optimal</th>
                          <th style={{ padding: "5px 8px", textAlign: "center", color: cs.dim, fontSize: 8 }}>Delta</th>
                        </tr></thead>
                        <tbody>
                          {ra.propMetrics && [
                            { l: "Forward Return Est.", c: ra.currReturn, p: ra.propReturn, u: "%", hi: true },
                            { l: "Trailing 12m (raw)", c: ra.currTrailing, p: ra.propTrailing, u: "%", hi: true },
                            { l: "Volatility", c: ra.currMetrics.vol, p: ra.propMetrics.vol, u: "%", hi: false },
                            { l: srLabel, c: getSR(ra.currMetrics), p: getSR(ra.propMetrics), u: "", hi: true },
                            { l: "VaR (95%)", c: ra.currMetrics.var95, p: ra.propMetrics.var95, u: "%", hi: false },
                            { l: "Max Drawdown Est.", c: ra.currMetrics.md, p: ra.propMetrics.md, u: "%", hi: false },
                          ].map(row => {
                            const d = row.p - row.c;
                            const good = row.hi ? d > 0.01 : d < -0.01;
                            return <tr key={row.l} style={{ borderTop: "1px solid #222222" }}>
                              <td style={{ padding: "5px 8px", color: cs.dim }}>{row.l}</td>
                              <td style={{ padding: "5px 8px", textAlign: "center", fontFamily: mono2, color: cs.text }}>{row.c.toFixed(2)}{row.u}</td>
                              <td style={{ padding: "5px 8px", textAlign: "center", fontFamily: mono2, color: cs.text, fontWeight: 600 }}>{row.p.toFixed(2)}{row.u}</td>
                              <td style={{ padding: "5px 8px", textAlign: "center", fontFamily: mono2, fontWeight: 600, color: good ? cs.green : Math.abs(d) < 0.01 ? cs.dim : cs.red }}>{d > 0 ? "+" : ""}{d.toFixed(2)}{row.u}</td>
                            </tr>;
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Hurdle Breakdown */}
                    <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>Hurdle Rate Breakdown</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 6, marginBottom: 12 }}>
                      <div style={{ padding: "8px 10px", borderRadius: 0, background: "#1c1c1c" }}>
                        <div style={{ fontSize: 7, color: cs.dim }}>Tax Cost</div>
                        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: mono2, color: cs.red }}>{ra.tcPct.toFixed(2)}%</div>
                        <div style={{ fontSize: 7, color: cs.muted }}>{fmt$(ra.estTax)} on {fmt$(ra.grossGains)} gains</div>
                      </div>
                      <div style={{ padding: "8px 10px", borderRadius: 0, background: "#1c1c1c" }}>
                        <div style={{ fontSize: 7, color: cs.dim }}>Tax Hurdle</div>
                        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: mono2, color: cs.yellow }}>{ra.taxHurdle.toFixed(2)}%</div>
                        <div style={{ fontSize: 7, color: cs.muted }}>{ra.curAlpha > 3 ? "2.0× (outperforming)" : ra.curAlpha < -2 ? "0.8× (underperf.)" : "1.2× (default)"}</div>
                      </div>
                      <div style={{ padding: "8px 10px", borderRadius: 0, background: "#1c1c1c" }}>
                        <div style={{ fontSize: 7, color: cs.dim }}>Min Floor</div>
                        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: mono2, color: cs.blue }}>{ra.minFloor.toFixed(1)}%</div>
                        <div style={{ fontSize: 7, color: cs.muted }}>Always required</div>
                      </div>
                      <div style={{ padding: "8px 10px", borderRadius: 0, background: "#1c1c1c" }}>
                        <div style={{ fontSize: 7, color: cs.dim }}>Turnover Cost</div>
                        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: mono2, color: cs.purple }}>{ra.turnoverCost.toFixed(2)}%</div>
                        <div style={{ fontSize: 7, color: cs.muted }}>{ra.turnoverPct.toFixed(0)}% changed</div>
                      </div>
                      <div style={{ padding: "8px 10px", borderRadius: 0, background: ra.shouldRebalance ? "rgba(66,190,101,.06)" : "rgba(251,191,36,.04)", border: `1px solid ${ra.shouldRebalance ? "rgba(66,190,101,.18)" : "rgba(255,171,145,.15)"}` }}>
                        <div style={{ fontSize: 7, color: cs.dim }}>Total Hurdle</div>
                        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: mono2, color: ra.shouldRebalance ? cs.green : cs.yellow }}>{ra.totalHurdle.toFixed(2)}%</div>
                        <div style={{ fontSize: 7, color: cs.muted }}>max(tax,floor)+turnover</div>
                      </div>
                      <div style={{ padding: "8px 10px", borderRadius: 0, background: ra.shouldRebalance ? "rgba(66,190,101,.06)" : "rgba(255,131,137,.06)", border: `1px solid ${ra.shouldRebalance ? "rgba(66,190,101,.18)" : "rgba(255,131,137,.18)"}` }}>
                        <div style={{ fontSize: 7, color: cs.dim }}>Return Improvement</div>
                        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: mono2, color: ra.retImprovement > ra.totalHurdle ? cs.green : cs.red }}>{ra.retImprovement > 0 ? "+" : ""}{ra.retImprovement.toFixed(2)}%</div>
                        <div style={{ fontSize: 7, color: cs.muted }}>{ra.shouldRebalance ? "Exceeds hurdle ✓" : "Below hurdle ✗"}</div>
                      </div>
                    </div>

                    {/* Proposed Trades — detailed */}
                    <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>Proposed Trades</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 9, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: mono2 }}>Sell: <span style={{ color: cs.red, fontWeight: 600 }}>{ra.sells.length}</span></span>
                      <span style={{ fontFamily: mono2 }}>Reduce: <span style={{ color: cs.yellow, fontWeight: 600 }}>{ra.reduces.length}</span></span>
                      <span style={{ fontFamily: mono2 }}>Keep: <span style={{ color: cs.blue, fontWeight: 600 }}>{ra.keeps.length}</span></span>
                      <span style={{ fontFamily: mono2 }}>Increase: <span style={{ color: cs.purple, fontWeight: 600 }}>{ra.increases.length}</span></span>
                      <span style={{ fontFamily: mono2 }}>Buy: <span style={{ color: cs.green, fontWeight: 600 }}>{ra.buys.length}</span></span>
                      <span style={{ fontFamily: mono2 }}>SPY Corr: <span style={{ color: ra.wtdSpyCorrVal > 0.85 ? cs.red : ra.wtdSpyCorrVal < 0.5 ? cs.green : cs.dim, fontWeight: 600 }}>{(ra.wtdSpyCorrVal * 100).toFixed(0)}%</span></span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 12 }}>
                      {ra.sells.map(t2 => <div key={t2.ticker} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 0, background: "rgba(255,131,137,.05)", fontSize: 9 }}>
                        <Badge color={cs.red}>SELL</Badge>
                        <span style={{ fontFamily: mono2, fontWeight: 600, color: cs.red, minWidth: 40 }}>{t2.ticker}</span>
                        <span style={{ color: cs.dim, flex: 1 }}>{t2.reason}</span>
                        <span style={{ fontFamily: mono2, color: cs.text }}>{fmt$(t2.curDollars)}</span>
                      </div>)}
                      {ra.reduces.map(t2 => <div key={t2.ticker} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 0, background: "rgba(255,171,145,.04)", fontSize: 9 }}>
                        <Badge color={cs.yellow}>REDUCE</Badge>
                        <span style={{ fontFamily: mono2, fontWeight: 600, color: cs.yellow, minWidth: 40 }}>{t2.ticker}</span>
                        <span style={{ color: cs.dim, flex: 1 }}>{t2.reason}</span>
                        <span style={{ fontFamily: mono2, color: t2.gl >= 0 ? cs.green : cs.red }}>{t2.gl >= 0 ? "+" : ""}{fmt$(t2.gl)}</span>
                      </div>)}
                      {ra.keeps.map(t2 => <div key={t2.ticker} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 0, background: "rgba(120,169,255,.04)", fontSize: 9 }}>
                        <Badge color={cs.blue}>KEEP</Badge>
                        <span style={{ fontFamily: mono2, fontWeight: 600, color: cs.blue, minWidth: 40 }}>{t2.ticker}</span>
                        <span style={{ color: cs.dim, flex: 1 }}>{t2.reason}</span>
                      </div>)}
                      {ra.increases.map(t2 => <div key={t2.ticker} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 0, background: "rgba(190,149,255,.04)", fontSize: 9 }}>
                        <Badge color={cs.purple}>ADD</Badge>
                        <span style={{ fontFamily: mono2, fontWeight: 600, color: cs.purple, minWidth: 40 }}>{t2.ticker}</span>
                        <span style={{ color: cs.dim, flex: 1 }}>{t2.reason}</span>
                      </div>)}
                      {ra.buys.map(t2 => <div key={t2.ticker} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 0, background: "rgba(110,231,183,.03)", fontSize: 9 }}>
                        <Badge color={cs.green}>BUY</Badge>
                        <span style={{ fontFamily: mono2, fontWeight: 600, color: cs.green, minWidth: 40 }}>{t2.ticker}</span>
                        <span style={{ color: cs.dim, flex: 1 }}>{t2.reason}</span>
                        <span style={{ fontFamily: mono2, color: cs.text }}>{fmt$(t2.optDollars)}</span>
                      </div>)}
                      {ra.sells.length === 0 && ra.buys.length === 0 && ra.reduces.length === 0 && ra.increases.length === 0 && <div style={{ fontSize: 9, color: cs.muted, padding: 6 }}>No changes needed — current portfolio is already near optimal.</div>}
                    </div>

                    {/* Tax Detail */}
                    {(ra.grossGains > 0 || ra.grossLosses > 0) && <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 4 }}>Tax Impact</div>
                      <div style={{ display: "flex", gap: 8, fontSize: 9, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: mono2 }}>Realized Gains: <span style={{ color: cs.green, fontWeight: 600 }}>{fmt$(ra.grossGains)}</span> (ST: {fmt$(ra.stGains)}, LT: {fmt$(ra.ltGains)})</span>
                        <span style={{ fontFamily: mono2 }}>Realized Losses: <span style={{ color: cs.red, fontWeight: 600 }}>{fmt$(ra.grossLosses)}</span></span>
                        <span style={{ fontFamily: mono2 }}>Net Taxable: <span style={{ color: cs.yellow, fontWeight: 600 }}>{fmt$(ra.netGains)}</span></span>
                        <span style={{ fontFamily: mono2 }}>Estimated Tax: <span style={{ color: cs.red, fontWeight: 600 }}>{fmt$(ra.estTax)}</span></span>
                        {ra.grossLosses > 0 && <span style={{ fontFamily: mono2 }}>Loss Offset: <span style={{ color: cs.purple, fontWeight: 600 }}>{fmt$(Math.min(ra.grossGains, ra.grossLosses))}</span></span>}
                      </div>
                    </div>}

                    {/* Regime Reasoning */}
                    {ra.regimeCtx && (() => {
                      const reasons = [];
                      const s5 = ra.regimeCtx.state5;
                      const ts = ra.regimeCtx.threeStage;
                      const dur = ts?.effectiveDuration || ra.regimeCtx.duration || 0;
                      if (s5?.includes("risk_off")) reasons.push(`Market is in ${s5.replace(/_/g," ")} — defensive positioning recommended`);
                      else if (s5?.includes("risk_on")) reasons.push(`Market is in ${s5.replace(/_/g," ")} — growth positioning favored`);
                      if (dur > 12) reasons.push(`Regime has persisted ${dur} months — tilt amplified (${Math.min(2.0, 0.5 + (dur/12)*1.5).toFixed(1)}× scaling)`);
                      if (ts?.patternType?.includes("reversal")) reasons.push(`Three-stage pattern: ${ts.pattern} (${ts.patternType.replace(/_/g," ")}) — signal: ${ts.patternSignal > 0 ? "+" : ""}${(ts.patternSignal*100).toFixed(0)}%`);
                      else if (ts?.patternType?.includes("continuation")) reasons.push(`Three-stage: ${ts.pattern} — ${ts.patternType.replace(/_/g," ")}, effective duration ${ts.effectiveDuration}m`);
                      if (ra.regimeCtx.durationModel) {
                        const fwd = getRegimeDurationFwd(ra.regimeCtx.durationModel, s5 || "neutral", dur);
                        if (fwd.confidence > 0.3) reasons.push(`Historical forward 6m return at this state+duration: ${fwd.fwd > 0 ? "+" : ""}${fwd.fwd.toFixed(1)}% (${fwd.count} obs)`);
                      }
                      if (reasons.length === 0) return null;
                      return <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 4 }}>Regime Context</div>
                        {reasons.map((r, i) => <div key={i} style={{ fontSize: 9, color: cs.dim, lineHeight: 1.6, paddingLeft: 10, borderLeft: "2px solid rgba(251,191,36,.15)", marginBottom: 3 }}>{r}</div>)}
                      </div>;
                    })()}

                    {/* Decision Logic */}
                    <div style={{ padding: "8px 10px", borderRadius: 0, background: "#1c1c1c", fontSize: 8, color: cs.muted, lineHeight: 1.7 }}>
                      <span style={{ fontWeight: 600, color: cs.text }}>Decision Logic: </span>
                      Return improvement ({ra.retImprovement > 0 ? "+" : ""}{ra.retImprovement.toFixed(2)}%) {ra.shouldRebalance ? ">" : "≤"} hurdle ({ra.totalHurdle.toFixed(2)}%)
                      {" = "}max(tax {ra.taxHurdle.toFixed(2)}%, floor {ra.minFloor}%) + turnover {ra.turnoverCost.toFixed(2)}%.
                      {ra.curAlpha > 3 ? " Outperforming SPY by " + ra.curAlpha.toFixed(1) + "% — higher bar (2.0×) to preserve winning strategy." :
                       ra.curAlpha < -2 ? " Underperforming SPY by " + Math.abs(ra.curAlpha).toFixed(1) + "% — lower bar (0.8×) to encourage improvement." :
                       " Near SPY — standard bar (1.2×)."}
                      {ra.wtdSpyCorrVal > 0.85 && " ⚠ Proposed portfolio >85% SPY-correlated — consider whether active management adds value."}
                    </div>
                  </div>;
                })()}
              </div>}

              {totalVal > 0 && <div style={cardS}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Growth Projection ({fmt$(totalVal)})</div>
                {(() => {
                  // The trailing return (metrics.nr) is backward-looking and often inflated.
                  // shrinkToForward blends trailing with long-term equity premium (~10%), weighted by vol.
                  const trailing = metrics.nr;
                  const fwdReturn = shrinkToForward(trailing, metrics.vol);
                  const bullReturn = Math.min(22, fwdReturn * 1.4);
                  const bearReturn = Math.max(1, fwdReturn * 0.5);
                  const volFactor = Math.min(1, (metrics.vol || 15) / 30);
                  const shrinkWeight = 0.4 + volFactor * 0.3;

                  return <>
                    <div style={{ fontSize: 8, color: cs.dim, marginBottom: 8 }}>
                      Trailing net return: <span style={{ fontFamily: mono2, color: cs.text }}>{trailing.toFixed(1)}%</span> · Forward estimate (shrunk): <span style={{ fontFamily: mono2, color: cs.green }}>{fwdReturn.toFixed(1)}%</span>
                      <span style={{ color: cs.muted }}> · Blends trailing return with long-term equity premium (10%), shrinkage {(shrinkWeight*100).toFixed(0)}% toward mean based on {metrics.vol.toFixed(0)}% vol</span>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                        <thead><tr>
                          <th style={{ padding: "5px 6px", textAlign: "left", color: cs.dim, fontSize: 8 }}>Scenario</th>
                          <th style={{ padding: "5px 6px", textAlign: "center", color: cs.dim, fontSize: 8 }}>Rate</th>
                          {[1, 5, 10, 20].map(yr => <th key={yr} style={{ padding: "5px 6px", textAlign: "center", color: cs.dim, fontSize: 8 }}>{yr}yr</th>)}
                        </tr></thead>
                        <tbody>
                          {[
                            { label: "🐻 Bear", rate: bearReturn, color: cs.red },
                            { label: "📊 Base", rate: fwdReturn, color: cs.green },
                            { label: "🐂 Bull", rate: bullReturn, color: cs.blue },
                          ].map(sc => (
                            <tr key={sc.label} style={{ borderTop: "1px solid #222222" }}>
                              <td style={{ padding: "5px 6px", color: sc.color, fontWeight: 600 }}>{sc.label}</td>
                              <td style={{ padding: "5px 6px", textAlign: "center", fontFamily: mono2, color: sc.color }}>{sc.rate.toFixed(1)}%</td>
                              {[1, 5, 10, 20].map(yr => {
                                const g = totalVal * Math.pow(1 + sc.rate / 100, yr);
                                return <td key={yr} style={{ padding: "5px 6px", textAlign: "center", fontFamily: mono2, fontWeight: sc.label.includes("Base") ? 700 : 400, color: sc.label.includes("Base") ? cs.green : cs.text }}>{fmt$(g)}</td>;
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>;
                })()}
              </div>}
              {allPos.length >= 2 && <div style={cardS}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Correlation Matrix</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ borderCollapse: "separate", borderSpacing: 2 }}><thead><tr><th />{allPos.slice(0, 10).map(p => <th key={p.ticker} style={{ padding: 2, fontSize: 8, fontFamily: mono2, color: cs.dim }}>{p.ticker}</th>)}</tr></thead>
                    <tbody>{allPos.slice(0, 10).map(row => <tr key={row.ticker}><td style={{ padding: "2px 5px", fontSize: 8, fontFamily: mono2, color: cs.dim }}>{row.ticker}</td>
                      {allPos.slice(0, 10).map(col => { const cr = gc(row.cat, col.cat); return <td key={col.ticker} style={{ padding: 2, textAlign: "center", fontSize: 8, fontFamily: mono2, background: cr > .8 ? "rgba(248,113,113,.1)" : cr < 0 ? "rgba(66,190,101,.12)" : "#1e1e1e", color: cr > .7 ? cs.red : cr < 0 ? cs.green : cs.text, borderRadius: 2 }}>{cr.toFixed(2)}</td> })}
                    </tr>)}</tbody></table>
                </div>
              </div>}

            </>}
        </div>}

        {/* ════ REGIME ANALYSIS ════ */}
        {tab === "Regime Analysis" && <div className="tab-content">

          {/* ── Regime History Charts (HMM-based) ── */}
          {hmmResult && (() => {
            const tl = hmmResult.timeline || [];
            const h = hmmResult;
            const ensR = h.currentEnsemble;
            const hmmR = h.currentHMM;
            const agree = h.agreement;
            const state5Colors = { strong_risk_on: "#42be65", mild_risk_on: "#6fdc8c", neutral: "#ffab91", mild_risk_off: "#ff832b", strong_risk_off: "#ff8389" };
            const hmmColors = ["#42be65", "#fbbf24", "#fb923c", "#ff8389", "#60a5fa"];

            // Compute stress thermometer from available data
            const lastComposite = tl.length > 0 ? tl[tl.length - 1].composite || 0 : 0;
            const lastCpProb = h.cpProb?.[h.cpProb.length - 1] || 0;
            // Estimate turbulence percentile from ensemble stress (approximate since raw turb isn't in hmmResult)
            const stressFromEns = (ensR.probs[2] || 0) + (ensR.probs[3] || 0); // correction + crisis prob as proxy
            const estTurbPctl = Math.min(1, stressFromEns * 1.5);
            const estArShift = lastComposite * 0.8; // approximate
            const stressThermo = (() => {
              const compNorm = Math.min(100, Math.max(0, 50 + lastComposite * 20));
              const turbNorm = estTurbPctl * 100;
              const arNorm = Math.min(100, Math.max(0, 50 + estArShift * 20));
              const cpNorm = lastCpProb * 100;
              const score = Math.min(100, Math.max(0, compNorm * 0.35 + turbNorm * 0.25 + arNorm * 0.20 + cpNorm * 0.20));
              const rounded = Math.round(score * 10) / 10;
              let level, color;
              if (rounded < 25) { level = 'calm'; color = '#42be65'; }
              else if (rounded < 50) { level = 'elevated'; color = '#f1c21b'; }
              else if (rounded < 75) { level = 'stressed'; color = '#ff832b'; }
              else { level = 'extreme'; color = '#ff8389'; }
              return { score: rounded, level, color };
            })();

            // Compute watchlist signals
            const watchlist = (() => {
              const signals = [];
              const regimeNames = ['Bull', 'Euphoria', 'Correction', 'Crisis', 'Recovery'];
              const forecast = h.forecast || [];
              const regimeProbs = ensR.probs;
              const currentRegime = ensR.idx;
              if (!forecast.length || !regimeProbs) return signals;
              const crisisNow = regimeProbs[3] || 0;
              for (let step = 0; step < Math.min(forecast.length, 12); step++) {
                const crisisFwd = forecast[step][3] || 0;
                if (crisisFwd > crisisNow + 0.10 && crisisFwd > 0.15) {
                  signals.push({ signal: `Crisis probability rising to ${(crisisFwd * 100).toFixed(0)}% in ${step + 1} months`, urgency: crisisFwd > 0.30 ? 'high' : 'medium', horizon: `${step + 1}m` });
                  break;
                }
              }
              const corrNow = regimeProbs[2] || 0;
              for (let step = 0; step < Math.min(forecast.length, 6); step++) {
                const corrFwd = forecast[step][2] || 0;
                if (corrFwd > corrNow + 0.15 && corrFwd > 0.25) {
                  signals.push({ signal: `Correction probability rising to ${(corrFwd * 100).toFixed(0)}% in ${step + 1} months`, urgency: corrFwd > 0.40 ? 'high' : 'medium', horizon: `${step + 1}m` });
                  break;
                }
              }
              if (currentRegime === 3 || currentRegime === 2) {
                for (let step = 0; step < Math.min(forecast.length, 6); step++) {
                  const recovFwd = forecast[step][4] || 0;
                  const bullFwd = forecast[step][0] || 0;
                  if (recovFwd > 0.25 || bullFwd > 0.30) {
                    signals.push({ signal: `Recovery/Bull probability reaching ${((recovFwd + bullFwd) * 100).toFixed(0)}% in ${step + 1} months`, urgency: 'medium', horizon: `${step + 1}m` });
                    break;
                  }
                }
              }
              if (currentRegime === 0) {
                const euphNow = regimeProbs[1] || 0;
                for (let step = 0; step < Math.min(forecast.length, 6); step++) {
                  const euphFwd = forecast[step][1] || 0;
                  if (euphFwd > euphNow + 0.10 && euphFwd > 0.20) {
                    signals.push({ signal: `Euphoria risk rising to ${(euphFwd * 100).toFixed(0)}% in ${step + 1} months`, urgency: 'low', horizon: `${step + 1}m` });
                    break;
                  }
                }
              }
              const dominantProb = regimeProbs[currentRegime] || 0;
              if (dominantProb < 0.50) {
                let maxGain = 0, gainRegime = -1;
                for (let i = 0; i < 5; i++) {
                  if (i === currentRegime) continue;
                  const fwd3 = forecast[Math.min(2, forecast.length - 1)]?.[i] || 0;
                  const gain = fwd3 - (regimeProbs[i] || 0);
                  if (gain > maxGain) { maxGain = gain; gainRegime = i; }
                }
                if (gainRegime >= 0 && maxGain > 0.05) {
                  signals.push({ signal: `${regimeNames[currentRegime]} confidence only ${(dominantProb * 100).toFixed(0)}% — ${regimeNames[gainRegime]} gaining (+${(maxGain * 100).toFixed(0)}pp over 3m)`, urgency: maxGain > 0.15 ? 'high' : 'medium', horizon: '3m' });
                }
              }
              return signals;
            })();

            return <>
              {/* ── Stress Thermometer Widget ── */}
              <div style={{ ...cardS, marginBottom: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>Market Stress Thermometer</div>
                  <Badge color={stressThermo.color}>{stressThermo.level.toUpperCase()} ({stressThermo.score})</Badge>
                </div>
                {/* Thermometer gauge */}
                <div style={{ position: "relative", height: 28, background: "#1a1a1a", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                  {/* Gradient background */}
                  <div className="stress-thermometer-bar" style={{ position: "absolute", top: 0, left: 0, height: "100%", width: "100%", opacity: 0.18, borderRadius: 3 }} />
                  {/* Active fill */}
                  <div className="stress-thermometer-bar" style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${stressThermo.score}%`, opacity: 0.5, borderRadius: 3 }} />
                  {/* Needle indicator */}
                  <div className="stress-thermometer-needle" style={{ position: "absolute", top: 0, left: `${stressThermo.score}%`, width: 2, height: "100%", background: stressThermo.color, boxShadow: `0 0 8px ${stressThermo.color}` }} />
                  {/* Score label */}
                  <div style={{ position: "absolute", top: "50%", left: `${Math.min(Math.max(stressThermo.score, 8), 92)}%`, transform: "translate(-50%, -50%)", fontSize: 12, fontWeight: 800, fontFamily: mono2, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,.8)" }}>{stressThermo.score}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, color: cs.muted }}>
                  <span>0 — Calm</span><span>25 — Elevated</span><span>50 — Stressed</span><span>75 — Extreme — 100</span>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 8, color: cs.dim }}>
                  <span>Composite: <span style={{ fontFamily: mono2, color: cs.text }}>{lastComposite.toFixed(2)}</span></span>
                  <span>CP Prob: <span style={{ fontFamily: mono2, color: lastCpProb > 0.2 ? cs.red : cs.text }}>{(lastCpProb * 100).toFixed(0)}%</span></span>
                  <span>Stress Probs: <span style={{ fontFamily: mono2, color: stressFromEns > 0.4 ? cs.red : cs.text }}>{(stressFromEns * 100).toFixed(0)}%</span></span>
                </div>
              </div>

              {/* Current Regime Banner (enhanced with glow) */}
              <div style={{ ...cardS, background: `${ensR.color}08`, borderColor: `${ensR.color}25`, marginBottom: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 8, color: cs.dim, letterSpacing: 2, textTransform: "uppercase" }}>HMM Classification</div>
                    <div className="regime-glow" style={{ display: "inline-block", padding: "6px 16px", borderRadius: 4, marginTop: 4, "--regime-color": `${hmmR.color}40` }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: hmmR.color }}>{hmmR.name}</div>
                    </div>
                    <div style={{ fontSize: 11, color: cs.dim, fontFamily: mono2, marginTop: 4 }}>{(hmmR.probs[hmmR.idx] * 100).toFixed(1)}% confidence</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: agree ? "rgba(66,190,101,.1)" : "rgba(248,113,113,.1)", border: `2px solid ${agree ? cs.green : cs.red}40` }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: agree ? cs.green : cs.red }}>{agree ? "AGREE" : "SPLIT"}</span>
                    </div>
                    <div style={{ fontSize: 8, color: cs.dim, marginTop: 4 }}>HMM vs Ensemble</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 8, color: cs.dim, letterSpacing: 2, textTransform: "uppercase" }}>Ensemble Consensus</div>
                    <div className="regime-glow" style={{ display: "inline-block", padding: "6px 16px", borderRadius: 4, marginTop: 4, "--regime-color": `${ensR.color}40` }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: ensR.color }}>{ensR.name}</div>
                    </div>
                    <div style={{ fontSize: 11, color: cs.dim, fontFamily: mono2, marginTop: 4 }}>{(ensR.probs[ensR.idx] * 100).toFixed(1)}% confidence</div>
                  </div>
                </div>
                {/* 5-regime probability bars (enhanced with ranking) */}
                <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                  {HMM_REGIMES.map((r, i) => {
                    const pct = ensR.probs[i] * 100;
                    const isDominant = i === ensR.idx;
                    return (
                      <div key={i} style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontSize: 7, color: r.color, fontWeight: isDominant ? 800 : 600, letterSpacing: 0.5 }}>{r.name}</span>
                          <span style={{ fontSize: isDominant ? 9 : 8, fontFamily: mono2, color: isDominant ? r.color : cs.dim, fontWeight: isDominant ? 700 : 400 }}>{pct.toFixed(1)}%</span>
                        </div>
                        <div style={{ height: isDominant ? 6 : 4, background: "#262626", borderRadius: 2, overflow: "hidden", transition: "height .3s" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: isDominant ? r.color : `${r.color}90`, borderRadius: 2, transition: "width .5s", boxShadow: isDominant ? `0 0 6px ${r.color}40` : "none" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Optimizer fusion note */}
                <div style={{ marginTop: 10, padding: "6px 10px", borderRadius: 0, background: "#1a1a1a", fontSize: 9 }}>
                  <span style={{ color: cs.dim }}>Optimizer → </span>
                  <span style={{ color: state5Colors[h.state5] || cs.yellow, fontWeight: 700 }}>{h.state5?.replace(/_/g, " ").toUpperCase()}</span>
                  <span style={{ color: cs.dim }}> · Conservative fusion uses the more defensive of FRED threshold vs HMM ensemble</span>
                </div>
              </div>

              {/* Alerts */}
              {h.alerts?.length > 0 && <div style={{ ...cardS, padding: "10px 14px", marginBottom: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>⚡ Active Alerts</div>
                {h.alerts.map((alert, i) => (
                  <div key={i} style={{ padding: "6px 10px", borderRadius: 0, marginBottom: 4, display: "flex", alignItems: "center", gap: 8, background: alert.severity === "high" ? "rgba(248,113,113,.06)" : "rgba(251,191,36,.06)", borderLeft: `3px solid ${alert.severity === "high" ? cs.red : cs.yellow}` }}>
                    <span style={{ fontSize: 9, fontWeight: 600, color: alert.severity === "high" ? cs.red : cs.yellow, minWidth: 80 }}>{alert.source}</span>
                    <span style={{ fontSize: 9, color: cs.dim }}>{alert.message}</span>
                  </div>
                ))}
              </div>}

              {/* ── What to Watch ── */}
              {watchlist.length > 0 && <div style={{ ...cardS, padding: "10px 14px", marginBottom: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>What to Watch</div>
                {watchlist.map((w, i) => (
                  <div key={i} style={{ padding: "6px 10px", borderRadius: 0, marginBottom: 4, display: "flex", alignItems: "center", gap: 8, background: w.urgency === "high" ? "rgba(248,113,113,.06)" : w.urgency === "medium" ? "rgba(251,191,36,.06)" : "rgba(66,190,101,.06)", borderLeft: `3px solid ${w.urgency === "high" ? cs.red : w.urgency === "medium" ? cs.yellow : cs.green}` }}>
                    <Badge color={w.urgency === "high" ? cs.red : w.urgency === "medium" ? cs.yellow : cs.green}>{w.horizon}</Badge>
                    <span style={{ fontSize: 9, color: cs.dim }}>{w.signal}</span>
                  </div>
                ))}
              </div>}

              {/* ── Regime History Summary Table ── */}
              {h.condStats && h.condStats.length > 0 && <div style={{ ...cardS, marginBottom: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Regime History Summary</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                    <thead><tr>
                      <th style={{ padding: "5px 8px", textAlign: "left", color: cs.dim, fontSize: 8 }}>Regime</th>
                      <th style={{ padding: "5px 8px", textAlign: "center", color: cs.dim, fontSize: 8 }}>Time %</th>
                      <th style={{ padding: "5px 8px", textAlign: "center", color: cs.dim, fontSize: 8 }}>Episodes</th>
                      <th style={{ padding: "5px 8px", textAlign: "center", color: cs.dim, fontSize: 8 }}>Avg Duration</th>
                      <th style={{ padding: "5px 8px", textAlign: "center", color: cs.dim, fontSize: 8 }}>Avg Score</th>
                    </tr></thead>
                    <tbody>
                      {h.condStats.map((st, i) => (
                        <tr key={i} style={{ borderTop: "1px solid #222" }}>
                          <td style={{ padding: "5px 8px" }}>
                            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: st.color, marginRight: 6, verticalAlign: "middle" }} />
                            <span style={{ color: st.color, fontWeight: 600 }}>{st.name}</span>
                          </td>
                          <td style={{ padding: "5px 8px", textAlign: "center", fontFamily: mono2 }}>{(st.pctTime * 100).toFixed(1)}%</td>
                          <td style={{ padding: "5px 8px", textAlign: "center", fontFamily: mono2 }}>{st.count}</td>
                          <td style={{ padding: "5px 8px", textAlign: "center", fontFamily: mono2 }}>{h.expDurations[i]?.toFixed(1) || "—"}m</td>
                          <td style={{ padding: "5px 8px", textAlign: "center", fontFamily: mono2, color: st.meanScore > 0.5 ? cs.red : st.meanScore < -0.5 ? cs.green : cs.dim }}>{st.meanScore?.toFixed(2) || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>}

              {/* ── Chart 1: Composite Stress Score + Change-Point Detection ── */}
              <RegimeLineChart
                data={tl}
                title="📈 Composite Stress Score & Change-Point Detection"
                subtitle="FRED composite z-score (stress level) with BOCPD change-point probability overlay. Background bands show detected regime."
                series={[
                  { key: "composite", label: "Stress Score", color: cs.yellow, width: 2 },
                  { key: "cpProb", label: "CP Probability", color: cs.red, width: 1.5, dash: "4,2" },
                ]}
                regimeBands={{ key: "regime" }}
                thresholds={[
                  { value: 0, color: cs.dim, label: "0", dash: "2,4" },
                  { value: 0.2, color: cs.red, label: "20% CP alert", dash: "4,3" },
                ]}
                height={220}
              />

              {/* ── Chart 2: HMM Filtered Probabilities (stacked) ── */}
              <RegimeLineChart
                data={tl.map(d => ({
                  date: d.date,
                  Bull: (d.p_Bull || 0) * 100,
                  Euphoria: (d.p_Euphoria || 0) * 100,
                  Correction: (d.p_Correction || 0) * 100,
                  Crisis: (d.p_Crisis || 0) * 100,
                  Recovery: (d.p_Recovery || 0) * 100,
                }))}
                title="🎯 HMM Filtered Probabilities"
                subtitle="Real-time (causal) probability of each regime. Stacked areas sum to 100%. Shows how regime confidence evolves over time."
                series={HMM_REGIMES.map(r => ({ key: r.name, label: r.name, color: r.color }))}
                stacked
                yDomain={[0, 100]}
                yFormat={v => `${v.toFixed(0)}%`}
                height={220}
              />

              {/* ── Chart 3: Ensemble Probabilities (stacked) ── */}
              <RegimeLineChart
                data={tl.map(d => ({
                  date: d.date,
                  Bull: (d.e_Bull || 0) * 100,
                  Euphoria: (d.e_Euphoria || 0) * 100,
                  Correction: (d.e_Correction || 0) * 100,
                  Crisis: (d.e_Crisis || 0) * 100,
                  Recovery: (d.e_Recovery || 0) * 100,
                }))}
                title="🔀 Ensemble Probabilities (HMM + BOCPD Fused)"
                subtitle="After fusing HMM with Bayesian change-point detection. When BOCPD fires, mass shifts from Bull/Euphoria → Correction/Crisis."
                series={HMM_REGIMES.map(r => ({ key: r.name, label: r.name, color: r.color }))}
                stacked
                yDomain={[0, 100]}
                yFormat={v => `${v.toFixed(0)}%`}
                height={220}
              />

              {/* ── Chart 4: Individual Regime Lines (non-stacked overlay) ── */}
              <RegimeLineChart
                data={tl.map(d => ({
                  date: d.date, regime: d.regime,
                  Bull: (d.e_Bull || 0) * 100,
                  Crisis: (d.e_Crisis || 0) * 100,
                  Correction: (d.e_Correction || 0) * 100,
                  Recovery: (d.e_Recovery || 0) * 100,
                  Euphoria: (d.e_Euphoria || 0) * 100,
                }))}
                title="📊 Regime Probability Lines (Ensemble)"
                subtitle="Individual regime probability traces. Crossovers indicate regime transitions. Hover to compare exact values."
                series={[
                  { key: "Bull", label: "Bull", color: "#42be65", width: 2 },
                  { key: "Crisis", label: "Crisis", color: "#ff8389", width: 2 },
                  { key: "Correction", label: "Correction", color: "#fb923c", width: 1.5 },
                  { key: "Recovery", label: "Recovery", color: "#60a5fa", width: 1.5 },
                  { key: "Euphoria", label: "Euphoria", color: "#fbbf24", width: 1, dash: "3,2" },
                ]}
                yDomain={[0, 100]}
                yFormat={v => `${v.toFixed(0)}%`}
                regimeBands={{ key: "regime" }}
                height={240}
              />

              {/* ── Regime Timeline (compact bar) ── */}
              <div style={cardS}>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>Regime Timeline (Viterbi Decoded)</div>
                <div style={{ display: "flex", height: 20, borderRadius: 0, overflow: "hidden", marginBottom: 4 }}>
                  {tl.map((d, i) => (
                    <div key={i} style={{ flex: 1, background: hmmColors[d.regime] || "#333", opacity: 0.75, borderRight: i < tl.length - 1 ? "1px solid rgba(0,0,0,.3)" : "none" }} title={`${d.date}: ${HMM_REGIMES[d.regime]?.name || "?"}`} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, color: cs.muted, marginBottom: 6 }}>
                  <span>{tl[0]?.date || ""}</span><span>{tl[tl.length - 1]?.date || ""}</span>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {HMM_REGIMES.map(r => (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: r.color }} />
                      <span style={{ fontSize: 8, color: cs.dim }}>{r.name}</span>
                      <span style={{ fontSize: 8, fontFamily: mono2, color: cs.muted }}>{(tl.filter(d => d.regime === r.id).length / tl.length * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Transition Matrix + Durations ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={cardS}>
                  <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Transition Matrix (learned)</div>
                  <div style={{ display: "grid", gridTemplateColumns: `52px repeat(5, 1fr)`, gap: 2, fontSize: 8 }}>
                    <div />
                    {HMM_REGIMES.map(r => <div key={r.id} style={{ textAlign: "center", color: r.color, fontWeight: 600, padding: 2 }}>{r.name.slice(0, 4)}</div>)}
                    {h.transMatrix.map((row, i) => {
                      const maxOffDiag = Math.max(...row.filter((_, j) => j !== i));
                      return (
                        <React.Fragment key={i}>
                          <div style={{ color: HMM_REGIMES[i].color, fontWeight: 600, display: "flex", alignItems: "center", fontSize: 7 }}>{HMM_REGIMES[i].name.slice(0, 4)}</div>
                          {row.map((p, j) => {
                            const intensity = i === j ? p : (p / (maxOffDiag || 1));
                            const heatColor = i === j
                              ? `${HMM_REGIMES[i].color}${Math.round(Math.min(intensity * 0.4, 0.35) * 255).toString(16).padStart(2, '0')}`
                              : p > 0.10 ? `rgba(120,169,255,${Math.min(intensity * 0.25, 0.2)})` : p > 0.03 ? `rgba(255,255,255,${Math.min(intensity * 0.08, 0.06)})` : "transparent";
                            return (
                              <div key={j} style={{ textAlign: "center", padding: 3, fontFamily: mono2, fontSize: 8, background: heatColor, color: i === j ? HMM_REGIMES[i].color : p > 0.10 ? cs.text : cs.dim, fontWeight: i === j ? 700 : p > 0.10 ? 600 : 400, borderRadius: 2, border: p === maxOffDiag && i !== j && p > 0.05 ? `1px solid ${HMM_REGIMES[j].color}30` : "1px solid transparent" }}>{(p * 100).toFixed(1)}</div>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
                <div style={cardS}>
                  <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Expected Durations & Forecast</div>
                  {HMM_REGIMES.map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5, padding: "3px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: r.color }} />
                        <span style={{ fontSize: 9, color: r.color }}>{r.name}</span>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, fontFamily: mono2 }}>{h.expDurations[i].toFixed(1)}m</span>
                      <span style={{ fontSize: 8, fontFamily: mono2, color: cs.dim }}>→ 6m: {(h.forecast[5]?.[i] * 100 || 0).toFixed(1)}%</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 8, padding: "6px 8px", borderRadius: 0, background: "#1a1a1a", fontSize: 8, color: cs.dim }}>
                    Forecast propagates ensemble probabilities through learned transition matrix. Expected durations = 1/(1-P(self-transition)).
                  </div>
                </div>
              </div>
            </>;
          })()}

          {!hmmResult && !hmmLoading && <div style={{ ...cardS, textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🧠</div>
            <div style={{ fontSize: 11, color: cs.muted, marginBottom: 10 }}>Probabilistic regime charts appear here once HMM training completes.</div>
            <button onClick={runHmmAnalysis} style={{ padding: "8px 16px", borderRadius: 0, border: "1px solid rgba(96,165,250,.2)", background: "rgba(96,165,250,.08)", color: "#60a5fa", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Train HMM Now</button>
          </div>}

          {hmmLoading && <div style={{ ...cardS, textAlign: "center", padding: 24 }}>
            <div style={{ fontSize: 11, color: "#60a5fa" }}>Training 5-state Gaussian HMM (Baum-Welch EM)...</div>
          </div>}

              {/* ── Regime Analysis ── */}
              <div style={cardS}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>🌊 Market Regime Analysis</div>
                    <div style={{ fontSize: 9, color: cs.dim, marginTop: 2 }}>12-factor FRED composite: HY Spreads, VIX, VIX3M, NFCI, yield curves (10Y-2Y, 10Y-3M), TED Spread, Sahm Rule, jobless claims, S&P 500, gold, 10Y yield</div>
                  </div>
                  <button onClick={fetchRegime} disabled={regimeLoading} style={{ padding: "6px 12px", borderRadius: 0, border: "1px solid rgba(110,231,183,.2)", background: "rgba(66,190,101,.08)", color: cs.green, fontSize: 9, fontWeight: 600, cursor: regimeLoading ? "wait" : "pointer", fontFamily: "inherit" }}>
                    {regimeLoading ? "Loading..." : regimeData ? "⟳ Refresh" : "Fetch Live Data"}
                  </button>
                </div>

                {regimeError && <div style={{ padding: "8px 10px", borderRadius: 0, background: "rgba(255,131,137,.06)", border: "1px solid rgba(248,113,113,.12)", fontSize: 9, color: cs.red, marginBottom: 10 }}>{regimeError}</div>}

                {!regimeData && !regimeLoading && !regimeError && <div style={{ textAlign: "center", padding: 20, color: cs.muted, fontSize: 10, border: "1px dashed #393939", borderRadius: 0 }}>
                  Auto-fetches on app launch. 12 FRED macro series analyzed with rolling z-scores, EMA smoothing, and cross-asset correlation to determine 5-state market regime (strong risk-on → strong risk-off).
                </div>}

                {regimeData?.regime && (() => {
                  const r = regimeData.regime;
                  const regimeColor = r.regime === "bull" ? cs.green : r.regime === "bear" ? cs.red : cs.yellow;
                  const state5Colors = { strong_risk_on: "#42be65", mild_risk_on: "#6fdc8c", neutral: "#ffab91", mild_risk_off: "#ff832b", strong_risk_off: "#ff8389" };
                  const state5Labels = { strong_risk_on: "STRONG RISK-ON", mild_risk_on: "MILD RISK-ON", neutral: "NEUTRAL", mild_risk_off: "MILD RISK-OFF", strong_risk_off: "STRONG RISK-OFF" };
                  const s5 = r.state5 || "neutral";
                  const s5Color = state5Colors[s5] || cs.yellow;

                  return <div>
                    {/* 5-State Regime Banner */}
                    <div style={{ padding: "14px 16px", borderRadius: 0, background: `${s5Color}0a`, border: `1px solid ${s5Color}30`, marginBottom: 12 }}>
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
                      <div style={{ display: "flex", height: 10, borderRadius: 0, overflow: "hidden", background: "#222222" }}>
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
                    <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>Factor Signals (12-factor weighted composite)</div>
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
                        return <div key={f.key} style={{ padding: "8px 10px", borderRadius: 0, background: "rgba(255,255,255,.01)", border: `1px solid ${sigColor}12` }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 10 }}>{f.icon}</span>
                            <span style={{ width: 6, height: 6, borderRadius: 3, background: sigColor, display: "inline-block" }} />
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: mono2, color: sigColor }}>{f.fmt(d.value)}</div>
                          <div style={{ fontSize: 7, color: cs.muted, marginTop: 2 }}>{f.label}</div>
                          <div style={{ fontSize: 7, color: cs.dim, fontFamily: mono2, display: "flex", alignItems: "center", gap: 4 }}>
                            <span>z: {d.zScore?.toFixed(2) || "—"}</span>
                            {d.zScore != null && <div style={{ flex: 1, height: 4, background: "#262626", borderRadius: 2, overflow: "hidden", position: "relative", minWidth: 30 }}>
                              {/* Center line at z=0 */}
                              <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: "100%", background: "#444" }} />
                              {/* Z-score bar */}
                              <div style={{
                                position: "absolute",
                                top: 0,
                                height: "100%",
                                borderRadius: 2,
                                background: sigColor,
                                ...(d.zScore >= 0
                                  ? { left: "50%", width: `${Math.min(Math.abs(d.zScore) / 3 * 50, 50)}%` }
                                  : { right: "50%", width: `${Math.min(Math.abs(d.zScore) / 3 * 50, 50)}%` }
                                ),
                              }} />
                            </div>}
                            <span>w: {(d.weight * 100).toFixed(0)}%</span>
                          </div>
                        </div>;
                      }).filter(Boolean)}
                    </div>

                    {/* Cross-Asset Correlations */}
                    {r.crossAsset && Object.keys(r.crossAsset).length > 0 && <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 0, background: "#1c1c1c" }}>
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
                        return <div key={i} style={{ padding: "8px 10px", borderRadius: 0, background: "rgba(255,255,255,.01)", border: `1px solid ${sigColor}10` }}>
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
                    <div style={{ padding: "8px 10px", borderRadius: 0, background: "#1c1c1c", fontSize: 8, color: cs.dim, marginBottom: 8 }}>
                      {(() => {
                        const allSignals = Object.values(r.details || {}).filter(d => d?.signal);
                        const on = allSignals.filter(d => d.signal === "risk-on").length;
                        const off = allSignals.filter(d => d.signal === "risk-off").length;
                        const neut = allSignals.filter(d => d.signal === "neutral").length;
                        return <span>{on} risk-on · {off} risk-off · {neut} neutral of {allSignals.length} factors · 5-state model · Daily EMA(10/60) smoothing · 12 FRED series + cross-asset correlation</span>;
                      })()}
                    </div>

                    {/* 5-State Optimizer Guidance */}
                    <div style={{ padding: "10px 12px", borderRadius: 0, background: `${s5Color}08`, border: `1px solid ${s5Color}15` }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: s5Color, marginBottom: 4 }}>Optimizer Guidance: {state5Labels[s5]}{r.momentum ? ` / ${r.momentum}` : ""}</div>
                      <div style={{ fontSize: 9, color: cs.dim, lineHeight: 1.6 }}>
                        {s5 === "strong_risk_on" && "Aggressive allocation. Optimizer tilts +15% to growth, tech, small cap, EM. Full Kelly sizing. Historically best environment for risk assets. Return shrinkage still applies — no single-stock dominance."}
                        {s5 === "mild_risk_on" && "Growth-tilted. Moderate overweight to aggressive categories. Max Sharpe recommended. Duration scaling amplifies tilt over time. Watch for complacency signals (compressed spreads + low VIX)."}
                        {s5 === "neutral" && "Balanced allocation across sectors. Vol target 12-15%. Minimum 3 positions enforced. Transition state — monitor acceleration and entry signals for directional shift."}
                        {s5 === "mild_risk_off" && "Defensive tilt. Increase bonds, dividend, quality, utilities. Kelly sizing reduced to 80% for aggressive assets. Tax-loss harvesting opportunities likely. Consider Min Volatility objective."}
                        {s5 === "strong_risk_off" && "Full defensive. Bonds, treasuries, gold favored. Kelly cut to 50% for aggressive positions. Min Volatility objective. Tax-loss harvest aggressively. Best entry signals often appear near the END of this state — watch for bear→bull transitions."}
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
                    <div style={{ fontSize: 9, color: cs.dim, marginTop: 2 }}>Historical regime episodes, transition probabilities, and forward returns by duration. Auto-fetched from 12 FRED series (2005–2025).</div>
                  </div>
                  <button onClick={fetchRegimeAnalytics} disabled={analyticsLoading} style={{ padding: "6px 12px", borderRadius: 0, border: "1px solid rgba(251,191,36,.2)", background: "rgba(255,171,145,.08)", color: cs.yellow, fontSize: 9, fontWeight: 600, cursor: analyticsLoading ? "wait" : "pointer", fontFamily: "inherit" }}>
                    {analyticsLoading ? "Computing..." : regimeAnalytics ? "⟳ Refresh" : "Run Analysis"}
                  </button>
                </div>

                {!regimeAnalytics && !analyticsLoading && <div style={{ textAlign: "center", padding: 18, color: cs.muted, fontSize: 10, border: "1px dashed #393939", borderRadius: 0 }}>
                  Auto-fetches on app launch. Computes regime episodes, transition probabilities, and optimal entry signals from 20 years of FRED macro data.
                </div>}

                {regimeAnalytics && (() => {
                  const a = regimeAnalytics;
                  const regColors = { bull: cs.green, neutral: cs.yellow, bear: cs.red };

                  return <div>
                    {/* Current Position */}
                    {a.current && <div style={{ padding: "12px 14px", borderRadius: 0, background: `${regColors[a.current.regime]}08`, border: `1px solid ${regColors[a.current.regime]}20`, marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: regColors[a.current.regime], marginBottom: 4 }}>Current Position</div>
                      <div style={{ fontSize: 10, color: cs.dim, lineHeight: 1.7 }}>
                        <span style={{ color: regColors[a.current.regime], fontWeight: 600 }}>{a.current.regime.toUpperCase()}</span> regime for <span style={{ color: cs.text, fontWeight: 600, fontFamily: mono2 }}>{a.current.runLength}</span> months
                        {a.current.transition && <span> · Transition: <span style={{ fontFamily: mono2, color: cs.text }}>{a.current.transition}</span></span>}
                        {a.current.prevDuration && <span> · Previous {a.current.prevRegime} lasted {a.current.prevDuration}m</span>}
                      </div>
                      {a.current.signalMatch && <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 0, background: "#1e1e1e" }}>
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

                    {/* ── Three-Stage Context Analysis ── */}
                    {a.episodes?.length > 2 && (() => {
                      // Build three-stage patterns from episode history
                      const eps = a.episodes;
                      const patterns = [];
                      for (let i = 2; i < eps.length; i++) {
                        const prev = eps[i - 2], bridge = eps[i - 1], cur = eps[i];
                        let patternType, signal;
                        if (prev.regime === cur.regime) {
                          patternType = bridge.months <= 2 ? "continuation_brief" : bridge.months <= 6 ? "continuation_extended" : "consolidation_reset";
                          signal = patternType === "continuation_extended" ? (cur.regime === "bull" ? 0.03 : cur.regime === "bear" ? -0.03 : 0) : 0;
                        } else if (prev.regime === "bear" && cur.regime === "bull") {
                          patternType = "reversal_bear_to_bull";
                          signal = bridge.months <= 3 ? 0.10 : bridge.months <= 6 ? 0.06 : 0.03;
                        } else if (prev.regime === "bull" && cur.regime === "bear") {
                          patternType = "reversal_bull_to_bear";
                          signal = bridge.months <= 3 ? -0.10 : bridge.months <= 6 ? -0.06 : -0.03;
                        } else if (prev.regime === "bear" && cur.regime === "neutral") {
                          patternType = "recovery_emerging"; signal = 0.04;
                        } else if (prev.regime === "bull" && cur.regime === "neutral") {
                          patternType = "topping_emerging"; signal = -0.04;
                        } else {
                          patternType = "transition"; signal = 0;
                        }
                        const effDur = patternType === "continuation_brief" ? cur.months + bridge.months + prev.months : patternType === "continuation_extended" ? cur.months + Math.floor(prev.months * 0.5) : cur.months;
                        patterns.push({
                          pattern: `${prev.regime}→${bridge.regime}→${cur.regime}`,
                          patternType, signal,
                          prevDur: prev.months, bridgeDur: bridge.months, curDur: cur.months,
                          effDur, start: prev.start, end: cur.end,
                        });
                      }

                      // Group by pattern type and count
                      const typeCounts = {};
                      patterns.forEach(p => {
                        if (!typeCounts[p.patternType]) typeCounts[p.patternType] = { count: 0, patterns: [], totalSignal: 0, bridges: [] };
                        typeCounts[p.patternType].count++;
                        typeCounts[p.patternType].patterns.push(p);
                        typeCounts[p.patternType].totalSignal += p.signal;
                        typeCounts[p.patternType].bridges.push(p.bridgeDur);
                      });

                      // Current three-stage context
                      const curThreeStage = a.current && eps.length >= 2 ? (() => {
                        const curEp = eps[eps.length - 1];
                        const bridgeEp = eps[eps.length - 2];
                        const prevEp = eps.length >= 3 ? eps[eps.length - 3] : null;
                        if (!prevEp) return null;
                        const p = patterns[patterns.length - 1];
                        return p;
                      })() : null;

                      const typeLabels = {
                        continuation_brief: { label: "Continuation (Brief Pause)", emoji: "⏩", desc: "Same regime before & after a 1-2 month bridge. Effective duration extends through the bridge." },
                        continuation_extended: { label: "Continuation (Extended Pause)", emoji: "⏸️", desc: "Same regime resumes after 3-6 month bridge. Partial duration credit for pre-bridge run." },
                        consolidation_reset: { label: "Consolidation Reset", emoji: "🔄", desc: "Long bridge (7m+) breaks the trend. New regime treated as fresh start." },
                        reversal_bear_to_bull: { label: "Reversal: Bear → Bull", emoji: "🚀", desc: "Bear market ends, bull begins. Strongest entry signal. Shorter bridge = sharper V-recovery." },
                        reversal_bull_to_bear: { label: "Reversal: Bull → Bear", emoji: "📉", desc: "Bull market ends, bear begins. Strongest defensive signal." },
                        recovery_emerging: { label: "Recovery Emerging", emoji: "🌱", desc: "Bear ends, settling into neutral. Cautious optimism — bull may follow." },
                        topping_emerging: { label: "Topping Emerging", emoji: "⚠️", desc: "Bull ends, settling into neutral. Cautious pessimism — bear may follow." },
                        transition: { label: "Other Transition", emoji: "↔️", desc: "Regime change without strong directional signal." },
                      };

                      return <div style={{ padding: "12px 14px", borderRadius: 0, background: "rgba(190,149,255,.06)", border: "1px solid rgba(167,139,250,.12)", marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: cs.purple, marginBottom: 2 }}>🔮 Three-Stage Regime Context</div>
                        <div style={{ fontSize: 8, color: cs.dim, marginBottom: 10 }}>Analyzes the pattern: prevRegime → bridgeRegime → currentRegime. Bridge duration determines whether a pause is a continuation or a genuine reversal.</div>

                        {/* Current Three-Stage */}
                        {curThreeStage && <div style={{ padding: "8px 10px", borderRadius: 0, background: "#1e1e1e", marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: cs.text, marginBottom: 4 }}>Current Pattern</div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{ fontSize: 14 }}>{typeLabels[curThreeStage.patternType]?.emoji || "↔️"}</span>
                            <span style={{ fontSize: 10, fontFamily: mono2, fontWeight: 600, color: cs.text }}>{curThreeStage.pattern}</span>
                            <Badge color={curThreeStage.signal > 0 ? cs.green : curThreeStage.signal < 0 ? cs.red : cs.dim}>
                              {typeLabels[curThreeStage.patternType]?.label || curThreeStage.patternType} {curThreeStage.signal !== 0 ? `${curThreeStage.signal > 0 ? "+" : ""}${(curThreeStage.signal * 100).toFixed(0)}%` : ""}
                            </Badge>
                          </div>
                          <div style={{ fontSize: 9, color: cs.dim, marginTop: 4, lineHeight: 1.6 }}>
                            Previous <span style={{ color: regColors[curThreeStage.pattern.split("→")[0]], fontWeight: 600 }}>{curThreeStage.pattern.split("→")[0]}</span> lasted <span style={{ fontFamily: mono2, color: cs.text }}>{curThreeStage.prevDur}m</span>
                            {" → "} Bridge <span style={{ color: regColors[curThreeStage.pattern.split("→")[1]], fontWeight: 600 }}>{curThreeStage.pattern.split("→")[1]}</span> lasted <span style={{ fontFamily: mono2, color: cs.text }}>{curThreeStage.bridgeDur}m</span>
                            {" → "} Current <span style={{ color: regColors[curThreeStage.pattern.split("→")[2]], fontWeight: 600 }}>{curThreeStage.pattern.split("→")[2]}</span> for <span style={{ fontFamily: mono2, color: cs.text }}>{curThreeStage.curDur}m</span>
                            {curThreeStage.effDur !== curThreeStage.curDur && <span> · <span style={{ color: cs.purple, fontWeight: 600 }}>Effective duration: {curThreeStage.effDur}m</span></span>}
                          </div>
                          <div style={{ fontSize: 8, color: cs.muted, marginTop: 3 }}>{typeLabels[curThreeStage.patternType]?.desc}</div>
                        </div>}

                        {/* Pattern History Table */}
                        <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>Historical Three-Stage Patterns ({patterns.length} total)</div>
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                            <thead><tr>
                              <th style={{ padding: "5px 6px", textAlign: "left", color: cs.dim, fontSize: 8 }}>Pattern Type</th>
                              <th style={{ padding: "5px 6px", textAlign: "center", color: cs.dim, fontSize: 8 }}>Count</th>
                              <th style={{ padding: "5px 6px", textAlign: "center", color: cs.dim, fontSize: 8 }}>Avg Bridge</th>
                              <th style={{ padding: "5px 6px", textAlign: "center", color: cs.dim, fontSize: 8 }}>Signal</th>
                              <th style={{ padding: "5px 6px", textAlign: "left", color: cs.dim, fontSize: 8 }}>Effect on Optimizer</th>
                            </tr></thead>
                            <tbody>
                              {Object.entries(typeCounts).sort((a, b) => b[1].count - a[1].count).map(([type, data]) => {
                                const info = typeLabels[type] || { label: type, emoji: "↔️" };
                                const avgBridge = data.bridges.length > 0 ? (data.bridges.reduce((s, v) => s + v, 0) / data.bridges.length).toFixed(1) : "—";
                                const avgSignal = data.count > 0 ? data.totalSignal / data.count : 0;
                                return <tr key={type} style={{ borderTop: "1px solid #222222" }}>
                                  <td style={{ padding: "5px 6px" }}><span style={{ marginRight: 3 }}>{info.emoji}</span> <span style={{ fontWeight: 600, color: cs.text }}>{info.label}</span></td>
                                  <td style={{ padding: "5px 6px", textAlign: "center", fontFamily: mono2 }}>{data.count}</td>
                                  <td style={{ padding: "5px 6px", textAlign: "center", fontFamily: mono2 }}>{avgBridge}m</td>
                                  <td style={{ padding: "5px 6px", textAlign: "center", fontFamily: mono2, fontWeight: 600, color: avgSignal > 0 ? cs.green : avgSignal < 0 ? cs.red : cs.dim }}>{avgSignal !== 0 ? `${avgSignal > 0 ? "+" : ""}${(avgSignal * 100).toFixed(1)}%` : "—"}</td>
                                  <td style={{ padding: "5px 6px", fontSize: 8, color: cs.muted }}>{type.includes("continuation_brief") ? "Extends effective duration through bridge" : type.includes("continuation_extended") ? "50% duration credit for pre-bridge run" : type.includes("reversal") ? "Strong entry/exit signal, fresh duration" : type.includes("recovery") ? "+4% aggressive bonus" : type.includes("topping") ? "-4% defensive signal" : "No special adjustment"}</td>
                                </tr>;
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Recent Episodes with Three-Stage Context */}
                        <div style={{ fontSize: 10, fontWeight: 600, marginTop: 10, marginBottom: 6 }}>Recent Three-Stage Episodes</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {patterns.slice(-8).reverse().map((p, i) => {
                            const info = typeLabels[p.patternType] || { emoji: "↔️", label: p.patternType };
                            const parts = p.pattern.split("→");
                            return <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 0, background: i === 0 ? "rgba(190,149,255,.06)" : "rgba(255,255,255,.01)", border: `1px solid ${i === 0 ? "rgba(190,149,255,.15)" : "#222222"}`, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 11 }}>{info.emoji}</span>
                              <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                                <span style={{ fontSize: 9, fontFamily: mono2, color: regColors[parts[0]], fontWeight: 600 }}>{parts[0]}</span>
                                <span style={{ fontSize: 8, color: cs.dim }}>({p.prevDur}m)</span>
                                <span style={{ fontSize: 8, color: cs.dim }}>→</span>
                                <span style={{ fontSize: 9, fontFamily: mono2, color: regColors[parts[1]], fontWeight: 600 }}>{parts[1]}</span>
                                <span style={{ fontSize: 8, color: cs.dim }}>({p.bridgeDur}m)</span>
                                <span style={{ fontSize: 8, color: cs.dim }}>→</span>
                                <span style={{ fontSize: 9, fontFamily: mono2, color: regColors[parts[2]], fontWeight: 600 }}>{parts[2]}</span>
                                <span style={{ fontSize: 8, color: cs.dim }}>({p.curDur}m)</span>
                              </div>
                              <Badge color={p.signal > 0 ? cs.green : p.signal < 0 ? cs.red : cs.dim}>
                                {info.label.split("(")[0].trim()} {p.signal !== 0 ? `${p.signal > 0 ? "+" : ""}${(p.signal * 100).toFixed(0)}%` : ""}
                              </Badge>
                              {p.effDur !== p.curDur && <span style={{ fontSize: 8, fontFamily: mono2, color: cs.purple }}>eff: {p.effDur}m</span>}
                              <span style={{ fontSize: 7, fontFamily: mono2, color: cs.muted }}>{p.start}–{p.end}</span>
                            </div>;
                          })}
                        </div>
                      </div>;
                    })()}

                    {/* Regime Timeline */}
                    <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>Regime Timeline ({a.episodes?.length} episodes, {a.totalMonths} months)</div>
                    <div style={{ display: "flex", height: 28, borderRadius: 0, overflow: "hidden", marginBottom: 12, border: "1px solid #262626" }}>
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
                        return <div key={regime} style={{ padding: "10px 12px", borderRadius: 0, background: "#1c1c1c", border: `1px solid ${regColors[regime]}12` }}>
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
                            {["bull","neutral","bear"].map(from => <tr key={from} style={{ borderTop: "1px solid #222222" }}>
                              <td style={{ padding: "5px 8px", color: regColors[from], fontWeight: 600 }}>{from.toUpperCase()}</td>
                              {["bull","neutral","bear"].map(to => {
                                const pct = a.transitionProb[from]?.[to] || 0;
                                const isHigh = pct > 50;
                                return <td key={to} style={{ padding: "5px 8px", textAlign: "center", fontFamily: mono2, fontWeight: isHigh ? 700 : 400, color: isHigh ? cs.text : cs.muted, background: isHigh ? "#222222" : "transparent" }}>{pct}%</td>;
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
                                <tr key={`${regime}-${bucket}`} style={{ borderTop: i === 0 ? `1px solid ${regColors[regime]}20` : "1px solid #1e1e1e" }}>
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
                          return <div key={sig.pattern} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 0, background: isBest ? "rgba(66,190,101,.06)" : "rgba(255,255,255,.01)", border: `1px solid ${isBest ? "rgba(66,190,101,.18)" : "#222222"}` }}>
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
                              return <tr key={pattern} style={{ borderTop: "1px solid #222222", background: isActive ? "rgba(251,191,36,.04)" : "transparent" }}>
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

        </div>}

        {/* ════ FRONTIER ════ */}
        {tab === "Frontier" && <div>
          <div style={cardS}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Efficient Frontier Analysis</div>
            <div style={{ fontSize: 9, color: cs.muted, marginBottom: 12 }}>
              {cashBalance > 0 ? `Cash deployment optimizer: 2,000 simulations showing ways to deploy $${cashBalance.toLocaleString()} across ETFs.` : "Portfolio frontier analysis across risk-return universe. Current portfolio shown in pink."}
            </div>
          </div>

          {/* Original Frontier Scatter (if cash available) */}
          {cashBalance > 0 && <div style={{ ...cardS, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "center", overflowX: "auto" }}>
              <Scatter data={frontier} cp={metrics} />
            </div>
          </div>}

          {/* Enhanced Analysis */}
          <EnhancedFrontier frontier={frontier} metrics={metrics} etfDB={ETF_DB} cashBalance={cashBalance} allPos={allPos} holdingsVal={holdingsVal} />
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
                <button key={c.k} onClick={() => { setAiCtx(c.k); getAI(c.k) }} disabled={aiL} style={{ flex: "1 1 130px", padding: "10px 12px", borderRadius: 0, border: "1px solid", cursor: aiL ? "wait" : "pointer", fontFamily: "inherit", textAlign: "left", borderColor: aiCtx === c.k && aiText ? "rgba(66,190,101,.25)" : "#393939", background: aiCtx === c.k && aiText ? "rgba(66,190,101,.08)" : "#1e1e1e", color: aiCtx === c.k && aiText ? cs.green : cs.dim, opacity: aiL ? .5 : 1 }}>
                  <div style={{ fontSize: 14, marginBottom: 3 }}>{c.i}</div>
                  <div style={{ fontSize: 10, fontWeight: 600 }}>{c.l}</div>
                  <div style={{ fontSize: 8, opacity: .6, marginTop: 1 }}>{c.d}</div>
                </button>
              ))}
            </div>

            {!etfs.length && !stocks.length && <div style={{ textAlign: "center", padding: 25, color: cs.muted, fontSize: 10, border: "1px dashed #393939", borderRadius: 0 }}>Add holdings first.</div>}
            {aiL && <div style={{ padding: 18, textAlign: "center" }}><div style={{ fontSize: 12, color: cs.green }}><span style={{ display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }}>✦</span> Analyzing with live market data...</div></div>}
            {aiText && !aiL && <div style={{ padding: 16, borderRadius: 0, background: "rgba(66,190,101,.04)", border: "1px solid rgba(110,231,183,.08)", fontSize: 11, lineHeight: 1.65, color: "#d1d5db" }}><AiMarkdown text={aiText} /></div>}
          </div>
        </div>}

        {/* ════ BACKTEST ════ */}
        {tab === "Backtest" && <div>
          <div style={cardS}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
              <span style={{ fontSize: 16 }}>📈</span><div style={{ fontSize: 13, fontWeight: 700 }}>Backtest: 2006–2025</div>
            </div>
            <div style={{ fontSize: 10, color: cs.dim, marginBottom: 14 }}>Simulates your optimizer settings against historical data (2006-2025). Includes 2008 financial crisis, 2020 COVID crash, and 2022 rate hike cycle. Tiered candidates: top 50 in bull markets, full universe (~130) in bear/neutral. Iterations scale with pool size (300-600). SPY-overlap penalty, return shrinkage (stocks 80%, ETFs 120%), and actual cost basis tracking.</div>

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
                {includeStocks && <span style={{ color: cs.blue }}> · ETF+Stocks</span>}
                <span style={{ color: cs.purple }}> · Tax: {taxRates.lt.toFixed(1)}% LT</span>
              </div>
            </div>

            <button onClick={runBacktest} disabled={btRunning} style={{ width: "100%", padding: "11px", borderRadius: 0, border: "none", background: btRunning ? "#393939" : cs.blue, color: btRunning ? cs.dim : cs.bg, fontSize: 12, fontWeight: 700, cursor: btRunning ? "wait" : "pointer", fontFamily: "inherit" }}>
              {btRunning ? btProgress : "Run Backtest (2006–2025)"}
            </button>
          </div>

          {btResult && (() => {
            const { curves, summary, annual, startCash: sc2 } = btResult;
            return <>
              {includeStocks && <div style={{ ...cardS, background: "rgba(96,165,250,.04)", borderColor: "rgba(96,165,250,.15)", marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: cs.blue }}>📊 <strong>Historical stock universe (2006–2025, ~100-140 per year):</strong> Top ~15 S&P 500 stocks per GICS sector at each year. Covers 2008 crisis (AIG in Financials pre-crash, removed after), 2010 recovery (V/MA enter), 2017 tech shift (NVDA enters), 2020 COVID (TSLA in Consumer), and 2023 AI boom (SMCI). GE Industrial #1 in 2006, exits by 2018. Return shrinkage (80% cap) + SPY-overlap penalty.</div>
              </div>}
              {/* Interactive Equity Curve */}
              <EquityCurve curves={curves} sc2={sc2} />

              {/* Annual Returns Bar Chart */}
              <AnnualReturnBars annual={annual} />

              {/* Drawdown Chart */}
              <DrawdownChart curves={curves} />

              {/* Monthly Returns Heatmap */}
              <MonthlyHeatmap curves={curves} />

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
                {useRegime && <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6, padding: "5px 8px", borderRadius: 0, background: "#1c1c1c" }}>
                  <span style={{ fontSize: 8, color: cs.dim, fontWeight: 600 }}>Regime:</span>
                  <span style={{ fontSize: 8, color: cs.dim }}>🟢 Strong Risk-On</span>
                  <span style={{ fontSize: 8, color: cs.dim }}>🟩 Mild Risk-On</span>
                  <span style={{ fontSize: 8, color: cs.dim }}>🟡 Neutral</span>
                  <span style={{ fontSize: 8, color: cs.dim }}>🟧 Mild Risk-Off</span>
                  <span style={{ fontSize: 8, color: cs.dim }}>🔴 Strong Risk-Off</span>
                </div>}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #393939" }}>
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
                            style={{ borderBottom: isExp ? "none" : "1px solid #222222", cursor: "pointer", background: isExp ? "rgba(110,231,183,.03)" : "transparent" }}
                            onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = "#1e1e1e" }}
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
                            <div style={{ padding: "10px 12px 14px", background: "rgba(66,190,101,.04)", borderBottom: "1px solid rgba(110,231,183,.08)" }}>
                              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                {/* Holdings */}
                                <div style={{ flex: "1 1 250px", minWidth: 200 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: cs.green, marginBottom: 6 }}>📊 Holdings ({a.holdings?.length || 0} ETFs · {fmt$(a.portfolioValue || 0)})</div>
                                  {a.holdings?.length > 0 ? <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    {a.holdings.map((h, i) => (
                                      <div key={h.ticker} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 7px", borderRadius: 0, background: i % 2 ? "rgba(255,255,255,.01)" : "transparent" }}>
                                        <span style={{ width: 4, height: 14, borderRadius: 2, background: PAL[i % PAL.length], flexShrink: 0 }} />
                                        <span style={{ fontFamily: mono2, fontWeight: 600, fontSize: 10, color: cs.green, minWidth: 40 }}>{h.ticker}</span>
                                        <span style={{ fontSize: 8, color: cs.dim, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</span>
                                        <span style={{ fontFamily: mono2, fontSize: 9, color: cs.text, fontWeight: 600, minWidth: 35, textAlign: "right" }}>{h.weight}%</span>
                                        <span style={{ fontFamily: mono2, fontSize: 8, color: cs.muted, minWidth: 50, textAlign: "right" }}>{fmt$(h.dollars)}</span>
                                      </div>
                                    ))}
                                    <div style={{ marginTop: 6, padding: "6px 7px", borderRadius: 0, background: "#1c1c1c", fontSize: 8, color: cs.dim }}>
                                      {(() => { const cats = {}; (a.holdings || []).forEach(h => { cats[h.cat] = (cats[h.cat] || 0) + h.weight; }); return Object.entries(cats).sort(([,x],[,y]) => y - x).map(([cat, wt]) => `${cat}: ${wt.toFixed(0)}%`).join(" · "); })()}
                                    </div>
                                  </div> : <div style={{ fontSize: 9, color: cs.muted }}>No data</div>}
                                </div>
                                {/* Rebalance Trades */}
                                <div style={{ flex: "1 1 250px", minWidth: 200 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: a.rebalanceCount > 0 ? cs.blue : cs.blue, marginBottom: 6 }}>{a.rebalanceCount > 0 ? `⚡ ${a.rebalanceCount} Rebalance${a.rebalanceCount > 1 ? "s" : ""} This Year` : "🛡 Held All Year (tax-optimized)"}</div>
                                  {a.rebalanceEvents?.length > 0 ? <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {a.rebalanceEvents.map((evt, ei) => (
                                      <div key={ei} style={{ padding: "6px 8px", borderRadius: 0, background: "rgba(66,190,101,.04)", border: "1px solid rgba(110,231,183,.06)" }}>
                                        <div style={{ fontSize: 9, fontWeight: 600, color: cs.green, marginBottom: 3 }}>📅 {evt.date} · {evt.taxType} rate ({evt.taxRate?.toFixed(1)}%)
                                          {evt.regime && <span style={{ color: cs.yellow, fontWeight: 400 }}> · {evt.regime.replace(/_/g," ")}</span>}
                                          {evt.duration > 0 && <span style={{ color: cs.dim, fontWeight: 400 }}> · {evt.duration}m</span>}
                                          {evt.fwdSignal?.confidence > 0.3 && <span style={{ color: evt.fwdSignal.fwd > 10 ? cs.green : evt.fwdSignal.fwd < 0 ? cs.red : cs.dim, fontWeight: 400 }}> · Fwd 6m: {evt.fwdSignal.fwd > 0 ? "+" : ""}{evt.fwdSignal.fwd.toFixed(1)}%</span>}
                                          {evt.threeStage && <span style={{ color: evt.threeStage.signal > 0 ? cs.green : evt.threeStage.signal < 0 ? cs.red : cs.dim, fontWeight: 400 }}> · {evt.threeStage.pattern} ({evt.threeStage.type?.replace(/_/g," ")})</span>}
                                          {evt.candidateCount && <span style={{ color: cs.dim, fontWeight: 400 }}> · {evt.candidateCount} candidates/{evt.iterations} iter</span>}
                                        </div>
                                        <div style={{ fontSize: 8, fontFamily: mono2, color: cs.dim, marginBottom: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                          <span>Gains: <span style={{ color: cs.green }}>{fmt$(evt.grossGains || 0)}</span></span>
                                          <span>Losses: <span style={{ color: cs.red }}>{fmt$(evt.grossLosses || 0)}</span></span>
                                          {(evt.lossOffset || 0) > 0 && <span>Offset: <span style={{ color: cs.blue }}>−{fmt$(evt.lossOffset)}</span></span>}
                                          <span>Net Tax: <span style={{ color: evt.taxPaid > 0 ? cs.red : cs.green }}>{fmt$(evt.taxPaid)}</span></span>
                                          {(evt.taxSaved || 0) > 0 && <span style={{ color: cs.green }}>Saved: {fmt$(evt.taxSaved)}</span>}
                                          {(evt.lossCarryover || 0) > 0 && <span style={{ color: cs.blue }}>Carry: {fmt$(evt.lossCarryover)}</span>}
                                        </div>
                                        {evt.trades?.map((t2, i) => (
                                          <div key={t2.ticker} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 4px", fontSize: 9, borderBottom: i < evt.trades.length - 1 ? "1px solid #222222" : "none" }}>
                                            <Badge color={t2.action === "BUY" ? cs.green : cs.red}>{t2.action}</Badge>
                                            <span style={{ fontFamily: mono2, fontWeight: 600, color: t2.action === "BUY" ? cs.green : cs.red, minWidth: 36 }}>{t2.ticker}</span>
                                            <span style={{ fontSize: 8, color: cs.dim, minWidth: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t2.name}</span>
                                            {t2.shares > 0 && <span style={{ fontFamily: mono2, fontSize: 8, color: cs.text, minWidth: 40, textAlign: "right" }}>{t2.shares.toLocaleString(undefined,{maximumFractionDigits:1})} sh</span>}
                                            {t2.price && <span style={{ fontFamily: mono2, fontSize: 8, color: cs.dim, minWidth: 44, textAlign: "right" }}>@ ${t2.price.toLocaleString(undefined,{maximumFractionDigits:2})}</span>}
                                            {t2.action === "SELL" && t2.costPerShare != null && <span style={{ fontFamily: mono2, fontSize: 8, color: cs.dim, minWidth: 50, textAlign: "right" }}>cost ${t2.costPerShare.toLocaleString(undefined,{maximumFractionDigits:2})}</span>}
                                            <span style={{ fontFamily: mono2, fontSize: 8, fontWeight: 600, color: t2.change > 0 ? cs.green : cs.red, minWidth: 34, textAlign: "right" }}>{t2.change > 0 ? "+" : ""}{t2.change}%</span>
                                            {t2.action === "SELL" && t2.gl != null && <span style={{ fontFamily: mono2, fontSize: 8, fontWeight: 600, color: t2.gl >= 0 ? cs.green : cs.red, minWidth: 50, textAlign: "right" }}>{t2.gl >= 0 ? "+" : ""}{fmt$(t2.gl)}</span>}
                                            {t2.action === "BUY" && <span style={{ fontFamily: mono2, fontSize: 8, color: cs.dim, minWidth: 50, textAlign: "right" }}>{fmt$(Math.round(t2.dollars))}</span>}
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div> : <div style={{ fontSize: 9, color: cs.muted, padding: "8px 0" }}>{a.year === btResult?.annualResults?.[0]?.year ? "Initial allocation" : "Portfolio held — improvement did not exceed 1.5% hurdle + turnover cost"}</div>}
                                </div>
                              </div>
                              {/* Regime Context for this year */}
                              {useRegime && a.state5 && <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 0, background: "rgba(255,171,145,.04)", border: "1px solid rgba(251,191,36,.08)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                <span style={{ fontSize: 9, fontWeight: 600, color: cs.yellow }}>🌊 Regime</span>
                                <span style={{ fontSize: 9, fontFamily: mono2, color: cs.text }}>{a.state5?.replace(/_/g, " ")}</span>
                                {a.duration > 0 && <span style={{ fontSize: 9, fontFamily: mono2, color: cs.dim }}>Duration: <span style={{ color: cs.text, fontWeight: 600 }}>{a.duration}m</span></span>}
                                {a.transition && <span style={{ fontSize: 9, fontFamily: mono2, color: cs.dim }}>Transition: <span style={{ color: cs.blue, fontWeight: 600 }}>{a.transition}</span></span>}
                                {a.acceleration != null && <span style={{ fontSize: 9, fontFamily: mono2, color: a.acceleration > 0.1 ? cs.red : a.acceleration < -0.1 ? cs.green : cs.dim }}>Accel: {a.acceleration > 0 ? "+" : ""}{a.acceleration.toFixed(2)} {a.acceleration < -0.1 ? "↓ improving" : a.acceleration > 0.1 ? "↑ deteriorating" : "→ stable"}</span>}
                                {a.hmmState5 && <span style={{ fontSize: 9, fontFamily: mono2, color: "#60a5fa" }}>HMM: <span style={{ fontWeight: 600 }}>{a.hmmState5.replace(/_/g, " ")}</span>{a.hmmState5 !== a.state5 ? " ⚡" : " ✓"}</span>}
                                {a.transition && (() => {
                                  const [from, to] = a.transition.includes("→") ? a.transition.split("→") : [null, null];
                                  if (from === "bear" && (to === "bull" || to === "neutral") && a.duration >= 2 && a.duration <= 8)
                                    return <Badge color={cs.green}>ENTRY SIGNAL</Badge>;
                                  return null;
                                })()}
                              </div>}
                              {/* Rebalance Decision */}
                              <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 0, background: a.rebalanceCount > 0 ? "rgba(110,231,183,.03)" : "rgba(120,169,255,.05)", border: `1px solid ${a.rebalanceCount > 0 ? "rgba(66,190,101,.1)" : "rgba(96,165,250,.12)"}`, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                <Badge color={a.rebalanceCount > 0 ? cs.green : cs.blue}>{a.rebalanceCount > 0 ? `${a.rebalanceCount} REBALANCE${a.rebalanceCount > 1 ? "S" : ""}` : "HOLD ALL YEAR"}</Badge>
                                <span style={{ fontSize: 9, fontFamily: mono2, color: cs.dim }}>Monitored monthly · {12 - (a.rebalanceCount || 0)} holds, {a.rebalanceCount || 0} trades</span>
                                {a.rebalanceCount === 0 && <span style={{ fontSize: 8, color: cs.blue }}>Tax cost exceeded expected improvement every month → kept existing positions</span>}
                              </div>
                              {/* Tax Impact for this year */}
                              {(a.taxPaid > 0 || a.grossGains > 0 || a.grossLosses > 0 || a.taxSaved > 0) && <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 0, background: "rgba(190,149,255,.04)", border: "1px solid rgba(167,139,250,.08)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
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
                {btResult.etfsUsed} ETFs{includeStocks ? " + Stocks" : ""} · Quarterly + regime-triggered · 1.5% hurdle · SPY-overlap penalty · Return shrinkage · {ot.replace("_"," ")} · {srLabel}{useKelly ? " · ½Kelly" : ""}{useRegime ? ` · Regime (${btResult.regimeSource || "FRED"})${btResult.regimeDurationModel ? " + Duration Model" : ""}` : ""} · {btResult.tax?.rates?.lt?.toFixed(1)}% LT ({btResult.tax?.state === "None" ? "Federal" : btResult.tax?.state})
              </div>
            </>;
          })()}
        </div>}

        {/* ═══ SIMULATION: 100x Monte Carlo ═══ */}
        {tab === "Backtest" && <div style={{ marginTop: 14 }}>
          <div style={cardS}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>🎲 Monte Carlo Simulation</div>
                <div style={{ fontSize: 9, color: cs.dim }}>Run the backtest 100 times with randomized optimizer seeds and candidate selection. Measures consistency of outperformance vs S&P 500, with full tax model, return shrinkage, and diversification constraints matching the main backtest.</div>
              </div>
              <button onClick={runSimulation} disabled={simRunning || !btResult} style={{ padding: "9px 18px", borderRadius: 0, border: "none", background: (!btResult || simRunning) ? "#2a2a2a" : cs.purple, color: (!btResult || simRunning) ? cs.dim : cs.bg, fontSize: 11, fontWeight: 700, cursor: (!btResult || simRunning) ? "default" : "pointer", fontFamily: "inherit", opacity: simRunning ? 0.6 : 1 }}>
                {simRunning ? simProgress || "Running..." : !btResult ? "Run Backtest First" : "Run 100 Simulations"}
              </button>
            </div>
            {!btResult && <div style={{ fontSize: 9, color: cs.yellow }}>⚠ Run a backtest first — simulation reuses the same parameters and time period.</div>}
            {includeStocks && <div style={{ fontSize: 9, color: cs.blue, marginTop: 4 }}>📊 <strong>Sector-based universe:</strong> ~130-140 stocks per year (top ~15 per GICS sector). Growth names enter when they become sector leaders. Return shrinkage caps stocks at 80% trailing return. SPY-overlap penalty rewards differentiated portfolios.</div>}
          </div>

          {simResult && <div style={{ ...cardS, background: "rgba(167,139,250,.02)", borderColor: "rgba(167,139,250,.1)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: cs.purple, marginBottom: 10 }}>🎲 Simulation Results ({simResult.numSims} runs)</div>

            {/* Win Rate */}
            <div style={{ textAlign: "center", padding: "14px 0 18px", marginBottom: 14, background: "#1c1c1c", borderRadius: 0 }}>
              <div style={{ fontSize: 10, color: cs.dim, marginBottom: 4 }}>Win Rate vs S&P 500</div>
              <div style={{ fontSize: 42, fontWeight: 800, fontFamily: mono2, color: simResult.winPct >= 60 ? cs.green : simResult.winPct >= 40 ? cs.yellow : cs.red }}>
                {simResult.winPct}%
              </div>
              <div style={{ fontSize: 11, color: cs.dim }}>{simResult.winRate} of {simResult.numSims} backtests beat SPY</div>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(90px,1fr))", gap: 8, marginBottom: 14 }}>
              {[
                { l: "SPY Final", v: fmt$(simResult.spyFinal), c: cs.blue },
                { l: "Avg Final", v: fmt$(simResult.avgFinal), c: simResult.avgFinal > simResult.spyFinal ? cs.green : cs.red },
                { l: "Avg Alpha", v: `${simResult.avgAlpha > 0 ? "+" : ""}${simResult.avgAlpha}%`, c: simResult.avgAlpha > 0 ? cs.green : cs.red },
                { l: "Median Alpha", v: `${simResult.medianAlpha > 0 ? "+" : ""}${simResult.medianAlpha}%`, c: simResult.medianAlpha > 0 ? cs.green : cs.red },
                { l: "SPY CAGR", v: `${simResult.spyCAGR}%`, c: cs.blue },
                { l: "Avg CAGR", v: `${simResult.avgCAGR}%`, c: simResult.avgCAGR > simResult.spyCAGR ? cs.green : cs.red },
                { l: "Avg Tax Drag", v: fmt$(simResult.avgTaxPaid), c: cs.red },
              ].map(s => (
                <div key={s.l} style={{ textAlign: "center", padding: "8px 4px", background: "#1c1c1c", borderRadius: 0 }}>
                  <div style={{ fontSize: 7, color: cs.dim }}>{s.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: mono2, color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Distribution bar */}
            <div style={{ padding: "10px 12px", background: "#1c1c1c", borderRadius: 0, marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: cs.dim, marginBottom: 6 }}>Distribution of Final Portfolio Values</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: mono2, fontSize: 10 }}>
                <span style={{ color: cs.red, minWidth: 60 }}>{fmt$(simResult.minFinal)}</span>
                <div style={{ flex: 1, height: 8, borderRadius: 0, background: "#262626", position: "relative", overflow: "hidden" }}>
                  {(() => {
                    const range = simResult.maxFinal - simResult.minFinal || 1;
                    const p10L = ((simResult.p10Final - simResult.minFinal) / range) * 100;
                    const p90L = ((simResult.p90Final - simResult.minFinal) / range) * 100;
                    const spyL = ((simResult.spyFinal - simResult.minFinal) / range) * 100;
                    const medL = ((simResult.p50Final - simResult.minFinal) / range) * 100;
                    return <><div style={{ position: "absolute", left: `${p10L}%`, right: `${100 - p90L}%`, top: 0, bottom: 0, background: "rgba(66,190,101,.25)", borderRadius: 4 }} /><div style={{ position: "absolute", left: `${spyL}%`, top: -2, width: 2, height: 12, background: cs.blue, borderRadius: 1 }} title={`SPY: ${fmt$(simResult.spyFinal)}`} /><div style={{ position: "absolute", left: `${medL}%`, top: -2, width: 2, height: 12, background: cs.green, borderRadius: 1 }} title={`Median: ${fmt$(simResult.p50Final)}`} /></>;
                  })()}
                </div>
                <span style={{ color: cs.green, minWidth: 60, textAlign: "right" }}>{fmt$(simResult.maxFinal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: cs.dim, marginTop: 4 }}>
                <span>P10: {fmt$(simResult.p10Final)}</span>
                <span><span style={{ color: cs.green }}>●</span> Median: {fmt$(simResult.p50Final)}</span>
                <span><span style={{ color: cs.blue }}>●</span> SPY: {fmt$(simResult.spyFinal)}</span>
                <span>P90: {fmt$(simResult.p90Final)}</span>
              </div>
            </div>

            {/* Alpha histogram */}
            <div style={{ padding: "10px 12px", background: "#1c1c1c", borderRadius: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: cs.dim, marginBottom: 6 }}>Alpha Distribution (CAGR vs SPY)</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 50 }}>
                {(() => {
                  const alphas = simResult.distribution.map(r => r.alpha);
                  const mn = Math.min(...alphas), mx = Math.max(...alphas);
                  const rng = mx - mn || 1;
                  const bk = new Array(20).fill(0);
                  alphas.forEach(a => { bk[Math.min(19, Math.floor(((a - mn) / rng) * 20))]++; });
                  const mxB = Math.max(...bk) || 1;
                  const zi = Math.min(19, Math.max(0, Math.floor(((0 - mn) / rng) * 20)));
                  return bk.map((c, i) => <div key={i} style={{ flex: 1, height: `${(c / mxB) * 100}%`, minHeight: c > 0 ? 2 : 0, background: i >= zi ? "rgba(110,231,183,.4)" : "rgba(248,113,113,.4)", borderRadius: "2px 2px 0 0" }} />);
                })()}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, color: cs.dim, marginTop: 6 }}>
                <span>P10: {simResult.p10Alpha > 0 ? "+" : ""}{simResult.p10Alpha}%</span>
                <span style={{ color: simResult.avgAlpha > 0 ? cs.green : cs.red }}>Avg: {simResult.avgAlpha > 0 ? "+" : ""}{simResult.avgAlpha}%</span>
                <span>P90: {simResult.p90Alpha > 0 ? "+" : ""}{simResult.p90Alpha}%</span>
              </div>
            </div>
          </div>}
        </div>}

        <div style={{ marginTop: 24, padding: "12px 0", borderTop: "1px solid #222222", fontSize: 8, color: "#3d4250", textAlign: "center", lineHeight: 1.5 }}>
          Historical data from Yahoo Finance. Backtest uses actual monthly close prices, real cost basis tracking, tax-loss netting with carryover, and return shrinkage to dampen momentum bias. Stock universe filtered to S&P 500 sector leaders at each year (no survivorship bias). Past performance ≠ future results. Not financial advice. Consult a professional.
        </div>
      </div>
      {so && <div onClick={() => setSo(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />}
      {stockDD && <div onClick={() => setStockDD(false)} style={{ position: "fixed", inset: 0, zIndex: 55 }} />}
    </div>
  );
}
