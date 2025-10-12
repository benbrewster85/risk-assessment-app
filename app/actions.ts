'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function updateOrderStatus(orderId: string, newStatus: 'approved' | 'ordered' | 'received' | 'rejected') {
  const supabase = createClient();

  const { error: updateError } = await supabase
    .from('order_requests')
    .update({ status: newStatus, resolved_at: new Date().toISOString() })
    .eq('id', orderId);

  if (updateError) {
    return { error: 'Failed to update order status.' };
  }

  if (newStatus === 'received') {
    const { data: order } = await supabase
      .from('order_requests')
      .select('*, inventory_items(id)')
      .eq('id', orderId)
      .single();

    if (order?.inventory_items?.id) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.rpc('handle_inventory_transaction', {
        item_id_in: order.inventory_items.id,
        user_id_in: user!.id,
        type_in: 'check_in',
        quantity_change_in: order.quantity,
        notes_in: `Order received. Request ID: ${order.id}`,
      });
    }
  }

  revalidatePath('/dashboard/orders');
  return { success: 'Order status updated.' };
}

export async function updateMemberRoles(memberId: string, isStoresperson: boolean, isFleetManager: boolean) {
  const supabase = createClient();

  const { error } = await supabase
    .from('profiles')
    .update({ 
      is_storesperson: isStoresperson,
      is_fleet_manager: isFleetManager 
    })
    .eq('id', memberId);

  if (error) {
    console.error('Error updating member roles:', error);
    return { error: 'Failed to update roles.' };
  }

  // Revalidate the path to show the updated data
  revalidatePath(`/dashboard/team/${memberId}`);
  return { success: 'Roles updated successfully.' };
}