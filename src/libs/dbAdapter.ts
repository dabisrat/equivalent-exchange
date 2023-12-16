import {supabase} from '../libs/supabaseClient';

export const dbAdapter = {
  async getUser() {
    const {data, error} = await supabase.from('todos').select('*');
    if (error) throw error;
    return data;
  }
};