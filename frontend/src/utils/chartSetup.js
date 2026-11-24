import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  RadialLinearScale, ArcElement, Tooltip, Legend, Filler
)

export const chartTextColor = '#CBD5E1'
export const chartGridColor = 'rgba(255,255,255,0.06)'

export const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: chartTextColor, font: { family: 'Inter' } } },
    tooltip: { backgroundColor: '#1a2140', borderColor: 'rgba(124,139,255,0.3)', borderWidth: 1 },
  },
  scales: {
    x: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
    y: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
  },
}
