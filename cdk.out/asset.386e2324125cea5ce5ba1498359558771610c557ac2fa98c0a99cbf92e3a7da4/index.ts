/* eslint-disable @typescript-eslint/require-await */
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  console.log("event 👉", event);

  return {
    body: JSON.stringify({ message: "Successful public lambda invocation" }),
    statusCode: 200,
  };
}
