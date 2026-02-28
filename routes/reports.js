const express = require('express');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Client = require('../models/Client');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.use(protect);

router.get('/summary', async (req, res) => {
  try {
    const uid = req.user._id;
    const year = Number(req.query.year) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const payData = await Payment.aggregate([
      { $match: { user: uid, paymentDate: { $gte: start, $lte: end }, status: 'completed' } },
      { $group: { _id: { month: { $month: '$paymentDate' } }, total: { $sum: '$amount' } } },
    ]);
    const expData = await Expense.aggregate([
      { $match: { user: uid, date: { $gte: start, $lte: end } } },
      { $group: { _id: { month: { $month: '$date' } }, total: { $sum: '$amount' } } },
    ]);

    const revenueByMonth = Array(12).fill(0);
    const expenseByMonth = Array(12).fill(0);
    payData.forEach(m => { revenueByMonth[m._id.month-1] = m.total; });
    expData.forEach(m => { expenseByMonth[m._id.month-1] = m.total; });

    const totalRevenue = revenueByMonth.reduce((a,v) => a+v, 0);
    const totalExpenses = expenseByMonth.reduce((a,v) => a+v, 0);

    const statusBreakdown = await Invoice.aggregate([
      { $match: { user: uid, issueDate: { $gte: start, $lte: end } } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } },
    ]);

    const topClients = await Payment.aggregate([
      { $match: { user: uid, paymentDate: { $gte: start, $lte: end }, status: 'completed' } },
      { $group: { _id: '$client', totalPaid: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { totalPaid: -1 } }, { $limit: 5 },
      { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'client' } },
      { $unwind: '$client' },
    ]);

    const paymentMethods = await Payment.aggregate([
      { $match: { user: uid, paymentDate: { $gte: start, $lte: end }, status: 'completed' } },
      { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        year, totalRevenue, totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        revenueByMonth, expenseByMonth,
        statusBreakdown, topClients, paymentMethods,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
