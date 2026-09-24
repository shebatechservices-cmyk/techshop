const express = require('express');
const router = express.Router();
const partyController = require('../controllers/partyController');

// 1. Transaction handler (must come before /:type/:id to prevent collision)
router.post('/transaction', partyController.handlePartyTransaction);

// 2. List all parties with search, filter, and pagination (20 per page)
router.get('/', partyController.getParties);

// 3. Profile & Ledger
router.get('/:type/:id', partyController.getPartyProfile);

// 4. In-place profile update
router.put('/:type/:id', partyController.updatePartyProfile);

// 5. Safe deletion (only if zero activity)
router.delete('/:type/:id', partyController.deleteParty);

module.exports = router;
