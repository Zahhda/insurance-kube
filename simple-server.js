require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');

// Environment variables
const PORT = process.env.PORT || 3001;
const SERVICE_NAME = process.env.SERVICE_NAME || 'Issuance Service';
const DATA_DIR = process.env.DATA_DIR || './data';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, DATA_DIR);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
  console.log(`📁 Created data directory: ${dataDir}`);
}

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // Root path handler for Vercel deployment
  if (req.method === 'GET' && (req.url === '/' || req.url === '')) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: SERVICE_NAME,
      message: 'Issuance service is running',
      endpoints: {
        health: '/health',
        issue: '/issue (POST)'
      },
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Health check endpoint
  if (req.method === 'GET' && req.url === '/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: SERVICE_NAME,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Issue credential endpoint
  if (req.method === 'POST' && (req.url === '/issue' || req.url === '/api/issue')) {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const credential = JSON.parse(body);
        
        if (!credential || !credential.id) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid credential format. Must include an id.' }));
          return;
        }
        
        const issuedCredential = {
          ...credential,
          issuedAt: new Date().toISOString(),
          status: 'valid'
        };
        
        // Save to file for persistence
        const dbFile = path.join(dataDir, 'credentials.json');
        let existingData = [];
        
        if (fs.existsSync(dbFile)) {
          try {
            existingData = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
          } catch (err) {
            console.error('❌ Error reading credentials file:', err);
          }
        }
        
        existingData.push(issuedCredential);
        fs.writeFileSync(dbFile, JSON.stringify(existingData, null, 2));
        console.log(`✅ Credential issued: ${issuedCredential.id}`);
        
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(issuedCredential));
      } catch (error) {
        console.error('❌ Error issuing credential:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Failed to issue credential' }));
      }
    });
    
    return;
  }

  // Not found
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║                                            ║
║  🚀 ${SERVICE_NAME} is running!            ║
║                                            ║
║  📡 Port: ${PORT}                          ║
║  🌐 Environment: ${process.env.NODE_ENV || 'development'} ║
║  📂 Data directory: ${DATA_DIR}            ║
║                                            ║
║  Health check: http://localhost:${PORT}/health ║
║                                            ║
╚════════════════════════════════════════════╝
  `);
});