'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [scoutInvites, setScoutInvites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setNotifications(notifs || [])

      const { data: invites } = await supabase
        .from('scout_invites')
        .select('*, communities(name, banner_index), events(title), inviter:invited_by(full_name)')
        .eq('invited_profile_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      setScoutInvites(invites || [])

      // Mark all as read
      await supabase.from('notifications').update({ is_read: true })
        .eq('profile_id', user.id).eq('is_read', false)

      setLoading(false)
    }
    load()
  }, [])

  const handleInviteResponse = async (inviteId: string, status: 'accepted' | 'ignored', communityId: string) => {
    await supabase.from('scout_invites').update({ status }).eq('id', inviteId)

    if (status === 'accepted') {
      // Auto-join the community
      await supabase.from('community_members').upsert({
        community_id: communityId,
        profile_id: userId,
        role: 'member',
      })
      router.push(`/communities/${communityId}`)
    } else {
      setScoutInvites(prev => prev.filter(i => i.id !== inviteId))
    }
  }

  const notifIcon = (type: string) => {
    const map: any = {
      scout_invite: '🔍',
      certificate_approved: '✅',
      certificate_rejected: '❌',
      community_approved: '✓',
      community_rejected: '✗',
      event_reminder: '📅',
      general: '🔔',
    }
    return map[type] || '🔔'
  }

  const notifColor = (type: string) => {
    if (type === 'certificate_approved' || type === 'community_approved') return 'var(--green)'
    if (type === 'certificate_rejected' || type === 'community_rejected') return 'var(--red)'
    if (type === 'scout_invite') return 'var(--accent)'
    return 'var(--text-2)'
  }

  if (loading) return (
    <div className="page-wrapper"><Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></main>
    </div>
  )

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Scout invites — shown prominently at top */}
        {scoutInvites.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
              🔍 Scout Invites ({scoutInvites.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {scoutInvites.map(invite => (
                <div key={invite.id} className="card" style={{ borderColor: '#4f8ef730' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent-glow)', color: 'var(--accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px', flexShrink: 0,
                    }}>🔍</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                        {invite.communities?.name} wants you!
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '4px' }}>
                        Invited by <strong>{invite.inviter?.full_name}</strong>
                        {invite.events?.title && <> for <strong>{invite.events.title}</strong></>}
                      </div>
                      {invite.message && (
                        <div style={{
                          fontSize: '12px', color: 'var(--text-3)',
                          background: 'var(--bg-4)', borderRadius: 'var(--radius-sm)',
                          padding: '8px 12px', marginBottom: '8px', fontStyle: 'italic',
                        }}>
                          "{invite.message}"
                        </div>
                      )}
                      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '12px' }}>
                        {new Date(invite.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleInviteResponse(invite.id, 'accepted', invite.community_id)}
                        >
                          ✓ Accept & Join
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleInviteResponse(invite.id, 'ignored', invite.community_id)}
                        >
                          Ignore
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All notifications */}
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <div className="empty-title">No notifications yet</div>
            <div className="empty-desc">Certificate updates and scout invites will appear here</div>
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
              All Notifications
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map(n => (
                <div key={n.id} className="card" style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                  opacity: n.is_read ? 0.7 : 1,
                  borderLeft: n.is_read ? undefined : `3px solid ${notifColor(n.type)}`,
                }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{notifIcon(n.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: n.is_read ? '400' : '600', color: 'var(--text)', marginBottom: '2px' }}>
                      {n.title}
                    </div>
                    {n.body && <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{n.body}</div>}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', flexShrink: 0 }}>
                    {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}