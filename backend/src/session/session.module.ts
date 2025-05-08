import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';
import { DatabaseModule } from '../database/database.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    OrchestratorModule,
    DatabaseModule,
    LoggerModule
  ],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService]
})
export class SessionModule {}
