export const KPICard = ({ title, value, icon: Icon, trend }) => (
  <div className="bg-surface-container border border-surface-container-highest p-5 flex flex-col relative group">
    <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="flex justify-between items-start mb-4">
      <span className="font-label-caps text-on-surface-variant">{title}</span>
      <span className="material-icons text-primary text-[20px]">{Icon}</span>
    </div>
    <div className="font-data-display text-[24px] text-on-surface mb-2">
      {value}
    </div>
    {trend && (
      <div className="flex items-center text-secondary font-label-caps mt-auto pt-2 border-t border-surface-container-highest">
        <span className="material-icons text-[14px] mr-1">trending_up</span>
        {trend}
      </div>
    )}
  </div>
);
