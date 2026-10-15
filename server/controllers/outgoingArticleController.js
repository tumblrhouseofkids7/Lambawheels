const OutgoingArticle = require('../models/OutgoingArticle');

exports.createArticle = async (req, res) => {
  try {
    const { 
      invoiceDetails, 
      buyerDetails, 
      consigneeDetails, 
      goodsDetails, 
      totalTaxableAmount,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      grandTotal 
    } = req.body;
    
    const article = new OutgoingArticle({
      invoiceDetails,
      buyerDetails,
      consigneeDetails,
      goodsDetails,
      totalTaxableAmount,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      grandTotal,
      createdBy: req.user._id
    });
    
    const savedArticle = await article.save();
    return res.status(201).json(savedArticle);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.getArticles = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};
    if (startDate || endDate) {
      query['invoiceDetails.invoiceDate'] = {};
      if (startDate) query['invoiceDetails.invoiceDate'].$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query['invoiceDetails.invoiceDate'].$lte = end;
      } else if (startDate) {
        const end = new Date(startDate);
        end.setHours(23, 59, 59, 999);
        query['invoiceDetails.invoiceDate'].$lte = end;
      }
    }
    const articles = await OutgoingArticle.find(query).sort({ 'invoiceDetails.invoiceDate': -1 });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSuggestions = async (req, res) => {
  try {
    const goods = await OutgoingArticle.distinct('goodsDetails.description');
    const hsn = await OutgoingArticle.distinct('goodsDetails.hsnCode');
    
    const vehicles = await OutgoingArticle.distinct('invoiceDetails.vehicleNumber');
    const buyerNames = await OutgoingArticle.distinct('buyerDetails.name');
    const consigneeNames = await OutgoingArticle.distinct('consigneeDetails.name');
    const addresses = await OutgoingArticle.distinct('buyerDetails.address');
    const cities = await OutgoingArticle.distinct('buyerDetails.city');
    const states = await OutgoingArticle.distinct('buyerDetails.state');
    const stateCodes = await OutgoingArticle.distinct('buyerDetails.stateCode');
    const gstins = await OutgoingArticle.distinct('buyerDetails.gstin');

    const buyers = await OutgoingArticle.aggregate([
      { $match: { 'buyerDetails.name': { $exists: true, $ne: '' } } },
      { $sort: { 'invoiceDetails.invoiceDate': -1, createdAt: -1 } },
      {
        $group: {
          _id: { $toLower: { $trim: { input: '$buyerDetails.name' } } },
          name: { $first: '$buyerDetails.name' },
          address: { $first: '$buyerDetails.address' },
          city: { $first: '$buyerDetails.city' },
          state: { $first: '$buyerDetails.state' },
          stateCode: { $first: '$buyerDetails.stateCode' },
          gstin: { $first: '$buyerDetails.gstin' },
          email: { $first: '$buyerDetails.email' }
        }
      }
    ]);

    const consignees = await OutgoingArticle.aggregate([
      { $match: { 'consigneeDetails.name': { $exists: true, $ne: '' } } },
      { $sort: { 'invoiceDetails.invoiceDate': -1, createdAt: -1 } },
      {
        $group: {
          _id: { $toLower: { $trim: { input: '$consigneeDetails.name' } } },
          name: { $first: '$consigneeDetails.name' },
          address: { $first: '$consigneeDetails.address' },
          city: { $first: '$consigneeDetails.city' },
          state: { $first: '$consigneeDetails.state' },
          stateCode: { $first: '$consigneeDetails.stateCode' },
          gstin: { $first: '$consigneeDetails.gstin' },
          email: { $first: '$consigneeDetails.email' }
        }
      }
    ]);

    res.json({ 
      goods, 
      hsn, 
      vehicles, 
      buyerNames, 
      consigneeNames, 
      addresses, 
      cities, 
      states, 
      stateCodes, 
      gstins,
      buyers,
      consignees
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
