import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { exportAssetsToCsv } from '@/lib/export'; // We will create this function next
import { Asset } from '@/lib/types';

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

        // Fetch all assets for the user's team, including joined data
        const { data: assets, error } = await supabase
            .from('assets')
            .select('*, category:asset_categories(name), assignee:profiles(first_name, last_name)')
            .eq('team_id', profile.team_id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Transform the data to handle Supabase's nested array structure
        const transformedAssets = (assets || []).map(asset => ({
            ...asset,
            category: Array.isArray(asset.category) ? asset.category[0] : asset.category,
            assignee: Array.isArray(asset.assignee) ? asset.assignee[0] : asset.assignee,
        }));
        
        // Generate the CSV string using our helper
        const csvData = exportAssetsToCsv(transformedAssets as Asset[]);

        // Return the CSV data as a downloadable file
        return new Response(csvData, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="asset_inventory_backup_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}