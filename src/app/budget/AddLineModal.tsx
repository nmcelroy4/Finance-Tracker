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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/Dropdown"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Category, Budget } from "@/types"
import { X } from "lucide-react"
import { useState } from "react"

type AddLineModalProps = {
    setAddLine: (value: boolean) => void
    categories: Category[]
    month: string
    budgetLine: Budget[]
    setBudgetLine: (value: Budget[]) => void
}

export default function AddLineModal({ setAddLine, categories, month, budgetLine, setBudgetLine } : AddLineModalProps){
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [amount, setAmount] = useState("")

    const handleSetBudgetLine = async () => {
        if (!selectedCategory || !amount) {
            return
        }

        try {
            const res = await fetch('/api/budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    categoryId: selectedCategory.id,
                    monthYear: month,
                    limit: Math.round(Number(amount) * 100),
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setBudgetLine(
                    budgetLine.some(b => b.categoryId === selectedCategory.id)
                    ? budgetLine.map(b => b.categoryId === selectedCategory.id ? data.budget : b)
                    : [...budgetLine, data.budget]
                );
                setAddLine(false)
            }
        } catch (error) {
            console.error('Error setting budget:', error)
        } 
    };

    return(
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>Add a budget line</CardTitle>
                <CardDescription>
                Pick a category and set a budget amount for the month
                </CardDescription>
                <CardAction>
                <Button 
                    onClick={() => setAddLine(false)} 
                    className="bg-transparent"
                >
                    <X color="black"/>
                </Button>
                </CardAction>
            </CardHeader>
            <CardContent>
                <form>
                <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                {selectedCategory ? selectedCategory.name : "Select a category"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {categories.map(category =>
                                <DropdownMenuItem  
                                    key={category.id} 
                                    onClick={() => setSelectedCategory(category)}
                                >
                                    {category.name}
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Label htmlFor="budget amount">Budget Amount</Label>
                    <Input 
                        type="number" 
                        placeholder="ex. 12.34"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    </div>
                </div>
                </form>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button
                    className="w-full"
                    onClick={handleSetBudgetLine}
                    disabled={!selectedCategory || !amount}
                >
                    Add Budget Line
                </Button>
                <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setAddLine(false)} 
                >
                    Cancel
                </Button>
            </CardFooter>
        </Card>
    )
}