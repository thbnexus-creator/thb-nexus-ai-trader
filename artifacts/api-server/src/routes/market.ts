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
  // EMA tracking
  ema5: number;
  ema15: number;
  signal: "BUY" | "SELL" | "HOLD";
  signalStrength: "strong" | "moderate" | "weak";
  // Price history for EMA
  priceHistory: number[];
}

const tickers: TickerState[] = [
  { symbol: "EURUSD", price: 1.08520, basePrice: 1.08500, openPrice: 1.08500, change: 0.00020, changePercent: 0.018, high24h: 1.08900, low24h: 1.07800, volume: 12453200, direction: "up", ema5: 1.08520, ema15: 1.08510, signal: "HOLD", signalStrength: "weak", priceHistory: [] },
  { symbol: "GBPUSD", price: 1.27340, basePrice: 1.27300, openPrice: 1.27300, change: 0.00040, changePercent: 0.031, high24h: 1.27900, low24h: 1.26400, volume: 8923400, direction: "up", ema5: 1.27340, ema15: 1.27330, signal: "BUY", signalStrength: "moderate", priceHistory: [] },
  { symbol: "XAUUSD", price: 2328.45, basePrice: 2330.00, openPrice: 2330.00, change: -1.55, changePercent: -0.066, high24h: 2345.00, low24h: 2310.00, volume: 345678, direction: "down", ema5: 2328.45, ema15: 2329.50, signal: "SELL", signalStrength: "moderate", priceHistory: [] },
  { symbol: "BTCUSD", price: 67234.50, basePrice: 67000.00, openPrice: 67000.00, change: 234.50, changePercent: 0.350, high24h: 68500.00, low24h: 65200.00, volume: 2345678, direction: "up", ema5: 67234.50, ema15: 67100.00, signal: "BUY", signalStrength: "strong", priceHistory: [] },
];

// Momentum and trend bias per ticker
const momentum: number[] = [0, 0, 0, 0];
const trendBias: number[] = [0, 0, 0, 0];
let trendTimer = 0;

function computeEma(prices: number[], period: number, prev: number): number {
  if (prices.length === 0) return prev;
  const k = 2 / (period + 1);
  return prices[prices.length - 1] * k + prev * (1 - k);
}

function computeSignal(t: TickerState, mom: number): { signal: "BUY" | "SELL" | "HOLD"; signalStrength: "strong" | "moderate" | "weak" } {
  const emaDiff = t.ema5 - t.ema15;
  const emaDiffPct = Math.abs(emaDiff / t.ema15);
  const priceVsEma5 = t.price - t.ema5;

  let signal: "BUY" | "SELL" | "HOLD" = "HOLD";
  let signalStrength: "strong" | "moderate" | "weak" = "weak";

  if (emaDiff > 0 && priceVsEma5 >= 0 && mom > 0.02) {
    signal = "BUY";
    signalStrength = emaDiffPct > 0.0005 && mom > 0.08 ? "strong" : emaDiffPct > 0.0002 ? "moderate" : "weak";
  } else if (emaDiff < 0 && priceVsEma5 <= 0 && mom < -0.02) {
    signal = "SELL";
    signalStrength = emaDiffPct > 0.0005 && mom < -0.08 ? "strong" : emaDiffPct > 0.0002 ? "moderate" : "weak";
  } else {
    signal = "HOLD";
    signalStrength = "weak";
  }

  return { signal, signalStrength };
}

function updateTickers(): void {
  trendTimer++;

  // Shift macro trend every ~40 seconds
  if (trendTimer % 50 === 0) {
    for (let i = 0; i < tickers.length; i++) {
      trendBias[i] = (Math.random() - 0.5) * 0.5;
    }
  }

  for (let i = 0; i < tickers.length; i++) {
    const t = tickers[i];
    const vol = t.symbol === "BTCUSD" ? 0.0020 :
                t.symbol === "XAUUSD" ? 0.0010 : 0.00028;

    // Mean-reverting momentum with trend bias
    momentum[i] = momentum[i] * 0.82 + (Math.random() - 0.5 + trendBias[i]) * 0.18;

    const rawChange = momentum[i] * t.price * vol;
    const isCrypto = t.symbol === "BTCUSD";
    const isMetal = t.symbol === "XAUUSD";
    const dp = isCrypto || isMetal ? 2 : 5;

    t.price = parseFloat(Math.max(t.price + rawChange, t.basePrice * 0.93).toFixed(dp));
    t.direction = rawChange >= 0 ? "up" : "down";
    t.change = parseFloat((t.price - t.openPrice).toFixed(dp));
    t.changePercent = parseFloat(((t.change / t.openPrice) * 100).toFixed(3));

    // Update 24h high/low
    if (t.price > t.high24h) t.high24h = t.price;
    if (t.price < t.low24h) t.low24h = t.price;

    // Volume simulation
    t.volume += Math.floor(Math.random() * 8000 + 1000);

    // Keep rolling price history (last 20 ticks)
    t.priceHistory.push(t.price);
    if (t.priceHistory.length > 20) t.priceHistory.shift();

    // Update EMAs
    t.ema5 = parseFloat(computeEma(t.priceHistory, 5, t.ema5).toFixed(dp));
    t.ema15 = parseFloat(computeEma(t.priceHistory, 15, t.ema15).toFixed(dp));

    // Compute signal
    const { signal, signalStrength } = computeSignal(t, momentum[i]);
    t.signal = signal;
    t.signalStrength = signalStrength;
  }
}

// Update every 800ms for smooth real-time feel
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
    ema5: t.ema5,
    ema15: t.ema15,
  })));
});

router.get("/market/summary", async (_req, res): Promise<void> => {
  const bullish = tickers.filter(t => t.signal === "BUY").length;
  const bearish = tickers.filter(t => t.signal === "SELL").length;
  const neutral = tickers.filter(t => t.signal === "HOLD").length;
  const totalVolume = tickers.reduce((sum, t) => sum + t.volume, 0);

  res.json({
    totalVolume,
    bullishCount: bullish,
    bearishCount: bearish,
    neutralCount: neutral,
    signals: tickers.map(t => ({ symbol: t.symbol, signal: t.signal, signalStrength: t.signalStrength })),
    lastUpdated: new Date().toISOString(),
  });
});

export default router;
