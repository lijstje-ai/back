import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      "http://localhost:3001",
      "http://localhost:3000",
      "https://front-gamma-nine.vercel.app",
      "https://lijstje.ai",
    ],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
