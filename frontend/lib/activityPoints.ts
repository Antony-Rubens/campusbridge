'use client'
import { supabase } from '@/lib/supabase'

export async function calculateSuggestedPoints({
  profileId,
  scheme,
  subActivityCode,
  eventLevel,
  achievementType,
}: {
  profileId: string
  scheme: string
  subActivityCode: string
  eventLevel: string | null
  achievementType: string
}): Promise<{ suggestedPoints: number; maxPoints: number; alreadyEarned: number }> {

  const { data: rule } = await supabase
    .from('ktu_rules')
    .select('*')
    .eq('scheme', scheme)
    .eq('sub_activity_code', subActivityCode)
    .single()

  if (!rule) return { suggestedPoints: 0, maxPoints: 0, alreadyEarned: 0 }

  const levelMap: Record<string, string> = {
    college:       'points_l1',
    zonal:         'points_l2',
    state:         'points_l3',
    national:      'points_l4',
    international: 'points_l5',
  }

  let rawPoints = 0

  if (achievementType === 'fixed') {
    rawPoints = rule.points_fixed
  } else if (achievementType === 'tier_1') {
    rawPoints = rule.points_tier_1
  } else if (achievementType === 'tier_2') {
    rawPoints = rule.points_tier_2
  } else if (achievementType === 'tier_3') {
    rawPoints = rule.points_tier_3
  } else if (eventLevel && achievementType === 'participation') {
    rawPoints = rule[levelMap[eventLevel]] ?? 0
  } else if (eventLevel && achievementType === 'winner_single') {
    rawPoints = rule[levelMap[eventLevel]] ?? 0
  } else if (eventLevel && achievementType === 'winner_group') {
    rawPoints = rule[levelMap[eventLevel]] ?? 0
  } else if (eventLevel && achievementType === 'first_prize') {
    rawPoints = (rule[levelMap[eventLevel]] ?? 0) + (rule.winner_first_add ?? 0)
  } else if (eventLevel && achievementType === 'second_prize') {
    rawPoints = (rule[levelMap[eventLevel]] ?? 0) + (rule.winner_second_add ?? 0)
  } else if (eventLevel && achievementType === 'third_prize') {
    rawPoints = (rule[levelMap[eventLevel]] ?? 0) + (rule.winner_third_add ?? 0)
  }

  const { data: existing } = await supabase
    .from('activity_point_records')
    .select('awarded_points, event_level')
    .eq('profile_id', profileId)
    .eq('sub_activity_code', subActivityCode)
    .eq('scheme', scheme)

  const alreadyEarned =
    existing?.reduce((sum: number, r: any) => sum + r.awarded_points, 0) ?? 0

  const levels = ['college', 'zonal', 'state', 'national', 'international']
  if (eventLevel && existing && existing.length > 0) {
    const currentIndex = levels.indexOf(eventLevel)
    for (const record of existing) {
      if (record.event_level) {
        const existingIndex = levels.indexOf(record.event_level)
        if (existingIndex > currentIndex) {
          return { suggestedPoints: 0, maxPoints: rule.max_points, alreadyEarned }
        }
      }
    }
  }

  const remaining = rule.max_points - alreadyEarned
  const suggestedPoints = Math.max(0, Math.min(rawPoints, remaining))

  return { suggestedPoints, maxPoints: rule.max_points, alreadyEarned }
}