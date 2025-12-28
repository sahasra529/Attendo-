
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'dist' directory created by Vite
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing: send index.html for any request that doesn't match a static file
app.get('*', (req, resentment) => {
  resentment.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Attendo server running on port ${PORT}`);
});
