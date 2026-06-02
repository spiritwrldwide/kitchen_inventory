// db.js - handles all data persistence via localStorage
// acts as a simple client-side database layer

const DB_KEY = "kitchen_inventory";
const ACTIVITY_KEY = "kitchen_activity";

// default seed data so the app isn't empty on first load
const DEFAULT_ITEMS = [
  { id: 1,  name: "Heavy Cream",     cat: "Dairy",     received: daysOffset(-3), expiry: daysOffset(-1), qty: 2,  unit: "liters", loc: "Walk-in" },
  { id: 2,  name: "Chicken Breast",  cat: "Meat",      received: daysOffset(-1), expiry: daysOffset(1),  qty: 5,  unit: "kg",     loc: "Walk-in" },
  { id: 3,  name: "Salmon Fillet",   cat: "Seafood",   received: daysOffset(-2), expiry: daysOffset(0),  qty: 3,  unit: "kg",     loc: "Walk-in" },
  { id: 4,  name: "Butter",          cat: "Dairy",     received: daysOffset(-5), expiry: daysOffset(14), qty: 4,  unit: "kg",     loc: "Walk-in" },
  { id: 5,  name: "Olive Oil",       cat: "Sauces",    received: daysOffset(-10),expiry: daysOffset(60), qty: 2,  unit: "liters", loc: "Pantry"  },
  { id: 6,  name: "Flour",           cat: "Dry Goods", received: daysOffset(-7), expiry: daysOffset(90), qty: 10, unit: "kg",     loc: "Pantry"  },
  { id: 7,  name: "Tomato Paste",    cat: "Sauces",    received: daysOffset(-1), expiry: daysOffset(2),  qty: 6,  unit: "units",  loc: "Pantry"  },
  { id: 8,  name: "Beef Tenderloin", cat: "Meat",      received: daysOffset(0),  expiry: daysOffset(5),  qty: 8,  unit: "kg",     loc: "Freezer" },
  { id: 9,  name: "Mozzarella",      cat: "Dairy",     received: daysOffset(-4), expiry: daysOffset(-2), qty: 1,  unit: "kg",     loc: "Walk-in" },
  { id: 10, name: "Lettuce",         cat: "Produce",   received: daysOffset(-2), expiry: daysOffset(1),  qty: 5,  unit: "units",  loc: "Walk-in" },
  { id: 11, name: "Shrimp",          cat: "Seafood",   received: daysOffset(-1), expiry: daysOffset(3),  qty: 2,  unit: "kg",     loc: "Freezer" },
  { id: 12, name: "Rice",            cat: "Dry Goods", received: daysOffset(-20),expiry: daysOffset(180),qty: 25, unit: "kg",     loc: "Pantry"  },
];

const DEFAULT_ACTIVITY = [
  { text: "Tomato Paste added to Pantry",           time: "2 min ago",  color: "var(--emerald)" },
  { text: "Heavy Cream marked as Expired",          time: "18 min ago", color: "var(--rose)"    },
  { text: "Chicken Breast marked as Used",          time: "1 hr ago",   color: "var(--sky)"     },
  { text: "Salmon Fillet — expiry alert triggered", time: "2 hr ago",   color: "var(--amber)"   },
];

// helper - returns ISO date string offset from today
function daysOffset(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

// load inventory from localStorage, seed defaults if nothing saved yet
function loadInventory() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not read inventory from storage, using defaults.", e);
  }
  // first visit - save seed data
  saveInventory(DEFAULT_ITEMS);
  return DEFAULT_ITEMS.slice();
}

function saveInventory(items) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save inventory:", e);
  }
}

function loadActivity() {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Activity log unavailable.", e);
  }
  saveActivity(DEFAULT_ACTIVITY);
  return DEFAULT_ACTIVITY.slice();
}

function saveActivity(log) {
  // keep last 20 entries so localStorage doesn't grow forever
  const trimmed = log.slice(0, 20);
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error("Failed to save activity log:", e);
  }
}

function clearStorage() {
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem(ACTIVITY_KEY);
}
