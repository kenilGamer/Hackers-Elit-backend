const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

const app = express();
const port = 5000;

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
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Process the image with Sharp 
  sharp(req.file.buffer).toBuffer((err, processedImage) => {
    if (err) {
      console.error('Error processing image:', err);
      return res.status(500).json({ error: 'Error processing image' });
    }

    // Call Plant.id API
    callPlantIdAPI(processedImage, (apiErr, result) => {
      if (apiErr) {
        console.error('Error calling Plant.id API:', apiErr);
        return res.status(500).json({ error: apiErr.message });
      }

      // Example response object based on API output
      const response = {
        plantName: result.plantName || 'Unknown',
        disease: result.disease || 'Unknown',
        confidence: result.confidence || 'N/A',
        additionalInfo: result.additionalInfo || 'No additional info available'
      };

      res.json(response);
    });
  });
});

// Function to call Plant.id API v3 with callback
const callPlantIdAPI = (imageBuffer, callback) => {
  const apiEndpoint = 'https://api.plant.id/v3/'; // Updated endpoint
  const apiKey = 'nIHfGmmzcYS5oKoGUb1i2GxAXcYUX0UsNjutoqp4srCed3yI0d'; // Replace with your actual API key

  const formData = new FormData();
  formData.append('images', imageBuffer, { filename: 'image.png' });

  axios.post(apiEndpoint, formData, {
    headers: {
      ...formData.getHeaders(),
      'Api-Key': apiKey
    }
  })
  .then(response => {
    if (response.status !== 200) {
      return callback(new Error(`API returned status code ${response.status}`));
    }

    const data = response.data;
    if (!data || data.error) {
      return callback(new Error(data.error || 'Unknown error'));
    }

    callback(null, {
      plantName: data.suggestions[0]?.plant_name || 'Unknown',
      disease: data.suggestions[0]?.disease || 'Unknown',
      confidence: data.suggestions[0]?.confidence || 'N/A',
      additionalInfo: data.suggestions[0]?.additional_info || 'No additional info available'
    });
  })
  .catch(error => {
    console.error('Error calling Plant.id API:', error.message || error);
    callback(new Error('Error calling Plant.id API'));
  });
};

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
