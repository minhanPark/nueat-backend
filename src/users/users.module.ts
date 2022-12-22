import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserResolver } from './users.resolver';
import { UserService } from './users.service';

@Module({
  // 강의에서 처럼 ConfigService를 불러오면
  // Classes annotated with @Injectable(), @Catch(), and @Controller() decorators must not appear in the "imports" array of a module.
  //  Please remove "ConfigService" (including forwarded occurrences, if any) from all of the "imports" arrays.
  // 이런 에러가 뜨는데
  // ConfigModule로 하면 정상적으로 작동함
  // 또 providers에 ConfigService를 넣는것은 제대로 작동한다.
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserService, UserResolver],
  exports: [UserService],
})
export class UsersModule {}
