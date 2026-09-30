const db = require('../config/db');

exports.createPoll = async (req, res) => {
    const { question, options } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ error: 'Provide a question and at least 2 options' });
    }

    try {
        const [poll] = await db.query('INSERT INTO polls (question) VALUES (?)', [question]);
        await db.query(
            'INSERT INTO options (poll_id, option_text) VALUES ?',
            [options.map((text) => [poll.insertId, text])]
        );
        res.status(201).json({ id: poll.insertId, question, options });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not create poll' });
    }
};

exports.getPolls = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM polls ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

exports.getPoll = async (req, res) => {
    try {
        const [polls] = await db.query('SELECT * FROM polls WHERE id = ?', [req.params.id]);
        if (polls.length === 0) return res.status(404).json({ error: 'Poll not found' });

        const [options] = await db.query('SELECT id, option_text FROM options WHERE poll_id = ?', [req.params.id]);
        res.json({ ...polls[0], options });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

exports.updatePoll = async (req, res) => {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question required' });

    try {
        const [result] = await db.query('UPDATE polls SET question = ? WHERE id = ?', [question, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Poll not found' });
        res.json({ id: Number(req.params.id), question });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

exports.deletePoll = async (req, res) => {
    try {
        await db.query('DELETE FROM votes WHERE poll_id = ?', [req.params.id]);
        await db.query('DELETE FROM options WHERE poll_id = ?', [req.params.id]);
        const [result] = await db.query('DELETE FROM polls WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Poll not found' });
        res.json({ message: 'Poll deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

exports.votePoll = async (req, res) => {
    const { user_id, option_id } = req.body;
    if (!user_id || !option_id) {
        return res.status(400).json({ error: 'user_id and option_id required' });
    }

    try {
        const [options] = await db.query(
            'SELECT id FROM options WHERE id = ? AND poll_id = ?',
            [option_id, req.params.id]
        );
        if (options.length === 0) {
            return res.status(400).json({ error: 'That option does not belong to this poll' });
        }

        const [existing] = await db.query(
            'SELECT id FROM votes WHERE user_id = ? AND poll_id = ?',
            [user_id, req.params.id]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: 'User has already voted on this poll' });
        }

        await db.query(
            'INSERT INTO votes (user_id, poll_id, option_id) VALUES (?, ?, ?)',
            [user_id, req.params.id, option_id]
        );
        res.status(201).json({ message: 'Vote recorded' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

exports.getResults = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT o.id, o.option_text, COUNT(v.id) AS total_votes
             FROM options o
             LEFT JOIN votes v ON v.option_id = o.id
             WHERE o.poll_id = ?
             GROUP BY o.id, o.option_text`,
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};