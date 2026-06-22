import crypto from "crypto";

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  isAdmin: boolean;
  isVerified: boolean;
  isActive: boolean;
  otp: string | null;
  otpExpiresAt: Date | null;
  createdAt: string;
}

export interface BotStatus {
  isRunning: boolean;
  strategy: string | null;
  riskLevel: string | null;
  timeframe: string | null;
  symbols: string[];
  tradesExecuted: number;
  startedAt: string | null;
  profitLoss: number;
  status: string;
  currentLot: number;
  winStreak: number;
}

export interface Mt5Connection {
  isConnected: boolean;
  brokerName: string | null;
  loginId: string | null;
  server: string | null;
  passwordHash: string | null;
  bridgeRunning: boolean;
  connectedAt: string | null;
  status: string;
}

export interface Deposit {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  txHash: string | null;
  createdAt: string;
}

export interface Trade {
  id: string;
  userId: string;
  symbol: string;
  direction: string;
  entryPrice: number;
  exitPrice: number | null;
  lots: number;
  profitLoss: number | null;
  status: string;
  strategy: string | null;
  timeframe: string | null;
  openedAt: string;
  closedAt: string | null;
}

export interface ActivationKey {
  id: string;
  key: string;
  plan: string;
  usedBy: string | null;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  isActive: boolean;
}

const ADMIN_EMAILS = ["thbnexus@gmail.com"];

const users = new Map<string, User>();
const botStatuses = new Map<string, BotStatus>();
const mt5Connections = new Map<string, Mt5Connection>();
const depositsMap = new Map<string, Deposit[]>();
const tradesMap = new Map<string, Trade[]>();
const activationKeys = new Map<string, ActivationKey>();
const botTimers = new Map<string, NodeJS.Timeout>();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "nexus_salt").digest("hex");
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateId(): string {
  return crypto.randomUUID();
}

function generateKey(plan: string): string {
  const seg = () => crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${plan.slice(0, 3).toUpperCase()}-${seg()}-${seg()}-${seg()}`;
}

// Live market reference prices (shared via module – market.ts updates these)
const BASE_PRICES: Record<string, number> = {
  EURUSD: 1.08520,
  GBPUSD: 1.27340,
  XAUUSD: 2328.45,
  BTCUSD: 67234.50,
};

// ── Strategy Engine ──────────────────────────────────────────────────────────
// Evaluates EMA9/EMA100/RSI4 to decide trade direction before simulating

interface StrategyState {
  symbol: string;
  ema9: number;
  ema100: number;
  rsiGains: number[];
  rsiLosses: number[];
  rsi: number;
  prevPrice: number;
}

const strategyStates = new Map<string, StrategyState>();

function getOrCreateState(symbol: string): StrategyState {
  if (!strategyStates.has(symbol)) {
    const p = BASE_PRICES[symbol] ?? 1.0;
    strategyStates.set(symbol, { symbol, ema9: p, ema100: p, rsiGains: [], rsiLosses: [], rsi: 50, prevPrice: p });
  }
  return strategyStates.get(symbol)!;
}

function updateStrategyState(symbol: string, price: number): void {
  const s = getOrCreateState(symbol);
  const k9 = 2 / 10;
  const k100 = 2 / 101;
  s.ema9 = price * k9 + s.ema9 * (1 - k9);
  s.ema100 = price * k100 + s.ema100 * (1 - k100);
  const diff = price - s.prevPrice;
  s.rsiGains.push(diff > 0 ? diff : 0);
  s.rsiLosses.push(diff < 0 ? Math.abs(diff) : 0);
  if (s.rsiGains.length > 4) { s.rsiGains.shift(); s.rsiLosses.shift(); }
  const avgG = s.rsiGains.reduce((a, b) => a + b, 0) / Math.max(s.rsiGains.length, 1);
  const avgL = s.rsiLosses.reduce((a, b) => a + b, 0) / Math.max(s.rsiLosses.length, 1);
  s.rsi = avgL === 0 ? 100 : parseFloat((100 - 100 / (1 + avgG / avgL)).toFixed(2));
  s.prevPrice = price;
}

function strategySignal(symbol: string): "BUY" | "SELL" | "HOLD" {
  const s = getOrCreateState(symbol);
  const priceAboveEma100 = s.prevPrice > s.ema100;
  const ema9Up = s.ema9 > s.ema100 * 0.9999;
  const ema9Down = s.ema9 < s.ema100 * 1.0001;
  if (priceAboveEma100 && ema9Up && s.rsi < 40) return "BUY";
  if (!priceAboveEma100 && ema9Down && s.rsi > 60) return "SELL";
  return "HOLD";
}

// Dynamic lot sizing
function calcLot(balance: number, riskLevel: string, winStreak: number): number {
  const riskPct = riskLevel === "High" ? 0.03 : riskLevel === "Low" ? 0.01 : 0.02;
  const base = parseFloat(Math.max(0.01, (balance * riskPct) / 100).toFixed(2));
  // Increase 10% per consecutive win, max 50% increase
  const multiplier = Math.min(1 + winStreak * 0.10, 1.5);
  return parseFloat(Math.min(base * multiplier, 2.0).toFixed(2));
}

// Pip value for P&L
function pipValue(symbol: string): number {
  if (symbol === "BTCUSD") return 1.0;
  if (symbol === "XAUUSD") return 0.10;
  return 0.0001;
}

function simulateTrade(userId: string): void {
  const status = botStatuses.get(userId);
  if (!status || !status.isRunning) return;

  const symbols = status.symbols.length ? status.symbols : ["EURUSD", "GBPUSD"];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const isCrypto = symbol === "BTCUSD";
  const isMetal = symbol === "XAUUSD";
  const dp = isCrypto || isMetal ? 2 : 5;

  // Get latest price with small noise
  const base = BASE_PRICES[symbol] ?? 1.0;
  const price = parseFloat((base * (1 + (Math.random() - 0.5) * 0.001)).toFixed(dp));

  // Update strategy engine
  updateStrategyState(symbol, price);
  const signal = strategySignal(symbol);

  // Use strategy signal if available, fallback to random
  let direction: "buy" | "sell";
  if (signal === "BUY") direction = "buy";
  else if (signal === "SELL") direction = "sell";
  else direction = Math.random() > 0.5 ? "buy" : "sell";

  const balance = store.getBalance(userId).usdt;
  const lot = calcLot(Math.max(balance, 100), status.riskLevel ?? "Medium", status.winStreak);

  // TP: 3-6 pips, SL: 3-6 pips
  const tpPips = 3 + Math.random() * 3;
  const slPips = 3 + Math.random() * 3;

  // Win probability: BUY signal from strategy = higher win rate
  const signalBoost = signal !== "HOLD" ? 0.08 : 0;
  const strategyWinRate = status.strategy === "Scalping" ? 0.58 : status.strategy === "Swing" ? 0.54 : 0.52;
  const isWin = Math.random() < strategyWinRate + signalBoost;

  const pipsGained = isWin ? tpPips : -slPips;
  const pv = pipValue(symbol);
  const profitLoss = parseFloat((pipsGained * pv * lot * 1000).toFixed(2));

  const entryPrice = parseFloat((price).toFixed(dp));
  const exitPipOffset = pipsGained * pv * (direction === "buy" ? 1 : -1);
  const exitPrice = parseFloat((price + exitPipOffset).toFixed(dp));

  const openedAt = new Date(Date.now() - 60000 - Math.random() * 120000).toISOString();
  const closedAt = new Date().toISOString();

  const trade: Trade = {
    id: generateId(),
    userId,
    symbol,
    direction,
    entryPrice,
    exitPrice,
    lots: lot,
    profitLoss,
    status: "closed",
    strategy: status.strategy,
    timeframe: status.timeframe,
    openedAt,
    closedAt,
  };

  const existing = tradesMap.get(userId) ?? [];
  tradesMap.set(userId, [trade, ...existing]);

  // Update bot state
  status.tradesExecuted += 1;
  status.profitLoss = parseFloat((status.profitLoss + profitLoss).toFixed(2));
  status.currentLot = lot;

  if (isWin) {
    status.winStreak = (status.winStreak ?? 0) + 1;
  } else {
    status.winStreak = 0; // reset after loss
  }

  botStatuses.set(userId, { ...status });
}

export const store = {
  // ── Auth ────────────────────────────────────────────────────────────────────
  createUser(email: string, password: string, name: string): User {
    const id = generateId();
    const otp = generateOtp();
    const user: User = {
      id,
      email: email.toLowerCase(),
      name,
      passwordHash: hashPassword(password),
      isAdmin: ADMIN_EMAILS.includes(email.toLowerCase()),
      isVerified: false,
      isActive: true,
      otp,
      otpExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      createdAt: new Date().toISOString(),
    };
    users.set(email.toLowerCase(), user);
    return user;
  },

  refreshOtp(email: string): User {
    const user = users.get(email.toLowerCase());
    if (!user) throw new Error("User not found");
    user.otp = generateOtp();
    user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    return user;
  },

  findUserByEmail(email: string): User | undefined {
    return users.get(email.toLowerCase());
  },

  findUserById(id: string): User | undefined {
    for (const user of users.values()) {
      if (user.id === id) return user;
    }
    return undefined;
  },

  verifyUserOtp(email: string, otp: string): boolean {
    const user = users.get(email.toLowerCase());
    if (!user || !user.otp || !user.otpExpiresAt) return false;
    if (new Date() > user.otpExpiresAt) return false;
    if (user.otp !== otp) return false;
    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    return true;
  },

  checkPassword(user: User, password: string): boolean {
    return user.passwordHash === hashPassword(password);
  },

  getPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  },

  // ── Bot ─────────────────────────────────────────────────────────────────────
  getBotStatus(userId: string): BotStatus {
    if (!botStatuses.has(userId)) {
      botStatuses.set(userId, {
        isRunning: false, strategy: null, riskLevel: null, timeframe: null,
        symbols: [], tradesExecuted: 0, startedAt: null, profitLoss: 0,
        status: "idle", currentLot: 0.01, winStreak: 0,
      });
    }
    return botStatuses.get(userId)!;
  },

  startBot(userId: string, strategy: string, riskLevel: string, symbols: string[], timeframe: string): BotStatus {
    const existing = botTimers.get(userId);
    if (existing) clearInterval(existing);

    const balance = store.getBalance(userId).usdt;
    const initLot = calcLot(Math.max(balance, 100), riskLevel, 0);

    const status: BotStatus = {
      isRunning: true, strategy, riskLevel, timeframe,
      symbols: symbols.length ? symbols : ["EURUSD", "GBPUSD"],
      tradesExecuted: 0, startedAt: new Date().toISOString(),
      profitLoss: 0, status: "running",
      currentLot: initLot, winStreak: 0,
    };
    botStatuses.set(userId, status);

    // Simulate trade 2s after start, then based on timeframe
    const intervalMs = timeframe === "1min" ? 20000 : timeframe === "3min" ? 40000 : 60000;
    setTimeout(() => simulateTrade(userId), 2000);
    const timer = setInterval(() => simulateTrade(userId), intervalMs);
    botTimers.set(userId, timer);

    return botStatuses.get(userId)!;
  },

  stopBot(userId: string): BotStatus {
    const timer = botTimers.get(userId);
    if (timer) { clearInterval(timer); botTimers.delete(userId); }
    const current = store.getBotStatus(userId);
    const status: BotStatus = { ...current, isRunning: false, status: "stopped" };
    botStatuses.set(userId, status);
    return status;
  },

  // ── MT5 ─────────────────────────────────────────────────────────────────────
  getMt5Connection(userId: string): Mt5Connection {
    if (!mt5Connections.has(userId)) {
      mt5Connections.set(userId, {
        isConnected: false, brokerName: null, loginId: null,
        server: null, passwordHash: null, bridgeRunning: false,
        connectedAt: null, status: "disconnected",
      });
    }
    return mt5Connections.get(userId)!;
  },

  saveMt5Connection(userId: string, brokerName: string, loginId: string, password: string, server: string): Mt5Connection {
    const conn: Mt5Connection = {
      isConnected: true, brokerName, loginId, server,
      passwordHash: hashPassword(password),
      bridgeRunning: false,
      connectedAt: new Date().toISOString(),
      status: "connected",
    };
    mt5Connections.set(userId, conn);
    return conn;
  },

  startMt5Bridge(userId: string): Mt5Connection {
    const conn = store.getMt5Connection(userId);
    if (!conn.isConnected) return { ...conn, status: "not_connected" };
    const updated: Mt5Connection = { ...conn, bridgeRunning: true, status: "bridge_active" };
    mt5Connections.set(userId, updated);
    return updated;
  },

  // ── Deposits ────────────────────────────────────────────────────────────────
  getDeposits(userId: string): Deposit[] {
    return depositsMap.get(userId) ?? [];
  },

  createDeposit(userId: string, amount: number, txHash: string | null): Deposit {
    const deposit: Deposit = {
      id: generateId(), userId, amount, currency: "USDT",
      status: "confirmed",
      txHash: txHash ?? `sim_${generateId().slice(0, 16)}`,
      createdAt: new Date().toISOString(),
    };
    const existing = depositsMap.get(userId) ?? [];
    depositsMap.set(userId, [deposit, ...existing]);
    return deposit;
  },

  getBalance(userId: string): { usdt: number; totalDeposited: number; totalPnl: number } {
    const deps = depositsMap.get(userId) ?? [];
    const totalDeposited = deps.reduce((s, d) => s + d.amount, 0);
    const trades = tradesMap.get(userId) ?? [];
    const totalPnl = trades.reduce((s, t) => s + (t.profitLoss ?? 0), 0);
    return {
      usdt: parseFloat((totalDeposited + totalPnl).toFixed(2)),
      totalDeposited: parseFloat(totalDeposited.toFixed(2)),
      totalPnl: parseFloat(totalPnl.toFixed(2)),
    };
  },

  // ── Trades ──────────────────────────────────────────────────────────────────
  getTrades(userId: string): Trade[] {
    return tradesMap.get(userId) ?? [];
  },

  getTradeStats(userId: string) {
    const closedTrades = (tradesMap.get(userId) ?? []).filter(t => t.status === "closed" && t.profitLoss !== null);
    const totalTrades = closedTrades.length;
    const winningTrades = closedTrades.filter(t => (t.profitLoss ?? 0) > 0).length;
    const losingTrades = closedTrades.filter(t => (t.profitLoss ?? 0) < 0).length;
    const totalPnl = closedTrades.reduce((s, t) => s + (t.profitLoss ?? 0), 0);
    const pnls = closedTrades.map(t => t.profitLoss ?? 0);
    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate: totalTrades > 0 ? parseFloat(((winningTrades / totalTrades) * 100).toFixed(1)) : 0,
      totalPnl: parseFloat(totalPnl.toFixed(2)),
      bestTrade: pnls.length ? parseFloat(Math.max(...pnls).toFixed(2)) : 0,
      worstTrade: pnls.length ? parseFloat(Math.min(...pnls).toFixed(2)) : 0,
      avgProfit: totalTrades > 0 ? parseFloat((totalPnl / totalTrades).toFixed(2)) : 0,
    };
  },

  // ── Seed data ────────────────────────────────────────────────────────────────
  seedTrades(userId: string): void {
    if ((tradesMap.get(userId) ?? []).length > 0) return;
    const symbols = ["EURUSD", "GBPUSD", "XAUUSD", "BTCUSD"];
    const strategies = ["Scalping", "Swing", "Trend Following"];
    const timeframes = ["1min", "3min", "5min"];
    const simTrades: Trade[] = [];
    for (let i = 0; i < 15; i++) {
      const symbol = symbols[i % symbols.length];
      const isCrypto = symbol === "BTCUSD";
      const isMetal = symbol === "XAUUSD";
      const base = BASE_PRICES[symbol] ?? 1.0;
      const dp = isCrypto || isMetal ? 2 : 5;
      const entryPrice = parseFloat((base * (1 + (Math.random() - 0.5) * 0.003)).toFixed(dp));
      const pips = (Math.random() - 0.4) * 8;
      const lot = parseFloat((0.05 + Math.random() * 0.15).toFixed(2));
      const pv = pipValue(symbol);
      const profitLoss = parseFloat((pips * pv * lot * 1000).toFixed(2));
      const openedAt = new Date(Date.now() - (15 - i) * 2 * 3600000 - Math.random() * 3600000).toISOString();
      const closedAt = new Date(new Date(openedAt).getTime() + 60000 + Math.random() * 300000).toISOString();
      const exitPrice = parseFloat((entryPrice + pips * pv).toFixed(dp));
      simTrades.push({
        id: generateId(), userId, symbol,
        direction: i % 2 === 0 ? "buy" : "sell",
        entryPrice, exitPrice, lots: lot, profitLoss,
        status: "closed",
        strategy: strategies[i % strategies.length],
        timeframe: timeframes[i % timeframes.length],
        openedAt, closedAt,
      });
    }
    tradesMap.set(userId, simTrades);
  },

  seedDeposits(userId: string): void {
    if ((depositsMap.get(userId) ?? []).length > 0) return;
    const amounts = [500, 1000];
    const existing: Deposit[] = [];
    for (let i = 0; i < amounts.length; i++) {
      existing.push({
        id: generateId(), userId, amount: amounts[i], currency: "USDT",
        status: "confirmed",
        txHash: `sim_${generateId().slice(0, 16)}`,
        createdAt: new Date(Date.now() - (2 - i) * 7 * 24 * 3600000).toISOString(),
      });
    }
    depositsMap.set(userId, existing);
  },

  // ── Admin ────────────────────────────────────────────────────────────────────
  isAdmin(userId: string): boolean {
    const user = store.findUserById(userId);
    return user?.isAdmin ?? false;
  },

  getAllUsers() {
    return Array.from(users.values()).map(u => {
      const balance = store.getBalance(u.id);
      const stats = store.getTradeStats(u.id);
      const botStatus = botStatuses.get(u.id);
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        isAdmin: u.isAdmin,
        isVerified: u.isVerified,
        isActive: u.isActive,
        createdAt: u.createdAt,
        balance: balance.usdt,
        totalDeposited: balance.totalDeposited,
        totalPnl: balance.totalPnl,
        totalTrades: stats.totalTrades,
        winRate: stats.winRate,
        botRunning: botStatus?.isRunning ?? false,
        mt5Connected: mt5Connections.get(u.id)?.isConnected ?? false,
      };
    });
  },

  toggleUserActive(userId: string) {
    const user = store.findUserById(userId);
    if (!user) throw new Error("User not found");
    user.isActive = !user.isActive;
    return store.getAllUsers().find(u => u.id === userId)!;
  },

  getAllDeposits(): Deposit[] {
    const all: Deposit[] = [];
    for (const deps of depositsMap.values()) all.push(...deps);
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getAllTrades(): Trade[] {
    const all: Trade[] = [];
    for (const trades of tradesMap.values()) all.push(...trades);
    return all.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  },

  getAdminOverview() {
    const allUsers = store.getAllUsers();
    const allDeposits = store.getAllDeposits();
    const allTrades = store.getAllTrades();
    const totalPnl = allTrades.reduce((s, t) => s + (t.profitLoss ?? 0), 0);
    const activeBots = Array.from(botStatuses.values()).filter(b => b.isRunning).length;
    const mt5Connected = Array.from(mt5Connections.values()).filter(m => m.isConnected).length;
    return {
      totalUsers: allUsers.length,
      verifiedUsers: allUsers.filter(u => u.isVerified).length,
      activeUsers: allUsers.filter(u => u.isActive).length,
      totalDeposited: parseFloat(allDeposits.reduce((s, d) => s + d.amount, 0).toFixed(2)),
      totalTrades: allTrades.length,
      totalPnl: parseFloat(totalPnl.toFixed(2)),
      activeBots,
      mt5Connected,
      activationKeys: activationKeys.size,
    };
  },

  // ── Activation keys ──────────────────────────────────────────────────────────
  getActivationKeys(): ActivationKey[] {
    return Array.from(activationKeys.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  generateActivationKey(plan: string, expiryDays: number): ActivationKey {
    const key: ActivationKey = {
      id: generateId(),
      key: generateKey(plan),
      plan,
      usedBy: null,
      usedAt: null,
      expiresAt: expiryDays > 0
        ? new Date(Date.now() + expiryDays * 24 * 3600000).toISOString()
        : null,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    activationKeys.set(key.id, key);
    return key;
  },
};

export { generateOtp };
