import { useState, useEffect } from "react";
import { useTheme } from "@/components/ui/theme-provider";
import { useToast } from "@/hooks/use-toast";

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  BellRing, 
  Moon, 
  Save, 
  Settings as SettingsIcon, 
  Sun, 
  User,
  UtensilsCrossed
} from "lucide-react";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [daysThreshold, setDaysThreshold] = useState(3);
  const [lowQuantityAlerts, setLowQuantityAlerts] = useState(true);
  const [mealReminders, setMealReminders] = useState(false);
  const [dietaryPreferences, setDietaryPreferences] = useState<string>("");
  const { toast } = useToast();
  
  // Load preferences from localStorage on component mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem("dietaryPreferences");
    if (savedPreferences) {
      setDietaryPreferences(savedPreferences);
    }
  }, []);
  
  // Save dietary preferences to localStorage
  const saveDietaryPreferences = () => {
    localStorage.setItem("dietaryPreferences", dietaryPreferences);
    toast({
      title: "Preferences Saved",
      description: "Your dietary preferences have been saved successfully."
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4 border-[#2a2a35] bg-[#12121a]">
          <TabsTrigger value="general" className="data-[state=active]:bg-[#2a2a35] data-[state=active]:text-white text-gray-400">
            General
          </TabsTrigger>
          <TabsTrigger value="dietary" className="data-[state=active]:bg-[#2a2a35] data-[state=active]:text-white text-gray-400">
            Dietary
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-[#2a2a35] data-[state=active]:text-white text-gray-400">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:bg-[#2a2a35] data-[state=active]:text-white text-gray-400">
            Account
          </TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general">
          <Card className="border-[#2a2a35] bg-[#1a1a22]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <SettingsIcon className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure the application's appearance and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="theme" className="text-white">Theme</Label>
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    <Select
                      value={theme}
                      onValueChange={(value: "light" | "dark" | "system") => setTheme(value)}
                    >
                      <SelectTrigger className="w-32 border-[#2a2a35] bg-[#1a1a22] text-white">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent className="border-[#2a2a35] bg-[#12121a]">
                        <SelectItem value="light" className="text-gray-200 hover:bg-[#2a2a35]">Light</SelectItem>
                        <SelectItem value="dark" className="text-gray-200 hover:bg-[#2a2a35]">Dark</SelectItem>
                        <SelectItem value="system" className="text-gray-200 hover:bg-[#2a2a35]">System</SelectItem>
                      </SelectContent>
                    </Select>
                    <Moon className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Expiry Date Settings */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-white">Expiry Date Warning Threshold</Label>
                  <span className="text-sm font-medium text-white">{daysThreshold} days</span>
                </div>
                <Slider
                  value={[daysThreshold]}
                  min={1}
                  max={14}
                  step={1}
                  onValueChange={(value) => setDaysThreshold(value[0])}
                  className="[&_[role=slider]]:bg-[#3a3a45] [&_[role=slider]]:border-[#2a2a35]"
                />
                <p className="text-xs text-gray-400">
                  Items expiring within this many days will be highlighted as expiring soon
                </p>
              </div>

              <div className="pt-4">
                <Button className="w-full bg-[#2a2a35] text-white hover:bg-[#3a3a45]">
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Dietary Preferences */}
        <TabsContent value="dietary">
          <Card className="border-[#2a2a35] bg-[#1a1a22]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <UtensilsCrossed className="h-5 w-5" />
                Dietary Preferences
              </CardTitle>
              <CardDescription className="text-gray-400">
                Set your dietary preferences for recipe recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dietary-preferences" className="text-white">
                  Your Dietary Preferences & Constraints
                </Label>
                <Textarea 
                  id="dietary-preferences"
                  placeholder="Enter your dietary preferences and constraints here. For example: vegetarian, gluten-free, low-carb, Indian cuisine, no seafood, etc."
                  className="min-h-32 resize-y border-[#2a2a35] bg-[#12121a] text-white"
                  value={dietaryPreferences}
                  onChange={(e) => setDietaryPreferences(e.target.value)}
                />
                <p className="text-xs text-gray-400">
                  Your preferences will be used to generate recipe recommendations that match your dietary needs and cuisine preferences.
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">Example Preferences:</p>
                <ul className="text-xs text-gray-400 list-disc pl-5 space-y-1">
                  <li>Dietary restrictions: vegetarian, vegan, gluten-free, dairy-free, nut-free, etc.</li>
                  <li>Cuisine preferences: Italian, Indian, Mexican, Chinese, etc.</li>
                  <li>Regional specialties: Bihari cuisine, Southern Italian, Northern Thai, etc.</li>
                  <li>Cooking style: quick meals, one-pot dishes, meal prep friendly, etc.</li>
                  <li>Health goals: low-carb, high-protein, low-sodium, etc.</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveDietaryPreferences} className="w-full bg-[#2a2a35] text-white hover:bg-[#3a3a45]">
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card className="border-[#2a2a35] bg-[#1a1a22]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BellRing className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure when and how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="expiry-notifications" className="text-white">Expiry Notifications</Label>
                    <p className="text-sm text-gray-400">
                      Receive alerts about items expiring soon
                    </p>
                  </div>
                  <Switch
                    id="expiry-notifications"
                    checked={true}
                    disabled
                    className="data-[state=checked]:bg-[#3a3a45]"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="low-quantity" className="text-white">Low Quantity Alerts</Label>
                    <p className="text-sm text-gray-400">
                      Receive alerts when inventory items are running low
                    </p>
                  </div>
                  <Switch
                    id="low-quantity"
                    checked={lowQuantityAlerts}
                    onCheckedChange={setLowQuantityAlerts}
                    className="data-[state=checked]:bg-[#3a3a45]"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="meal-reminders" className="text-white">Meal Plan Reminders</Label>
                    <p className="text-sm text-gray-400">
                      Receive reminders about upcoming planned meals
                    </p>
                  </div>
                  <Switch
                    id="meal-reminders"
                    checked={mealReminders}
                    onCheckedChange={setMealReminders}
                    className="data-[state=checked]:bg-[#3a3a45]"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button className="w-full bg-[#2a2a35] text-white hover:bg-[#3a3a45]">
                  <Save className="mr-2 h-4 w-4" />
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Account Settings */}
        <TabsContent value="account">
          <Card className="border-[#2a2a35] bg-[#1a1a22]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription className="text-gray-400">
                Manage your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input id="username" placeholder="username" disabled className="border-[#2a2a35] bg-[#12121a] text-gray-400" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email Address</Label>
                <Input id="email" type="email" placeholder="example@email.com" className="border-[#2a2a35] bg-[#12121a] text-white" />
              </div>
              
              <div className="pt-4 space-y-2">
                <Button className="w-full bg-[#2a2a35] text-white hover:bg-[#3a3a45]">
                  <Save className="mr-2 h-4 w-4" />
                  Save Account Changes
                </Button>
                <p className="text-xs text-center text-gray-400">
                  Account preferences are only stored locally in this demo.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}