import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Home, Calendar, Umbrella, AlertCircle, Clock } from 'lucide-react';

const eventTypeIcons = {
  bouwverlof: Umbrella,
  schilder_verlof: Calendar,
  tijdelijke_werkloosheid: Clock,
  rustdag_bouw: Home,
  feestdag: AlertCircle
};

const CalendarItemBar = React.forwardRef(({ 
  item, 
  startColumn, 
  endColumn, 
  track, 
  type,
  onClick,
  colorClasses,
  ...props
}, ref) => {
  const spanDays = endColumn - startColumn + 1;
  const Icon = type === 'project' ? Briefcase : eventTypeIcons[item.event_type];
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`absolute left-0 right-0 cursor-pointer group ${type === 'event' ? 'z-20' : 'z-10'}`}
      style={{
        gridColumnStart: startColumn + 1,
        gridColumnEnd: endColumn + 2,
        top: `${track * 28 + 32}px`,
        height: '24px'
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(item);
      }}
      {...props}
    >
      <div className={`
        ${colorClasses.bg} 
        ${colorClasses.border} 
        ${colorClasses.text}
        border rounded-md px-2 py-0.5 text-xs font-medium truncate h-full flex items-center gap-1.5
        shadow-sm hover:shadow-md transition-all duration-200
        group-hover:scale-[1.02] group-hover:z-30
      `}>
        {Icon && <Icon className="w-3 h-3 flex-shrink-0 opacity-70" />}
        <span className="truncate">{type === 'project' ? item.project_name : item.title}</span>
      </div>
    </motion.div>
  );
});

CalendarItemBar.displayName = 'CalendarItemBar';

export default CalendarItemBar;