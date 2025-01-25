import { NextResponse } from "next/server";
import { getDbConnection } from "@/app/server/db/db"; // Adjust path as needed

export async function POST(request) {
    try {
        // Parse the request body for the date range
        const { startDate, endDate } = await request.json();

        // Validate the date inputs
        if (!startDate || !endDate) {
            return NextResponse.json(
                { success: false, message: "Both startDate and endDate are required." },
                { status: 400 }
            );
        }

        // Establish a database connection
        const connection = await getDbConnection();

        try {
            // Query to calculate total collection by puja dates
            const query = `
                SELECT 
                    bd.date AS puja_date,
                    pb.puja_id,
                    p.name AS puja_name,
                    COUNT(DISTINCT bd.booking_id) AS total_bookings,
                    p.price AS daily_price,
                    (COUNT(DISTINCT bd.booking_id) * p.price) AS total_collection
                FROM 
                    booking_dates bd
                INNER JOIN 
                    puja_booking pb ON bd.booking_id = pb.id
                INNER JOIN 
                    pujas p ON pb.puja_id = p.id
                WHERE 
                    bd.date BETWEEN ? AND ? -- Filter by puja date range
                GROUP BY 
                    bd.date, pb.puja_id, p.name, p.price
                ORDER BY 
                    bd.date ASC, pb.puja_id ASC;
            `;

            // Execute the query with the date range parameters
            const [rows] = await connection.execute(query, [startDate, endDate]);

            // Calculate the overall total collection across all dates
            const overallTotal = rows.reduce((sum, record) => sum + parseFloat(record.total_collection || 0), 0);

            // Return the meaningful data and total collection
            return NextResponse.json({
                success: true,
                data: {
                    overall_total_collection: overallTotal,
                    date_wise_summary: rows,
                },
            });
        } catch (dbError) {
            console.error("Database error:", dbError.message);
            return NextResponse.json(
                { success: false, message: "Database error occurred" },
                { status: 500 }
            );
        } finally {
            await connection.end();
        }
    } catch (error) {
        console.error("Internal error:", error.message);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
