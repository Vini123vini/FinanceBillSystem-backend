require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Expense = require('../models/Expense');

const COLORS = ['#7C6FFF','#10B981','#3B82F6','#F59E0B','#F43F5E','#A855F7','#06B6D4','#84CC16'];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kanakku');
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([User.deleteMany({}), Client.deleteMany({}), Invoice.deleteMany({}), Payment.deleteMany({}), Product.deleteMany({}), Expense.deleteMany({})]);
  console.log('Cleared old data');

  // Create demo user
  const user = await User.create({
    name: 'Arjun Sharma',
    email: 'admin@kanakku.in',
    password: 'password123',
    phone: '+91 98765 43210',
    business: {
      name: 'Sharma Tech Solutions Pvt. Ltd.',
      address: '42, Whitefield Industrial Area',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560066',
      country: 'India',
      gstin: '29AAFCS1234A1Z5',
    },
    invoiceSettings: { prefix: 'INV', nextNumber: 12, defaultDueDays: 30, defaultTaxRate: 18, currencySymbol: '₹' },
  });

  // Create clients
  const clientData = [
    { name:'Priya Mehta', company:'Mehta & Associates', email:'priya@mehta.co.in', phone:'+91 98111 22334', city:'Mumbai', state:'Maharashtra', gstin:'27AADCM5678B1Z3' },
    { name:'Rajesh Kumar', company:'Kumar Exports', email:'raj@kumarexports.com', phone:'+91 97222 11445', city:'Delhi', state:'Delhi', gstin:'07AADCK4321C1Z8' },
    { name:'Sunita Patel', company:'Patel Industries', email:'sunita@patelindustries.com', phone:'+91 96333 44556', city:'Ahmedabad', state:'Gujarat', gstin:'24AADCP8765D1Z2' },
    { name:'Kiran Reddy', company:'Reddy Tech', email:'kiran@reddytech.io', phone:'+91 95444 55667', city:'Hyderabad', state:'Telangana', gstin:'36AAACR3456E1Z6' },
    { name:'Ananya Singh', company:'Singh Consulting', email:'ananya@singhco.in', phone:'+91 94555 66778', city:'Kolkata', state:'West Bengal', gstin:'19AAACS7890F1Z1' },
    { name:'Vivek Nair', company:'Nair Digital', email:'vivek@nairdigital.com', phone:'+91 93666 77889', city:'Chennai', state:'Tamil Nadu', gstin:'33AAACN2345G1Z9' },
    { name:'Deepa Joshi', company:'Joshi & Co.', email:'deepa@joshico.com', phone:'+91 92777 88990', city:'Pune', state:'Maharashtra', gstin:'27AAADJ6789H1Z4' },
    { name:'Amit Verma', company:'Verma Enterprises', email:'amit@vermaent.com', phone:'+91 91888 99001', city:'Jaipur', state:'Rajasthan', gstin:'08AAADV1234I1Z7' },
  ];
  const clients = await Client.create(clientData.map((c, i) => ({ ...c, user: user._id, status:'active', color: COLORS[i] })));

  // Create products
  await Product.create([
    { user: user._id, name: 'Web Development', type: 'service', category: 'development', rate: 75000, unit: 'project', taxRate: 18, description: 'Full-stack web application development', status: 'active' },
    { user: user._id, name: 'Mobile App Development', type: 'service', category: 'development', rate: 120000, unit: 'project', taxRate: 18, description: 'iOS and Android app development', status: 'active' },
    { user: user._id, name: 'UI/UX Design', type: 'service', category: 'design', rate: 45000, unit: 'project', taxRate: 18, description: 'User interface and experience design', status: 'active' },
    { user: user._id, name: 'SEO Services', type: 'service', category: 'marketing', rate: 15000, unit: 'month', taxRate: 18, description: 'Search engine optimization', status: 'active' },
    { user: user._id, name: 'Cloud Hosting', type: 'service', category: 'infrastructure', rate: 8000, unit: 'month', taxRate: 18, description: 'AWS / GCP cloud hosting services', status: 'active' },
    { user: user._id, name: 'Tech Consultation', type: 'service', category: 'consulting', rate: 5000, unit: 'hour', taxRate: 18, description: 'Technical architecture consultation', status: 'active' },
    { user: user._id, name: 'Annual Maintenance Contract', type: 'service', category: 'support', rate: 60000, unit: 'year', taxRate: 18, description: 'AMC for software products', status: 'active' },
    { user: user._id, name: 'Data Analytics Dashboard', type: 'service', category: 'development', rate: 95000, unit: 'project', taxRate: 18, description: 'Custom analytics dashboards', status: 'active' },
  ]);

  // Create invoices (past 6 months)
  const invoiceData = [];
  const now = new Date();
  const invoiceDefs = [
    { client: 0, items:[{d:'Web Development',q:1,r:75000,t:18},{d:'UI/UX Design',q:1,r:45000,t:18}], status:'paid', monthsAgo:5 },
    { client: 1, items:[{d:'Mobile App Development',q:1,r:120000,t:18}], status:'paid', monthsAgo:4 },
    { client: 2, items:[{d:'SEO Services',q:3,r:15000,t:18},{d:'Cloud Hosting',q:3,r:8000,t:18}], status:'paid', monthsAgo:4 },
    { client: 3, items:[{d:'Tech Consultation',q:10,r:5000,t:18}], status:'paid', monthsAgo:3 },
    { client: 4, items:[{d:'Data Analytics Dashboard',q:1,r:95000,t:18}], status:'pending', monthsAgo:2 },
    { client: 5, items:[{d:'Annual Maintenance Contract',q:1,r:60000,t:18}], status:'sent', monthsAgo:2 },
    { client: 6, items:[{d:'Web Development',q:1,r:75000,t:18},{d:'Cloud Hosting',q:6,r:8000,t:18}], status:'overdue', monthsAgo:3 },
    { client: 7, items:[{d:'UI/UX Design',q:1,r:45000,t:18},{d:'SEO Services',q:2,r:15000,t:18}], status:'draft', monthsAgo:0 },
    { client: 0, items:[{d:'Mobile App Development',q:1,r:120000,t:18},{d:'Cloud Hosting',q:3,r:8000,t:18}], status:'paid', monthsAgo:2 },
    { client: 1, items:[{d:'Annual Maintenance Contract',q:1,r:60000,t:18}], status:'pending', monthsAgo:1 },
    { client: 2, items:[{d:'Tech Consultation',q:20,r:5000,t:18}], status:'paid', monthsAgo:1 },
  ];

  const invoices = [];
  for (let i = 0; i < invoiceDefs.length; i++) {
    const def = invoiceDefs[i];
    const issueDate = new Date(now.getFullYear(), now.getMonth() - def.monthsAgo, Math.floor(Math.random()*20)+1);
    const dueDate = new Date(issueDate); dueDate.setDate(dueDate.getDate() + 30);
    const lineItems = def.items.map(it => ({ description: it.d, quantity: it.q, rate: it.r, taxRate: it.t }));
    const inv = new Invoice({
      user: user._id, client: clients[def.client]._id,
      invoiceNumber: `INV-${String(i+1).padStart(4,'0')}`,
      status: def.status, issueDate, dueDate, lineItems,
      notes: 'Thank you for your business. Payment due within 30 days.',
    });
    await inv.save();
    invoices.push(inv);
  }

  // Create payments for paid invoices
  const paidMethods = ['upi','neft','bank_transfer','cheque','card'];
  for (const inv of invoices) {
    if (inv.status === 'paid') {
      const payment = await Payment.create({
        user: user._id, invoice: inv._id, client: inv.client,
        amount: inv.totalAmount,
        paymentDate: new Date(inv.issueDate.getTime() + Math.random()*15*86400000),
        paymentMethod: paidMethods[Math.floor(Math.random()*paidMethods.length)],
        referenceNumber: `TXN${Date.now()}${Math.floor(Math.random()*1000)}`,
        status: 'completed',
      });
      inv.amountPaid = inv.totalAmount;
      inv.balanceDue = 0;
      await inv.save();
    }
  }

  // Create expenses
  await Expense.create([
    { user: user._id, title:'Office Rent', category:'office', amount:45000, date:new Date(now.getFullYear(), now.getMonth(), 1), paymentMethod:'bank_transfer', vendor:'Prestige Properties' },
    { user: user._id, title:'Team Lunch', category:'office', amount:3200, date:new Date(now.getFullYear(), now.getMonth()-1, 15), paymentMethod:'upi', vendor:'The Diner' },
    { user: user._id, title:'AWS Cloud Services', category:'software', amount:12500, date:new Date(now.getFullYear(), now.getMonth()-1, 5), paymentMethod:'card', vendor:'Amazon Web Services' },
    { user: user._id, title:'Mumbai Client Visit', category:'travel', amount:8750, date:new Date(now.getFullYear(), now.getMonth()-2, 20), paymentMethod:'cash', vendor:'Air India' },
    { user: user._id, title:'Internet & Broadband', category:'utilities', amount:2500, date:new Date(now.getFullYear(), now.getMonth(), 1), paymentMethod:'bank_transfer', vendor:'Airtel Business' },
    { user: user._id, title:'Figma Pro Subscription', category:'software', amount:4800, date:new Date(now.getFullYear(), now.getMonth()-1, 10), paymentMethod:'card', vendor:'Figma Inc.' },
    { user: user._id, title:'GST Filing Fee', category:'taxes', amount:5000, date:new Date(now.getFullYear(), now.getMonth()-2, 25), paymentMethod:'upi', vendor:'CA Pradeep & Associates' },
    { user: user._id, title:'LinkedIn Premium', category:'marketing', amount:2800, date:new Date(now.getFullYear(), now.getMonth()-3, 8), paymentMethod:'card', vendor:'LinkedIn' },
    { user: user._id, title:'Electricity Bill', category:'utilities', amount:3200, date:new Date(now.getFullYear(), now.getMonth()-1, 28), paymentMethod:'upi', vendor:'BESCOM' },
    { user: user._id, title:'Developer Salaries', category:'salaries', amount:320000, date:new Date(now.getFullYear(), now.getMonth(), 1), paymentMethod:'bank_transfer', vendor:'Payroll' },
  ]);

  user.invoiceSettings.nextNumber = invoices.length + 1;
  await user.save();

  console.log('✅  Seed complete!');
  console.log('   Email:    admin@kanakku.in');
  console.log('   Password: password123');
  process.exit(0);
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
