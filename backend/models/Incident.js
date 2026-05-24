const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add an incident title'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'POS Issue',
      'Delivery Delay',
      'Inventory',
      'Kitchen Equipment',
      'Customer Complaint',
      'Other'
    ]
  },
  description: {
    type: String,
    required: [true, 'Please add a description of the incident'],
    trim: true
  },
  storeLocation: {
    type: String,
    required: [true, 'Please specify the store/restaurant location'],
    trim: true
  },
  severity: {
    type: String,
    required: [true, 'Please specify the severity level'],
    enum: ['Low', 'Medium', 'High', 'Critical']
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  dateTime: {
    type: Date,
    required: [true, 'Please select the date and time of the incident'],
    default: Date.now
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  managerNotes: {
    type: String,
    default: ''
  },
  managerName: {
    type: String,
    default: ''
  },
  managerStore: {
    type: String,
    default: ''
  },
  resolutionActions: {
    type: [String],
    default: []
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  image: {
    type: String,
    default: ''
  },
  aiSolution: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Incident', IncidentSchema);
