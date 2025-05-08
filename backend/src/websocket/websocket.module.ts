import { Module } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [
    OrchestratorModule,
    AgentsModule,
  ],
  providers: [
    WebSocketGateway,
    WebSocketService,
  ],
  exports: [
    WebSocketService,
  ],
})
export class WebSocketModule {} 