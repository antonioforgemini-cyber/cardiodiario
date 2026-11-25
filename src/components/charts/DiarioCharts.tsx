"use client";

import React from "react";
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

interface ChartPoint {
  label: string;
  sistolica: number;
  diastolica: number;
  bpm: number | null;
  data: string;
  slot: string;
}

interface SlotAvgPoint {
  fascia: string;
  avgMax: number;
  avgMin: number;
}

export function DiarioCharts({
  chartData,
  distributionData,
}: {
  chartData: ChartPoint[];
  distributionData: SlotAvgPoint[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant/50 shadow-terra space-y-4">
        <div>
          <h2 className="text-lg font-headline font-bold text-on-surface">
            Andamento Pressorio del Diario
          </h2>
          <p className="text-xs text-on-surface-variant">
            Evoluzione di Sistolica e Diastolica con linee di riferimento clinico (140/90 mmHg).
          </p>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e0d8" vertical={false} />
              <XAxis dataKey="label" stroke="#74796e" fontSize={11} tickLine={false} />
              <YAxis stroke="#74796e" fontSize={11} domain={[60, 170]} tickLine={false} />
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
                label={{ value: "Limite Max 140", fill: "#b83230", fontSize: 10, position: "insideTopRight" }}
              />
              <ReferenceLine
                y={90}
                stroke="#b83230"
                strokeDasharray="4 4"
                label={{ value: "Limite Min 90", fill: "#b83230", fontSize: 10, position: "insideBottomRight" }}
              />
              <Line
                type="monotone"
                dataKey="sistolica"
                stroke="#4a7c59"
                strokeWidth={3}
                dot={{ r: 3, fill: "#4a7c59" }}
                name="Sistolica (MAX)"
              />
              <Line
                type="monotone"
                dataKey="diastolica"
                stroke="#705c30"
                strokeWidth={3}
                dot={{ r: 3, fill: "#705c30" }}
                name="Diastolica (MIN)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant/50 shadow-terra space-y-4">
        <div>
          <h2 className="text-lg font-headline font-bold text-on-surface">
            Medie per Fascia Oraria
          </h2>
          <p className="text-xs text-on-surface-variant">
            Confronto tra Mattina, Pomeriggio e Sera.
          </p>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e0d8" vertical={false} />
              <XAxis dataKey="fascia" stroke="#74796e" fontSize={11} tickLine={false} />
              <YAxis stroke="#74796e" fontSize={11} domain={[60, 160]} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #c4c8bc",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="avgMax" fill="#4a7c59" name="Media Max" radius={[6, 6, 0, 0]} />
              <Bar dataKey="avgMin" fill="#c4a66a" name="Media Min" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
