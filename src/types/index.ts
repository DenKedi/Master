// ─── User ────────────────────────────────────────────────────────────────────
export interface IUser {
  _id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  currency: number;
  xp: number;
  createdAt: Date;
  updatedAt: Date;
  friends: string[]; // User IDs
  avatarUrl?: string;
  isActive: boolean;
  tutorialCompleted: boolean;
  tutorialStep: number;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export type CardRarity = 'normal' | 'nice' | 'special' | 'uiiiii' | 'unknown';
export type CardType = 'character' | 'arsenal' | 'destination' | 'trick';
export type CharacterType = 'human' | 'goblin' | 'beast' | 'underworld';

export interface ICard {
  _id: string;
  cardId: string;
  name: string;
  description: string;
  rarity: CardRarity;
  type: CardType;
  imageUrl: string;
  attack: number;
  defense: number;
  effect?: string;
  tags: string[];
  characterType?: CharacterType;
  isActive: boolean;
  setId?: string;
  createdAt: Date;
}

// ─── Card Recipe (Combination) ────────────────────────────────────────────────
export interface ICardRecipe {
  _id: string;
  ingredientA: string; // Card ID
  ingredientB: string; // Card ID
  result: string; // Card ID produced by the combination
  createdAt: Date;
}

// ─── Battle ───────────────────────────────────────────────────────────────────
export interface BattleCard {
  card: ICard;
  /** The card's current attack stat (may be modified by combo or effects) */
  attack: number;
  /** Character subtype (only for character cards) */
  characterType?: CharacterType;
  /** The card's current defense stat (may be modified by combo or effects) */
  defense: number;
  /** If this card was produced from a combo, the source names */
  comboSource?: { characterName: string; arsenalName: string };
}

// ─── Collection ───────────────────────────────────────────────────────────────
export interface ICollectionEntry {
  _id: string;
  userId: string;
  cardId: string;
  quantity: number;
  obtainedAt: Date;
}

// ─── Deck ─────────────────────────────────────────────────────────────────────
export interface IDeck {
  _id: string;
  userId: string;
  name: string;
  /** Card IDs in the deck (MIN_DECK_SIZE..MAX_DECK_SIZE) */
  cards: string[];
  /** Whether this is the active deck used for matchmaking */
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Shop / Packs ─────────────────────────────────────────────────────────────
export type PackType = 'standard' | 'premium' | 'sale' | 'bundle';

export interface IPack {
  _id: string;
  name: string;
  description: string;
  price: number; // in game currency
  cardCount: number;
  guaranteedRarity?: CardRarity;
  imageUrl: string;
  type: PackType;
  isActive: boolean;
  discount?: number; // percentage 0-100
  expiresAt?: Date;
  bundleItems?: string[]; // Pack IDs included in bundle
  createdAt: Date;
}

// ─── Transaction ──────────────────────────────────────────────────────────────
export type TransactionType =
  | 'purchase'
  | 'pack_purchase'
  | 'currency_grant'
  | 'currency_spend'
  | 'xp_grant'
  | 'refund';

export interface ITransaction {
  _id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// ─── Friend Request ───────────────────────────────────────────────────────────
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface IFriendRequest {
  _id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  createdAt: Date;
}

// ─── API Responses ────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Session ──────────────────────────────────────────────────────────────────
export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  currency: number;
  avatarUrl?: string;
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalCards: number;
  totalPacks: number;
  totalTransactions: number;
  totalCurrencyInCirculation: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  packsPurchasedLast7Days: number;
  packsPurchasedLast30Days: number;
  topSpenders: { userId: string; username: string; spent: number }[];
  cardRarityDistribution: Record<CardRarity, number>;
  dailyActiveUsers: { date: string; count: number }[];
  revenueByDay: { date: string; amount: number }[];
}
