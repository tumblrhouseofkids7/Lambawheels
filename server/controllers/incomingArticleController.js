const IncomingArticle = require('../models/IncomingArticle');

exports.createArticle = async (req, res) => {
  try {
    if (req.body.billDetails && req.body.articles && Array.isArray(req.body.articles)) {
      const { billDetails, articles } = req.body;
      const { date, billNo, purchasedFrom, sgst = 0, cgst = 0, igst = 0 } = billDetails;

      const totalArticlesCost = articles.reduce((sum, article) => {
        return sum + (Number(article.weight) * Number(article.unitCost));
      }, 0);

      const newArticles = articles.map(article => {
        const articleCost = Number(article.weight) * Number(article.unitCost);
        const proportion = totalArticlesCost > 0 ? (articleCost / totalArticlesCost) : (1 / articles.length);
        
        const articleSgst = Number(sgst) * proportion;
        const articleCgst = Number(cgst) * proportion;
        const articleIgst = Number(igst) * proportion;
        const totalCost = articleCost + articleSgst + articleCgst + articleIgst;

        return {
          date,
          billNo,
          purchasedFrom,
          particulars: article.particulars,
          weight: Number(article.weight),
          unitCost: Number(article.unitCost),
          sgst: articleSgst,
          cgst: articleCgst,
          igst: articleIgst,
          totalCost: totalCost,
          createdBy: req.user._id
        };
      });

      const savedArticles = await IncomingArticle.insertMany(newArticles);
      return res.status(201).json(savedArticles);
    } else {
      const { date, billNo, particulars, weight, unitCost, purchasedFrom, sgst = 0, cgst = 0, igst = 0, totalCost } = req.body;
      const article = new IncomingArticle({
        date,
        billNo,
        particulars,
        weight,
        unitCost,
        purchasedFrom,
        sgst,
        cgst,
        igst,
        totalCost,
        createdBy: req.user._id
      });
      const savedArticle = await article.save();
      return res.status(201).json(savedArticle);
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
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
