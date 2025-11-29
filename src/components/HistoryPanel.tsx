import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import { FocusSession } from '../types';

interface HistoryPanelProps {
    history: FocusSession[];
    totalFocusMinutes: number;
    heatmapValues: { date: string; count: number }[];
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
    history,
    totalFocusMinutes,
    heatmapValues,
}) => {
    return (
        <div className="history-card">
            <div className="analytics-shell">
                <div className="flex items-center justify-between text-xs text-[#7a8ba3]">
                    <span>Total Focus Time</span>
                    <span>{totalFocusMinutes} min</span>
                </div>

                <div className="history-panel mt-4">
                    {/* Heatmap: always visible */}
                    <div className="mb-4">
                        <CalendarHeatmap
                            startDate={new Date(new Date().setMonth(new Date().getMonth() - 3))}
                            endDate={new Date()}
                            values={heatmapValues}
                            classForValue={(value: { date?: string | Date; count?: number } | undefined) => {
                                if (!value || !value.count) return 'heatmap-empty';
                                if (value.count <= 25) return 'heatmap-level-1';
                                if (value.count <= 50) return 'heatmap-level-2';
                                return 'heatmap-level-3';
                            }}
                            tooltipDataAttrs={(value: { date?: string | Date; count?: number } | undefined) => {
                                if (!value || !value.date) return {};
                                const label = `${value.date}: ${value.count ?? 0} min`;
                                return { title: label };
                            }}
                        />
                    </div>

                    {history.length === 0 ? (
                        <div className="history-empty">No completed focus sessions yet.</div>
                    ) : (
                        <ul className="history-list custom-scrollbar">
                            {history.map(item => (
                                <li key={item.id} className="history-item">
                                    <div className="history-row">
                                        <span className="history-date">{item.date}</span>
                                        <span className="history-minutes">{item.minutes} min</span>
                                    </div>
                                    <div className="flex items-center justify-between history-range">
                                        <span>{item.range}</span>
                                        <span className="text-[10px] text-[#94a3b8]">{item.category}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};
