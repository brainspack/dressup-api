import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable default body parser
  });

  // 🚀 INCREASE PAYLOAD SIZE LIMIT for image uploads (50MB)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Enable CORS to allow requests from your frontend
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:8081', 'http://10.0.2.2:8081'], // React/Vite frontend and React Native
    credentials: true, // allow cookies and headers like Authorization
  });

  await app.listen(3000);
  console.log('🚀 Server running on port 3000 with 50MB payload limit');
}
bootstrap();
