const User = require('../models/User');
const Labour = require('../models/Labour');
const Dispatch = require('../models/Dispatch');

// @desc    Get all users (excluding current superadmin)
// @route   GET /api/users
// @access  Private/Superadmin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all foremen (Thakadars)
// @route   GET /api/users/foremen
// @access  Private (accountant, superadmin)
const getForemen = async (req, res) => {
  try {
    const foremen = await User.find({ role: 'foreman' }).select('name email phone profilePic');
    res.json(foremen);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new system user
// @route   POST /api/users
// @access  Private/Superadmin
const createUser = async (req, res) => {
  try {
    const { name, email, role, phone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      phone,
      role: role || 'pending'
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Superadmin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Superadmin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
      if (req.body.phone !== undefined) {
        user.phone = req.body.phone;
      }

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        googleId: updatedUser.googleId,
        profilePic: updatedUser.profilePic,
        createdAt: updatedUser.createdAt,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user own profile (pending -> foreman profile setup)
// @route   PUT /api/users/profile
// @access  Private (Any authenticated user)
const updateOwnProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (req.body.phone !== undefined) {
        user.phone = req.body.phone;
      }
      if (req.body.name !== undefined) {
        user.name = req.body.name;
      }
      
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/profile/pic
// @access  Private (Any authenticated user)
const uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const cloudinary = require('../config/cloudinary');
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'foreman-profiles',
      width: 400,
      height: 400,
      crop: 'fill',
      gravity: 'face',
    });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.profilePic = result.secure_url;
    await user.save();

    // Clean up temp file
    const fs = require('fs');
    fs.unlink(req.file.path, () => {});

    res.json({ profilePic: result.secure_url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard statistics (superadmin)
// @route   GET /api/users/dashboard-stats?date=YYYY-MM-DD
// @access  Private/Superadmin
const getDashboardStats = async (req, res) => {
  try {
    const { date } = req.query; // optional date filter for recent dispatches

    // -- Users by role --
    const allUsers = await User.find({}).select('name email phone role profilePic googleId createdAt').lean();
    const accountants = allUsers.filter(u => u.role === 'accountant');
    const foremen     = allUsers.filter(u => u.role === 'foreman');
    const pending     = allUsers.filter(u => u.role === 'pending');

    // -- Labours: case-insensitive role match --
    const allLabours = await Labour
      .find({})
      .populate('assignedForeman', 'name email profilePic')
      .lean();

    const normaliseRole = (r) => (r || 'Labour').trim().toLowerCase();
    const labours   = allLabours.filter(l => normaliseRole(l.role) === 'labour');
    const thakadars = allLabours.filter(l => normaliseRole(l.role) === 'thakadar' || normaliseRole(l.role) === 'thakdar');

    // -- All dispatches (sorted by DB) --
    const allDispatches = await Dispatch.find({}).sort({ createdAt: -1 }).lean();

    // -- Dispatch production total --
    const totalDispatchProduction = allDispatches.reduce((sum, d) => {
      return sum + (d.entries || []).reduce((s, e) => s + (Number(e.quantity) || 0), 0);
    }, 0);

    // -- Recent dispatches (filtered by date if given, else last 10) --
    let filteredDispatches = allDispatches;
    if (date) {
      filteredDispatches = allDispatches.filter(d => d.date === date);
    }
    const recentDispatches = filteredDispatches.slice(0, 10).map(d => ({
      _id: d._id,
      productName: d.productName,
      foremanName: d.foremanName || '',
      foremanId: d.foremanId,
      date: d.date,
      shift: d.shift,
      targetQty: d.targetQty || 0,
      totalProduced: (d.entries || []).reduce((s, e) => s + (Number(e.quantity) || 0), 0),
      isSubmitted: d.isSubmitted,
    }));

    // -- Date-scoped counts (only populated when date is given) --
    let dateCounts = null;
    if (date) {
      const dateProduction = filteredDispatches.reduce((sum, d) =>
        sum + (d.entries || []).reduce((s, e) => s + (Number(e.quantity) || 0), 0), 0);
      const activeforemanIds = new Set(filteredDispatches.map(d => d.foremanId?.toString()).filter(Boolean));
      // unique labours who produced something on this date
      const activeLabourNames = new Set();
      filteredDispatches.forEach(d => (d.entries || []).forEach(e => { if (e.labourName) activeLabourNames.add(e.labourName); }));
      dateCounts = {
        dispatchSheets: filteredDispatches.length,
        dispatchProduction: dateProduction,
        activeForemen: activeforemanIds.size,
        activeLabours: activeLabourNames.size,
      };
    }

    // -- Assignment map: foreman -> their labours --
    const foremanLabourMap = {};
    allLabours.forEach(l => {
      const fId = l.assignedForeman?._id?.toString() || l.assignedForeman?.toString();
      if (!fId) return;
      if (!foremanLabourMap[fId]) foremanLabourMap[fId] = [];
      foremanLabourMap[fId].push({
        _id: l._id,
        name: l.name,
        role: (l.role || 'Labour').trim(),
        gender: l.gender,
        image: l.image,
      });
    });

    // -- Build per-foreman summary with their dispatch production --
    const foremanStats = foremen.map(f => {
      const fId = f._id.toString();
      const myLabours = foremanLabourMap[fId] || [];
      const myDispatches = allDispatches.filter(d => d.foremanId?.toString() === fId);
      const myProduction = myDispatches.reduce((s, d) =>
        s + (d.entries || []).reduce((ss, e) => ss + (Number(e.quantity) || 0), 0), 0);
      return {
        ...f,
        labours: myLabours,
        totalLabours:   myLabours.filter(l => normaliseRole(l.role) === 'labour').length,
        totalThakadars: myLabours.filter(l => normaliseRole(l.role) === 'thakadar' || normaliseRole(l.role) === 'thakdar').length,
        totalProduction: myProduction,
      };
    });

    // -- Available dispatch dates (for frontend date picker hints) --
    const dispatchDates = [...new Set(allDispatches.map(d => d.date).filter(Boolean))].sort().reverse();

    res.json({
      counts: {
        totalLabours: labours.length,
        totalThakadars: thakadars.length,
        totalForemen: foremen.length,
        totalAccountants: accountants.length,
        totalPending: pending.length,
        totalDispatchProduction,
      },
      accountants,
      foremenStats: foremanStats,
      recentDispatches,
      thakadars,
      dispatchDates,
      selectedDate: date || null,
      dateCounts,  // null when no date selected; has dispatchSheets/dispatchProduction/activeForemen/activeLabours when date given
    });
  } catch (error) {
    console.error('[getDashboardStats ERROR]', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getForemen,
  getDashboardStats,
  createUser,
  deleteUser,
  updateUser,
  updateOwnProfile,
  uploadProfilePic,
};
