import { Callback, Context, Handler } from 'aws-lambda';
import { ApiGuidesPrintingModule } from './api-guides-printing.module';
import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@vendia/serverless-express';

let server: Handler;
async function bootstrap(): Promise<Handler> {
  const app = await NestFactory.create(ApiGuidesPrintingModule);
  app.enableCors();
  app.useGlobalPipes();
  app.useGlobalFilters();

  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback
) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
}
