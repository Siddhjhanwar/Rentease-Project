const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "replace-this-demo-secret-before-deployment";
const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, "rentease.db"));

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const parseTenures = (value) => JSON.stringify(Array.isArray(value) ? value : []);
const productRow = (product) => ({ ...product, tenures: JSON.parse(product.tenures) });

function withTransaction(work) {
  db.exec("BEGIN");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function initializeDatabase() {
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'customer', created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, rent REAL NOT NULL,
      deposit REAL NOT NULL, tenures TEXT NOT NULL, stock INTEGER NOT NULL, image TEXT, description TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rentals (
      id TEXT PRIMARY KEY, product_id TEXT NOT NULL, user_id TEXT NOT NULL, product_name TEXT NOT NULL,
      monthly_rent REAL NOT NULL, tenure INTEGER NOT NULL, customer_name TEXT NOT NULL, city TEXT NOT NULL,
      address TEXT NOT NULL, delivery_date TEXT NOT NULL, status TEXT NOT NULL, pickup_date TEXT,
      returned_date TEXT, created_at TEXT NOT NULL,
      FOREIGN KEY(product_id) REFERENCES products(id), FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, rental_id TEXT NOT NULL, product_name TEXT NOT NULL,
      type TEXT NOT NULL, description TEXT NOT NULL, status TEXT NOT NULL, damage_charge REAL DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(rental_id) REFERENCES rentals(id)
    );
    CREATE TABLE IF NOT EXISTS service_areas (
      id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL
    );
  `);

  const admin = db.prepare("SELECT id FROM users WHERE email = ?").get("admin@rentease.demo");
  if (!admin) {
    db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)").run(
      "rentease-demo-admin", "RentEase Admin", "admin@rentease.demo",
      bcrypt.hashSync("Admin@123", 10), "admin", now()
    );
  }

  const productCount = db.prepare("SELECT COUNT(*) AS count FROM products").get().count;
  if (productCount === 0) seedProducts();

  const areaCount = db.prepare("SELECT COUNT(*) AS count FROM service_areas").get().count;
  if (areaCount === 0) ["Bengaluru", "Hyderabad", "Pune", "Delhi NCR"].forEach((name) => {
    db.prepare("INSERT INTO service_areas VALUES (?, ?, ?)").run(id(), name, now());
  });
}

function seedProducts() {
  const products = [
    ["Queen Bed with Mattress", "Furniture", 899, 1800, [3, 6, 12], 8, "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80", "Comfortable queen bed setup for students and working professionals."],
    ["Three-Seater Sofa", "Furniture", 1099, 2200, [3, 6, 12], 5, "https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=900&q=80", "A compact sofa for apartments, shared flats, and rented homes."],
    ["Study Table", "Furniture", 349, 700, [1, 3, 6], 12, "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=80", "Simple work table for remote work, study, and exam preparation."],
    ["Single Door Fridge", "Appliance", 799, 1600, [3, 6, 12], 7, "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=900&q=80", "Energy-efficient fridge suitable for singles and small families."],
    ["Washing Machine", "Appliance", 999, 2000, [3, 6, 12], 4, "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=900&q=80", "Fully automatic washing machine with maintenance support included."],
    ["Smart TV", "Appliance", 1199, 2400, [3, 6, 12], 6, "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=900&q=80", "Large screen smart TV for entertainment without the purchase cost."]
  ];
  const statement = db.prepare("INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  products.forEach(([name, category, rent, deposit, tenures, stock, image, description]) => {
    statement.run(id(), name, category, rent, deposit, parseTenures(tenures), stock, image, description, now());
  });
}

function tokenFor(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "8h" });
}

function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Login is required." });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ message: "Your session has expired. Please log in again." }); }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access is required." });
  next();
}

app.get("/api/health", (req, res) => res.json({ status: "ok", database: "sqlite" }));

app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: "Name, email, and a 6-character password are required." });
  try {
    const user = { id: id(), name: name.trim(), email: email.trim().toLowerCase(), role: "customer" };
    db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)").run(user.id, user.name, user.email, bcrypt.hashSync(password, 10), user.role, now());
    res.status(201).json({ user, token: tokenFor(user) });
  } catch { res.status(409).json({ message: "This email is already registered." }); }
});

app.post("/api/auth/login", (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(String(req.body.email || "").trim().toLowerCase());
  if (!user || !bcrypt.compareSync(req.body.password || "", user.password_hash)) return res.status(401).json({ message: "Invalid email or password." });
  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.json({ user: safeUser, token: tokenFor(safeUser) });
});

app.get("/api/products", (req, res) => res.json(db.prepare("SELECT * FROM products ORDER BY created_at DESC").all().map(productRow)));
app.post("/api/products", authenticate, adminOnly, (req, res) => {
  const { name, category, rent, deposit, tenures, stock, image = "", description = "" } = req.body;
  if (!name || !category || !Number(rent) || !Number(deposit) || !Array.isArray(tenures) || !tenures.length || Number(stock) < 0) return res.status(400).json({ message: "Complete all product fields." });
  const product = { id: id(), name, category, rent: Number(rent), deposit: Number(deposit), tenures, stock: Number(stock), image, description, created_at: now() };
  db.prepare("INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(product.id, product.name, product.category, product.rent, product.deposit, parseTenures(product.tenures), product.stock, product.image, product.description, product.created_at);
  res.status(201).json(product);
});
app.put("/api/products/:id", authenticate, adminOnly, (req, res) => {
  const { name, category, rent, deposit, tenures, stock, image = "", description = "" } = req.body;
  const result = db.prepare("UPDATE products SET name=?, category=?, rent=?, deposit=?, tenures=?, stock=?, image=?, description=? WHERE id=?").run(name, category, Number(rent), Number(deposit), parseTenures(tenures), Number(stock), image, description, req.params.id);
  if (!result.changes) return res.status(404).json({ message: "Product not found." });
  res.json(productRow(db.prepare("SELECT * FROM products WHERE id=?").get(req.params.id)));
});
app.delete("/api/products/:id", authenticate, adminOnly, (req, res) => {
  if (db.prepare("SELECT id FROM rentals WHERE product_id=?").get(req.params.id)) return res.status(400).json({ message: "Products with rental records cannot be removed." });
  const result = db.prepare("DELETE FROM products WHERE id=?").run(req.params.id);
  if (!result.changes) return res.status(404).json({ message: "Product not found." });
  res.status(204).end();
});

app.get("/api/rentals", authenticate, (req, res) => {
  const rentals = req.user.role === "admin" ? db.prepare("SELECT * FROM rentals ORDER BY created_at DESC").all() : db.prepare("SELECT * FROM rentals WHERE user_id=? ORDER BY created_at DESC").all(req.user.id);
  res.json(rentals);
});
app.post("/api/rentals", authenticate, (req, res) => {
  const { items, customerName, city, address, deliveryDate } = req.body;
  if (!Array.isArray(items) || !items.length || !city || !address || !deliveryDate) return res.status(400).json({ message: "Complete delivery details and add an item." });
  let create;
  try {
    create = withTransaction(() => {
    const rentals = items.map((item) => {
      const product = db.prepare("SELECT * FROM products WHERE id=?").get(item.productId);
      if (!product || product.stock < 1) throw new Error("One or more products are unavailable.");
      if (!JSON.parse(product.tenures).includes(Number(item.tenure))) throw new Error("Invalid rental tenure.");
      const rental = { id: id(), productId: product.id, userId: req.user.id, productName: product.name, monthlyRent: product.rent, tenure: Number(item.tenure), customerName: customerName || req.user.name, city, address, deliveryDate, status: "Active", createdAt: now() };
      db.prepare("INSERT INTO rentals VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(rental.id, rental.productId, rental.userId, rental.productName, rental.monthlyRent, rental.tenure, rental.customerName, rental.city, rental.address, rental.deliveryDate, rental.status, null, null, rental.createdAt);
      db.prepare("UPDATE products SET stock=stock-1 WHERE id=?").run(product.id);
      return rental;
    });
    return rentals;
    });
    res.status(201).json(create);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
app.patch("/api/rentals/:id", authenticate, (req, res) => {
  const rental = db.prepare("SELECT * FROM rentals WHERE id=?").get(req.params.id);
  if (!rental) return res.status(404).json({ message: "Rental not found." });
  if (req.user.role !== "admin" && rental.user_id !== req.user.id) return res.status(403).json({ message: "Access denied." });
  const { action, pickupDate } = req.body;
  if (action === "extend" && req.user.role !== "admin") db.prepare("UPDATE rentals SET tenure=tenure+1 WHERE id=?").run(rental.id);
  else if (action === "schedulePickup" && req.user.role !== "admin") db.prepare("UPDATE rentals SET status='Pickup Scheduled', pickup_date=? WHERE id=?").run(pickupDate, rental.id);
  else if (action === "return" && req.user.role === "admin" && rental.status !== "Returned") {
    withTransaction(() => { db.prepare("UPDATE rentals SET status='Returned', returned_date=? WHERE id=?").run(new Date().toISOString().slice(0, 10), rental.id); db.prepare("UPDATE products SET stock=stock+1 WHERE id=?").run(rental.product_id); });
  } else return res.status(400).json({ message: "Invalid rental action." });
  res.json(db.prepare("SELECT * FROM rentals WHERE id=?").get(rental.id));
});

app.get("/api/requests", authenticate, (req, res) => {
  const statement = req.user.role === "admin" ? db.prepare("SELECT * FROM requests ORDER BY created_at DESC") : db.prepare("SELECT * FROM requests WHERE user_id=? ORDER BY created_at DESC");
  res.json(req.user.role === "admin" ? statement.all() : statement.all(req.user.id));
});
app.post("/api/requests", authenticate, (req, res) => {
  const { rentalId, type, description } = req.body;
  const rental = db.prepare("SELECT * FROM rentals WHERE id=? AND user_id=? AND status != 'Returned'").get(rentalId, req.user.id);
  if (!rental || !type || !description) return res.status(400).json({ message: "Choose an active rental and provide request details." });
  const request = { id: id(), userId: req.user.id, rentalId, productName: rental.product_name, type, description, status: "Open", createdAt: now() };
  db.prepare("INSERT INTO requests VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(request.id, request.userId, request.rentalId, request.productName, request.type, request.description, request.status, 0, request.createdAt, null);
  res.status(201).json(request);
});
app.patch("/api/requests/:id", authenticate, adminOnly, (req, res) => {
  const { status, damageCharge = 0 } = req.body;
  const result = db.prepare("UPDATE requests SET status=?, damage_charge=?, updated_at=? WHERE id=?").run(status, Number(damageCharge), now(), req.params.id);
  if (!result.changes) return res.status(404).json({ message: "Request not found." });
  res.json(db.prepare("SELECT * FROM requests WHERE id=?").get(req.params.id));
});

app.get("/api/users", authenticate, adminOnly, (req, res) => res.json(db.prepare("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC").all()));
app.get("/api/areas", (req, res) => res.json(db.prepare("SELECT * FROM service_areas ORDER BY name").all()));
app.post("/api/areas", authenticate, adminOnly, (req, res) => { const name = String(req.body.name || "").trim(); if (!name) return res.status(400).json({ message: "Area name is required." }); try { const area = { id: id(), name, createdAt: now() }; db.prepare("INSERT INTO service_areas VALUES (?, ?, ?)").run(area.id, area.name, area.createdAt); res.status(201).json(area); } catch { res.status(409).json({ message: "This service area already exists." }); } });
app.delete("/api/areas/:id", authenticate, adminOnly, (req, res) => { db.prepare("DELETE FROM service_areas WHERE id=?").run(req.params.id); res.status(204).end(); });
app.get("/api/analytics", authenticate, adminOnly, (req, res) => {
  const activeRentals = db.prepare("SELECT COUNT(*) AS count FROM rentals WHERE status != 'Returned'").get().count;
  const mrr = db.prepare("SELECT COALESCE(SUM(monthly_rent), 0) AS value FROM rentals WHERE status != 'Returned'").get().value;
  const stock = db.prepare("SELECT COALESCE(SUM(stock), 0) AS value FROM products").get().value;
  const totalUsers = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role='customer'").get().count;
  const returningUsers = db.prepare("SELECT COUNT(*) AS count FROM (SELECT user_id FROM rentals GROUP BY user_id HAVING COUNT(*) > 1)").get().count;
  const averageResolutionHours = db.prepare("SELECT COALESCE(AVG((julianday(updated_at) - julianday(created_at)) * 24), 0) AS value FROM requests WHERE status IN ('Resolved', 'Damage Charged', 'No Damage Found') AND updated_at IS NOT NULL").get().value;
  res.json({ activeRentals, mrr, utilization: stock + activeRentals === 0 ? 0 : Math.round((activeRentals / (stock + activeRentals)) * 100), retentionRate: totalUsers ? Math.round((returningUsers / totalUsers) * 100) : 0, averageResolutionHours: Number(averageResolutionHours.toFixed(1)) });
});

initializeDatabase();
app.listen(PORT, () => console.log(`RentEase server is running at http://localhost:${PORT}`));
