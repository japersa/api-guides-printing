import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ApiGuidesPrintingController } from './api-guides-printing.controller';
import { ApiGuidesPrintingService } from './api-guides-printing.service';
import { TokenInterceptor } from './interceptors/token.interceptor';
import { TokenService } from './services/token.service';
import { DynamoDBProvider } from './providers/dynamoDB.provider';
import { LoggerService } from './common/logger/logger.service';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { ShipmentsService } from './services/shipments.service';
import { S3Service } from './services/s3.service';

@Module({
  imports: [],
  controllers: [ApiGuidesPrintingController],
  providers: [
    ApiGuidesPrintingService,
    TokenService,
    TokenInterceptor,
    DynamoDBProvider,
    LoggerService,
    ShipmentsService,
    S3Service
  ],
  exports: [
    DynamoDBProvider,
    LoggerService,
    S3Service
  ]
})
export class ApiGuidesPrintingModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(ApiGuidesPrintingController);
  }
}
