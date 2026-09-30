const router = require('express').Router();
const { createPoll, getPolls, getPoll, updatePoll, deletePoll, votePoll, getResults } = require('../controllers/pollController');

router.post('/', createPoll);
router.get('/', getPolls);
router.get('/:id', getPoll);
router.put('/:id', updatePoll);
router.delete('/:id', deletePoll);
router.post('/:id/vote', votePoll);
router.get('/:id/results', getResults);

module.exports = router;