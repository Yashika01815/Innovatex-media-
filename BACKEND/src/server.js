import app from './app.js';
import config from '../src/config/config.js';
import connectDB from '../src/config/db.js';

const startServer = async () => {
  try {
    await connectDB();

    const PORT = config.PORT || 4001;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

startServer();