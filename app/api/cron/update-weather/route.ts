import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const authToken = (req.headers.get('authorization') || '').split('Bearer ').pop();
  if (authToken !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // UPDATED LINE: Explicitly create an admin client to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const openWeatherApiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
    if (!openWeatherApiKey) {
      throw new Error("OpenWeatherMap API key is not configured.");
    }

    // This query will now be run with guaranteed admin rights
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from('teams')
      .select('id, home_location_lat, home_location_lon')
      .not('home_location_lat', 'is', null)
      .not('home_location_lon', 'is', null);

    if (teamsError) throw teamsError;

    if (!teams || teams.length === 0) {
      // If we still get here, the team location data is definitely missing
      console.log("No teams with location found in the database.");
      return NextResponse.json({ message: 'Success (no teams with location found).' });
    }

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