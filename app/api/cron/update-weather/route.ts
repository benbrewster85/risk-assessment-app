import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const authToken = (req.headers.get('authorization') || '').split('Bearer ').pop();
  if (authToken !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log("Cron job started: Initializing Supabase admin client.");
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.CRON_SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const openWeatherApiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
    if (!openWeatherApiKey) throw new Error("OpenWeatherMap API key is not configured.");

    console.log("Fetching teams with locations from the database...");
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from('teams')
      .select('id, home_location_lat, home_location_lon')
      .not('home_location_lat', 'is', null)
      .not('home_location_lon', 'is', null);

    if (teamsError) throw teamsError;

    // ADDED LOG: Check how many teams were found
    console.log(`Found ${teams?.length || 0} teams with locations.`);

    if (!teams || teams.length === 0) {
      return NextResponse.json({ message: 'Success (no teams with location found).' });
    }

    for (const team of teams) {
      // ADDED LOG: Log which team is being processed
      console.log(`Processing weather for team ID: ${team.id}`);
      const { id: team_id, home_location_lat, home_location_lon } = team;
      const apiUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${home_location_lat}&lon=${home_location_lon}&exclude=current,minutely,hourly,alerts&appid=${openWeatherApiKey}&units=metric`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (!data.daily) {
        console.log(`No daily data from OpenWeatherMap for team ${team.id}. Skipping.`);
        continue;
      }

      const forecastsToUpsert = data.daily.slice(0, 14).map((day: any) => ({
        team_id: team_id,
        forecast_date: new Date(day.dt * 1000).toISOString().split('T')[0],
        max_temp_celsius: day.temp.max,
        min_temp_celsius: day.temp.min,
        weather_icon_code: day.weather[0].icon,
      }));
      
      // --- START OF NEW LOGGING ---
      console.log(`Attempting to upsert data for team ${team.id}. First record:`, JSON.stringify(forecastsToUpsert[0], null, 2));

      const { data: upsertData, error: upsertError } = await supabaseAdmin
        .from('daily_forecasts')
        .upsert(forecastsToUpsert, { onConflict: 'team_id, forecast_date' })
        .select(); // IMPORTANT: Added .select() to get a response
      
      if (upsertError) {
        console.error(`CRITICAL: Supabase upsert failed for team ${team.id}:`, upsertError);
        // We will continue to the next team instead of stopping
        continue; 
      }

      console.log(`SUCCESS: Supabase upsert completed for team ${team.id}. Response count:`, upsertData?.length || 0);
      // --- END OF NEW LOGGING ---
    }

    console.log("Cron job finished.");
    return NextResponse.json({ message: 'Weather update completed successfully.' });

  } catch (error: any) {
    console.error('Cron job failed with a catchable error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}