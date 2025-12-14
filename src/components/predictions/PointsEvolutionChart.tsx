'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface PointsEvolutionChartProps {
  data: Array<{
    date: string
    points: number
    cumulative: number
  }>
}

export function PointsEvolutionChart({ data }: PointsEvolutionChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolución de Puntos</CardTitle>
          <CardDescription>
            Tus puntos acumulados a lo largo del torneo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No hay datos de evolución disponibles
          </div>
        </CardContent>
      </Card>
    )
  }

  // Formatear datos para el gráfico
  const chartData = data.map((item) => ({
    ...item,
    formattedDate: format(new Date(item.date), 'd MMM', { locale: es }),
    fullDate: format(new Date(item.date), "d 'de' MMMM", { locale: es }),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución de Puntos</CardTitle>
        <CardDescription>
          Tus puntos acumulados a lo largo del torneo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <p className="text-sm font-medium">{data.fullDate}</p>
                        <p className="text-sm text-muted-foreground">
                          Puntos del partido: <span className="font-medium text-foreground">+{data.points}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total acumulado: <span className="font-medium text-foreground">{data.cumulative}</span>
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorCumulative)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

