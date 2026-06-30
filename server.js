const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const axios = require('axios');
const csv = require('csvtojson');

const app = express();
app.use(cors()); 
app.use(express.json());

const razorpay = new Razorpay({
  key_id: 'rzp_live_T7rpyol8chYI2V',
  key_secret: 'BZH0ouHtlceupIGk841LwgZh'
});

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTrRUJLznG-1edIxnwH1EHmfpuWhaPosDKF-1_xokoub9IGWEz_3JlMYOLw6DVgI-Tx830hyojfVmcd/pub?output=csv";

app.get("/api/products", async (req, res) => {
    try {
        const response = await axios.get(SHEET_CSV_URL);
        const products = await csv().fromString(response.data);
        const safeProducts = products.map(item => {
            return {
                id: item.id, title: item.title, price: item.price,
                category: item.category, description: item.description,
                image1: item.image1, image2: item.image2,
                image3: item.image3, image4: item.image4,
                // આ ૨ નવા ખાના ઉમેર્યા છે CMS માટે
                Show_on_Home: item.Show_on_Home, 
                Show_in_Shop: item.Show_in_Shop  
            };
        });
        res.json(safeProducts); 
    } catch (error) {
        res.status(500).json({ error: "Failed to load data" });
    }
});

app.post('/api/get-links', async (req, res) => {
  try {
    const { productIds } = req.body;
    const response = await axios.get(SHEET_CSV_URL);
    const products = await csv().fromString(response.data);

    let downloadLinks = [];
    products.forEach(item => {
      if (productIds.includes(item.id)) {
        if (item.file1_name && item.file1_link) downloadLinks.push({ name: item.file1_name, path: item.file1_link.trim() });
        if (item.file2_name && item.file2_link) downloadLinks.push({ name: item.file2_name, path: item.file2_link.trim() });
        if (item.file3_name && item.file3_link) downloadLinks.push({ name: item.file3_name, path: item.file3_link.trim() });
      }
    });
    res.json(downloadLinks);
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

app.post('/create-order', async (req, res) => {
  try {
    const order = await razorpay.orders.create({ 
      amount: req.body.amount * 100, 
      currency: 'INR', 
      receipt: 'receipt_' + Math.floor(Math.random() * 1000) 
    });
    res.json(order);
  } catch (error) {
    res.status(500).send('Order failed');
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
