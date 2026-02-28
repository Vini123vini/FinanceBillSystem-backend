const express = require('express');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { client, invoice, method, limit = 50, page = 1 } = req.query;
    const filter = { user: req.user._id };
    if (client) filter.client = client;
    if (invoice) filter.invoice = invoice;
    if (method) filter.paymentMethod = method;
    const total = await Payment.countDocuments(filter);
    const payments = await Payment.find(filter)
      .populate('client', 'name company color')
      .populate('invoice', 'invoiceNumber totalAmount')
      .sort({ paymentDate: -1 }).limit(Number(limit)).skip((Number(page)-1)*Number(limit));
    const [sum] = await Payment.aggregate([
      { $match: { ...filter, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    res.json({ success: true, data: payments, total, totalAmount: sum?.total || 0 });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.body.invoice, user: req.user._id });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    const payment = await Payment.create({ ...req.body, user: req.user._id, client: invoice.client });
    invoice.amountPaid += payment.amount;
    invoice.balanceDue  = Math.max(0, invoice.totalAmount - invoice.amountPaid);
    if (invoice.balanceDue <= 0) invoice.status = 'paid';
    else if (invoice.amountPaid > 0) invoice.status = 'pending';
    await invoice.save();
    await payment.populate('client', 'name company color');
    await payment.populate('invoice', 'invoiceNumber');
    res.status(201).json({ success: true, data: payment });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, user: req.user._id });
    if (!payment) return res.status(404).json({ success: false, message: 'Not found' });
    const invoice = await Invoice.findById(payment.invoice);
    if (invoice) {
      invoice.amountPaid = Math.max(0, invoice.amountPaid - payment.amount);
      invoice.balanceDue = Math.max(0, invoice.totalAmount - invoice.amountPaid);
      if (invoice.amountPaid === 0) invoice.status = 'sent';
      await invoice.save();
    }
    await payment.deleteOne();
    res.json({ success: true, message: 'Payment deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
