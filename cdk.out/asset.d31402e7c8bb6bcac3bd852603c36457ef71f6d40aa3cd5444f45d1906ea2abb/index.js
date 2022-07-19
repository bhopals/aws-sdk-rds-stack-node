var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/my-lambda/index.ts
var my_lambda_exports = {};
__export(my_lambda_exports, {
  main: () => main
});
module.exports = __toCommonJS(my_lambda_exports);
async function main(event) {
  console.log("event \u{1F449}", event);
  return {
    body: JSON.stringify({ message: "Successful lambda invocation" }),
    statusCode: 200
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  main
});
