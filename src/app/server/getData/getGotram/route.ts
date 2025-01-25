import { NextResponse } from "next/server";
import { getDbConnection } from "../../db/db";

export async function GET() {
  try {
    const connection = await getDbConnection();

    try {
      // Add ORDER BY clause to sort results alphabetically by the 'name' column
      const [rows] = await connection.execute(
        "SELECT * FROM gotram ORDER BY name_english ASC"
      );
      console.log(rows);

      return NextResponse.json(rows);
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
    console.error("Error fetching pujas:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
