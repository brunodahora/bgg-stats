import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/bgg/collection", () => {
    return HttpResponse.xml("<items></items>", { status: 200 });
  }),
];
