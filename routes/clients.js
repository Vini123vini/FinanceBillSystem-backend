const express = require('express');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.use(protect);

const COLORS = ['#7C6FFF','#10B981','#3B82F6','#F59E0B','#F43F5E','#A855F7','#06B6D4','#84CC16'];

router.get('/', async (req, res) => {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (search) filter.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { company: new RegExp(search, 'i') },
    ];
    const total = await Client.countDocuments(filter);
    const clients = await Client.find(filter).sort({ createdAt: -1 }).limit(Number(limit)).skip((Number(page)-1)*Number(limit));
    res.json({ success: true, data: clients, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const count = await Client.countDocuments({ user: req.user._id });
    const color = req.body.color || COLORS[count % COLORS.length];
    const client = await Client.create({ ...req.body, user: req.user._id, color });
    res.status(201).json({ success: true, data: client });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, user: req.user._id });
    if (!client) return res.status(404).json({ success: false, message: 'Not found' });
    const invoices = await Invoice.find({ client: client._id, user: req.user._id }).sort({ createdAt: -1 });
    const [stats] = await Invoice.aggregate([
      { $match: { client: client._id, user: req.user._id } },
      { $group: { _id: null, totalInvoices: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' }, totalPaid: { $sum: '$amountPaid' }, outstanding: { $sum: '$balanceDue' } } },
    ]);
    res.json({ success: true, data: { ...client.toJSON(), invoices, stats: stats || {} } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true, runValidators: true });
    if (!client) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: client });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!client) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Client deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
