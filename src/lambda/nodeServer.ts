/* eslint-disable @typescript-eslint/require-await */
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import fetch from "node-fetch";

export async function main(
  event: APIGatewayProxyEventV2,
  context: any
): Promise<APIGatewayProxyResultV2> {
  console.log(event);
  console.log(context);

  let response = {} as any;
  const API_URL = "https://7cp0guqyr4.execute-api.us-west-2.amazonaws.com";
  const random = Math.floor(Math.random() * 100);
  const user = {
    name: `lambda${random}`,
    email: `lambda${random}@gmail.com`,
    password: "lambda123456",
    c_password: "lambda123456",
  };

  try {
    console.log("user>", user);
    const res = await makeRequest(`${API_URL}/api/register`, "POST", user);
    console.log("res>", res);

    const { token } = await makeRequest(`${API_URL}/api/login`, "POST", {
      email: user.email,
      password: user.password,
    });
    console.log("token>", token);

    response = await makeRequest(`${API_URL}/api/clients`, "GET", {}, token);
    response = {
      body: JSON.stringify(response),
      user,
      statusCode: 200,
    };
  } catch (err) {
    console.log("ERR>", err);
    response = {
      body: JSON.stringify({
        err,
      }),
      statusCode: 500,
    };
  }

  console.log(response);
  return response;
}

async function makeRequest(
  url: string,
  type: string,
  payload: object,
  token?: string
) {
  try {
    let requestBody = {
      method: type,
    } as any;

    if (type === "POST") {
      requestBody.body = JSON.stringify(payload);
      requestBody.headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
    } else {
      requestBody.headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };
    }
    console.log("requestBody", requestBody);
    const response = await fetch(url, requestBody);

    console.log("response.status>", response.status);
    if (!response.ok) {
      throw new Error(`Error! status: ${response.status}`);
    }

    const result = (await response.json()) as any;
    console.log("response.result>", result);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.log("error message: ", error.message);
      return error.message;
    } else {
      console.log("unexpected error: ", error);
      return "An unexpected error occurred";
    }
  }
}
