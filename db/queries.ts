import supabase from './supabase';
import { type GameplayEntry } from '../lib/types';

export async function getEfrogrPlaysStats() {
  const { data: entries, error } = await supabase
    .from('efrogr_plays_stats')
    .select('*');

  if (error) {
    console.error(`Failed to get efrogr_plays_stats from db`, error);
    throw new Error(`Failed to get efrogr_plays_stats from db: ${error}`);
  }

  return entries as GameplayEntry[];
}
