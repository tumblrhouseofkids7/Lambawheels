const Labour = require('../models/Labour');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// @desc    Get all labours (foreman sees their assigned, admin/accountant sees all)
// @route   GET /api/labours
// @access  Private
const getLabours = async (req, res) => {
  try {
    let query = {};
    // Removed restriction: Foremen now see all labours
    
    const labours = await Labour.find(query).populate('assignedForeman', 'name email');
    res.json(labours);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new labour
// @route   POST /api/labours
// @access  Private (Superadmin, Foreman)
const createLabour = async (req, res) => {
  try {
    const { name, gender, role, labourType, assignedForeman, basicSalary } = req.body;
    let imageUrl = '';
    let public_id = '';

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'lamba_wheels/labours',
      });
      imageUrl = result.secure_url;
      public_id = result.public_id;
      // Remove file from local uploads
      fs.unlinkSync(req.file.path);
    }

    const finalRole = role || 'Labour';
    // labourType only applies to Labour role; Thakdar has no sub-type
    const finalLabourType = finalRole === 'Labour' ? (labourType || 'Simple') : 'Simple';

    const labour = new Labour({
      name,
      gender,
      role: finalRole,
      labourType: finalLabourType,
      basicSalary: basicSalary || 0,
      assignedForeman: assignedForeman || req.user._id,
      image: imageUrl,
      public_id: public_id
    });

    const createdLabour = await labour.save();
    res.status(201).json(createdLabour);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete labour
// @route   DELETE /api/labours/:id
// @access  Private (Superadmin)
const deleteLabour = async (req, res) => {
  try {
    const labour = await Labour.findById(req.params.id);
    if (!labour) {
      return res.status(404).json({ message: 'Labour not found' });
    }

    if (labour.public_id) {
      await cloudinary.uploader.destroy(labour.public_id);
    }

    await labour.deleteOne();
    res.json({ message: 'Labour removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Update labour
// @route   PUT /api/labours/:id
// @access  Private (Superadmin, Foreman)
const updateLabour = async (req, res) => {
  try {
    const labour = await Labour.findById(req.params.id);
    if (!labour) {
      return res.status(404).json({ message: 'Labour not found' });
    }

    const { name, gender, role, labourType, basicSalary } = req.body;
    if (name) labour.name = name;
    if (gender) labour.gender = gender;
    if (role !== undefined) labour.role = role;
    if (basicSalary !== undefined) labour.basicSalary = basicSalary;

    // Only set labourType when role is Labour; clear it for Thakdar
    const finalRole = role !== undefined ? role : labour.role;
    if (finalRole === 'Labour') {
      labour.labourType = labourType || 'Simple';
    } else {
      labour.labourType = 'Simple';
    }

    const updatedLabour = await labour.save();
    res.json(updatedLabour);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getLabours, createLabour, deleteLabour, updateLabour };
