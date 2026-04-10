// ── Food Menu Data & Types ─────────────────────────────────────

export type KitchenZone = "Bếp trên" | "Bếp Tổng" | "Bar";
export type OrderStatus  = "new" | "sent" | "in_progress" | "completed" | "void";
export type AdditionInputType = "radio" | "checkbox" | "counter";

export interface AdditionOption {
  id: string;
  label: string;
  price?: number;        // extra charge in VND
}

export interface AdditionGroup {
  id: string;
  name: string;
  type: AdditionInputType;
  required?: boolean;
  options: AdditionOption[];
}

export interface SelectedAddition {
  groupId: string;
  optionId: string;
  qty: number;           // 1 for radio/checkbox; 1+ for counter
}

export interface FoodCategory {
  id: string;
  name: string;
  emoji: string;
  gradient: [string, string];
}

export interface FoodItem {
  id: string;
  categoryId: string;
  name: string;
  price: number;            // VND base price
  kitchen: KitchenZone;
  emoji: string;
  description?: string;
  soldCount?: number;       // mock sold counter
  additions?: AdditionGroup[];
}

export interface CartLine {
  lineId: string;                       // unique per line
  item: FoodItem;
  qty: number;
  note?: string;
  modifiers?: string[];                 // display labels derived from selectedAdditions
  selectedAdditions?: SelectedAddition[];
}

export interface OrderBatch {
  id: string;
  timestamp: string;
  staffName: string;
  lines: CartLine[];
  status: OrderStatus;
}

// ── Categories ─────────────────────────────────────────────────
export const FOOD_CATEGORIES: FoodCategory[] = [
  { id: "snacks",     name: "Savory Snacks",    emoji: "🥨", gradient: ["#fff7ed", "#fed7aa"] },
  { id: "mains",      name: "Main Course",      emoji: "🍽️", gradient: ["#f0fdf4", "#bbf7d0"] },
  { id: "appetizers", name: "Appetizers",       emoji: "🥗", gradient: ["#faf5ff", "#e9d5ff"] },
  { id: "desserts",   name: "Dessert Delights", emoji: "🍰", gradient: ["#fdf2f8", "#fbcfe8"] },
  { id: "beverages",  name: "Beverages",        emoji: "🍹", gradient: ["#eff6ff", "#bfdbfe"] },
];

// ── Items ──────────────────────────────────────────────────────
export const FOOD_ITEMS: FoodItem[] = [
  // ── Savory Snacks ── Bếp Tổng
  { id: "s1", categoryId: "snacks", name: "Xúc xích chiên giòn",       price: 85000,  kitchen: "Bếp Tổng", emoji: "🌭", description: "Crispy fried sausage with dipping sauce" },
  { id: "s2", categoryId: "snacks", name: "Khoai tây chiên phô mai",    price: 65000,  kitchen: "Bếp Tổng", emoji: "🍟", description: "Cheese seasoned fries" },
  { id: "s3", categoryId: "snacks", name: "Bánh mì phô mai mozzarella", price: 75000,  kitchen: "Bếp Tổng", emoji: "🧀", description: "Toasted bread with melted mozzarella" },
  { id: "s4", categoryId: "snacks", name: "Chả giò hải sản",           price: 95000,  kitchen: "Bếp Tổng", emoji: "🥟", description: "Crispy seafood spring rolls" },
  { id: "s5", categoryId: "snacks", name: "Bắp rang bơ truffle",       price: 55000,  kitchen: "Bếp Tổng", emoji: "🍿", description: "Truffle butter popcorn" },
  { id: "s6", categoryId: "snacks", name: "Nachos phô mai",            price: 79000,  kitchen: "Bếp Tổng", emoji: "🌮", description: "Loaded nachos with cheese dip" },

  // ── Main Course ── Bếp Tổng
  {
    id: "m1", categoryId: "mains", name: "Bò bít tết sốt nấm", price: 295000, kitchen: "Bếp Tổng", emoji: "🥩",
    description: "Pan-seared prime beef tenderloin served with rich mushroom sauce, seasonal vegetables and your choice of steak doneness.",
    soldCount: 38,
    additions: [
      {
        id: "doneness", name: "Độ chín (Doneness)", type: "radio", required: true,
        options: [
          { id: "rare",       label: "\uD83D\uDD34 Rare – Tái" },
          { id: "medium_r",   label: "\uD83D\uDFE0 Medium Rare" },
          { id: "medium",     label: "\uD83D\uDFE1 Medium" },
          { id: "well",       label: "\uD83D\uDFE2 Well Done" },
        ],
      },
      {
        id: "toppings", name: "Extra Toppings", type: "checkbox", required: false,
        options: [
          { id: "mushroom", label: "Sốt nấm thêm",    price: 15000 },
          { id: "egg",      label: "Trứng ốp la",      price: 15000 },
          { id: "cheese",   label: "Phô mai Parmesan", price: 20000 },
        ],
      },
      {
        id: "sides", name: "Món phụ thêm", type: "counter", required: false,
        options: [
          { id: "fries",  label: "Khoai tây chiên", price: 25000 },
          { id: "salad",  label: "Salad tươi",      price: 20000 },
        ],
      },
    ],
  },
  { id: "m2", categoryId: "mains", name: "Tôm nướng muối ớt",    price: 245000, kitchen: "Bếp Tổng", emoji: "🦐", description: "Grilled shrimp with chili salt",       soldCount: 15 },
  { id: "m3", categoryId: "mains", name: "Gà nướng BBQ Mỹ",      price: 195000, kitchen: "Bếp Tổng", emoji: "🍗", description: "American BBQ grilled chicken",        soldCount: 22 },
  { id: "m4", categoryId: "mains", name: "Cá hồi áp chảo",       price: 265000, kitchen: "Bếp Tổng", emoji: "🐟", description: "Pan-seared salmon with herbs",        soldCount: 17 },
  { id: "m5", categoryId: "mains", name: "Pasta carbonara",       price: 175000, kitchen: "Bếp Tổng", emoji: "🍝", description: "Classic carbonara with pancetta",   soldCount: 29 },
  { id: "m6", categoryId: "mains", name: "Pizza margherita",      price: 155000, kitchen: "Bếp Tổng", emoji: "🍕", description: "Classic margherita pizza",          soldCount: 31 },

  // ── Appetizers ── Bếp trên
  { id: "a1", categoryId: "appetizers", name: "Salad Caesar",        price: 95000,  kitchen: "Bếp trên", emoji: "🥗", description: "Classic Caesar with croutons" },
  { id: "a2", categoryId: "appetizers", name: "Súp bí đỏ kem tươi", price: 75000,  kitchen: "Bếp trên", emoji: "🍲", description: "Creamy pumpkin soup" },
  { id: "a3", categoryId: "appetizers", name: "Bruschetta cà chua",  price: 85000,  kitchen: "Bếp trên", emoji: "🍅", description: "Toasted bruschetta with fresh tomatoes" },
  { id: "a4", categoryId: "appetizers", name: "Gỏi cuốn tôm thịt",  price: 75000,  kitchen: "Bếp trên", emoji: "🫔", description: "Fresh spring rolls with peanut sauce" },
  { id: "a5", categoryId: "appetizers", name: "Carpaccio bò",       price: 135000, kitchen: "Bếp trên", emoji: "🥩", description: "Thinly sliced beef with lemon dressing" },

  // ── Dessert Delights ── Bếp trên
  {
    id: "d1", categoryId: "desserts", name: "Bánh tiramisu", price: 95000, kitchen: "Bếp trên", emoji: "🎂",
    description: "Authentic Italian tiramisu made with mascarpone cream, espresso-soaked ladyfingers and dusted with premium cocoa powder.",
    soldCount: 19,
    additions: [
      {
        id: "size", name: "Cỡ bánh (Size)", type: "radio", required: true,
        options: [
          { id: "regular", label: "Regular" },
          { id: "large",   label: "Large (+20.000 đ)", price: 20000 },
        ],
      },
      {
        id: "extras", name: "Topping thêm", type: "checkbox", required: false,
        options: [
          { id: "cocoa", label: "Extra Cocoa Powder",  price: 10000 },
          { id: "cream", label: "Extra Whipped Cream", price: 15000 },
        ],
      },
    ],
  },
  { id: "d2", categoryId: "desserts", name: "Kem gelato 3 vị",   price: 75000, kitchen: "Bếp trên", emoji: "🍨", description: "Three flavor Italian gelato",                 soldCount: 27 },
  { id: "d3", categoryId: "desserts", name: "Bánh crepe Nhật",   price: 80000, kitchen: "Bếp trên", emoji: "🥞", description: "Japanese crepe with cream filling",          soldCount: 14 },
  { id: "d4", categoryId: "desserts", name: "Chè thái đặc biệt", price: 55000, kitchen: "Bếp trên", emoji: "🍮", description: "Thai dessert with coconut cream",            soldCount: 33 },
  { id: "d5", categoryId: "desserts", name: "Bánh brownie nóng", price: 85000, kitchen: "Bếp trên", emoji: "🍫", description: "Warm chocolate brownie with ice cream",     soldCount: 11 },

  // ── Beverages ── Bar
  {
    id: "b1", categoryId: "beverages", name: "Cocktail Mojito", price: 125000, kitchen: "Bar", emoji: "🍹",
    description: "A refreshing classic cocktail made with fresh mint, juicy lime, white rum, and soda water. Perfectly balanced and ice cold.",
    soldCount: 24,
    additions: [
      {
        id: "ice", name: "Mức đá (Ice Level)", type: "radio", required: true,
        options: [
          { id: "no_ice",  label: "No Ice – Không đá" },
          { id: "less",    label: "Less Ice – Ít đá" },
          { id: "normal",  label: "Normal – Đá vừa" },
          { id: "extra",   label: "Extra Ice – Nhiều đá" },
        ],
      },
      {
        id: "additions", name: "Thêm vào (Add-ons)", type: "checkbox", required: false,
        options: [
          { id: "mint",  label: "Extra Mint",         price: 10000 },
          { id: "lime",  label: "Extra Lime Wedge",   price: 10000 },
          { id: "syrup", label: "Simple Syrup +",     price: 10000 },
        ],
      },
      {
        id: "shots", name: "Extra Rum Shots", type: "counter", required: false,
        options: [
          { id: "rum", label: "Rum Shot (30ml)", price: 35000 },
        ],
      },
    ],
  },
  { id: "b2", categoryId: "beverages", name: "Nước ép trái cây tươi",  price: 75000,  kitchen: "Bar", emoji: "🧃", description: "Fresh seasonal fruit juice",    soldCount: 18 },
  { id: "b3", categoryId: "beverages", name: "Smoothie bơ",            price: 85000,  kitchen: "Bar", emoji: "🥑", description: "Creamy avocado smoothie",      soldCount: 9  },
  { id: "b4", categoryId: "beverages", name: "Beer Heineken 330ml",    price: 65000,  kitchen: "Bar", emoji: "🍺", description: "Premium imported beer",        soldCount: 42 },
  { id: "b5", categoryId: "beverages", name: "Rượu vang đỏ (ly)",     price: 150000, kitchen: "Bar", emoji: "🍷", description: "Premium red wine by glass",   soldCount: 16 },
  { id: "b6", categoryId: "beverages", name: "Soft drink lon",         price: 45000,  kitchen: "Bar", emoji: "🥤", description: "Canned soft drink (Coke/Sprite)", soldCount: 55 },
];

// ── Helpers ────────────────────────────────────────────────────
export function formatVND(amount: number): string {
  return amount.toLocaleString("vi-VN") + " đ";
}

export const KITCHEN_META: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "Bếp Tổng": { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa", dot: "#f97316" },
  "Bếp trên": { bg: "#faf5ff", text: "#7c3aed", border: "#e9d5ff", dot: "#a855f7" },
  "Bar":       { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", dot: "#3b82f6" },
};

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  new:         { label: "New",         color: "#b45309", bg: "#fef3c7" },
  sent:        { label: "Sent",        color: "#0369a1", bg: "#dbeafe" },
  in_progress: { label: "In Progress", color: "#7c3aed", bg: "#ede9fe" },
  completed:   { label: "Completed",   color: "#15803d", bg: "#dcfce7" },
  void:        { label: "Void",        color: "#991b1b", bg: "#fee2e2" },
};
