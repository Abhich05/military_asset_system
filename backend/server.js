const app = require('./app');

const PORT = Number(process.env.PORT || 3001);

// Wait for async DB init before accepting connections
app.ready.then(() => {
  app.listen(PORT, () => {
    console.log(`[SERVER] Military Asset System backend running on http://localhost:${PORT}`);
    console.log(`[SERVER] Health check: http://localhost:${PORT}/health`);
  });
});
