import { NextResponse } from "next/server"
import { getDbConnection } from "../../db/db"

export async function POST(request: Request) {
  try {
    const connection = await getDbConnection()
    const body = await request.json()

    const { startDate, endDate, pujaId } = body

    try {
      let query = `
        SELECT 
          puja_id, 
          duration_type, 
          first_name, 
          last_name, 
          mobile_number, 
          email, 
          address1, 
          city, 
          state, 
          pin_code, 
          total_price, 
          created_at AS booking_made_on
        FROM 
          puja_booking
        WHERE 
          created_at BETWEEN ? AND ?
      `

      const queryParams: any[] = [startDate, endDate]

      if (pujaId) {
        query += " AND puja_id = ?"
        queryParams.push(pujaId)
      }

      query += " ORDER BY created_at DESC"

      const [rows] = await connection.execute(query, queryParams)

      return NextResponse.json(rows)
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ success: false, message: "Database error occurred" }, { status: 500 })
    } finally {
      await connection.end()
    }
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

