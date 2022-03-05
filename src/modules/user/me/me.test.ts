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

const meQuery = `query {
    me {
        id
        firstName
        lastName
        email
        name
    }
  }`;

describe("Me Resolver", () => {
  it("get current User", async () => {
    const user = await User.create({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    }).save();

    const response = await gCall({
      source: meQuery,
      userId: user.id,
    });

    console.log(response);

    expect(response).toMatchObject({
      data: {
        me: {
          id: `${user.id}`,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          name: user.firstName + " " + user.lastName,
        },
      },
    });
  }, 10000);

  it("return null", async () => {
    const reponse = await gCall({
      source: meQuery,
    });

    expect(reponse).toMatchObject({
      data: {
        me: null,
      },
    });
  });
});
