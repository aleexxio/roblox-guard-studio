import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Ban() {
  const [username, setUsername] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("");
  const { toast } = useToast();

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Replace with actual API call
    console.log("Banning user:", { username, reason, duration });
    
    toast({
      title: "Player Banned",
      description: `${username} has been banned for ${duration}.`,
    });
    
    setUsername("");
    setReason("");
    setDuration("");
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Ban Player</h1>
        <p className="text-muted-foreground">Remove a player from the game</p>
      </div>

      <Card className="border-border shadow-glow-primary/20">
        <CardHeader>
          <CardTitle>Ban Information</CardTitle>
          <CardDescription>Enter the details to ban a player</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBan} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter ban reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={setDuration} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" variant="destructive" className="w-full">
              Ban Player
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
