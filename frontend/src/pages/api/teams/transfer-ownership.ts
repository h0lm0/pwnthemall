import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";
  
  try {
    const response = await fetch(`${backendUrl}/teams/transfer-ownership`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.cookie || "",
      },
      body: JSON.stringify(req.body),
      credentials: "include",
    });
    
    let data;
      try {
      data = await response.json();
      } catch (parseError) {
      return res.status(500).json({ 
        error: "Invalid response from backend" 
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data?.error || "Backend error" 
      });
    }
      
    res.status(response.status).json(data);
  } catch (fetchError) {
    return res.status(500).json({ 
      error: "Failed to connect to backend" 
    });
  }
} 