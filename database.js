const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const DATA_DIR = process.env.DATA_DIR || process.env.APPDATA || __dirname;
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'SistemaPOS', 'sistema_pos.db');
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();
  let data = null;
  try { data = fs.readFileSync(DB_PATH); } catch (e) {}
  db = new SQL.Database(data);
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA foreign_keys = ON");
  db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, full_name TEXT NOT NULL DEFAULT '', role TEXT NOT NULL DEFAULT 'vendedor', active INTEGER NOT NULL DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, description TEXT DEFAULT '')`);
  db.run(`CREATE TABLE IF NOT EXISTS suppliers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, contact TEXT DEFAULT '', phone TEXT DEFAULT '', email TEXT DEFAULT '', address TEXT DEFAULT '')`);
  db.run(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT DEFAULT '', description1 TEXT DEFAULT '', description2 TEXT DEFAULT '', barcode TEXT DEFAULT '', price REAL NOT NULL DEFAULT 0, cost REAL NOT NULL DEFAULT 0, stock INTEGER NOT NULL DEFAULT 0, min_stock INTEGER NOT NULL DEFAULT 0, max_stock INTEGER NOT NULL DEFAULT 0, category_id INTEGER DEFAULT NULL, supplier_id INTEGER DEFAULT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (category_id) REFERENCES categories(id), FOREIGN KEY (supplier_id) REFERENCES suppliers(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT DEFAULT '', phone TEXT DEFAULT '', address TEXT DEFAULT '', cuit TEXT DEFAULT '', iva TEXT DEFAULT 'Consumidor Final', total_sales REAL NOT NULL DEFAULT 0, total_paid REAL NOT NULL DEFAULT 0, balance REAL NOT NULL DEFAULT 0, code TEXT DEFAULT '', business_name TEXT DEFAULT '', nickname TEXT DEFAULT '', locality TEXT DEFAULT '', whatsapp TEXT DEFAULT '', credit_limit REAL NOT NULL DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  try { db.run("ALTER TABLE clients ADD COLUMN code TEXT DEFAULT ''"); } catch (e) {}
  try { db.run("ALTER TABLE clients ADD COLUMN business_name TEXT DEFAULT ''"); } catch (e) {}
  try { db.run("ALTER TABLE clients ADD COLUMN nickname TEXT DEFAULT ''"); } catch (e) {}
  try { db.run("ALTER TABLE clients ADD COLUMN locality TEXT DEFAULT ''"); } catch (e) {}
  try { db.run("ALTER TABLE clients ADD COLUMN whatsapp TEXT DEFAULT ''"); } catch (e) {}
  try { db.run("ALTER TABLE clients ADD COLUMN cuit TEXT DEFAULT ''"); } catch (e) {}
  try { db.run("ALTER TABLE clients ADD COLUMN iva TEXT DEFAULT 'Consumidor Final'"); } catch (e) {}
  try { db.run("ALTER TABLE products ADD COLUMN max_stock INTEGER NOT NULL DEFAULT 0"); } catch (e) {}
  try { db.run("ALTER TABLE products ADD COLUMN description1 TEXT DEFAULT ''"); } catch (e) {}
  try { db.run("ALTER TABLE products ADD COLUMN description2 TEXT DEFAULT ''"); } catch (e) {}
  try { db.run("ALTER TABLE purchases ADD COLUMN invoice_number TEXT DEFAULT ''"); } catch (e) {}
  try { db.run("ALTER TABLE purchases ADD COLUMN invoice_type TEXT DEFAULT 'No Oficial'"); } catch (e) {}
  db.run(`CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER DEFAULT NULL, client_id INTEGER DEFAULT NULL, total REAL NOT NULL DEFAULT 0, discount REAL NOT NULL DEFAULT 0, payment_method TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (client_id) REFERENCES clients(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS sale_items (id INTEGER PRIMARY KEY AUTOINCREMENT, sale_id INTEGER NOT NULL, product_id INTEGER DEFAULT NULL, product_name TEXT NOT NULL, quantity REAL NOT NULL DEFAULT 1, price REAL NOT NULL DEFAULT 0, subtotal REAL NOT NULL DEFAULT 0, description TEXT DEFAULT '', FOREIGN KEY (sale_id) REFERENCES sales(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS purchases (id INTEGER PRIMARY KEY AUTOINCREMENT, supplier_id INTEGER DEFAULT NULL, total REAL NOT NULL DEFAULT 0, payment_method TEXT DEFAULT '', invoice_number TEXT DEFAULT '', invoice_type TEXT DEFAULT 'No Oficial', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (supplier_id) REFERENCES suppliers(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS purchase_items (id INTEGER PRIMARY KEY AUTOINCREMENT, purchase_id INTEGER NOT NULL, product_id INTEGER DEFAULT NULL, product_name TEXT NOT NULL, quantity REAL NOT NULL DEFAULT 1, price REAL NOT NULL DEFAULT 0, subtotal REAL NOT NULL DEFAULT 0, description TEXT DEFAULT '', FOREIGN KEY (purchase_id) REFERENCES purchases(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER DEFAULT NULL, amount REAL NOT NULL DEFAULT 0, payment_method TEXT DEFAULT '', notes TEXT DEFAULT '', date DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (client_id) REFERENCES clients(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS quotes (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER DEFAULT NULL, user_id INTEGER DEFAULT NULL, total REAL NOT NULL DEFAULT 0, discount REAL NOT NULL DEFAULT 0, status TEXT DEFAULT 'pendiente', notes TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (client_id) REFERENCES clients(id), FOREIGN KEY (user_id) REFERENCES users(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS quote_items (id INTEGER PRIMARY KEY AUTOINCREMENT, quote_id INTEGER NOT NULL, product_id INTEGER DEFAULT NULL, product_name TEXT NOT NULL, quantity REAL NOT NULL DEFAULT 1, price REAL NOT NULL DEFAULT 0, subtotal REAL NOT NULL DEFAULT 0, description TEXT DEFAULT '', FOREIGN KEY (quote_id) REFERENCES quotes(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS invoices (id INTEGER PRIMARY KEY AUTOINCREMENT, sale_id INTEGER, invoice_type TEXT NOT NULL, invoice_letter TEXT DEFAULT '', invoice_number TEXT NOT NULL, cae TEXT DEFAULT '', cae_vto TEXT DEFAULT '', result TEXT DEFAULT '', client_id INTEGER, client_name TEXT NOT NULL, client_cuit TEXT DEFAULT '', client_iva TEXT DEFAULT '', total REAL NOT NULL DEFAULT 0, iva_total REAL NOT NULL DEFAULT 0, subtotal REAL NOT NULL DEFAULT 0, discount REAL NOT NULL DEFAULT 0, payment_method TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE TABLE IF NOT EXISTS invoice_items (id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_id INTEGER NOT NULL, product_name TEXT NOT NULL, quantity REAL NOT NULL DEFAULT 1, price REAL NOT NULL DEFAULT 0, subtotal REAL NOT NULL DEFAULT 0, description TEXT DEFAULT '', iva_aliquot INTEGER NOT NULL DEFAULT 21, iva_amount REAL NOT NULL DEFAULT 0, FOREIGN KEY (invoice_id) REFERENCES invoices(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS fiscal_config (id INTEGER PRIMARY KEY AUTOINCREMENT, company_name TEXT DEFAULT 'Caños Embalse', company_cuit TEXT DEFAULT '', company_address TEXT DEFAULT 'Hipolito Yrigoyen 546', company_phone TEXT DEFAULT '3571 637747', company_email TEXT DEFAULT 'canosembalse@gmail.com', logo_url TEXT DEFAULT '/logo-ticket.png', env_mode TEXT DEFAULT 'homologacion', cert_password TEXT DEFAULT '', pos_number TEXT DEFAULT '1', legal_letter TEXT DEFAULT 'A', cae TEXT DEFAULT '', cae_vto TEXT DEFAULT '', last_invoice_number TEXT DEFAULT '1', use_cae INTEGER DEFAULT 0, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  try { db.run("ALTER TABLE invoices ADD COLUMN discount REAL NOT NULL DEFAULT 0"); } catch (e) {}
  try { db.run("ALTER TABLE quotes ADD COLUMN discount REAL NOT NULL DEFAULT 0"); } catch (e) {}
  try { db.run("ALTER TABLE invoices ADD COLUMN subtotal REAL NOT NULL DEFAULT 0"); } catch (e) {}
  try { db.run("ALTER TABLE invoices ADD COLUMN payment_method TEXT DEFAULT ''"); } catch (e) {}
  try { db.run("ALTER TABLE invoices ADD COLUMN invoice_letter TEXT DEFAULT ''"); } catch (e) {}
}

function getDb() { return db; }
function saveDb() {}
function queryAll(sql, params) { return db.prepare(sql).all(params || []); }
function queryOne(sql, params) { return db.prepare(sql).get(params || []) || null; }
function lastId() { return db.prepare("SELECT last_insert_rowid() as id").get().id; }

module.exports = { initDatabase, getDb, saveDb, queryAll, queryOne, lastId };
