import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";
    const response = await fetch(`${backendUrl}/teams/disband`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.cookie || "",
      },
      body: JSON.stringify(req.body),
      credentials: "include",
    });
    
    const contentType = response.headers.get("content-type");
    
    // Check if the response is JSON
    if (contentType && contentType.includes("application/json")) {
      try {
        const data = await response.json();
        res.status(response.status).json(data);
      } catch (parseError) {
        console.error("Failed to parse backend JSON response:", parseError);
        res.status(500).json({ error: "invalid_server_response" });
      }
    } else {
      // Backend returned non-JSON (probably HTML error page)
      const textResponse = await response.text();
      console.error("Backend returned non-JSON response:", {
        status: response.status,
        contentType,
        body: textResponse.substring(0, 200) // Log first 200 chars
      });
      
      res.status(response.status || 500).json({ 
        error: response.status === 404 ? "team_not_found" : "invalid_server_response" 
      });
    }
  } catch (fetchError) {
    console.error("Failed to connect to backend:", fetchError);
    res.status(500).json({ error: "internal_server_error" });
  }
} 