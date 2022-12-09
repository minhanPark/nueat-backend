# NuEat backend

우선 세팅은 nestjs의 documentation에서 GRAPHQL을 따라했다.

```bash
npm i @nestjs/graphql @nestjs/apollo graphql apollo-server-express
```

위의 4개를 다운로드한다.  
예전과 다르게 driver를 추가해줘야한다.

```ts
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
    }),
  ],
})
export class AppModule {}
```

## Code first

접근 방법이 2개 있는데 Code first와 Schema first가 있다.  
코드 퍼스트는 데코레이터와 타입스크립트를 이용해서 resolver롤 만들면 graphql scheme를 만들어 준다.

```ts
GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    }),
```

autoSchemaFile에 저렇게 파일 위치를 넣어주면 schema.gql이 자동으로 만들어진다.

```ts
// src/restaurants/restaurants.resolver.ts

import { Resolver, Query } from '@nestjs/graphql';

@Resolver()
export class RestaurantResolver {
  // 쿼리는 첫번째 매개변수로 자기가 반환해야할 타입을 리턴하는 함수를 받는다.
  // () => Boolean을 해도 되지만 모양이 더 예쁘도록 returns => Boolean 형태로 사용함
  @Query((returns) => Boolean)
  // 위의 리턴 타입은 GRAPHQL을 위한 타입이고
  // 아래의 리턴타입은 타입스크립트를 위한 타입이다.
  isPizzaGood(): Boolean {
    return true;
  }
```

예시로 레스토랑 resolver를 만들면 src/schema.gql 파일 안에 스키마를 자동으로 만들어준다.

```gql
# ------------------------------------------------------
# THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
# ------------------------------------------------------

type Query {
  isPizzaGood: Boolean!
}
```

파일이 만들어지는 것이 아니고 메모리상에서만 만들어지게 하려면 autoSchemaFile에 true만 적으면 된다. 해당 강의에서는 true만 주었음

## entity 작성

엔티티는 데이터베이스에 들어가는 형태라고 생각하면 된다.

```ts
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Restaurant {
  @Field((type) => String)
  name: string;

  @Field((type) => Boolean, { nullable: true })
  isGood?: boolean;
}
```

ObjectType과 Field 모두 첫번째로는 자기의 타입을 반환하는 함수를 가진다.  
기본적으로 타입스크립트에서는 타입을 소문자로 쓰지만 graphql의 데코레이터는 타입을 파스칼 케이스로 받는다.  
또한 GraphQL 스키마의 대부분의 정의는 object types이다. 정의하는 각 object type은 응용 프로그램 클라이언트가 상호 작용해야하는 도메인 객체를 나타내야 합니다.

## Arguments

쿼리에는 arguments를 쓸 수 있다.

```graphql
{
  restaurant(vaganOnly: true) {
    name
  }
}
```

위에처럼 쿼리를 사용할 때 argument(여기선 vaganOnly)를 보낼 수 있는데, 해당 쿼리를 사용하려면 코드상에서 @Args 데코레이터를 사용해야한다.

```ts
@Resolver((of) => Restaurant)
export class RestaurantResolver {
  @Query((returns) => [Restaurant])
  restaurant(@Args('vaganOnly') veganOnly: boolean) {
    return [];
  }
}
```

## InputTypes과 ArgumentType

```ts
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Restaurant {
  @Field((type) => String)
  name: string;

  @Field((type) => Boolean)
  isVegan: boolean;

  @Field((type) => String)
  address: string;

  @Field((type) => String)
  ownerName: string;
}
```

위와 같은 entity가 있다.  
만약 createRestaurant라는 mutation을 만든다고 했을 떄 아래처럼 보내게 될 것이다.

```graphql
mutation {
  createRestaurant(
    name: "RW"
    isVegan: false
    address: "부산"
    ownerName: "사장"
  )
}
```

resolver에서 받는 일반적인 형태는 무엇이 될까?

```ts
@Resolver((of) => Restaurant)
export class RestaurantResolver {
  @Mutation((returns) => Boolean)
  createRestaurant(
    @Args('name') name: string,
    @Args('isVegan') isVegan: boolean,
    @Args('address') address: string,
    @Args('ownerName') ownerName: string,
  ): boolean {
    return true;
  }
}
```

위와 같은 형태가 될 것이다.  
객체로 한번에 받을 수 있도록 사용할 수 있는 것이 InputType이다.(Mutation이 객체를 argument로 취해야 하는 경우 사용 가능, InputType은 argument로 전달할 수 있는 특수한 유형의 객체)

```ts
// src/restaurants/dto/create-restaurant.dto.ts

import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateRestaurantDto {
  @Field((type) => String)
  name: string;
  @Field((type) => Boolean)
  isVegan: boolean;
  @Field((type) => String)
  address: string;
  @Field((type) => String)
  ownersName: string;
}
```

이렇게 InputType을 사용하면 객체로 받아서 사용할 수 있다.  
그리고 Input 타입으로 작성했다면 resolver 안에 mutation은 아래처럼 변경되어야 한다.

```ts
@Resolver((of) => Restaurant)
export class RestaurantResolver {
  @Mutation((returns) => Boolean)
  createRestaurant(
    @Args('createRestaurantInput') createRestaurantInput: CreateRestaurantDto,
  ): boolean {
    return true;
  }
}
```

그리고 mutation을 보낼 때는 아래처럼 보내야한다.

```graphql
mutation {
  createRestaurant(
    createRestaurantInput: {
      name: "RW"
      isVegan: false
      address: "부산"
      ownersName: "사장"
    }
  )
}
```

> 보내는건 Args 타입으로 따로 보내고, 받는건 객체로 한번에 받는 방법은 무엇이 있을까?

dto의 타입을 ArgsType만들고, Args로 전체 매개변수를 받으면 된다.

```ts
// dto의 타입을 ArgsType
@ArgsType()
export class CreateRestaurantDto {
  @Field((type) => String)
  name: string;
  @Field((type) => Boolean)
  isVegan: boolean;
  @Field((type) => String)
  address: string;
  @Field((type) => String)
  ownersName: string;
}
```

```ts
@Resolver((of) => Restaurant)
export class RestaurantResolver {
  @Mutation((returns) => Boolean)
  createRestaurant(
    @Args() createRestaurantInput: CreateRestaurantDto,
  ): boolean {
    console.log(createRestaurantInput);
    return true;
  }
}
```

@Args로 저렇게 전체를 받으면 createRestaurantInput에는 매개변수가 객체로 담길 것이다.

```graphql
mutation {
  createRestaurant(
    name: "RW"
    isVegan: false
    address: "부산"
    ownersName: "사장"
  )
}
```

기존처럼 mutation도 위와 같이 보낼 수 있게된다.

## Validating ArgsType

ArgsType에 유효성 검사를 해줄 수 있다.

```cmd
npm i class-transformer class-validator
```

설치 이후에 app에 설정을 바꿔준다.

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
```

```ts
import { ArgsType, Field } from '@nestjs/graphql';
import { IsString, IsBoolean, Length } from 'class-validator';

@ArgsType()
export class CreateRestaurantDto {
  @Field((type) => String)
  @Length(2, 10)
  @IsString()
  name: string;

  @Field((type) => Boolean)
  @IsBoolean()
  isVegan: boolean;

  @Field((type) => String)
  @IsString()
  address: string;

  @Field((type) => String)
  @IsString()
  ownersName: string;
}
```

class-validator를 필수값에 대한 에러뿐만 아니라 타입, 길이 등 좀 더 다양한 유효성 검사를 추가할 수 있다.
