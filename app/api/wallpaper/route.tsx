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
    // Reverting to original "Life Calendar" style spacing
    const contentWidth = width * 0.8;
    const dotSize = Math.floor(contentWidth / 22); // ~22 dots per row max
    const gap = Math.floor(dotSize * 0.4);

    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start', // Top-aligned content
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#000000', // Black background
                    paddingTop: height * 0.36, // 15% padding top
                    paddingBottom: height * 0.15,
                    paddingLeft: width * 0.1,
                    paddingRight: width * 0.1,
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
