import { Logger, Module } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import type { EnvironmentVariables } from '../../common/config/env.validation';

import { SupabaseModule } from '../../supabase/supabase.module';

import { AiController } from './ai.controller';

import { WASTE_CLASSIFIER } from './ai.tokens';

import { CategoryMapperService } from './category-mapper';

import { ClassificationService } from './classification.service';

import { InferenceLogger } from './inference-logger';

import { MockClassifier } from './mock-classifier';

import { ModelClassifier } from './model-classifier';

import { ModelVersionService } from './model-version.service';

import type { WasteClassifier } from './classifier.interface';

@Module({
  imports: [SupabaseModule],

  controllers: [AiController],

  providers: [
    CategoryMapperService,

    ClassificationService,

    InferenceLogger,

    ModelClassifier,

    ModelVersionService,

    {
      provide: WASTE_CLASSIFIER,

      useFactory: (
        configService: ConfigService<EnvironmentVariables, true>,

        modelClassifier: ModelClassifier,
      ): WasteClassifier => {
        const logger = new Logger('AiModule');

        const useMock = configService.get('AI_USE_MOCK_CLASSIFIER', {
          infer: true,
        });

        if (useMock) {
          logger.log('Active waste classifier: MockClassifier (mock-1.0.0)');

          return new MockClassifier();
        }

        logger.log(
          `Active waste classifier: ModelClassifier (ready=${modelClassifier.isReady()}, version=${modelClassifier.getModelVersion()})`,
        );

        return modelClassifier;
      },

      inject: [ConfigService, ModelClassifier],
    },
  ],

  exports: [
    WASTE_CLASSIFIER,

    CategoryMapperService,

    InferenceLogger,

    ModelVersionService,

    ClassificationService,
  ],
})
export class AiModule {}
