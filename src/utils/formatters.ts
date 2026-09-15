export const whToKwh = (wh: number) => wh / 1000

export const formatEnergy = (wh: number, minimumFractionDigits = 2) =>
  `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits,
    maximumFractionDigits: 3,
  }).format(whToKwh(wh))} kWh`

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))

export const formatTime = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

export const formatShortDate = (value: Date) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(value)
