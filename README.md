# Life Calendar Wallpaper API

This Next.js application provides an API endpoint to generate a dynamic "Life Calendar" style wallpaper for iPhone, intended to be used with Apple Shortcuts.

## API Endpoint

`GET /api/wallpaper`

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `width` | Number | 1179 | Width of the image |
| `height` | Number | 2556 | Height of the image |
| `color` | String | #000000 | Hex color for current/past days |
| `tz` | String | UTC | Timezone for calculation |

### Example Usage

```
/api/wallpaper?color=%23FF5733&tz=America/New_York
```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000/api/wallpaper](http://localhost:3000/api/wallpaper) with your browser to see the result.
