import { Router, type IRouter } from "express";

const router: IRouter = Router();

interface TickerState {
  symbol: string;
  price: number;
  basePrice: number;
  openPrice: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume: number;
  direction: "up" | "down";
  ema9: number;
  ema100: number;
  rsi: number;
  signal: "BUY" | "SELL" | "HOLD";
  signalStrength: "strong" | "moderate" | "weak";
  priceHistory: number[];
  gains: number[];
  losses: number[];
  prevRsi: number;
  prevEma9: number;
}

const tickers: TickerState[] = [
  { symbol: "EURUSD",  price: 1.08520,   basePrice: 1.08500,  openPrice: 1.08500,  change: 0.00020, changePercent: 0.018,  high24h: 1.08900,  low24h: 1.07800,  volume: 12453200,  direction: "up",   ema9: 1.08510,   ema100: 1.08480,  rsi: 45, signal: "HOLD", signalStrength: "weak", priceHistory: [], gains: [], losses: [], prevRsi: 45, prevEma9: 1.08505 },
  { symbol: "GBPUSD",  price: 1.27340,   basePrice: 1.27300,  openPrice: 1.27300,  change: 0.00040, changePercent: 0.031,  high24h: 1.27900,  low24h: 1.26400,  volume: 8923400,   direction: "up",   ema9: 1.27320,   ema100: 1.27250,  rsi: 55, signal: "BUY",  signalStrength: "moderate", priceHistory: [], gains: [], losses: [], prevRsi: 50, prevEma9: 1.27310 },
  { symbol: "XAUUSD",  price: 2328.45,   basePrice: 2330.00,  openPrice: 2330.00,  change: -1.55,   changePercent: -0.066, high24h: 2345.00,  low24h: 2310.00,  volume: 345678,    direction: "down", ema9: 2329.80,   ema100: 2340.00,  rsi: 62, signal: "SELL", signalStrength: "moderate", priceHistory: [], gains: [], losses: [], prevRsi: 65, prevEma9: 2330.20 },
  { symbol: "BTCUSD",  price: 67234.50,  basePrice: 67000.00, openPrice: 67000.00, change: 234.50,  changePercent: 0.350,  high24h: 68500.00, low24h: 65200.00, volume: 2345678,   direction: "up",   ema9: 67150.00,  ema100: 66800.00, rsi: 58, signal: "BUY",  signalStrength: "strong", priceHistory: [], gains: [], losses: [], prevRsi: 52, prevEma9: 67100.00 },
];

const momentum: number[] = [0, 0, 0, 0];
const trendBias: number[] = [0, 0, 0, 0];
let trendTimer = 0;

function calcEma(price: number, prev: number, period: number): number {
  const k = 2 / (period + 1);
  return price * k + prev * (1 - k);
}

function calcRsi4(gains: number[], losses: number[]): number {
  if (gains.length < 4) return 50;
  const avgGain = gains.slice(-4).reduce((a, b) => a + b, 0) / 4;
  const avgLoss = losses.slice(-4).reduce((a, b) => a + b, 0) / 4;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return parseFloat((100 - 100 / (1 + rs)).toFixed(2));
}

function computeSignal(t: TickerState): { signal: "BUY" | "SELL" | "HOLD"; signalStrength: "strong" | "moderate" | "weak" } {
  const priceAboveEma100 = t.price > t.ema100;
  const priceBelowEma100 = t.price < t.ema100;
  const ema9TrendingUp = t.ema9 > t.prevEma9;
  const ema9TrendingDown = t.ema9 < t.prevEma9;
  const rsiHookUp = t.rsi > t.prevRsi;
  const rsiHookDown = t.rsi < t.prevRsi;

  // BUY: price above EMA100, EMA9 trending up, RSI < 20 with hook up
  if (priceAboveEma100 && ema9TrendingUp && t.rsi < 20 && rsiHookUp) {
    return { signal: "BUY", signalStrength: "strong" };
  }
  // BUY: price above EMA100, EMA9 trending up, RSI < 35
  if (priceAboveEma100 && ema9TrendingUp && t.rsi < 35 && rsiHookUp) {
    return { signal: "BUY", signalStrength: "moderate" };
  }
  // BUY: general upward
  if (priceAboveEma100 && ema9TrendingUp && t.rsi < 50) {
    return { signal: "BUY", signalStrength: "weak" };
  }

  // SELL: price below EMA100, EMA9 trending down, RSI > 80 with hook down
  if (priceBelowEma100 && ema9TrendingDown && t.rsi > 80 && rsiHookDown) {
    return { signal: "SELL", signalStrength: "strong" };
  }
  // SELL: price below EMA100, EMA9 trending down, RSI > 65
  if (priceBelowEma100 && ema9TrendingDown && t.rsi > 65 && rsiHookDown) {
    return { signal: "SELL", signalStrength: "moderate" };
  }
  // SELL: general downward
  if (priceBelowEma100 && ema9TrendingDown && t.rsi > 50) {
    return { signal: "SELL", signalStrength: "weak" };
  }

  return { signal: "HOLD", signalStrength: "weak" };
}

function updateTickers(): void {
  trendTimer++;

  // Shift macro trend every ~35s
  if (trendTimer % 44 === 0) {
    for (let i = 0; i < tickers.length; i++) {
      trendBias[i] = (Math.random() - 0.5) * 0.55;
    }
  }

  for (let i = 0; i < tickers.length; i++) {
    const t = tickers[i];
    const isCrypto = t.symbol === "BTCUSD";
    const isMetal = t.symbol === "XAUUSD";
    const dp = isCrypto || isMetal ? 2 : 5;
    const vol = isCrypto ? 0.0022 : isMetal ? 0.0012 : 0.00030;

    // Mean-reverting momentum
    momentum[i] = momentum[i] * 0.80 + (Math.random() - 0.5 + trendBias[i]) * 0.20;

    const rawChange = momentum[i] * t.price * vol;
    const prevPrice = t.price;

    t.price = parseFloat(Math.max(t.price + rawChange, t.basePrice * 0.92).toFixed(dp));
    t.direction = rawChange >= 0 ? "up" : "down";
    t.change = parseFloat((t.price - t.openPrice).toFixed(dp));
    t.changePercent = parseFloat(((t.change / t.openPrice) * 100).toFixed(3));

    if (t.price > t.high24h) t.high24h = t.price;
    if (t.price < t.low24h) t.low24h = t.price;

    t.volume += Math.floor(Math.random() * 9000 + 1500);

    // RSI4 gain/loss tracking
    const diff = t.price - prevPrice;
    t.gains.push(diff > 0 ? diff : 0);
    t.losses.push(diff < 0 ? Math.abs(diff) : 0);
    if (t.gains.length > 10) { t.gains.shift(); t.losses.shift(); }

    // Update EMAs
    t.prevEma9 = t.ema9;
    t.ema9 = parseFloat(calcEma(t.price, t.ema9, 9).toFixed(dp));
    t.ema100 = parseFloat(calcEma(t.price, t.ema100, 100).toFixed(dp));

    // RSI4
    t.prevRsi = t.rsi;
    t.rsi = calcRsi4(t.gains, t.losses);

    // Signal
    const { signal, signalStrength } = computeSignal(t);
    t.signal = signal;
    t.signalStrength = signalStrength;
  }
}

// 800ms updates for smooth real-time feel
setInterval(updateTickers, 800);

// Reset 24h stats at midnight
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    for (const t of tickers) {
      t.openPrice = t.price;
      t.high24h = t.price;
      t.low24h = t.price;
      t.volume = 0;
    }
  }
}, 60000);

router.get("/market/tickers", async (_req, res): Promise<void> => {
  res.json(tickers.map(t => ({
    symbol: t.symbol,
    price: t.price,
    change: t.change,
    changePercent: t.changePercent,
    high24h: t.high24h,
    low24h: t.low24h,
    volume: t.volume,
    direction: t.direction,
    signal: t.signal,
    signalStrength: t.signalStrength,
    ema9: t.ema9,
    ema100: t.ema100,
    rsi: t.rsi,
  })));
});

router.get("/market/summary", async (_req, res): Promise<void> => {
  const bullish = tickers.filter(t => t.signal === "BUY").length;
  const bearish = tickers.filter(t => t.signal === "SELL").length;
  const totalVolume = tickers.reduce((sum, t) => sum + t.volume, 0);

  res.json({
    totalVolume,
    bullishCount: bullish,
    bearishCount: bearish,
    neutralCount: tickers.filter(t => t.signal === "HOLD").length,
    signals: tickers.map(t => ({ symbol: t.symbol, signal: t.signal, signalStrength: t.signalStrength, rsi: t.rsi })),
    lastUpdated: new Date().toISOString(),
  });
});

export default router;
