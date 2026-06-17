const express = require('express');
const app = express();

app.use(express.json());

// Routes
app.use('/device', require('./routes/devices'));
app.use('/device', require('./routes/policy'));
app.use('/device', require('./routes/updates'));
app.use('/device', require('./routes/apps'));
app.use('/', require('./routes/logs'));

// Global error handler
app.use(require('./middleware/errorHandler'));

module.exports = app;