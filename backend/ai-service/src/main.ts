import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // API JSON detrás de autenticación: nunca debe cachearse ni devolver
  // 304 (Not Modified) por ETag automático de Express (causaba respuestas
  // vacías al recargar el frontend).
  app.getHttpAdapter().getInstance().set('etag', false);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableCors();
  const port = process.env.PORT || 3007;
  await app.listen(port);
  console.log(`[BizSmart] servicio escuchando en el puerto ${port}`);
}
bootstrap();
