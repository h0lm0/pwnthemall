import type { NextApiRequest, NextApiResponse } from "next";
import axios from "@/lib/axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";

  try {
    const response = await axios.post(`${backendUrl}/login`, req.body, {
      headers: {
        "Content-Type": "application/json",
        Cookie: req.headers.cookie || "",
      },
      withCredentials: true,
    });

    const setCookie = response.headers["set-cookie"];
    if (setCookie) {
      res.setHeader("set-cookie", setCookie);
    }

    res.status(response.status).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(
      error.response?.data || {
        error: "Internal Server Error",
      }
    );
  }
}
