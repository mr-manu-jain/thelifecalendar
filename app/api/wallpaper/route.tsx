import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getDaysInYear, getDayOfYear, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    // Parse width and height with defaults
    const width = parseInt(searchParams.get('width') || '1179', 10);
    const height = parseInt(searchParams.get('height') || '2556', 10);

    // Parse color (default to red for the current day)
    const activeColor = searchParams.get('color') || '#FF3B30'; // Apple-ish Red

    // Parse date or use current time
    const dateParam = searchParams.get('date');
    // Parse timezone (default to UTC), though if ISO is provided with offset, it handles itself mostly
    const tz = searchParams.get('tz') || 'UTC';

    let targetDate: Date;

    if (dateParam) {
        try {
            targetDate = parseISO(dateParam);
        } catch (e) {
            console.error('Invalid date param', e);
            targetDate = new Date();
        }
    } else {
        targetDate = new Date();
    }

    // If a timezone is strictly required for "Day of Year" calculation relative to a wall clock:
    let zonedDate: Date;
    try {
        // If the date string already has timezone info, toZonedTime might adjust it to the target TZ
        zonedDate = toZonedTime(targetDate, tz);
    } catch (error) {
        console.error('Timezone error:', error);
        zonedDate = targetDate;
    }

    const daysTotal = getDaysInYear(zonedDate);
    const dayIndex = getDayOfYear(zonedDate); // 1-based index (1 to 365/366)

    // Generate dots array
    const dots = Array.from({ length: daysTotal }, (_, i) => {
        const currentDotDay = i + 1;
        let color = '#333333'; // Future days (Dark Gray)

        if (currentDotDay < dayIndex) {
            color = '#ffffff'; // Past days (White)
        } else if (currentDotDay === dayIndex) {
            color = activeColor; // Current day (Red/Custom)
        }

        return { color };
    });

    // Layout Calculations
    // Aim for a grid that fits comfortably in the center vertical area
    // iPhone lockscreen safe area is roughly top 20% and bottom 10-15%

    const contentWidth = width * 0.85; // Use 85% of width

    // Create a grid. 13 columns looks decent for ~365 dots (28 rows)
    // or let flex wrap handle it naturally with a good size.
    // 1179px width -> 85% = ~1000px.
    // If we want ~13 columns: 1000 / 13 = ~76px per item (including gap).
    // Let's try to infer a good size. 
    // Let's stick to a fixed size that looks good on mobile.

    const cols = 13;
    const gap = Math.floor(contentWidth / (cols * 4)); // specific ratio for aesthetic
    const dotSize = Math.floor((contentWidth - (gap * (cols - 1))) / cols);

    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center', // Center vertically in the safe area?
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#000000', // Black background
                    padding: '220px 40px 100px 40px'
                    // paddingTop: height * 0.35, // Space for Clock/Widgets
                    // paddingBottom: height * 0.25, // Space for dock/buttons
                    // paddingLeft: width * 0.075,
                    // paddingRight: width * 0.075,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        alignContent: 'flex-start',
                        gap: gap,
                        width: '100%',
                        // Limit the height if needed, or let it flow
                    }}
                >
                    {dots.map((dot, index) => (
                        <div
                            key={index}
                            style={{
                                width: dotSize,
                                height: dotSize,
                                borderRadius: '50%',
                                backgroundColor: dot.color,
                            }}
                        />
                    ))}
                </div>
            </div>
        ),
        {
            width,
            height,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        }
    );
}
