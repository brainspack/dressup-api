import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS to allow requests from your frontend
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:8081', 'http://10.0.2.2:8081'], // React/Vite frontend and React Native
    credentials: true, // allow cookies and headers like Authorization
  });

  await app.listen(3000);
}
bootstrap();
