const mongoose = require('mongoose');

// Define the admin schema
const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true // Ensures email is unique in the database
  },
  password: {
    type: String,
    required: true
  },
  picture: {
    type: String, // Assuming picture will be stored as a URL
    required: false // Not required, adjust as needed
  },
  bio: {
    type: String,
    required: false // Not required, adjust as needed
  }
});

// Create a model based on the schema
const Admin = mongoose.model('Admin', adminSchema);

// Export the model to use it in other parts of the application
module.exports = Admin;