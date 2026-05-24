import { Button } from "@/components/ui/Button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"
import { DropdownMenu } from "@/components/ui/Dropdown"
import { Label } from "@/components/ui/Label"
import { X } from "lucide-react"

type AddLineModalProps = {
    setAddLine: (value: boolean) => void
}

export default function AddLineModal({ setAddLine } : AddLineModalProps){
    return(
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>Add a budget line</CardTitle>
                <CardDescription>
                Pick a category and set a budget amount for the month
                </CardDescription>
                <CardAction>
                <Button onClick={() => setAddLine(false)}>
                    <X />
                </Button>
                </CardAction>
            </CardHeader>
            <CardContent>
                <form>
                <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <DropdownMenu>
                        
                    </DropdownMenu>
                    </div>
                </div>
                </form>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button type="submit" className="w-full">
                Login
                </Button>
                <Button variant="outline" className="w-full">
                Login with Google
                </Button>
            </CardFooter>
        </Card>
    )
}