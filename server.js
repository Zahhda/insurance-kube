const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Simple in-memory database for credentials
const credentialsDB = [];

// Issue credential endpoint
app.post('/issue', (req, res) => {
  try {
    const credential = req.body;
    
    if (!credential || !credential.id) {
      return res.status(400).json({ error: 'Invalid credential format. Must include an id.' });
    }
    
    // Generate a unique ID if not provided
    const credentialId = credential.id || `cred-${Date.now()}`;
    const issuedCredential = {
      ...credential,
      id: credentialId,
      issuedAt: new Date().toISOString(),
      status: 'valid'
    };
    
    // Store in memory
    credentialsDB.push(issuedCredential);
    
    // Also save to file for persistence
    const dbFile = path.join(dataDir, 'credentials.json');
    let existingData = [];
    
    if (fs.existsSync(dbFile)) {
      try {
        existingData = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
      } catch (err) {
        console.error('Error reading credentials file:', err);
      }
    }
    
    existingData.push(issuedCredential);
    fs.writeFileSync(dbFile, JSON.stringify(existingData, null, 2));
    
    res.status(201).json(issuedCredential);
  } catch (error) {
    console.error('Error issuing credential:', error);
    res.status(500).json({ error: 'Failed to issue credential' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'issuance-service' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Issuance service running on port ${PORT}`);
});