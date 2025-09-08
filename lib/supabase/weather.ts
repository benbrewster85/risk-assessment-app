import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// Define the structure of our forecast data
export interface DailyForecast {
  forecast_date: string; // YYYY-MM-DD
  max_temp_celsius: number;
  min_temp_celsius: number;
  weather_icon_code: string;
}

/**
 * Fetches the 14-day weather forecast for all teams with a defined home location
 * and updates the 'daily_forecasts' table in the database.
 * This is designed to be called by a scheduled daily cron job.
 */
export async function updateAllTeamWeatherForecasts() {
  const openWeatherApiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
  if (!openWeatherApiKey) {
    throw new Error("OpenWeatherMap API key is not configured.");
  }

  // 1. Get all teams that have a location set
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, home_location_lat, home_location_lon')
    .not('home_location_lat', 'is', null)
    .not('home_location_lon', 'is', null);

  if (teamsError) throw teamsError;
  if (!teams || teams.length === 0) {
    console.log("No teams with location set. Skipping weather update.");
    return;
  }

  // 2. Iterate over each team and fetch their forecast
  for (const team of teams) {
    const { id: team_id, home_location_lat, home_location_lon } = team;
    const apiUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${home_location_lat}&lon=${home_location_lon}&exclude=current,minutely,hourly,alerts&appid=${openWeatherApiKey}&units=metric`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data.daily) {
        console.warn(`No daily forecast data for team ${team_id}`);
        continue;
      }

      // 3. Format the data for our database
      const forecastsToUpsert = data.daily.slice(0, 14).map((day: any) => ({
        team_id: team_id,
        forecast_date: new Date(day.dt * 1000).toISOString().split('T')[0],
        max_temp_celsius: day.temp.max,
        min_temp_celsius: day.temp.min,
        weather_icon_code: day.weather[0].icon,
        last_updated: new Date().toISOString(),
      }));
      
      // 4. Upsert the data into the database
      const { error: upsertError } = await supabase
        .from('daily_forecasts')
        .upsert(forecastsToUpsert, { onConflict: 'team_id, forecast_date' });
        
      if (upsertError) {
        console.error(`Failed to upsert weather for team ${team_id}:`, upsertError);
      } else {
        console.log(`Successfully updated weather for team ${team_id}`);
      }

    } catch (error) {
      console.error(`Error fetching weather for team ${team_id}:`, error);
    }
  }
}

/**
 * Gets the cached weather forecast for a specific team and date range from the local database.
 * @param teamId The UUID of the team.
 * @param dates An array of Date objects for which to fetch forecasts.
 * @returns An array of DailyForecast objects.
 */
export async function getCachedWeatherForDates(teamId: string, dates: Date[]): Promise<DailyForecast[]> {
  if (!teamId || dates.length === 0) {
    return [];
  }

  const dateStrings = dates.map(d => d.toISOString().split('T')[0]);
  
  const { data, error } = await supabase
    .from('daily_forecasts')
    .select('forecast_date, max_temp_celsius, min_temp_celsius, weather_icon_code')
    .eq('team_id', teamId)
    .in('forecast_date', dateStrings);

  if (error) {
    console.error("Error fetching cached weather:", error);
    return [];
  }
  
  return data as DailyForecast[];
}