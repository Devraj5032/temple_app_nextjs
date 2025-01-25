import { NextResponse } from "next/server";
import { getDbConnection } from "../db/db";
import { parseISO, eachDayOfInterval, isSameDay, isWithinInterval, format, addDays } from "date-fns";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { puja_id, start_date, end_date } = body;

    console.log({ puja_id, start_date, end_date });

    if (!start_date || !end_date) {
      return NextResponse.json(
        { success: false, message: "Start date and end date are required." },
        { status: 400 }
      );
    }

    const startDateObj = parseISO(start_date);
    const endDateObj = parseISO(end_date);

    if (endDateObj < startDateObj) {
      return NextResponse.json(
        { success: false, message: "End date must be after or equal to the start date." },
        { status: 400 }
      );
    }

    const connection = await getDbConnection();

    try {
      // Base query to fetch puja bookings
      let query = `
        SELECT 
          pb.*, 
          p.name AS puja_name, 
          p.description AS puja_description, 
          p.price AS puja_price
        FROM puja_booking pb
        JOIN pujas p ON pb.puja_id = p.id
        WHERE 
          (
            (pb.start_date <= ? AND (pb.end_date >= ? OR pb.end_date IS NULL))
            OR (pb.start_date BETWEEN ? AND ?)
          )
          AND (? IS NULL OR pb.puja_id = ?)
      `;

      const queryParams: (string | number | null)[] = [
        end_date,
        start_date,
        start_date,
        end_date,
        puja_id,
        puja_id,
      ];

      // Execute query
      const [rows] = await connection.execute(query, queryParams);

      console.log(rows);

      // Adjust date for the required offset
      const adjustDateWithOffset = (dateStr: string) => {
        const date = new Date(dateStr);
        date.setUTCHours(date.getUTCHours() + 5, date.getUTCMinutes() + 30); // Adjust to +5:30
        return date;
      };

      // Adjust rows with proper date formatting
      const adjustedRows = rows.map((puja: any) => ({
        ...puja,
        start_date: adjustDateWithOffset(puja.start_date),
        end_date: puja.end_date ? adjustDateWithOffset(puja.end_date) : null,
      }));

      // Generate the range of days
      const daysInRange = eachDayOfInterval({ start: startDateObj, end: endDateObj });

      // Map bookings to their respective dates
      const result = daysInRange.map((day) => {
        const pujasForDay = adjustedRows.filter((puja: any) => {
          const { start_date, end_date, duration_type, weekly_days, monthly_date } = puja;

          switch (duration_type) {
            case "one_time":
              return isSameDay(day, start_date);

            case "daily":
              return isWithinInterval(day, { start: start_date, end: end_date || addDays(day, 1) });

            case "weekly":
              if (!isWithinInterval(day, { start: start_date, end: end_date || addDays(day, 1) })) {
                return false;
              }
              const dayOfWeek = format(day, "EEEE");
              const weeklyDaysArray = JSON.parse(weekly_days);
              return weeklyDaysArray.includes(dayOfWeek);

            case "monthly":
              if (!isWithinInterval(day, { start: start_date, end: end_date || addDays(day, 1) })) {
                return false;
              }
              return day.getDate() === monthly_date;

            default:
              return false;
          }
        });

        return {
          date: format(day, "yyyy-MM-dd"),
          pujas: pujasForDay,
        };
      });

      return NextResponse.json({ success: true, data: result });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { success: false, message: "A database error occurred. Please try again later." },
        { status: 500 }
      );
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { success: false, message: "An internal server error occurred. Please try again later." },
      { status: 500 }
    );
  }
}