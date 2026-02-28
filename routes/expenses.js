const express = require('express');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { category, limit = 100, page = 1 } = req.query;
    const filter = { user: req.user._id };
    if (category) filter.category = category;
    const total = await Expense.countDocuments(filter);
    const expenses = await Expense.find(filter).sort({ date: -1 }).limit(Number(limit)).skip((Number(page)-1)*Number(limit));
    const [agg] = await Expense.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    res.json({ success: true, data: expenses, total, totalAmount: agg?.total || 0 });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: expense });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true });
    if (!expense) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: expense });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
