/* eslint-disable @typescript-eslint/require-await */

export const handler = async (event: any) => {
  console.log("event 👉", event);

  return {
    body: JSON.stringify({ message: "Successful PUBLIC lambda invocation" }),
    statusCode: 200,
  };
};
