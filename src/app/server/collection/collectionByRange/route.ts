import { NextResponse } from "next/server";
import { getDbConnection } from "@/app/server/db/db"; // Adjust path as needed

export async function POST(request) {
    try {
        // Parse the request body for inputs
        const { startDate, endDate, pujaId, collectionType } = await request.json();

        // Validate inputs
        if (!startDate || !endDate || !collectionType) {
            return NextResponse.json(
                { success: false, message: "Start date, end date, and collection type are required." },
                { status: 400 }
            );
        }

        // Check for valid collectionType
        if (!["payment_date", "puja_date"].includes(collectionType)) {
            return NextResponse.json(
                { success: false, message: "Invalid collection type. Use 'payment_date' or 'puja_date'." },
                { status: 400 }
            );
        }

        // Establish a database connection
        const connection = await getDbConnection();

        try {
            let query;
            const queryParams = [startDate, endDate];

            // Construct query based on collection type and optional puja filter
            if (collectionType === "payment_date") {
                query = `
                    SELECT 
                        pb.id AS booking_id,
                        pb.first_name,
                        pb.last_name,
                        pb.mobile_number,
                        pb.email,
                        pb.city,
                        pb.state,
                        pb.total_price,
                        pb.payment_date,
                        pb.status,
                        p.name AS puja_name
                    FROM 
                        puja_booking pb
                    LEFT JOIN 
                        pujas p ON pb.puja_id = p.id
                    WHERE 
                        pb.payment_date BETWEEN ? AND ?
                        ${pujaId ? "AND pb.puja_id = ?" : ""}; 
                `;
                if (pujaId) queryParams.push(pujaId);
            } else if (collectionType === "puja_date") {
                query = `
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
                        bd.date BETWEEN ? AND ?
                        ${pujaId ? "AND pb.puja_id = ?" : ""}
                    GROUP BY 
                        bd.date, pb.puja_id, p.name, p.price
                    ORDER BY 
                        bd.date ASC, pb.puja_id ASC;
                `;
                if (pujaId) queryParams.push(pujaId);
            }

            // Execute the query
            const [rows] = await connection.execute(query, queryParams);

            // Calculate total collection if applicable
            const totalCollection = rows.reduce((sum, record) => {
                return collectionType === "payment_date"
                    ? sum + parseFloat(record.total_price || 0)
                    : sum + parseFloat(record.total_collection || 0);
            }, 0);

            // Return response
            return NextResponse.json({
                success: true,
                data: {
                    total_collection: totalCollection,
                    details: rows,
                },
            });
        } catch (dbError) {
            console.error("Database error:", dbError.message);
            return NextResponse.json(
                { success: false, message: "Database error occurred." },
                { status: 500 }
            );
        } finally {
            await connection.end();
        }
    } catch (error) {
        console.error("Internal server error:", error.message);
        return NextResponse.json(
            { success: false, message: "Internal server error." },
            { status: 500 }
        );
    }
}
