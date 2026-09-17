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
    const articles = await IncomingArticle.find().sort({ date: -1 });
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
