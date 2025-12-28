import React from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { useAnalytics } from '../../hooks/useAnalytics';
import { FocusSession } from '../../types';
import { Clock, Calendar, PieChart as PieIcon, Activity } from 'lucide-react';

interface AnalyticsPanelProps {
    history: FocusSession[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ history }) => {
    const { summary, weeklyActivity, categoryStats, hourlyStats, heatmapData } = useAnalytics(history);

    // Styling for Recharts Tooltip
    const tooltipStyle = {
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        color: 'var(--text-main)',
        fontSize: '12px'
    };

    return (
        <div className="space-y-6 pb-6 h-full overflow-y-auto pr-1 select-none">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-1 text-[var(--text-sub)]">
                        <Clock size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Total Focus</span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--text-main)]">
                        {Math.floor(summary.totalMinutes / 60)}<span className="text-sm font-normal opacity-60 ml-0.5 mr-1">h</span>
                        {summary.totalMinutes % 60}<span className="text-sm font-normal opacity-60 ml-0.5">m</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-1 text-[var(--text-sub)]">
                        <Calendar size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Today's Focus</span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--text-main)]">
                        {Math.floor(summary.todayMinutes / 60)}<span className="text-sm font-normal opacity-60 ml-0.5 mr-1">h</span>
                        {summary.todayMinutes % 60}<span className="text-sm font-normal opacity-60 ml-0.5">m</span>
                    </div>
                </motion.div>
            </div>

            {/* Activity Heatmap */}
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm"
            >
                <div className="flex items-center gap-2 mb-4 text-[var(--text-main)] border-b border-[var(--border-color)] pb-2">
                    <Activity size={18} className="text-[var(--text-accent)]" />
                    <h3 className="font-semibold text-sm">Activity Heatmap</h3>
                </div>
                <div className="flex items-start gap-4 justify-center">
                    <div className="overflow-x-auto">
                        {/* Month Labels Row */}
                        <div className="flex text-xs text-[var(--text-sub)] mb-1 px-1 h-5">
                            {Array.from({ length: Math.ceil(heatmapData.length / 7) }).map((_, weekIndex) => {
                                const day = heatmapData[weekIndex * 7];
                                if (!day) return <div key={weekIndex} className="w-5 mx-0.5"></div>;

                                const prevDay = heatmapData[(weekIndex - 1) * 7];
                                const isNewMonth = !prevDay || day.month !== prevDay.month;

                                return (
                                    <div key={weekIndex} className="w-5 mx-0.5 relative">
                                        {isNewMonth && (
                                            <span className="whitespace-nowrap font-medium">{day.month}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex gap-1.5 min-w-max pb-2 px-1">
                            {/* Days Grid */}
                            {Array.from({ length: Math.ceil(heatmapData.length / 7) }).map((_, weekIndex) => {
                                const weekData = heatmapData.slice(weekIndex * 7, (weekIndex + 1) * 7);
                                const totalWeeks = Math.ceil(heatmapData.length / 7);
                                const isRightSide = weekIndex >= totalWeeks - 4;
                                const isLeftSide = weekIndex < 2;

                                return (
                                    <div key={weekIndex} className="flex flex-col gap-1.5">
                                        {weekData.map((day, dayIndex) => {
                                            const isTopRow = dayIndex < 2;

                                            return (
                                                <div
                                                    key={day.date}
                                                    data-title={`${day.date.split('-')[1]}月${day.date.split('-')[2]}日: ${day.count}分`}
                                                    style={day.level === 0 ? { backgroundColor: 'var(--ring-track)' } : undefined}
                                                    className={`heatmap-day w-5 h-5 rounded transition-all cursor-pointer hover:ring-2 hover:ring-[var(--text-accent)] ${isRightSide ? 'tooltip-right' : ''} ${isLeftSide ? 'tooltip-left-align' : ''} ${isTopRow ? 'tooltip-bottom' : ''} ${day.level === 0 ? '' :
                                                        day.level === 1 ? 'bg-green-200 dark:bg-green-900/40' :
                                                            day.level === 2 ? 'bg-green-300 dark:bg-green-800' :
                                                                day.level === 3 ? 'bg-green-400 dark:bg-green-600' :
                                                                    'bg-green-500 dark:bg-green-500'
                                                        }`}
                                                />
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Legend - Vertical on right side */}
                    <div className="flex flex-col gap-1.5 text-xs text-[var(--text-sub)] pt-5 flex-shrink-0 ml-12">
                        <span className="text-center mb-0.5">More</span>
                        <div className="w-5 h-5 rounded bg-green-500"></div>
                        <div className="w-5 h-5 rounded bg-green-400 dark:bg-green-600"></div>
                        <div className="w-5 h-5 rounded bg-green-300 dark:bg-green-800"></div>
                        <div className="w-5 h-5 rounded bg-green-200 dark:bg-green-900/40"></div>
                        <div className="w-5 h-5 rounded" style={{ backgroundColor: 'var(--ring-track)' }}></div>
                        <span className="text-center mt-0.5">Less</span>
                    </div>
                </div>
            </motion.div>

            {/* Weekly Activity Chart */}
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm"
            >
                <div className="flex items-center gap-2 mb-4 text-[var(--text-main)] border-b border-[var(--border-color)] pb-2">
                    <Activity size={18} className="text-[var(--text-accent)]" />
                    <h3 className="font-semibold text-sm">Weekly Activity</h3>
                </div>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyActivity}>
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'var(--text-sub)' }}
                                dy={10}
                            />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                cursor={{ fill: 'var(--bg-hover)' }}
                            />
                            <Bar
                                dataKey="minutes"
                                fill="var(--text-accent)"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Category Distribution */}
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm"
            >
                <div className="flex items-center gap-2 mb-4 text-[var(--text-main)] border-b border-[var(--border-color)] pb-2">
                    <PieIcon size={18} className="text-[var(--text-accent)]" />
                    <h3 className="font-semibold text-sm">Category Breakdown</h3>
                </div>
                <div className="h-48 w-full flex">
                    <div className="w-1/2 h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 flex flex-col justify-center gap-2 overflow-y-auto max-h-48 text-xs">
                        {categoryStats.map((cat, idx) => (
                            <div key={cat.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                <div className="truncate text-[var(--text-main)] flex-1">{cat.name}</div>
                                <div className="text-[var(--text-sub)]">{cat.value}m</div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Hourly Activity */}
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm"
            >
                <div className="flex items-center gap-2 mb-4 text-[var(--text-main)] border-b border-[var(--border-color)] pb-2">
                    <Clock size={18} className="text-[var(--text-accent)]" />
                    <h3 className="font-semibold text-sm">Hourly Key Times</h3>
                </div>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={hourlyStats}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                            <XAxis
                                dataKey="hour"
                                tickFormatter={(h) => `${h}h`}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'var(--text-sub)' }}
                                dy={10}
                                interval={3}
                            />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Line
                                type="monotone"
                                dataKey="minutes"
                                stroke="var(--text-accent)"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
};
