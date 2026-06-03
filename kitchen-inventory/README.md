# KitchenOS - Kitchen Inventory & Expiry Tracker

A web-based application for tracking kitchen inventory and product expiry dates.
Built with vanilla HTML, CSS and JavaScript (no frameworks required).

## Project Structure

```
kitchen-inventory/
├── index.html        # Main page / UI markup
├── css/
│   └── style.css     # All styles, dark/light theme variables
└── js/
    ├── db.js         # Data persistence layer (localStorage)
    └── app.js        # Application logic, rendering, event handlers
```

## How to Run

Open `index.html` in any modern browser. No server or build step needed.

Data is saved automatically to `localStorage` so it persists between sessions.

## Features

- **Dashboard** — overview stats (total, fresh, warning, expired items)
- **Inventory table** — search and filter by category, location, status
- **Alerts** — items expiring within 48 hours or already expired
- **Role system** — Staff (view, mark used) vs Manager (edit, delete, waste report)
- **Persistence** — all changes saved to localStorage automatically
- **Dark/Light theme** toggle

## Data Layer (`db.js`)

`db.js` acts as a client-side database module:
- `loadInventory()` / `saveInventory(items)` — read/write inventory array
- `loadActivity()` / `saveActivity(log)` — read/write activity log
- `clearStorage()` — reset all saved data
- On first visit, seed data is loaded automatically

## Main Logic (`app.js`)

- `renderDashboard()` — updates stat cards and activity feed
- `renderTable()` — filters and renders inventory rows
- `renderAlerts()` — builds the alerts list
- `addItem()` / `editItem()` / `deleteItem()` / `markUsed()` — CRUD operations
- `toggleRole()` — switches between Staff and Manager views
