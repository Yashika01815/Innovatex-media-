import config from './src/config/config.js';
import express from 'express';
import connectDB from './src/config/db.js';

import leadRoutes from './src/modules/leads/lead.routes.js';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.use('/api/leads', leadRoutes);

const PORT = config.PORT;

connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});