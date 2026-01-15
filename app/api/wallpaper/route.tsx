import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { getDaysInYear, getDayOfYear } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    // Parse width and height with defaults
    const width = parseInt(searchParams.get('width') || '1179', 10);
    const height = parseInt(searchParams.get('height') || '2556', 10);

    // Parse color (default to black)
    const color = searchParams.get('color') || '#000000';

    // Parse timezone (default to UTC)
    const tz = searchParams.get('tz') || 'UTC';

    // Calculate dates
    const now = new Date();
    let zonedDate: Date;
    try {
        zonedDate = toZonedTime(now, tz);
    } catch (error) {
        // Fallback if timezone is invalid
        console.error('Invalid timezone:', tz, error);
        zonedDate = now;
    }

    const daysTotal = getDaysInYear(zonedDate);
    const dayIndex = getDayOfYear(zonedDate); // 1-based index (1 to 365/366)
    const percent = Math.round((dayIndex / daysTotal) * 100);

    // Generate dots array
    const dots = Array.from({ length: daysTotal }, (_, i) => {
        const currentDay = i + 1;
        return {
            filled: currentDay <= dayIndex,
        };
    });

    // Styles
    // We want a grid that fits nicely. 
    // For ~365 items, a square-ish grid or a rectangle grid ratio is needed.
    // 1179 width. Let's aim for the dots to occupy central 80% width.
    // Dot sizing calculation:
    // sqrt(365) is approx 19. So 19 columns roughly.
    // Let's settle on a comfortable gap and size relative to width.
    const contentWidth = width * 0.8;
    // Estimate column count based on width/height ratio? 
    // Or just let flexbox wrap.
    // Dot size:
    const dotSize = Math.floor(contentWidth / 22); // ~22 dots per row max
    const gap = Math.floor(dotSize * 0.4);

    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start', // Top-aligned content but with padding
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#ffffff',
                    paddingTop: height * 0.15, // 15% padding top
                    paddingBottom: height * 0.15,
                    paddingLeft: width * 0.1,
                    paddingRight: width * 0.1,
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Year Progress Header */}
                <div
                    style={{
                        display: 'flex',
                        fontSize: width * 0.08,
                        fontWeight: 900,
                        color: color,
                        marginBottom: height * 0.05,
                    }}
                >
                    {percent}% Completed
                </div>

                {/* Dots Container */}
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
                                backgroundColor: dot.filled ? color : '#e5e7eb',
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
