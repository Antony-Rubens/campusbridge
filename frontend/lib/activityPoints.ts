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
}): Promise<{ suggestedPoints: number; maxPoints: number; alreadyEarned: number; message?: string }> {

  const { data: rule } = await supabase
    .from('ktu_rules')
    .select('*')
    .eq('scheme', scheme)
    .eq('sub_activity_code', subActivityCode)
    .single()

  if (!rule) return { suggestedPoints: 0, maxPoints: 0, alreadyEarned: 0, message: 'Activity rule not found in database.' }

  const levelMap: Record<string, string> = {
    college:       'points_l1',
    zonal:         'points_l2',
    state:         'points_l3',
    national:      'points_l4',
    international: 'points_l5',
  }

  let rawPoints = 0

  // Calculate base points with strict fallbacks to 0 to prevent NaN errors
  if (achievementType === 'fixed') {
    rawPoints = rule.points_fixed ?? 0
  } else if (achievementType === 'tier_1') {
    rawPoints = rule.points_tier_1 ?? 0
  } else if (achievementType === 'tier_2') {
    rawPoints = rule.points_tier_2 ?? 0
  } else if (achievementType === 'tier_3') {
    rawPoints = rule.points_tier_3 ?? 0
  } else if (eventLevel && achievementType === 'participation') {
    rawPoints = rule[levelMap[eventLevel]] ?? 0
  } else if (eventLevel && achievementType === 'winner_single') {
    // 2024 Logic: Winning points stand alone (Participation and winning points cannot be combined)
    rawPoints = rule[levelMap[eventLevel]] ?? 0
  } else if (eventLevel && achievementType === 'winner_group') {
    // 2024 Logic: Winning points stand alone 
    rawPoints = rule[levelMap[eventLevel]] ?? 0
  } else if (eventLevel && achievementType === 'first_prize') {
    // 2019 Logic: Base participation + additional winning points 
    rawPoints = (rule[levelMap[eventLevel]] ?? 0) + (rule.winner_first_add ?? 0)
  } else if (eventLevel && achievementType === 'second_prize') {
    // 2019 Logic: Base participation + additional winning points
    rawPoints = (rule[levelMap[eventLevel]] ?? 0) + (rule.winner_second_add ?? 0)
  } else if (eventLevel && achievementType === 'third_prize') {
    // 2019 Logic: Base participation + additional winning points
    rawPoints = (rule[levelMap[eventLevel]] ?? 0) + (rule.winner_third_add ?? 0)
  }

  // Fetch student's existing approved points for this specific activity
  const { data: existing } = await supabase
    .from('activity_point_records')
    .select('awarded_points, event_level')
    .eq('profile_id', profileId)
    .eq('sub_activity_code', subActivityCode)
    .eq('scheme', scheme)

  const alreadyEarned = existing?.reduce((sum: number, r: any) => sum + r.awarded_points, 0) ?? 0

  // 2024 STRICT OVERRIDE RULE: If they already have a higher-level certificate approved, they can't claim a lower level
  if (scheme === '2024') {
    const levels = ['college', 'zonal', 'state', 'national', 'international']
    if (eventLevel && existing && existing.length > 0) {
      const currentIndex = levels.indexOf(eventLevel)
      for (const record of existing) {
        if (record.event_level) {
          const existingIndex = levels.indexOf(record.event_level)
          if (existingIndex > currentIndex) {
            return { 
              suggestedPoints: 0, 
              maxPoints: rule.max_points, 
              alreadyEarned, 
              message: 'A higher-level record already exists for this activity (KTU 2024 Rule).' 
            }
          }
        }
      }
    }
  }

  // Calculate remaining room under the category cap
  const remaining = Math.max(0, (rule.max_points ?? 0) - alreadyEarned)
  const suggestedPoints = Math.max(0, Math.min(rawPoints, remaining))

  // Generate a precise warning message for the UI if points are reduced
  let msg = undefined
  if (rawPoints === 0) {
    msg = 'No points configured for this combination. Check activity rules.'
  } else if (rawPoints > 0 && suggestedPoints === 0) {
    msg = 'Max points already reached for this activity category.'
  } else if (rawPoints > 0 && suggestedPoints < rawPoints) {
    msg = `Points capped. You earn ${suggestedPoints} (would be ${rawPoints}) due to the ${rule.max_points}pt maximum limit.`
  }

  return { suggestedPoints, maxPoints: rule.max_points ?? 0, alreadyEarned, message: msg }
}