import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import {
  HiOutlineViewGrid,
  HiOutlinePlus,
  HiOutlineInbox,
  HiOutlinePaperAirplane,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineShieldCheck,
} from 'react-icons/hi';

const navItems = [
  { to: '/dashboard',   label: 'Dashboard',  Icon: HiOutlineViewGrid },
  { to: '/new-secret',  label: 'New Secret', Icon: HiOutlinePlus },
  { to: '/inbox',       label: 'Inbox',      Icon: HiOutlineInbox, badge: true },
  { to: '/sent',        label: 'Sent',       Icon: HiOutlinePaperAirplane },
  { to: '/profile',     label: 'Profile',    Icon: HiOutlineUser },
];

export default function Sidebar({ inboxCount = 0 }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col z-20
                      bg-[#0e0f1a]/95 backdrop-blur-xl border-r border-white/5">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <HiOutlineShieldCheck className="text-white w-5 h-5" />
          </div>
          <span className="text-white font-extralight text-lg tracking-widest">
            luka<span className="text-purple-400 font-bold">MARI</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
              ${isActive
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="flex-1">{label}</span>
            {badge && inboxCount > 0 && (
              <span className="bg-purple-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {inboxCount > 99 ? '99+' : inboxCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom — user + sign out */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <NavLink
          to="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group"
        >
          <Avatar name={profile?.username ?? ''} avatarUrl={profile?.avatar_url} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{profile?.username ?? '—'}</p>
            <p className="text-gray-500 text-xs truncate">{profile?.email ?? ''}</p>
          </div>
        </NavLink>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                     text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <HiOutlineLogout className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
