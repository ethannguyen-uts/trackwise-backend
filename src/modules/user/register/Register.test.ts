import { testConn } from "../../../test-utils/testConn";
import { Connection } from "typeorm";
import { gCall } from "../../../test-utils/gCall";
import faker from "@faker-js/faker";
import { User } from "../../../entity/User";

let conn: Connection;
beforeAll(async () => {
  conn = await testConn(); //pass false so we do not drop database after each test
});

afterAll(async () => {
  await conn.close();
});

const registerMutation = `mutation Register($data: RegisterInput!) {
    register(
        data: $data
      ) {
      firstName
      lastName
      email
    }
  }`;

describe("Register Resolver", () => {
  return;
  it("create a new user", async () => {
    const user = {
      firstName: faker.name.firstName().replace("'", ""),
      lastName: faker.name.lastName().replace("'", ""),
      email: faker.internet.email(),
      password: faker.internet.password(),
    };
    console.log(user);

    const response = await gCall({
      source: registerMutation,
      variableValues: { data: user },
    });
    expect(response).toMatchObject({
      data: {
        register: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      },
    });
    const dbUser = await User.findOne({ where: { email: user.email } });
    expect(dbUser).toBeDefined();
    expect(dbUser!.confirmed).toBeFalsy();
    expect(dbUser!.email).toEqual(user.email);
  }, 10000);
});
