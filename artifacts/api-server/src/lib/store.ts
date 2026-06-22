import crypto from "crypto";

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  isAdmin: boolean;
  isVerified: boolean;
  otp: string | null;
  otpExpiresAt: Date | null;
  createdAt: string;
}

export interface BotStatus {
  isRunning: boolean;
  strategy: string | null;
  riskLevel: string | null;
  symbols: string[];
  tradesExecuted: number;
  startedAt: string | null;
  profitLoss: number;
  status: string;
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
  openedAt: string;
  closedAt: string | null;
}

const ADMIN_EMAILS = ["thbnexus@gmail.com"];

const users = new Map<string, User>();
const botStatuses = new Map<string, BotStatus>();
const mt5Connections = new Map<string, Mt5Connection>();
const depositsMap = new Map<string, Deposit[]>();
const tradesMap = new Map<string, Trade[]>();

// Bot simulation timers: userId -> intervalId
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

// Reference prices for simulation
const BASE_PRICES: Record<string, number> = {
  EURUSD: 1.08520,
  GBPUSD: 1.27340,
  XAUUSD: 2328.45,
  BTCUSD: 67234.50,
};

function simulateTrade(userId: string): void {
  const status = botStatuses.get(userId);
  if (!status || !status.isRunning) return;

  const symbols = status.symbols.length ? status.symbols : ["EURUSD", "GBPUSD"];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const direction = Math.random() > 0.5 ? "buy" : "sell";
  const basePrice = BASE_PRICES[symbol] ?? 1.0;

  const isCrypto = symbol === "BTCUSD";
  const isMetal = symbol === "XAUUSD";
  const entryPrice = parseFloat((basePrice * (1 + (Math.random() - 0.5) * 0.002)).toFixed(isCrypto || isMetal ? 2 : 5));

  // Risk-adjusted P&L
  const riskMultiplier = status.riskLevel === "High" ? 3 : status.riskLevel === "Low" ? 1 : 2;
  const winBias = status.strategy === "Scalping" ? 0.55 : 0.52;
  const isWin = Math.random() < winBias;
  const pipRange = riskMultiplier * (isWin ? 1 : -1) * (5 + Math.random() * 15);
  const profitLoss = parseFloat((pipRange * 0.1).toFixed(2));

  const exitPrice = parseFloat((entryPrice * (1 + pipRange * 0.0001 * (direction === "buy" ? 1 : -1))).toFixed(isCrypto || isMetal ? 2 : 5));
  const openedAt = new Date(Date.now() - 60000 - Math.random() * 300000).toISOString();
  const closedAt = new Date().toISOString();

  const trade: Trade = {
    id: generateId(),
    userId,
    symbol,
    direction,
    entryPrice,
    exitPrice,
    lots: 0.1,
    profitLoss,
    status: "closed",
    openedAt,
    closedAt,
  };

  const existing = tradesMap.get(userId) ?? [];
  tradesMap.set(userId, [trade, ...existing]);

  // Update bot P&L and trade count
  status.tradesExecuted += 1;
  status.profitLoss = parseFloat((status.profitLoss + profitLoss).toFixed(2));
  botStatuses.set(userId, { ...status });
}

export const store = {
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
    if (!user) return false;
    if (!user.otp || !user.otpExpiresAt) return false;
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

  getBotStatus(userId: string): BotStatus {
    if (!botStatuses.has(userId)) {
      botStatuses.set(userId, {
        isRunning: false,
        strategy: null,
        riskLevel: null,
        symbols: [],
        tradesExecuted: 0,
        startedAt: null,
        profitLoss: 0,
        status: "idle",
      });
    }
    return botStatuses.get(userId)!;
  },

  startBot(userId: string, strategy: string, riskLevel: string, symbols: string[]): BotStatus {
    // Clear any existing timer
    const existingTimer = botTimers.get(userId);
    if (existingTimer) clearInterval(existingTimer);

    const status: BotStatus = {
      isRunning: true,
      strategy,
      riskLevel,
      symbols: symbols.length ? symbols : ["EURUSD", "GBPUSD"],
      tradesExecuted: 0,
      startedAt: new Date().toISOString(),
      profitLoss: 0,
      status: "running",
    };
    botStatuses.set(userId, status);

    // Simulate a trade immediately and then every 45 seconds
    setTimeout(() => simulateTrade(userId), 2000);
    const timer = setInterval(() => simulateTrade(userId), 45000);
    botTimers.set(userId, timer);

    return botStatuses.get(userId)!;
  },

  stopBot(userId: string): BotStatus {
    const timer = botTimers.get(userId);
    if (timer) {
      clearInterval(timer);
      botTimers.delete(userId);
    }

    const current = store.getBotStatus(userId);
    const status: BotStatus = {
      ...current,
      isRunning: false,
      status: "stopped",
    };
    botStatuses.set(userId, status);
    return status;
  },

  getMt5Connection(userId: string): Mt5Connection {
    if (!mt5Connections.has(userId)) {
      mt5Connections.set(userId, {
        isConnected: false,
        brokerName: null,
        loginId: null,
        server: null,
        passwordHash: null,
        bridgeRunning: false,
        connectedAt: null,
        status: "disconnected",
      });
    }
    return mt5Connections.get(userId)!;
  },

  saveMt5Connection(userId: string, brokerName: string, loginId: string, password: string, server: string): Mt5Connection {
    const conn: Mt5Connection = {
      isConnected: true,
      brokerName,
      loginId,
      server,
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
    if (!conn.isConnected) {
      return { ...conn, status: "not_connected" };
    }
    const updated: Mt5Connection = {
      ...conn,
      bridgeRunning: true,
      status: "bridge_active",
    };
    mt5Connections.set(userId, updated);
    return updated;
  },

  getDeposits(userId: string): Deposit[] {
    return depositsMap.get(userId) ?? [];
  },

  createDeposit(userId: string, amount: number, txHash: string | null): Deposit {
    const deposit: Deposit = {
      id: generateId(),
      userId,
      amount,
      currency: "USDT",
      status: "confirmed",
      txHash: txHash ?? `sim_${generateId().slice(0, 16)}`,
      createdAt: new Date().toISOString(),
    };
    const existing = depositsMap.get(userId) ?? [];
    depositsMap.set(userId, [deposit, ...existing]);
    return deposit;
  },

  getBalance(userId: string): { usdt: number; totalDeposited: number; totalPnl: number } {
    const userDeposits = depositsMap.get(userId) ?? [];
    const totalDeposited = userDeposits.reduce((sum, d) => sum + d.amount, 0);
    const userTrades = tradesMap.get(userId) ?? [];
    const totalPnl = userTrades.reduce((sum, t) => sum + (t.profitLoss ?? 0), 0);
    return {
      usdt: parseFloat((totalDeposited + totalPnl).toFixed(2)),
      totalDeposited: parseFloat(totalDeposited.toFixed(2)),
      totalPnl: parseFloat(totalPnl.toFixed(2)),
    };
  },

  getTrades(userId: string): Trade[] {
    return tradesMap.get(userId) ?? [];
  },

  seedTrades(userId: string): void {
    if ((tradesMap.get(userId) ?? []).length > 0) return;
    const symbols = ["EURUSD", "GBPUSD", "XAUUSD", "BTCUSD"];
    const directions = ["buy", "sell"];
    const simTrades: Trade[] = [];
    for (let i = 0; i < 15; i++) {
      const symbol = symbols[i % symbols.length];
      const direction = directions[i % 2];
      const isCrypto = symbol === "BTCUSD";
      const isMetal = symbol === "XAUUSD";
      const base = BASE_PRICES[symbol] ?? 1.0;
      const entryPrice = parseFloat((base * (1 + (Math.random() - 0.5) * 0.003)).toFixed(isCrypto || isMetal ? 2 : 5));
      const pips = (Math.random() - 0.4) * 200;
      const profitLoss = parseFloat((pips * 0.1).toFixed(2));
      const openedAt = new Date(Date.now() - (15 - i) * 2 * 3600000 - Math.random() * 3600000).toISOString();
      const closedAt = new Date(new Date(openedAt).getTime() + 900000 + Math.random() * 3600000).toISOString();
      const exitPrice = parseFloat((entryPrice + pips * 0.0001).toFixed(isCrypto || isMetal ? 2 : 5));
      simTrades.push({
        id: generateId(),
        userId,
        symbol,
        direction,
        entryPrice,
        exitPrice,
        lots: parseFloat((0.05 + Math.random() * 0.15).toFixed(2)),
        profitLoss,
        status: "closed",
        openedAt,
        closedAt,
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
        id: generateId(),
        userId,
        amount: amounts[i],
        currency: "USDT",
        status: "confirmed",
        txHash: `sim_${generateId().slice(0, 16)}`,
        createdAt: new Date(Date.now() - (2 - i) * 7 * 24 * 3600000).toISOString(),
      });
    }
    depositsMap.set(userId, existing);
  },

  getTradeStats(userId: string) {
    const userTrades = tradesMap.get(userId) ?? [];
    const closedTrades = userTrades.filter(t => t.status === "closed" && t.profitLoss !== null);
    const totalTrades = closedTrades.length;
    const winningTrades = closedTrades.filter(t => (t.profitLoss ?? 0) > 0).length;
    const losingTrades = closedTrades.filter(t => (t.profitLoss ?? 0) < 0).length;
    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.profitLoss ?? 0), 0);
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
};

export { generateOtp };
