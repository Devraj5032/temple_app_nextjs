import { NextResponse } from "next/server";
import { getDbConnection } from "../db/db";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const pujaId = searchParams.get("puja_id");

        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, "0");
        const day = String(currentDate.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;

        const connection = await getDbConnection();

        try {
            const query = `
                SELECT 
                    bd.puja_id, 
                    bd.booking_id, 
                    bd.date, 
                    bd.day, 
                    pb.remarks, 
                    fm.name AS family_name, 
                    fm.nakshatram AS nakshatram_id, 
                    fm.gotram AS gotram_id, 
                    fm.rashi AS rashi_id, 
                    n.name_english AS nakshatram_name_english, 
                    g.name_english AS gotram_name_english, 
                    r.name_english AS rashi_name_english, 
                    n.name_hindi AS nakshatram_name_hindi, 
                    g.name_hindi AS gotram_name_hindi, 
                    r.name_hindi AS rashi_name_hindi, 
                    n.name_tamil AS nakshatram_name_tamil, 
                    g.name_tamil AS gotram_name_tamil, 
                    r.name_tamil AS rashi_name_tamil
                FROM booking_dates AS bd
                JOIN puja_booking AS pb ON pb.id = bd.booking_id
                JOIN family_members AS fm ON pb.id = fm.booking_id
                JOIN nakshatram AS n ON fm.nakshatram = n.id
                JOIN gotram AS g ON fm.gotram = g.id
                JOIN rashi AS r ON fm.rashi = r.id
                WHERE DATE(bd.date) = ?
                ${pujaId ? "AND bd.puja_id = ?" : ""}
                ORDER BY bd.puja_id, bd.booking_id;
            `;

            const params = pujaId ? [formattedDate, pujaId] : [formattedDate];
            const [rows] = await connection.execute(query, params);

            // Transform data to group family details
            const groupedData = rows.reduce((acc, row) => {
                const {
                    puja_id,
                    booking_id,
                    date,
                    day,
                    remarks,
                    family_name,
                    nakshatram_id,
                    gotram_id,
                    rashi_id,
                    nakshatram_name_english,
                    gotram_name_english,
                    rashi_name_english,
                    nakshatram_name_hindi,
                    gotram_name_hindi,
                    rashi_name_hindi,
                    nakshatram_name_tamil,
                    gotram_name_tamil,
                    rashi_name_tamil,
                } = row;

                const bookingKey = `${puja_id}-${booking_id}`;
                if (!acc[bookingKey]) {
                    acc[bookingKey] = {
                        puja_id,
                        booking_id,
                        date,
                        day,
                        remarks,
                        family_data: [],
                    };
                }

                acc[bookingKey].family_data.push({
                    name: family_name,
                    nakshatram_id,
                    gotram_id,
                    rashi_id,
                    nakshatram_name_english,
                    gotram_name_english,
                    rashi_name_english,
                    nakshatram_name_hindi,
                    gotram_name_hindi,
                    rashi_name_hindi,
                    nakshatram_name_tamil,
                    gotram_name_tamil,
                    rashi_name_tamil,
                });

                return acc;
            }, {});

            const result = Object.values(groupedData);

            return NextResponse.json({ success: true, data: result });
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
