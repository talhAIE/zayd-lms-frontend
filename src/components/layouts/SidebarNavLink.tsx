import { Link } from "react-router-dom";
import { PiSquaresFourFill, PiBookOpenBold, PiTrophyBold, PiChartBarBold, PiHeadsetBold } from "react-icons/pi";

const icons = {
  Dashboard: PiSquaresFourFill,
  Courses: PiBookOpenBold,
  Achievements: PiTrophyBold,
  Leaderboard: PiChartBarBold,
  Support: PiHeadsetBold,
};
export type SidebarLabel = keyof typeof icons;

export function SidebarNavLink({ to, label, active, collapsed = false, onClick }: {
  to: string;
  label: SidebarLabel;
  active: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  const Icon = icons[label];
  return (
    <Link
      id={`sidebar-${label.toLowerCase()}`}
      to={to}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      onClick={onClick}
      className={`flex min-h-[60px] items-center border-l-4 rounded-xl font-nunito font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075ED1] focus-visible:ring-offset-2 ${collapsed ? "w-14 justify-center pr-1" : "w-full gap-3 pl-3 pr-2"} ${active ? "border-[#075ED1] bg-[#E3EFFF] text-[#10243C]" : "border-transparent text-[#10243C] hover:bg-[#F0F6FD]"}`}
    >
      <Icon aria-hidden="true" className={`h-10 w-10 shrink-0 ${active ? "text-[#075ED1]" : "text-[#10243C]"}`} />
      {!collapsed && <span className="text-xl whitespace-nowrap">{label}</span>}
    </Link>
  );
}
