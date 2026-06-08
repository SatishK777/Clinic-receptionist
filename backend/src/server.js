import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5001;

// Connect to Database first
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `AI Voice Receptionist Server is running on port ${PORT} in ${
          process.env.NODE_ENV || 'development'
        } mode`
      );
    });
  })
  .catch((error) => {
    console.error(`Failed to connect to database: ${error.message}`);
    process.exit(1);
  });
