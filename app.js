const express = require('express');
const connectToDatabase = require('./data/database');
const routes = require('./routes/routes'); 
const cookieParser = require('cookie-parser'); 
const path = require('path');

const app = express();
 
// Set up middleware
app.use(express.static(path.join(__dirname, 'public'))); 
app.use(express.urlencoded({ extended: true })); 
app.use(express.json()); 
app.use(cookieParser()); 
app.set('view engine', 'ejs'); 

// Define routes
app.use('/', routes); 

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
