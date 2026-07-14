import { getStore } from "@netlify/blobs";

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

export default async function handler(request) {
  const store = getStore("libac-site-data");

  if (request.method === "GET") {
    const data = await store.get("content", { type: "json", consistency: "strong" });
    return Response.json({ data }, { headers });
  }

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers });
  }

  const expectedPassword = process.env.LIBAC_ADMIN_PASSWORD;
  if (!expectedPassword) {
    return Response.json({ error: "Server password is not configured" }, { status: 503, headers });
  }

  if (request.headers.get("x-libac-admin-password") !== expectedPassword) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  try {
    const data = await request.json();
    if (!data || !Array.isArray(data.fields) || !Array.isArray(data.majors)) {
      return Response.json({ error: "Invalid site data" }, { status: 400, headers });
    }
    await store.setJSON("content", data);
    return Response.json({ ok: true }, { headers });
  } catch (error) {
    return Response.json({ error: "Could not save site data" }, { status: 400, headers });
  }
}
