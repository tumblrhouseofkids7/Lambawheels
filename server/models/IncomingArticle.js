const mongoose = require('mongoose');

const incomingArticleSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  billNo: { type: String, required: true },
  particulars: { type: String, required: true },
  weight: { type: Number, required: true },
  unitCost: { type: Number, required: true },
  purchasedFrom: { type: String, required: true },
  sgst: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  totalCost: { type: Number, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('IncomingArticle', incomingArticleSchema);
