import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';

import leadRoutes from './modules/leads/lead/lead.routes.js';

const app = express();

/*
|--------------------------------------------------------------------------
| Security Middleware
|--------------------------------------------------------------------------
*/

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

/*
|--------------------------------------------------------------------------
| Logging
|--------------------------------------------------------------------------
*/

app.use(morgan('dev'));

/*
|--------------------------------------------------------------------------
| Compression
|--------------------------------------------------------------------------
*/

app.use(compression());

/*
|--------------------------------------------------------------------------
| Body Parsers
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: '1mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '1mb',
  })
);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    service: 'InnovateX CRM API',
    status: 'healthy',
  });
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use('/api/leads', leadRoutes);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use((err, req, res, next) => {
  console.error(err);

  return res.status(err.status || 500).json({
    success: false,
    message:
      err.message || 'Internal Server Error',
  });
});

export default app;