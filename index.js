const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const axios = require('axios');
const FormData = require('form-data');
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

// Route to handle image uploads
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Process the image
    const processedImage = await sharp(req.file.buffer).toBuffer();

    // Call Plant.id API
    const result = await callPlantIdAPI(processedImage);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    // Example response object based on API output
    const response = {
      plantName: result.plantName || 'Unknown',
      disease: result.disease || 'Unknown',
      confidence: result.confidence || 'N/A',
      additionalInfo: result.additionalInfo || 'No additional info available'
    };

    res.json(response);
  } catch (error) {
    console.error('Error processing image:', error.message || error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Function to call Plant.id API v3
const callPlantIdAPI = async (imageBuffer) => {
  try {
    const apiEndpoint = 'https://api.plant.id/v3/plant-identification'; // Updated endpoint
    const apiKey = 'nIHfGmmzcYS5oKoGUb1i2GxAXcYUX0UsNjutoqp4srCed3yI0d'; // Replace with your actual API key

    const formData = new FormData();
    formData.append('images', imageBuffer, { filename: 'image.png' });

    const response = await axios.post(apiEndpoint, formData, {
      headers: {
        ...formData.getHeaders(),
        'Api-Key': apiKey
      }
    });

    // Check if response is successful
    if (response.status !== 200) {
      throw new Error(`API returned status code ${response.status}`);
    }

    // Process API response
    const data = response.data;
    if (!data || data.error) {
      throw new Error(data.error || 'Unknown error');
    }

    return {
      plantName: data.suggestions[0]?.plant_name || 'Unknown',
      disease: data.suggestions[0]?.disease || 'Unknown',
      confidence: data.suggestions[0]?.confidence || 'N/A',
      additionalInfo: data.suggestions[0]?.additional_info || 'No additional info available'
    };
  } catch (error) {
    console.error('Error calling Plant.id API:', error.message || error);
    return { error: 'Error calling Plant.id API' };
  }
};

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
