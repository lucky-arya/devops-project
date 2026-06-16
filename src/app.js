import express from 'express';
import helmet from 'helmet';
import logger from '#config/logger.js';  
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from '#routes/auth.routes.js';
import securityMiddleware from '#middleware/security.middleware.js';

const app = express();
app.use(helmet());
app.use(cookieParser());
app.use(securityMiddleware);

app.use(cors(
  
));

app.use(express.json());
app.use(express.urlencoded({extended:true}));



// Use morgan to log HTTP requests, directing logs to winston
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));


app.get('/', (req, res) => {
  logger.info('Hello from Acquisitions API!');
  res.status(200).send('Hello from Acquisitions!');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' ,timestamp: new Date().toISOString()});
});

app.get('/api',(req,res)=>{
    res.status(200).json({message:'Acquisitions API is running!'});
});

app.use('/api/auth',authRoutes); // api/auth/sign-up, api/auth/sign-in, api/auth/sign-out

export default app;
