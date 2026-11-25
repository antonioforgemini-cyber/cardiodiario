"use client";

import React from "react";
import { BarChart3, LineChart as LineChartIcon } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
} from "recharts";

interface TrendPoint {
  day: string;
  sistolica: number;
  diastolica: number;
}

interface DistributionPoint {
  fascia: string;
  mediaMax: number;
  mediaMin: number;
}

export function DashboardCharts({
  trendData,
  distributionData,
}: {
  trendData: TrendPoint[];
  distributionData: DistributionPoint[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant/50 shadow-terra space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-headline font-bold text-on-surface">
              Andamento Pressorio di Coorte
            </h2>
            <p className="text-xs text-on-surface-variant">
              Media sistolica e diastolica rilevata nei cicli con soglie target ESC/ESH (140/90 mmHg).
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-primary inline-block" aria-hidden="true" />
              Sistolica (MAX)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-tertiary inline-block" aria-hidden="true" />
              Diastolica (MIN)
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-4 flex items-center justify-center">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e0d8" vertical={false} />
                <XAxis dataKey="day" stroke="#74796e" fontSize={12} tickLine={false} />
                <YAxis stroke="#74796e" fontSize={12} domain={[60, 160]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #c4c8bc",
                    fontSize: "12px",
                  }}
                />
                <ReferenceLine
                  y={140}
                  stroke="#b83230"
                  strokeDasharray="4 4"
                  label={{ value: "Target Max 140", fill: "#b83230", fontSize: 10, position: "insideTopRight" }}
                />
                <ReferenceLine
                  y={90}
                  stroke="#b83230"
                  strokeDasharray="4 4"
                  label={{ value: "Target Min 90", fill: "#b83230", fontSize: 10, position: "insideBottomRight" }}
                />
                <Line
                  type="monotone"
                  dataKey="sistolica"
                  name="Sistolica (MAX)"
                  stroke="#4a7c59"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#4a7c59" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="diastolica"
                  name="Diastolica (MIN)"
                  stroke="#705c30"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#705c30" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
              <LineChartIcon className="w-8 h-8 mb-2 text-outline" aria-hidden="true" />
              <p className="text-sm font-semibold text-on-surface">Nessun dato di andamento disponibile</p>
              <p className="text-xs max-w-xs mt-1">
                I grafici di coorte si popoleranno automaticamente non appena i pazienti registreranno le prime misurazioni.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant/50 shadow-terra space-y-4">
        <div>
          <h2 className="text-lg font-headline font-bold text-on-surface">
            Distribuzione per Fascia
          </h2>
          <p className="text-xs text-on-surface-variant">
            Confronto dei valori medi per orario di misurazione.
          </p>
        </div>

        <div className="h-64 w-full pt-4 flex items-center justify-center">
          {distributionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e0d8" vertical={false} />
                <XAxis dataKey="fascia" stroke="#74796e" fontSize={12} tickLine={false} />
                <YAxis stroke="#74796e" fontSize={12} domain={[60, 160]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #c4c8bc",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="mediaMax" fill="#4a7c59" name="Media Max" radius={[6, 6, 0, 0]} />
                <Bar dataKey="mediaMin" fill="#c4a66a" name="Media Min" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
              <BarChart3 className="w-8 h-8 mb-2 text-outline" aria-hidden="true" />
              <p className="text-sm font-semibold text-on-surface">Nessun dato per fascia oraria</p>
              <p className="text-xs max-w-xs mt-1">
                I valori medi per mattina, pomeriggio e sera appariranno non appena verranno acquisite le letture.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
