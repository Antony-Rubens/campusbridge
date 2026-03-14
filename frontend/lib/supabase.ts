// lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

export type Role = 'student' | 'faculty' | 'system_admin'
export type Scheme = '2019' | '2025'
export type CommunityType = 'class' | 'general'
export type CommunityCategory = 'Technical' | 'Cultural' | 'Sports' | 'Social' | 'Professional'
export type ActivityLevel = 'college' | 'university' | 'national' | 'international'
export type CertStatus = 'pending' | 'approved' | 'rejected'
export type CommunityStatus = 'pending' | 'approved' | 'rejected'
export type ScoutStatus = 'pending' | 'accepted' | 'ignored'
export type NotifType = 'scout_invite' | 'certificate_approved' | 'certificate_rejected' | 'community_approved' | 'community_rejected' | 'event_reminder' | 'general'

export interface Department {
  id: string
  name: string
  code: string
  created_at: string
}

export interface Batch {
  id: string
  name: string
  department_id: string
  semester: number
  scheme: Scheme
  academic_year: string
  faculty_coordinator_id: string | null
  is_graduated: boolean
  created_at: string
  departments?: Department
  faculty_coordinator?: Profile
}

export interface Profile {
  id: string
  full_name: string
  email: string
  role: Role
  department_id: string | null
  batch_id: string | null
  roll_number: string | null
  semester: number | null
  scheme: Scheme | null
  faculty_coordinator_id: string | null
  skills: string[]
  interests: string[]
  github_url: string | null
  linkedin_url: string | null
  avatar_url: string | null
  is_profile_complete: boolean
  created_at: string
  departments?: Department
  batches?: Batch
  faculty_coordinator?: Profile
}

export interface Community {
  id: string
  name: string
  description: string | null
  type: CommunityType
  category: CommunityCategory | null
  banner_index: number
  department_id: string | null
  batch_id: string | null
  created_by: string | null
  faculty_advisor_id: string | null
  status: CommunityStatus
  is_active: boolean
  created_at: string
  departments?: Department
  creator?: Profile
  faculty_advisor?: Profile
  community_members?: CommunityMember[]
  _member_count?: number
  _is_member?: boolean
  _is_admin?: boolean
}

export interface CommunityMember {
  community_id: string
  profile_id: string
  role: 'member' | 'admin'
  joined_at: string
  profiles?: Profile
}

export interface Announcement {
  id: string
  community_id: string
  title: string
  content: string
  created_by: string | null
  is_pinned: boolean
  expires_at: string | null
  created_at: string
  communities?: Community
  creator?: Profile
}

export interface Event {
  id: string
  community_id: string
  title: string
  description: string | null
  event_date: string
  registration_deadline: string | null
  venue: string | null
  ktu_category: string | null
  activity_level: ActivityLevel | null
  suggested_points: number
  max_participants: number | null
  banner_index: number
  created_by: string | null
  created_at: string
  communities?: Community
  creator?: Profile
  _is_registered?: boolean
  _registration_count?: number
}

export interface Certificate {
  id: string
  profile_id: string
  title: string
  activity_category: string
  activity_level: ActivityLevel
  file_path: string | null
  file_deleted: boolean
  status: CertStatus
  suggested_points: number
  awarded_points: number | null
  faculty_remarks: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  profiles?: Profile
  reviewer?: Profile
}

export interface ActivityPointRecord {
  id: string
  profile_id: string
  certificate_id: string
  category: string
  scheme: Scheme
  awarded_points: number
  attempt_number: number
  approved_by: string | null
  created_at: string
  certificates?: Certificate
}

export interface KtuRule {
  id: string
  scheme: Scheme
  category: string
  level: ActivityLevel
  base_points: number
  max_points_per_category: number
  attempt_2_multiplier: number
  attempt_3_multiplier: number
  updated_at: string
}

export interface Notification {
  id: string
  profile_id: string
  type: NotifType
  title: string
  body: string | null
  is_read: boolean
  related_id: string | null
  created_at: string
}

export interface ScoutInvite {
  id: string
  community_id: string
  event_id: string | null
  invited_by: string
  invited_profile_id: string
  message: string | null
  status: ScoutStatus
  created_at: string
  communities?: Community
  events?: Event
  inviter?: Profile
}

// ── Supabase client (browser) ─────────────────────────────────
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    global: {
      fetch: (url: RequestInfo | URL, options?: RequestInit) =>
        fetch(url, { ...options, cache: 'no-store' }),
    },
  }
)

// ── Skills & Interests fixed list ────────────────────────────
export const SKILLS_LIST = {
  'Technical': [
    'Python', 'Java', 'C++', 'JavaScript', 'React', 'Node.js',
    'Machine Learning', 'AI / Deep Learning', 'Data Science',
    'Web Development', 'App Development', 'UI/UX Design',
    'Cybersecurity', 'Cloud Computing', 'IoT', 'Embedded Systems',
    'Robotics', 'CAD / 3D Design', 'Video Editing', 'Photography',
    'Graphic Design', 'Content Writing', 'Research'
  ],
  'Arts & Cultural': [
    'Classical Dance', 'Western Dance', 'Bharatanatyam', 'Mohiniyattam',
    'Kuchipudi', 'Singing (Carnatic)', 'Singing (Western)',
    'Violin', 'Guitar', 'Keyboard', 'Tabla', 'Mridangam', 'Veena', 'Flute',
    'Drama / Theatre', 'Mimicry', 'Elocution', 'Debate', 'Quiz',
    'Fine Arts / Drawing', 'Painting', 'Calligraphy', 'Sculpture'
  ],
  'Sports': [
    'Cricket', 'Football', 'Basketball', 'Volleyball', 'Badminton',
    'Table Tennis', 'Chess', 'Athletics', 'Swimming', 'Kabaddi', 'Kho Kho'
  ],
  'Leadership & Management': [
    'Event Management', 'Public Speaking', 'Team Leadership',
    'Community Management', 'Project Management', 'Entrepreneurship',
    'Social Work', 'NSS', 'NCC'
  ]
}

export const ALL_SKILLS = Object.values(SKILLS_LIST).flat()

// ── Preset banner gradients (index 0-7) ──────────────────────
export const BANNER_GRADIENTS = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',       // 0 — navy deep
  'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',       // 1 — purple cosmos
  'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',                     // 2 — teal forest
  'linear-gradient(135deg, #c94b4b 0%, #4b134f 100%)',                     // 3 — crimson dusk
  'linear-gradient(135deg, #373b44 0%, #4286f4 100%)',                     // 4 — steel blue
  'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',                     // 5 — amber gold
  'linear-gradient(135deg, #141e30 0%, #243b55 100%)',                     // 6 — midnight
  'linear-gradient(135deg, #1d4350 0%, #a43931 100%)',                     // 7 — ocean rust
]

export const BANNER_PATTERNS = [
  '📚', '🚀', '🌿', '🎭', '⚡', '🏆', '🌙', '🔥'
]

// ── KTU Categories ────────────────────────────────────────────
export const KTU_CATEGORIES = ['Sports', 'Cultural', 'Technical', 'Professional', 'Social']
export const ACTIVITY_LEVELS: ActivityLevel[] = ['college', 'university', 'national', 'international']
export const KTU_TARGET_POINTS = 100