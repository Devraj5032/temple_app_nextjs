import { NextResponse } from "next/server";
import { getDbConnection } from "../../db/db";

export async function POST(request) {
    try {
        const connection = await getDbConnection();

        try {
            const { phone_number, password } = await request.json(); // Get the request body
            
            // Validate input
            if (!phone_number || !password) {
                return NextResponse.json(
                    { success: false, message: "Phone number and password are required" },
                    { status: 400 }
                );
            }

            // Query the database to find the user
            const query = `
                SELECT * 
                FROM user_master 
                WHERE phone_number = ? AND password = ?
            `;
            const [rows] = await connection.execute(query, [phone_number, password]);

            // Check if user exists
            if (rows.length === 0) {
                return NextResponse.json(
                    { success: false, message: "Invalid phone number or password" },
                    { status: 401 }
                );
            }

            // Return success with user data (omit sensitive data like password)
            const user = rows[0];
            delete user.password; // Remove password before sending the response

            return NextResponse.json({ success: true, user });
        } catch (dbError) {
            console.error("Database error:", dbError);
            return NextResponse.json(
                { success: false, message: "Database error occurred" },
                { status: 500 }
            );
        } finally {
            await connection.end();
        }
    } catch (error) {
        console.error("Error processing login:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
