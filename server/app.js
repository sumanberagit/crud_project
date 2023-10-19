
const express = require('express');
const mongoose = require('mongoose');
const stripe = require('stripe')('sk_test_51NzZbaSIMIvEw1NGmEpnRyEIcAsMcJolRsVfg6eNadL0uRWldsPyf63trWrWbWwySMw3xdqwr3LnVmuTvMVEitGI00td85yKSs'); // Replace with your Stripe secret key
const bodyParser = require('body-parser');
const Package = require('./models/Package');

const app = express();
app.use(bodyParser.json());

// Connect to MongoDB (make sure your MongoDB server is running)
const mongoURI = "mongodb://0.0.0.0:27017/Stripe-payment";
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB!');
});

// Create a new package
app.post('/packages', async (req, res) => {
    try {
        const package = new Package(req.body);
        await package.save();
        res.status(201).send(package);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Get all packages
app.get('/packages', async (req, res) => {
    try {
        const packages = await Package.find();

        res.send(packages);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Get package by ID
app.get('/packages/:id', async (req, res) => {
    try {
        const package = await Package.findById(req.params.id);
        if (!package) {
            return res.status(404).send('Package not found');
        }
        res.send(package);
    } catch (error) { 
        res.status(500).send(error);
    }
});


// Update package by ID
app.put('/packages/:id', async (req, res) => {
    try {
        const package = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!package) {
            return res.status(404).send('Package not found');
        }
        res.send(package);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Delete package by ID
app.delete('/packages/:id', async (req, res) => {
    try {
        const package = await Package.findByIdAndDelete(req.params.id);
        if (!package) {
            return res.status(404).send('Package not found');
        }
        res.send(package);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Payment endpoint
app.post('/purchase', async (req, res) => {
    const { packageId, token } = req.body;

    try {
        const selectedPackage = await Package.findById(packageId);
        if (!selectedPackage) {
            return res.status(404).send('Package not found');
        }
 
        const amount = selectedPackage.price * 100; // Amount in cents
        const charge = await stripe.charges.create({
            amount: amount,
            currency: 'inr',
            description: 'Stripe Payment for ' + selectedPackage.name,
            source: token.id
        });

        // Handle successful payment, e.g., mark the package as purchased for the user
        // You can add logic here to store the payment status in your database

        res.status(200).send('Payment successful');
    } catch (error) {
        console.error(error);
        res.status(500).send('Payment failed');
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
