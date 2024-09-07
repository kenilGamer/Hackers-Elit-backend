const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Multer setup for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Invalid file type, only images are allowed!'), false);
    }
    cb(null, true);
  }
});

// Example route to handle image uploads
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Process the image
    const processedImage = await sharp(req.file.buffer).toBuffer();

    // Call Plant.id API
    const result = await callPlantIdAPI(processedImage);

    // Example response object based on API output
    const response = {
      plantName: result.plantName || 'Unknown',
      disease: result.disease || 'Unknown',
      confidence: result.confidence || 'N/A'
    };

    res.json(response);
  } catch (error) {
    console.error('Error processing image:', error.message || error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Function to call Plant.id API
const callPlantIdAPI = async (imageBuffer) => {
  try {
    const apiEndpoint = 'https://api.plant.id/v2/plant-identification';
    const apiKey = 'YOUR_API_KEY'; // Replace with your actual API key

    const formData = new FormData();
    formData.append('images', imageBuffer, { filename: 'image.png' });

    const response = await axios.post(apiEndpoint, formData, {
      headers: {
        ...formData.getHeaders(),
        'Api-Key': apiKey
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error calling Plant.id API:', error.message || error);
    throw new Error('Error calling Plant.id API');
  }
};

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
