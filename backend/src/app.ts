import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';

import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error';

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/', (_req, res) => res.send('Backend OK ✅'));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
