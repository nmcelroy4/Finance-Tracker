import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card"

interface InfoTileProps {
    title: string
    total: string
}

export default function InfoTile( {title, total}: InfoTileProps) {
    return(
        <Card>
            <CardTitle>{title}</CardTitle>
            <CardContent>{total}</CardContent>
        </Card>
    )
}