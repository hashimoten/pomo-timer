declare module 'react-calendar-heatmap' {
  import * as React from 'react';

  export interface HeatmapValue {
    date: string | Date;
    count?: number;
  }

  export interface CalendarHeatmapProps {
    startDate: Date;
    endDate: Date;
    values: HeatmapValue[];
    classForValue?: (value: HeatmapValue | undefined) => string;
    tooltipDataAttrs?: (value: HeatmapValue | undefined) => React.HTMLAttributes<SVGRectElement>;
  }

  export default class CalendarHeatmap extends React.Component<CalendarHeatmapProps> { }
}
