/* eslint-disable @typescript-eslint/require-await */
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { Lambda } from "@aws-sdk/client-lambda";
import { TextDecoder, TextEncoder } from "util";
import {
  appName,
  LambdaType,
  INVOCATION_TYPE,
  UTF_8,
} from "../../lib/stackConfiguration";

export async function main(
  event: APIGatewayProxyEventV2,
  context: any
): Promise<APIGatewayProxyResultV2> {
  console.log(event);
  console.log(context);

  // accessing environment variables 👇
  console.log("region 👉", process.env.region);
  console.log("availabilityZones 👉", process.env.availabilityZones);
  console.log("endpoint 👉", process.env.endpoint);
  console.log("port 👉", process.env.port);
  console.log("databaseName 👉", process.env.databaseName);
  console.log("userName 👉", process.env.userName);
  console.log("password 👉", process.env.password);

  let response;
  try {
    const lambdaClient = new Lambda({});
    const { Payload } = await lambdaClient.invoke({
      FunctionName: `${appName}-${LambdaType.PRIVATE_LAMBDA}`,
      InvocationType: INVOCATION_TYPE,
      Payload: new TextEncoder().encode(JSON.stringify({ event, context })),
    });

    response = {
      body: JSON.stringify({
        data: JSON.parse(new TextDecoder(UTF_8).decode(Payload) || "{}"),
      }),
      statusCode: 200,
    };
  } catch (error) {
    response = {
      body: JSON.stringify({
        error,
      }),
      statusCode: 500,
    };
  }

  console.log(response);

  return response;
}
