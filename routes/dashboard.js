const express = require('express');
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.use(protect);

router.get('/stats', async (req, res) => {
  try {
    const uid = req.user._id;
    const now = new Date();
    const yrStart = new Date(now.getFullYear(), 0, 1);
    const moStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMoStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMoEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [invStats] = await Invoice.aggregate([
      { $match: { user: uid } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        paid: { $sum: { $cond: [{ $eq: ['$status','paid'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $in: ['$status',['pending','sent']] }, 1, 0] } },
        overdue: { $sum: { $cond: [{ $eq: ['$status','overdue'] }, 1, 0] } },
        draft: { $sum: { $cond: [{ $eq: ['$status','draft'] }, 1, 0] } },
        totalRevenue: { $sum: { $cond: [{ $eq: ['$status','paid'] }, '$totalAmount', 0] } },
        pendingAmt: { $sum: { $cond: [{ $in: ['$status',['pending','sent']] }, '$balanceDue', 0] } },
        overdueAmt: { $sum: { $cond: [{ $eq: ['$status','overdue'] }, '$balanceDue', 0] } },
      }},
    ]);

    const [currMo] = await Payment.aggregate([
      { $match: { user: uid, paymentDate: { $gte: moStart }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const [lastMo] = await Payment.aggregate([
      { $match: { user: uid, paymentDate: { $gte: lastMoStart, $lte: lastMoEnd }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const monthlyData = await Payment.aggregate([
      { $match: { user: uid, paymentDate: { $gte: yrStart }, status: 'completed' } },
      { $group: { _id: { month: { $month: '$paymentDate' } }, total: { $sum: '$amount' } } },
      { $sort: { '_id.month': 1 } },
    ]);
    const revenueByMonth = Array(12).fill(0);
    monthlyData.forEach(m => { revenueByMonth[m._id.month - 1] = m.total; });

    const expMonthly = await Expense.aggregate([
      { $match: { user: uid, date: { $gte: yrStart } } },
      { $group: { _id: { month: { $month: '$date' } }, total: { $sum: '$amount' } } },
    ]);
    const expByMonth = Array(12).fill(0);
    expMonthly.forEach(m => { expByMonth[m._id.month - 1] = m.total; });

    const totalClients = await Client.countDocuments({ user: uid });
    const activeClients = await Client.countDocuments({ user: uid, status: 'active' });

    const recentInvoices = await Invoice.find({ user: uid })
      .populate('client', 'name company color')
      .sort({ createdAt: -1 }).limit(8);

    const recentPayments = await Payment.find({ user: uid })
      .populate('client', 'name company color')
      .populate('invoice', 'invoiceNumber')
      .sort({ paymentDate: -1 }).limit(6);

    const curr = currMo?.total || 0;
    const last = lastMo?.total || 0;
    const growth = last > 0 ? (((curr - last) / last) * 100).toFixed(1) : 0;

    // Status breakdown for chart
    const statusBreakdown = await Invoice.aggregate([
      { $match: { user: uid } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } },
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue: invStats?.totalRevenue || 0,
        totalInvoices: invStats?.total || 0,
        paidInvoices: invStats?.paid || 0,
        pendingInvoices: invStats?.pending || 0,
        overdueInvoices: invStats?.overdue || 0,
        draftInvoices: invStats?.draft || 0,
        pendingAmount: invStats?.pendingAmt || 0,
        overdueAmount: invStats?.overdueAmt || 0,
        totalClients, activeClients,
        currentMonthRevenue: curr,
        lastMonthRevenue: last,
        revenueGrowth: Number(growth),
        revenueByMonth,
        expByMonth,
        recentInvoices,
        recentPayments,
        statusBreakdown,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
