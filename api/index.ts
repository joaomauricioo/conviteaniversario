import type { IncomingMessage, ServerResponse } from "node:http";
import { app } from "../backend/src/app";

function removerPrefixoApi(url = "/") {
  if (url === "/api") return "/";
  if (url.startsWith("/api?")) return `/${url.slice(4)}`;
  if (url.startsWith("/api/")) return url.slice(4);

  return url;
}

export default function handler(request: IncomingMessage, response: ServerResponse) {
  request.url = removerPrefixoApi(request.url);
  return app(request, response);
}
