import { Test, TestingModule } from '@nestjs/testing';
import { ApiGuidesPrintingController } from './api-guides-printing.controller';
import { ApiGuidesPrintingService } from './api-guides-printing.service';

describe('ApiGuidesPrintingController', () => {
  let apiGuidesPrintingController: ApiGuidesPrintingController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ApiGuidesPrintingController],
      providers: [ApiGuidesPrintingService],
    }).compile();

    apiGuidesPrintingController = app.get<ApiGuidesPrintingController>(ApiGuidesPrintingController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(apiGuidesPrintingController.getHello()).toBe('Hello World!');
    });
  });
});
