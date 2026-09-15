const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const distPath = path.join(__dirname, 'dist/previdencial-familiar/browser');

app.use(express.static(distPath));

app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
