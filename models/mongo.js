const mongoose = require('mongoose');

// Asynchronous function to handle MongoDB connection
async function connectToDatabase() {
  try {
    const mongodb = await mongoose.connect('mongodb+srv://kenilk677:Ih21PoNJyoLT1QOI@cluster0.lziadv4.mongodb.net/', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Database connected:', mongodb.connection.name); // Logs the name of the connected database
  } catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1); // Exits the process with an error status code
  }
}

// Define schema for a plant
const plantSchema = new mongoose.Schema({
  name: String,
  disease: String,
  image: Buffer
});

// Create model
const Plant = mongoose.model('Plant', plantSchema);

// Function to create a new plant document
async function createPlant() {
  try {
    const plant = new Plant({
      name: 'Test Plant',
      disease: 'Test Disease',
      image: Buffer.from('YOUR_IMAGE_DATA_HERE', 'base64') // Replace with actual Base64 image data
    });

    const savedPlant = await plant.save();
    console.log('Plant saved:', savedPlant);
  } catch (error) {
    console.error('Error saving plant:', error);
  }
}

// Connect to the database and create the plant
connectToDatabase().then(() => {
  createPlant();
});

module.exports = Plant;
