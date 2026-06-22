import { Router, type IRouter } from "express";

const router: IRouter = Router();

interface TickerState {
  symbol: string;
  price: number;
  basePrice: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume: number;
  direction: string;
}

const tickerState: TickerState[] = [
  { symbol: "EURUSD", price: 1.08520, basePrice: 1.08500, change: 0, changePercent: 0, high24h: 1.08900, low24h: 1.07800, volume: 12453200, direction: "up" },
  { symbol: "GBPUSD", price: 1.27340, basePrice: 1.27300, change: 0, changePercent: 0, high24h: 1.27900, low24h: 1.26400, volume: 8923400, direction: "up" },
  { symbol: "XAUUSD", price: 2328.45, basePrice: 2330.00, change: 0, changePercent: 0, high24h: 2345.00, low24h: 2310.00, volume: 345678, direction: "down" },
  { symbol: "BTCUSD", price: 67234.50, basePrice: 67000.00, change: 0, changePercent: 0, high24h: 68500.00, low24h: 65200.00, volume: 2345678, direction: "up" },
];

function updateTickers(): void {
  for (const ticker of tickerState) {
    const volatility = ticker.symbol === "BTCUSD" ? 0.002 :
                       ticker.symbol === "XAUUSD" ? 0.001 : 0.0003;
    const change = (Math.random() - 0.5) * ticker.price * volatility;
    ticker.price = parseFloat((ticker.price + change).toFixed(ticker.symbol === "BTCUSD" || ticker.symbol === "XAUUSD" ? 2 : 5));
    ticker.direction = change >= 0 ? "up" : "down";
    ticker.change = parseFloat((ticker.price - ticker.basePrice).toFixed(5));
    ticker.changePercent = parseFloat(((ticker.change / ticker.basePrice) * 100).toFixed(3));

    if (ticker.price > ticker.high24h) ticker.high24h = ticker.price;
    if (ticker.price < ticker.low24h) ticker.low24h = ticker.price;
  }
}

setInterval(updateTickers, 1000);

router.get("/market/tickers", async (_req, res): Promise<void> => {
  res.json(tickerState.map(t => ({
    symbol: t.symbol,
    price: t.price,
    change: t.change,
    changePercent: t.changePercent,
    high24h: t.high24h,
    low24h: t.low24h,
    volume: t.volume,
    direction: t.direction,
  })));
});

router.get("/market/summary", async (_req, res): Promise<void> => {
  const bullish = tickerState.filter(t => t.direction === "up").length;
  const bearish = tickerState.filter(t => t.direction === "down").length;
  const totalVolume = tickerState.reduce((sum, t) => sum + t.volume, 0);

  res.json({
    totalVolume,
    bullishCount: bullish,
    bearishCount: bearish,
    lastUpdated: new Date().toISOString(),
  });
});

export default router;
