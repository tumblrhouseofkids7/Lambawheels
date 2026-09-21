const IncomingArticle = require('../models/IncomingArticle');

exports.createArticle = async (req, res) => {
  try {
    const { date, billNo, particulars, weight, unitCost, purchasedFrom, sgst, cgst, totalCost } = req.body;
    const article = new IncomingArticle({
      date,
      billNo,
      particulars,
      weight,
      unitCost,
      purchasedFrom,
      sgst,
      cgst,
      totalCost,
      createdBy: req.user._id
    });
    const savedArticle = await article.save();
    res.status(201).json(savedArticle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getArticles = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      // Set to end of day if endDate is provided
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      } else if (startDate) {
        // If only start date, treat it as a single day
        const end = new Date(startDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }
    const articles = await IncomingArticle.find(query).sort({ date: -1 });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSuggestions = async (req, res) => {
  try {
    const particulars = await IncomingArticle.distinct('particulars');
    const purchasedFrom = await IncomingArticle.distinct('purchasedFrom');
    res.json({ particulars, purchasedFrom });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
