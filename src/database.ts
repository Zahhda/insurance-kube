import sqlite3 from 'sqlite3';
import { resolve } from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || resolve(__dirname, '../data/credentials.db');

// Ensure data directory exists
const dataDir = resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
export const db = new sqlite3.Database(DB_PATH);

// Initialize database with required tables
export const initializeDatabase = (): void => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS credentials (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        issued_at INTEGER NOT NULL,
        issued_by TEXT NOT NULL
      )
    `);
  });
  
  console.log(`Database initialized at ${DB_PATH}`);
};

// Store a credential in the database
export const storeCredential = (
  id: string, 
  data: string, 
  issuedBy: string
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const issuedAt = Date.now();
    
    db.run(
      'INSERT INTO credentials (id, data, issued_at, issued_by) VALUES (?, ?, ?, ?)',
      [id, data, issuedAt, issuedBy],
      function(err) {
        if (err) {
          // Check if error is due to duplicate ID (SQLITE_CONSTRAINT)
          if (err.message.includes('UNIQUE constraint failed')) {
            resolve(false); // Credential already exists
          } else {
            reject(err);
          }
        } else {
          resolve(true); // Credential stored successfully
        }
      }
    );
  });
};

// Check if a credential exists
export const credentialExists = (id: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id FROM credentials WHERE id = ?',
      [id],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      }
    );
  });
};