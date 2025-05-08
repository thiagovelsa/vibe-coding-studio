import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from './database.service';
import { RelationalDatabaseService } from './relational-database.service';
import { PersistenceService } from './persistence.service';
import { join } from 'path';
import { LoggerModule } from '../logger/logger.module';

// Definindo uma interface para a configuração do DB - Mantido para referência
interface DbConfig {
  type: string;
  database: string;
  synchronize: boolean;
  logging: boolean;
  // Adicionar outras propriedades se existirem
}

// Configuração Hardcoded para teste (agora usada diretamente)
const testDbOptions: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: join(process.cwd(), 'vibeforge-test.sqlite'),
  synchronize: true,
  logging: true,
  entities: [
    join(__dirname, '**/*.entity.{ts,js}'),
  ],
};

console.log('Usando opções de DB hardcoded (forRoot) com entidades restritas:', testDbOptions);

@Module({
  imports: [
    // Importar módulos necessários para as dependências dos providers
    ConfigModule, 
    LoggerModule,
    // Usando forRoot diretamente com as opções hardcoded
    TypeOrmModule.forRoot(testDbOptions),
    /*
    // Código original com forRootAsync (comentado)
    TypeOrmModule.forRootAsync({
      useFactory: (): TypeOrmModuleOptions => {
        // ... (lógica anterior com hardcoded config) ...
        return { ... };
      },
    }),
    */
  ],
  providers: [DatabaseService, RelationalDatabaseService, PersistenceService],
  exports: [DatabaseService, RelationalDatabaseService, PersistenceService],
})
export class DatabaseModule {} 