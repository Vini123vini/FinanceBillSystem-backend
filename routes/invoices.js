const express = require('express');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { status, client, search, limit = 50, page = 1 } = req.query;
    const filter = { user: req.user._id };
    if (status && status !== 'all') filter.status = status;
    if (client) filter.client = client;
    if (search) filter.invoiceNumber = new RegExp(search, 'i');
    const total = await Invoice.countDocuments(filter);
    const invoices = await Invoice.find(filter)
      .populate('client', 'name company color email')
      .sort({ createdAt: -1 }).limit(Number(limit)).skip((Number(page)-1)*Number(limit));
    res.json({ success: true, data: invoices, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const num = user.invoiceSettings.nextNumber;
    const invoiceNumber = `${user.invoiceSettings.prefix}-${String(num).padStart(4, '0')}`;
    user.invoiceSettings.nextNumber = num + 1;
    await user.save();
    const invoice = new Invoice({ ...req.body, user: req.user._id, invoiceNumber });
    await invoice.save();
    await invoice.populate('client', 'name company color email');
    res.status(201).json({ success: true, data: invoice });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id })
      .populate('client', 'name company email phone address city state gstin color');
    if (!invoice) return res.status(404).json({ success: false, message: 'Not found' });
    const Payment = require('../models/Payment');
    const payments = await Payment.find({ invoice: invoice._id }).sort({ paymentDate: -1 });
    res.json({ success: true, data: { ...invoice.toJSON(), payments } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });
    if (!invoice) return res.status(404).json({ success: false, message: 'Not found' });
    Object.assign(invoice, req.body);
    await invoice.save();
    await invoice.populate('client', 'name company color email');
    res.json({ success: true, data: invoice });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status }, { new: true }
    ).populate('client', 'name company color');
    if (!invoice) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: invoice });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!invoice) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
