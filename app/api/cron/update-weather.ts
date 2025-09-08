import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// This tells Next.js to run this function as an Edge Function for speed.
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  // 1. Check for the secret authorization token from the header
  const authToken = (req.headers.get('authorization') || '').split('Bearer ').pop();
  if (authToken !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Create a Supabase admin client to bypass RLS for server-side operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const openWeatherApiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
    if (!openWeatherApiKey) {
      throw new Error("OpenWeatherMap API key is not configured.");
    }

    // 3. Get all teams that have a location set
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from('teams')
      .select('id, home_location_lat, home_location_lon')
      .not('home_location_lat', 'is', null)
      .not('home_location_lon', 'is', null);

    if (teamsError) throw teamsError;

    if (!teams || teams.length === 0) {
      console.log("No teams with location set. Skipping weather update.");
      return NextResponse.json({ message: 'No teams with location set.' });
    }

    // 4. Iterate over each team, fetch their forecast, and upsert to the DB
    for (const team of teams) {
      const { id: team_id, home_location_lat, home_location_lon } = team;
      const apiUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${home_location_lat}&lon=${home_location_lon}&exclude=current,minutely,hourly,alerts&appid=${openWeatherApiKey}&units=metric`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data.daily) continue;

      const forecastsToUpsert = data.daily.slice(0, 14).map((day: any) => ({
        team_id: team_id,
        forecast_date: new Date(day.dt * 1000).toISOString().split('T')[0],
        max_temp_celsius: day.temp.max,
        min_temp_celsius: day.temp.min,
        weather_icon_code: day.weather[0].icon,
      }));

      await supabaseAdmin
        .from('daily_forecasts')
        .upsert(forecastsToUpsert, { onConflict: 'team_id, forecast_date' });
    }

    return NextResponse.json({ message: 'Weather update completed successfully.' });

  } catch (error: any) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}