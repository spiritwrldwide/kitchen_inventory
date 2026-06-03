KitchenOS - Kitchen Inventory Tracker
Web app for tracking kitchen stock and expiry dates. No frameworks, just HTML/CSS/JS.

Files

kitchen-inventory/
index.html        # markup
css/style.css     # styles + theme
 js/
    db.js         # localStorage read/write
    app.js        # all app logic
    
Running

Open index.html in Firefox. Data saves automatically to localStorage between sessions.

What it does

Dashboard with stock summary (fresh / expiring / expired counts)
Inventory table with search and filters
Alerts for items expiring within 48h
Two roles: Staff (view + mark used) and Manager (add/edit/delete + waste report)
Dark/light theme

db.js
Handles all localStorage access. loadInventory() / saveInventory() for the item list, same pair for the activity log. First visit seeds some sample data so the app isn't empty.
app.js
Rendering, event handlers, CRUD. Main functions: renderDashboard(), renderTable(), renderAlerts(), addItem(), editItem(), deleteItem(), markUsed().
