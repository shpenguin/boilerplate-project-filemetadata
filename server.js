require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new mongoose.Schema({
    original: { type: String, required: true },
    short: Number
});

const URL = mongoose.model('URL', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', async function(req, res) {
    const { url } = req.body;
    const reg=/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;

    if (!reg.test(url)) {
        res.json({
            error: 'invalid url'
        });
        return;
    }

    let match = await URL.findOne({
        original: url
    });

    if (!match) {
        let idx = await URL.find().countDocuments();
        match = new URL({
            original: url,
            short: ++idx
        });
        await match.save();
    }

    res.json({
        original_url: match.original,
        short_url: match.short
    });
});

app.get('/api/shorturl/:input', async function(req, res) {
    let { input } = req.params;

    await URL.findOne({ short: input }, (err, result) => {
        if (!err && result) {
            res.redirect(result.original);
        } else {
            res.send('URL not Found');
        }
    });
});

app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});
