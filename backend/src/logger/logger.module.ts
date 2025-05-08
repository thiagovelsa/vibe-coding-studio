import { Module, Global } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { LoggerService } from './logger.service';

@Global()
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      providers: [],
      useFactory: (configService: ConfigService) => {
        const { level } = configService.logConfig;
        const isProduction = configService.appConfig.env === 'production';

        return {
          pinoHttp: {
            level: level,
            transport: isProduction 
              ? undefined 
              : { target: 'pino-pretty', options: { colorize: true, singleLine: true }},
            redact: {
              paths: ['req.headers.authorization', 'req.headers.cookie'],
              censor: '***REDACTED***',
            },
            customProps: (req, res) => ({
              context: 'HTTP',
            }),
            customLogLevel: (req, res, err) => {
              if (res.statusCode >= 500 || err) {
                return 'error';
              } else if (res.statusCode >= 400) {
                return 'warn';
              }
              return 'info';
            },
          },
        };
      },
    }),
  ],
  providers: [LoggerService],
  exports: [PinoLoggerModule, LoggerService],
})
export class LoggerModule {} 