const express = require('express');
const {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  deleteIncident,
  getIncidentStats,
  generateAiSolution
} = require('../controllers/incidentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/stats', getIncidentStats);
router.post('/', createIncident);
router.get('/', getIncidents);
router.get('/:id', getIncidentById);
router.post('/:id/ai-solution', generateAiSolution);
router.patch('/:id', authorize('manager'), updateIncidentStatus);
router.delete('/:id', authorize('manager'), deleteIncident);

module.exports = router;
