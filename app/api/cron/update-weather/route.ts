import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const authToken = (req.headers.get('authorization') || '').split('Bearer ').pop();
  if (authToken !== process.env.NEXT_PUBLIC_CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { teamId } = await req.json(); // Expect a teamId in the request
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, home_location_lat, home_location_lon')
      .eq('id', teamId)
      .single();
      
    if (teamError || !team) {
       return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }
    
    const { home_location_lat, home_location_lon } = team;
    const openWeatherApiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY!;
    
    const apiUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${home_location_lat}&lon=${home_location_lon}&exclude=current,minutely,hourly,alerts&appid=${openWeatherApiKey}&units=metric`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.daily) {
      throw new Error(`OpenWeatherMap API error: ${JSON.stringify(data)}`);
    }

    const forecastsToUpsert = data.daily.slice(0, 14).map((day: any) => ({
      team_id: teamId,
      forecast_date: new Date(day.dt * 1000).toISOString().split('T')[0],
      max_temp_celsius: day.temp.max,
      min_temp_celsius: day.temp.min,
      weather_icon_code: day.weather[0].icon,
    }));

    await supabaseAdmin
      .from('daily_forecasts')
      .upsert(forecastsToUpsert, { onConflict: 'team_id, forecast_date' });
      
    // IMPORTANT: Update the timestamp for the team
    await supabaseAdmin
        .from('teams')
        .update({ weather_last_updated_at: new Date().toISOString() })
        .eq('id', teamId);

    return NextResponse.json({ message: 'Weather update completed successfully.' });

  } catch (error: any) {
    console.error('Weather update failed:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}