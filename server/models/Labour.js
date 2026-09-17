const mongoose = require('mongoose');

const labourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  role: {
    type: String,
    default: 'Labour'
  },
  labourType: {
    type: String,
    enum: ['Simple', '4 Die', '6 Die', 'Molding'],
    default: 'Simple'  // 'Simple' = no type/default, others = upgraded labour
  },
  assignedForeman: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  basicSalary: {
    type: Number,
    default: 0
  },
  image: {
    type: String, // Cloudinary URL
    default: ''
  },
  public_id: {
    type: String, // Cloudinary public ID for deletion
    default: ''
  },
  dispatchRate: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const Labour = mongoose.model('Labour', labourSchema);
module.exports = Labour;
