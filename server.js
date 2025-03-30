require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET']
}));

// API Key Verification Middleware
const verifyApiKey = (req, res, next) => {
  if (!process.env.OPENWEATHER_API_KEY) {
    console.error('❌ Missing OpenWeatherMap API key');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  next();
};

// Weather Endpoint
app.get('/api/weather', verifyApiKey, async (req, res) => {
  try {
    const { city, lat, lon } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!city && !(lat && lon)) {
      return res.status(400).json({ error: 'Provide city or coordinates' });
    }

    const url = city 
      ? `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
      : `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    const response = await axios.get(url, { timeout: 5000 });

    res.json({
      city: response.data.name,
      country: response.data.sys?.country,
      temp: response.data.main.temp,
      feels_like: response.data.main.feels_like,
      humidity: response.data.main.humidity,
      wind: response.data.wind.speed,
      description: response.data.weather[0].description,
      icon: response.data.weather[0].icon,
      coord: response.data.coord
    });
  } catch (error) {
    handleWeatherError(error, res);
  }
});

// Forecast Endpoint
app.get('/api/forecast', verifyApiKey, async (req, res) => {
  try {
    const { city, lat, lon } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    const url = city 
      ? `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
      : `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    const response = await axios.get(url, { timeout: 5000 });
    
    res.json(response.data.list.map(item => ({
      dt: item.dt,
      temp: item.main.temp,
      icon: item.weather[0].icon,
      description: item.weather[0].description
    })));
  } catch (error) {
    handleWeatherError(error, res);
  }
});

// Error Handler
function handleWeatherError(error, res) {
  console.error('API Error:', error.response?.data || error.message);
  
  if (error.response?.status === 401) {
    res.status(401).json({ 
      error: 'Invalid API Key',
      solution: 'Update OPENWEATHER_API_KEY in .env file'
    });
  } else if (error.response?.status === 404) {
    res.status(404).json({ error: 'Location not found' });
  } else {
    res.status(500).json({ error: 'Weather service unavailable' });
  }
}

// Start Server
app.listen(PORT, () => {
  console.log(`🌦️ Server running on port ${PORT}`);
  console.log(`Using API Key: ${process.env.OPENWEATHER_API_KEY ? '✅ Configured' : '❌ Missing'}`);
});