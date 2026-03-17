import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export async function GET(request: NextRequest) {
  try {
    console.log("=== Active Users API Called ===");
    
    // Verify admin authentication
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");

    console.log("Token found:", !!token);

    if (!token) {
      console.log("No token found in cookies");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token.value, JWT_SECRET) as any;
    console.log("Decoded user role:", decoded.role);
    
    if (decoded.role !== "admin") {
      console.log("Access denied - not admin");
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    console.log("Fetching users from database...");
    // Get all users with their last login info
    const [users] = await db.query(
      `SELECT 
        id,
        username,
        nama,
        email,
        role,
        status,
        created_at,
        updated_at,
        last_login
      FROM users 
      WHERE status IN ('aktif', 'active')
      ORDER BY last_login DESC`
    );

    console.log("Users fetched:", (users as any[]).length);

    // Get login activity from recent sessions (if you have a sessions table)
    // For now, we'll just return user data with last_login info
    const formattedUsers = (users as any[]).map((user) => ({
      id: user.id,
      username: user.username,
      nama: user.nama,
      email: user.email || "-",
      role: user.role,
      status: user.status,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      isOnline: user.last_login ? isRecentlyActive(user.last_login) : false
    }));

    console.log("Active users count:", formattedUsers.filter(u => u.isOnline).length);

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      totalActive: formattedUsers.filter(u => u.isOnline).length,
      totalUsers: formattedUsers.length
    });
  } catch (error: any) {
    console.error("Error fetching active users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to check if user was active in last 30 minutes
function isRecentlyActive(lastLogin: Date | string | null): boolean {
  if (!lastLogin) return false;
  
  const loginTime = new Date(lastLogin).getTime();
  const now = new Date().getTime();
  const thirtyMinutes = 30 * 60 * 1000;
  
  return (now - loginTime) < thirtyMinutes;
}
