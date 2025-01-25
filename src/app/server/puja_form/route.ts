import { type NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "../db/db"
import { RowDataPacket, type OkPacket } from "mysql2"

function formatDateForMySQL(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ")
}

function calculateBookingDates(start: Date, end: Date, frequency: string, weeklyDays?: string[]): Date[] {
  const dates: Date[] = []
  const current = new Date(start)
  const endDate = new Date(end)

  while (current <= endDate) {
    switch (frequency) {
      case "one_time":
        dates.push(new Date(current))
        return dates
      case "daily":
        dates.push(new Date(current))
        break
      case "weekly":
        if (
          weeklyDays &&
          weeklyDays.includes(
            ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][current.getDay()],
          )
        ) {
          dates.push(new Date(current))
        }
        break
      case "monthly":
        if (current.getDate() === start.getDate()) {
          dates.push(new Date(current))
        }
        break
    }
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export async function POST(req: NextRequest) {
  const connection = await getDbConnection()
  await connection.beginTransaction()

  try {
    const body = await req.json()
    console.log(body)

    // Insert main booking data
    const [bookingResult] = await connection.execute<OkPacket>(
      `INSERT INTO puja_booking (
        puja_id, start_date, end_date, duration_type, weekly_days, monthly_date,
        first_name, last_name, mobile_number, email, address1, address2,
        city, state, pin_code, remarks, total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.selected_puja,
        formatDateForMySQL(new Date(body.start_date)),
        body.end_date ? formatDateForMySQL(new Date(body.end_date)) : null,
        body.duration,
        Array.isArray(body.weekly_days) ? JSON.stringify(body.weekly_days) : body.weekly_days,
        body.monthly_date || null,
        body.first_name,
        body.last_name,
        body.mobile_number,
        body.email || null,
        body.address1,
        body.address2 || null,
        body.city,
        body.state,
        body.pin_code,
        body.remarks || null,
        body.total_price,
      ],
    )

    const bookingId = bookingResult.insertId

    // Insert family member details
    for (const member of body.family_members) {
      await connection.execute(
        `INSERT INTO family_members (
          booking_id, name, nakshatram, gotram, rashi
        ) VALUES (?, ?, ?, ?, ?)`,
        [bookingId, member.name, member.nakshatram, member.gotram, member.rashi],
      )
    }

    // Calculate and insert booking dates
    const startDate = new Date(body.start_date)
    const endDate = body.end_date ? new Date(body.end_date) : startDate
    const bookingDates = calculateBookingDates(startDate, endDate, body.duration, body.weekly_days)

    for (const date of bookingDates) {
      await connection.execute(
        `INSERT INTO booking_dates (
          puja_id, booking_id, date, day
        ) VALUES (?, ?, ?, ?)`,
        [
          body.selected_puja,
          bookingId,
          formatDateForMySQL(date),
          ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()],
        ],
      )
    }

    await connection.commit()

    return NextResponse.json({ success: true, message: "Booking created successfully", bookingId }, { status: 201 })
  } catch (error) {
    await connection.rollback()
    console.error("Error creating booking:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 },
    )
  } finally {
    await connection.end()
  }
}

