var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var aiClient = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing");
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message content is required" });
    }
    let ai;
    try {
      ai = getGeminiClient();
    } catch (e) {
      return res.json({
        reply: "\u3010\u7CFB\u7D71\u63D0\u793A\u3011\u76EE\u524D\u5C08\u6848\u5F8C\u7AEF\u672A\u8A2D\u5B9A GEMINI_API_KEY \u91D1\u9470\u3002\u8ACB\u65BC AI Studio \u53F3\u4E0A\u65B9\u9EDE\u64CA\u300CSettings > Secrets\u300D\u8A2D\u5B9A\u5F8C\u91CD\u8A66\uFF01\u73FE\u5728\u6211\u5C07\u4EE5\u4EAC\u90FD\u7576\u5730\u5C0F\u7CBE\u9748\u7684\u8EAB\u4EFD\u4EE3\u7B54\uFF1A\u6E05\u6C34\u5BFA\u8207\u5343\u672C\u9CE5\u5C45\u662F\u4EAC\u90FD\u65C5\u884C\u4E0D\u53EF\u932F\u7A7A\u7684\u7D55\u7F8E\u5730\u6A19\u5594\uFF01"
      });
    }
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction: `\u4F60\u662F Google L6 Staff Software Engineer \u8207\u5C08\u696D\u7684\u4EAC\u90FD\u65C5\u904A\u7BA1\u5BB6\u3002
        \u4F60\u5C0D\u4EAC\u90FD\u5E02\uFF08Kiyomizu-dera, Kinkaku-ji, Fushimi Inari, Gion, Arashiyama \u7B49\uFF09\u7684\u6B77\u53F2\u53E4\u8E5F\u3001\u795E\u793E\u79AE\u7BC0\u3001\u7C73\u5176\u6797\u7F8E\u98DF\u3001\u548C\u670D\u9AD4\u9A57\u3001\u516C\u8ECA\u5E02\u71DF\u5730\u9435\u4E58\u8ECA\u7968\u50F9\u64C1\u6709\u9802\u7D1A\u7684\u4E86\u89E3\u3002
        \u8ACB\u4F7F\u7528\u89AA\u5207\u3001\u5C08\u696D\u3001\u6D41\u66A2\u7684\u7E41\u9AD4\u4E2D\u6587\uFF0C\u70BA\u4F7F\u7528\u8005\u63D0\u4F9B\u5BA2\u88FD\u5316\u7684\u4EAC\u90FD\u65C5\u884C\u8A08\u756B\u8207\u8CBC\u5FC3\u5C0F\u63D0\u9192\u3002`
      }
    });
    const reply = response.text || "\u6211\u6B63\u5728\u7CBE\u7B97\u9019\u689D\u8DEF\u7DDA\uFF0C\u8ACB\u60A8\u7A0D\u7B49\u6211\u4E00\u4E0B\uFF01";
    res.json({ reply });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Kyoto Travel Console is live at http://localhost:${PORT}`);
  });
}
startServer();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
