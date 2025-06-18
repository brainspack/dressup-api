import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS to allow requests from your frontend
  app.enableCors({
    origin: 'http://localhost:5173', // your React/Vite frontend
    credentials: true, // allow cookies and headers like Authorization
  });

  await app.listen(3000);
}
bootstrap();
