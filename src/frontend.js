const express = require('express');
const path = require('path');
const { FRONTEND_PORT } = require('./config');

const app = express();

app.use(express.static(path.join(__dirname, '../public')));

app.listen(FRONTEND_PORT, () => {
  console.log(`Frontend app running at http://localhost:${FRONTEND_PORT}`);
});
