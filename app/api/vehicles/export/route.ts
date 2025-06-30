import { createClient } from '@/lib/supabase/server';
import { exportVehiclesToCsv } from '@/lib/export';
import { Vehicle } from '@/lib/types';

export async function GET() {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('team_id')
            .eq('id', user.id)
            .single();

        if (!profile?.team_id) {
            return new Response('User has no team assigned', { status: 403 });
        }

        const { data: vehicles, error } = await supabase
            .from('vehicles_with_details')
            .select('*')
            .eq('team_id', profile.team_id)
            .order('registration_number', { ascending: true });

        if (error) throw error;
        
        const csvData = exportVehiclesToCsv(vehicles as Vehicle[]);

        return new Response(csvData, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="vehicle_inventory_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}