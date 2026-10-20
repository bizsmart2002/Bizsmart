import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // API JSON detrás de autenticación: nunca debe cachearse ni devolver
  // 304 (Not Modified) por ETag automático de Express (causaba respuestas
  // vacías al recargar el frontend).
  app.getHttpAdapter().getInstance().set('etag', false);

  // El Gateway NO revalida DTOs (cada microservicio ya lo hace); solo
  // enruta, aplica CORS, logging y rate limiting (ver Fase 1, sección 10).
  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`[BizSmart] API Gateway escuchando en el puerto ${port}`);
}
bootstrap();
