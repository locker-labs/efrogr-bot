import { type Address } from 'viem';

export interface GameplayEntry {
  user_id: number;
  tg_id: string;
  address: Address;
  play_date: string;
  last_play_date: string;
  tg_username: string;
  num_plays: number;
  high_score: number;
  croak_used: number;
}
