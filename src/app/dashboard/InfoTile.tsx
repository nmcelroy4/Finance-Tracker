import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card"

type InfoTileVariant = 'info' | 'danger' | 'success'

interface InfoTileProps {
    title: string
    total: string
    variant?: InfoTileVariant
}

const variantClasses: Record<InfoTileVariant, string> = {
  info: 'bg-blue-200 border-blue-500',
  danger: 'bg-red-200 border-red-500',
  success: 'bg-green-200 border-green-500',
}

export default function InfoTile( {title, total, variant = 'info'}: InfoTileProps) {
    return(
        <Card className={`py-0 border ${variantClasses[variant]}`}>
            <CardHeader>
                <CardTitle className="pl-4 py-4 pb-0">{title}</CardTitle>
                <CardContent className="text-center text-2xl py-0 pb-6">{total}</CardContent>
            </CardHeader>
        </Card>
    )
}