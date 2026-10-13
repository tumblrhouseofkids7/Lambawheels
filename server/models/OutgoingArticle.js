const mongoose = require('mongoose');

const goodsDetailSchema = new mongoose.Schema({
  description: { type: String, required: true },
  hsnCode: { type: String, required: true },
  qty: { type: Number, required: true },
  uom: { type: String, default: 'PCS' },
  rate: { type: Number, required: true },
  taxableValue: { type: Number, default: 0 },
  cgstRate: { type: Number, default: 0 },
  cgstAmt: { type: Number, default: 0 },
  sgstRate: { type: Number, default: 0 },
  sgstAmt: { type: Number, default: 0 },
  amount: { type: Number, default: 0 }
});

const outgoingArticleSchema = new mongoose.Schema({
  invoiceDetails: {
    invoiceDate: { type: Date, required: true },
    invoiceNo: { type: String, required: true },
    state: { type: String, required: true },
    stateCode: { type: String, required: true },
    vehicleNumber: { type: String }
  },
  buyerDetails: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    stateCode: { type: String, required: true },
    gstin: { type: String },
    email: { type: String }
  },
  consigneeDetails: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    stateCode: { type: String, required: true },
    gstin: { type: String },
    email: { type: String }
  },
  goodsDetails: [goodsDetailSchema],
  totalTaxableAmount: { type: Number, default: 0 },
  cgstRate: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstRate: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('OutgoingArticle', outgoingArticleSchema);
