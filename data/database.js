const mongoose = require('mongoose');
const Admin = require('../model/admins'); // Adjust the path as needed

// MongoDB connection URI
const uri = 'mongodb+srv://manansalaant7:r3yNDzmOBR0zNdTj@cluster0.oxvhutr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB using Mongoose
async function connectToDatabase() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected successfully to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
  }
}

async function addAdmin(name, email, password, picture, bio) {
  try {
    // Create a new admin document
    const newAdmin = new Admin({
      name: name,
      email: email,
      password: password,
      picture: picture,
      bio: bio
    });

    // Save the new admin document to the database
    await newAdmin.save();
    console.log('Admin saved successfully');
  } catch (err) {
    console.error('Error saving admin:', err);
    throw err; // Propagate the error
  }
}

module.exports = addAdmin;
connectToDatabase();