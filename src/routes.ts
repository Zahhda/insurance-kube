import { Router, Request, Response } from 'express';
import { storeCredential, credentialExists } from './database';

const router = Router();
const WORKER_ID = process.env.WORKER_ID || 'worker-1';

// POST /issue - Issue a new credential
router.post('/issue', async (req: Request, res: Response) => {
  try {
    const credential = req.body;
    
    // Validate request body
    if (!credential || !credential.id) {
      return res.status(400).json({ 
        error: 'Invalid credential format. Must include an id field.' 
      });
    }
    
    // Check if credential already exists
    const exists = await credentialExists(credential.id);
    if (exists) {
      return res.status(200).json({ 
        message: 'credential already issued',
        worker: WORKER_ID
      });
    }
    
    // Store the credential
    await storeCredential(
      credential.id,
      JSON.stringify(credential),
      WORKER_ID
    );
    
    // Return success response
    return res.status(201).json({ 
      message: `credential issued by ${WORKER_ID}`,
      worker: WORKER_ID
    });
  } catch (error) {
    console.error(`[${WORKER_ID}] Error issuing credential:`, error);
    return res.status(500).json({ 
      error: 'Internal server error',
      worker: WORKER_ID
    });
  }
});

export { router };