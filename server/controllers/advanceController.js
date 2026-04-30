const Advance = require('../models/Advance');
const Labour = require('../models/Labour');

// @desc    Get all advances
// @route   GET /api/advances
// @access  Private
exports.getAdvances = async (req, res) => {
  try {
    const { labourId, isDeducted, startDate, endDate } = req.query;
    
    let query = {};
    
    if (labourId) query.labour = labourId;
    if (isDeducted !== undefined) query.isDeducted = isDeducted === 'true';
    
    if (startDate && endDate) {
      query.dateGiven = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }

    const advances = await Advance.find(query)
      .populate('labour', 'name role labourType')
      .populate('deductedInSalaryId', 'startDate endDate')
      .sort({ dateGiven: -1 });
      
    res.status(200).json(advances);
  } catch (error) {
    console.error('Error fetching advances:', error);
    res.status(500).json({ message: 'Server error fetching advances' });
  }
};

// @desc    Add an advance
// @route   POST /api/advances
// @access  Private
exports.addAdvance = async (req, res) => {
  try {
    const { labour, amount, dateGiven, note, advanceType } = req.body;
    
    if (!labour || !amount || !dateGiven) {
      return res.status(400).json({ message: 'Please provide labour, amount, and date' });
    }

    const advance = await Advance.create({
      labour,
      amount,
      advanceType: advanceType || 'Current',
      dateGiven,
      note
    });

    const populatedAdvance = await Advance.findById(advance._id).populate('labour', 'name role labourType');

    res.status(201).json(populatedAdvance);
  } catch (error) {
    console.error('Error adding advance:', error);
    res.status(500).json({ message: 'Server error adding advance' });
  }
};

// @desc    Update an advance
// @route   PUT /api/advances/:id
// @access  Private
exports.updateAdvance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const advance = await Advance.findByIdAndUpdate(
      id,
      { $set: req.body },
      { returnDocument: 'after', runValidators: true }
    ).populate('labour', 'name role labourType');

    if (!advance) {
      return res.status(404).json({ message: 'Advance not found' });
    }

    res.status(200).json(advance);
  } catch (error) {
    console.error('Error updating advance:', error);
    res.status(500).json({ message: 'Server error updating advance' });
  }
};

// @desc    Delete an advance
// @route   DELETE /api/advances/:id
// @access  Private
exports.deleteAdvance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const advance = await Advance.findByIdAndDelete(id);

    if (!advance) {
      return res.status(404).json({ message: 'Advance not found' });
    }

    res.status(200).json({ message: 'Advance deleted successfully' });
  } catch (error) {
    console.error('Error deleting advance:', error);
    res.status(500).json({ message: 'Server error deleting advance' });
  }
};
