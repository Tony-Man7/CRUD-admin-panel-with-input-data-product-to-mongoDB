const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../model/admins'); 
const authenticateToken = require('../middleware/auth'); 
const upload = require('../middleware/upload'); 
const Product = require('../model/product'); 


// Display login form
router.get('/', (req, res) => {
    res.render('home'); 
});

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if email already exists in the database
        const existingAdmin = await Admin.findOne({ email: email });
        if (existingAdmin) {
            return res.render('register', { errorMessage: 'Email already exists' });
        }

        // Validate the password
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.render('register', { errorMessage: 'Password must be at least 6 characters long and contain at least one uppercase and one lowercase letter' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new admin document
        const newAdmin = new Admin({
            name: name,
            email: email,
            password: hashedPassword
        });

        // Save the new admin document to the database
        await newAdmin.save();
        console.log('Admin registered successfully');

        // Redirect to a success page or login page
        res.redirect('/login');
    } catch (error) {
        console.error('Error registering admin:', error);
        res.render('register', { errorMessage: 'Server error' });
    }
});

// Display registration form
router.get('/register', (req, res) => {
    res.render('register'); 
});

// Display login form
router.get('/login', (req, res) => {
    res.render('login'); 
});

// Display table form
router.get('/table', (req, res) => {
    res.render('table'); 
});

// Product form and list
// also pagination
router.get('/product-form', authenticateToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select('-password');
        if (!admin) {
            return res.status(404).send('Admin not found');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        // Fetch products with pagination
        const products = await Product.find().skip(skip).limit(limit);
        const totalProducts = await Product.countDocuments(); 

        res.render('product-form', {
            admin,
            products,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            limit
        });
    } catch (error) {
        console.error('Error fetching admin or products:', error);
        res.status(500).send('Server error');
    }
});


// Handle login form submission
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the admin exists in the database
        const admin = await Admin.findOne({ email: email });
        if (!admin) {
            return res.render('login', { errorMessage: 'Admin not found' });
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.render('login', { errorMessage: 'Invalid password' });
        }

        // Issue JWT token
        const payload = {
            admin: {
                id: admin.id
            }
        };

        const jwtSecret = process.env.JWT_SECRET || "4715aed3c946f7b0a38e6b534a9583628d84e96d10fbc04700770d572af3dce43625dd";
        jwt.sign(payload, jwtSecret, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.cookie('token', token, { httpOnly: true }); // Set cookie with JWT token
            res.redirect('/dashboard');
        });

    } catch (error) {
        console.error('Error logging in admin:', error);
        res.render('login', { errorMessage: 'Server error' });
    }
});

// POST route to handle profile updates
router.post('/profile', authenticateToken, upload.single('picture'), async (req, res) => {
    try {
        const { name, bio } = req.body;
        const picture = req.file ? '/images/' + req.file.filename : null; // Construct path to store in database

        // Find the admin by ID and update the fields
        const updatedFields = { name, bio };
        if (picture) {
            updatedFields.picture = picture;
        }

        const admin = await Admin.findByIdAndUpdate(req.admin.id, updatedFields, { new: true });

        if (!admin) {
            return res.status(404).send('Admin not found');
        }

        res.render('profile', { admin, successMessage: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating admin profile:', error);
        res.status(500).send('Server error');
    }
});

router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select('-password');
        if (!admin) {
            return res.status(404).send('Admin not found');
        }
        res.render('profile', { admin });
    } catch (error) {
        console.error('Error fetching admin:', error);
        res.status(500).send('Server error');
    }
});


// Delete a product by ID
router.post('/delete-product/:id', authenticateToken, async (req, res) => {
    try {
        // Find the product by ID and remove it
        await Product.findByIdAndDelete(req.params.id);

        console.log('Product deleted successfully');
        res.redirect('/product-form');
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).send('Server error');
    }
});


// Handle the form submission
// POST route to handle product update
router.post('/update-product/:id', authenticateToken, upload.single('image'), async (req, res) => {
    const { name, price, description, category } = req.body;
    const image = req.file ? '/images/' + req.file.filename : null; // Adjust the path as needed

    try {
        // Validate input
        if (!name || !price || !description || !category) {
            return res.redirect(`/edit-product/${req.params.id}?error=All fields are required`);
        }

        // Update the product document
        const updatedFields = { name, price, description, category };
        if (image) {
            updatedFields.image = image;
        }

        const product = await Product.findByIdAndUpdate(req.params.id, updatedFields, { new: true });
        if (!product) {
            return res.status(404).send('Product not found');
        }

        console.log('Product updated successfully');
        res.redirect('/product-form'); // Redirect to the product form or list
    } catch (error) {
        console.error('Error updating product:', error);
        res.redirect(`/edit-product/${req.params.id}?error=Server error`);
    }
});


// GET route to display edit form
router.get('/edit-product/:id', authenticateToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select('-password');
        if (!admin) {
            return res.status(404).send('Admin not found');
        }

        // Find the product by ID
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        res.render('edit-product', { admin, product });
    } catch (error) {
        console.error('Error fetching product or admin:', error);
        res.status(500).send('Server error');
    }
});


router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select('-password');
        if (!admin) {
            return res.status(404).send('Admin not found');
        }
        res.render('dashboard', { admin });
    } catch (error) {
        console.error('Error fetching admin:', error);
        res.status(500).send('Server error');
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie('token'); // Clear the token cookie
    res.redirect('/login'); // Redirect to login page after logout
});

module.exports = router;
